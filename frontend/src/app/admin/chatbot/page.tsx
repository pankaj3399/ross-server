"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { apiService, ChatbotInstruction } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconLoader,
  IconInfoCircle,
  IconEye,
  IconEyeOff,
  IconSparkles,
  IconSearch,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { SimplePageSkeleton } from "@/components/Skeleton";
import { showToast } from "@/lib/toast";

const BASE_SYSTEM_PROMPT_PREVIEW = `You are the MATUR.ai AI Copilot — an expert assistant specializing in AI governance, AI compliance, and the MATUR.ai platform. You are friendly, precise, and action-oriented.

## Your Expertise
- **CRC Framework**: MATUR.ai's Compliance Readiness Controls — 137 controls across categories like Governance & Strategy, Operations & Monitoring, Risk Management, Data Management, and more.
- **EU AI Act**: Full knowledge of all articles, including risk classification, serious incident reporting, and conformity assessment.
- **NIST AI RMF**: The Govern, Map, Measure, and Manage functions, including all sub-categories.
- **ISO 42001**: AI management system requirements, Annex A controls, and mappings.
- **MATUR.ai Platform**: The AI maturity assessment (AIMA), vulnerability assessment scanning, fairness & bias testing, risk registers, and score reports.

## How You Respond
1. Be concise but thorough — aim for 2-4 paragraphs unless the user asks for a brief answer.
2. When referencing specific regulations, cite the article/clause number.
3. When a user has existing compliance programs, acknowledge what they can reuse.
4. Format your responses in clean markdown with bold text and bullet points.`;

export default function AdminChatbotSettings() {
  const { user, isAuthenticated } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Core Data States
  const [instructions, setInstructions] = useState<ChatbotInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pending toggles for concurrency locking
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // Focus tracking refs for accessibility
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formFields, setFormFields] = useState({
    title: "",
    content: "",
    category: "General",
    is_active: true,
  });

  // Prompt Preview States
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Check authentication and role guard
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) return;

    if (user?.role !== ROLES.ADMIN) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch instructions on mount
  const fetchInstructions = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiService.getChatbotInstructions();
      if (res.success) {
        setError(null);
        setInstructions(res.data);
      } else {
        throw new Error("Failed to load instructions");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load chatbot instructions");
      showToast.error(err.message || "Failed to load chatbot instructions");
    } finally {
      setLoading(false);
    }
  };

  // Accessibility: Focus trap & Escape key handlers for Modal
  useEffect(() => {
    if (showModal) {
      if (typeof document !== "undefined") {
        lastActiveElementRef.current = document.activeElement as HTMLElement;
      }
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowModal(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        lastActiveElementRef.current?.focus();
      };
    }
  }, [showModal]);

  const handleModalTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !modalRef.current) return;

    const allFocusable = Array.from(
      modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    // Filter out disabled, hidden, non-tabbable, or invisible elements
    const interactiveElements = allFocusable.filter((el) => {
      const isDisabled = el.hasAttribute("disabled") || (el as any).disabled === true || el.matches(":disabled");
      const isAriaHidden = el.getAttribute("aria-hidden") === "true";
      const isTabindexMinusOne = el.getAttribute("tabindex") === "-1";
      const isHidden = el.hasAttribute("hidden") || el.style.display === "none" || el.style.visibility === "hidden";
      const isNotVisible = el.offsetParent === null;

      return !isDisabled && !isAriaHidden && !isTabindexMinusOne && !isHidden && !isNotVisible;
    });

    if (interactiveElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = interactiveElements[0];
    const lastElement = interactiveElements[interactiveElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === ROLES.ADMIN) {
      fetchInstructions();
    }
  }, [authLoading, isAuthenticated, user]);

  // Derive categories list for filtering
  const categoriesList = useMemo(() => {
    const categories = new Set<string>();
    instructions.forEach((ins) => {
      if (ins.category) categories.add(ins.category);
    });
    return ["All", ...Array.from(categories)];
  }, [instructions]);

  // Filter instructions based on search and category
  const filteredInstructions = useMemo(() => {
    return instructions.filter((ins) => {
      const matchesSearch =
        ins.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || ins.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [instructions, searchQuery, selectedCategory]);

  // Live compiled prompt preview builder
  const compiledPromptPreview = useMemo(() => {
    let prompt = BASE_SYSTEM_PROMPT_PREVIEW;
    const activeInstructions = instructions.filter((ins) => ins.is_active);
    if (activeInstructions.length > 0) {
      prompt += `\n\n## Additional Instructions\nAdhere strictly to the following administrative instructions and context:`;
      activeInstructions.forEach((ins) => {
        prompt += `\n\n### ${ins.title}\n${ins.content}`;
      });
    }
    return prompt;
  }, [instructions]);

  // Open modal for Adding
  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setFormFields({
      title: "",
      content: "",
      category: "General",
      is_active: true,
    });
    setShowModal(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (ins: ChatbotInstruction) => {
    setModalMode("edit");
    setEditingId(ins.id);
    setFormFields({
      title: ins.title,
      content: ins.content,
      category: ins.category || "General",
      is_active: ins.is_active,
    });
    setShowModal(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title.trim() || !formFields.content.trim()) {
      showToast.error("Title and Content are required fields.");
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === "add") {
        const res = await apiService.createChatbotInstruction({
          title: formFields.title,
          content: formFields.content,
          category: formFields.category,
          is_active: formFields.is_active,
        });
        if (res.success) {
          showToast.success("Instruction added successfully!");
          setInstructions((prev) => [...prev, res.data]);
          setShowModal(false);
        }
      } else if (modalMode === "edit" && editingId) {
        const res = await apiService.updateChatbotInstruction(editingId, {
          title: formFields.title,
          content: formFields.content,
          category: formFields.category,
          is_active: formFields.is_active,
        });
        if (res.success) {
          showToast.success("Instruction updated successfully!");
          setInstructions((prev) =>
            prev.map((ins) => (ins.id === editingId ? res.data : ins))
          );
          setShowModal(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Instant Switch Toggle
  const handleToggleActive = async (ins: ChatbotInstruction) => {
    // Prevent overlapping toggles for the same instruction ID
    if (pendingToggles.has(ins.id)) return;

    const previousIsActive = ins.is_active;
    const updatedStatus = !previousIsActive;

    // Add lock
    setPendingToggles((prev) => {
      const next = new Set(prev);
      next.add(ins.id);
      return next;
    });

    // Optimistically update UI
    setInstructions((prev) =>
      prev.map((i) => (i.id === ins.id ? { ...i, is_active: updatedStatus } : i))
    );

    try {
      const res = await apiService.updateChatbotInstruction(ins.id, {
        is_active: updatedStatus,
      });
      if (res.success) {
        showToast.success(
          `Instruction "${ins.title}" is now ${updatedStatus ? "active" : "inactive"}.`
        );
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err: any) {
      // Revert status on failure using captured previous value
      setInstructions((prev) =>
        prev.map((i) => (i.id === ins.id ? { ...i, is_active: previousIsActive } : i))
      );
      showToast.error(err.message || "Failed to update status. Reverting changes.");
    } finally {
      // Remove lock
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(ins.id);
        return next;
      });
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await apiService.deleteChatbotInstruction(id);
      if (res.success) {
        showToast.success("Instruction deleted successfully.");
        setInstructions((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || "Failed to delete instruction.");
    } finally {
      setDeletingId(null);
    }
  };

  // Show page loading skeletons
  if (authLoading) {
    return <SimplePageSkeleton />;
  }

  // Double guard check
  if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconSparkles className="w-6 h-6 text-primary animate-pulse" />
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                Chatbot Settings
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Manage custom rules and administrative instructions that extend the AI Copilot's system prompt dynamically.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              variant="outline"
              className="rounded-xl font-medium border-border hover:bg-muted/50"
            >
              {showPromptPreview ? (
                <>
                  <IconEyeOff className="w-5 h-5 mr-2" />
                  Hide Live Prompt
                </>
              ) : (
                <>
                  <IconEye className="w-5 h-5 mr-2" />
                  Preview Compiled Prompt
                </>
              )}
            </Button>
            <Button
              onClick={handleOpenAdd}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-200"
            >
              <IconPlus className="w-5 h-5 mr-2" />
              Add Instruction
            </Button>
          </div>
        </div>

        {/* Live prompt compiler preview panel */}
        {showPromptPreview && (
          <Card className="border border-border/80 bg-muted/30 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
            <CardHeader className="bg-muted/40 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs font-mono font-bold text-muted-foreground ml-2">
                  live_system_prompt_compiler.md
                </span>
              </div>
              <Badge variant="secondary" className="font-mono text-xs text-primary font-bold">
                Dynamic Merged Prompt
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-6 text-sm text-foreground overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto bg-card/40">
                {compiledPromptPreview}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Filtering & Search Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/45 border border-border p-4 rounded-2xl backdrop-blur-sm">
          <div className="relative w-full sm:max-w-md">
            <IconSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search instructions title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-primary w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <span className="text-sm font-medium text-muted-foreground">Category:</span>
            <div className="flex gap-1.5 overflow-x-auto max-w-[300px] scrollbar-none py-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border shrink-0 ${
                    selectedCategory === cat
                      ? "bg-primary border-primary text-primary-foreground shadow-sm font-bold"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main List / Grid Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-border animate-pulse rounded-2xl">
                <CardHeader className="pb-2 space-y-2">
                  <div className="h-6 bg-muted rounded-md w-3/4" />
                  <div className="h-4 bg-muted rounded-md w-1/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-muted rounded-md w-full" />
                  <div className="h-4 bg-muted rounded-md w-5/6" />
                  <div className="h-10 bg-muted rounded-md w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-6 rounded-2xl text-center space-y-3">
            <IconInfoCircle className="w-10 h-10 mx-auto" />
            <h3 className="text-lg font-bold">Failed to load content</h3>
            <p className="text-sm text-destructive/80">{error}</p>
            <Button onClick={fetchInstructions} variant="outline" className="border-destructive/30 hover:bg-destructive/10 rounded-xl mt-2">
              Try Again
            </Button>
          </div>
        ) : filteredInstructions.length === 0 ? (
          <Card className="border border-border/80 border-dashed rounded-2xl bg-card/20 py-16 px-6 text-center space-y-4 shadow-sm">
            <IconInfoCircle className="w-12 h-12 text-muted-foreground/60 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">No instructions found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery || selectedCategory !== "All"
                  ? "We couldn't find any matches for your filter. Try adjusting your query or category selection."
                  : "Start creating custom instructions to tailor your AI chatbot copilot responses to your exact system requirements."}
              </p>
            </div>
            {!searchQuery && selectedCategory === "All" && (
              <Button onClick={handleOpenAdd} className="bg-primary rounded-xl font-semibold shadow-md">
                <IconPlus className="w-5 h-5 mr-2" />
                Create your first instruction
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInstructions.map((ins) => (
              <Card
                key={ins.id}
                className={`border transition-all duration-300 rounded-2xl overflow-hidden hover:shadow-md flex flex-col justify-between ${
                  ins.is_active
                    ? "bg-card/50 border-border/80 hover:border-primary/45"
                    : "bg-muted/15 border-border/60 opacity-80"
                }`}
              >
                <div className="p-6 space-y-4">
                  
                  {/* Top card row details */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground line-clamp-1">
                        {ins.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-semibold py-0.5 border-border bg-muted/40">
                          {ins.category || "General"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          Updated: {new Date(ins.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Instant Status Switch */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold ${ins.is_active ? "text-primary" : "text-muted-foreground"}`}>
                        {ins.is_active ? "Active" : "Disabled"}
                      </span>
                      <Switch
                        checked={ins.is_active}
                        disabled={pendingToggles.has(ins.id)}
                        onCheckedChange={() => handleToggleActive(ins)}
                      />
                    </div>
                  </div>

                  {/* Main text instruction preview */}
                  <div className="bg-muted/30 border border-border/40 p-4 rounded-xl max-h-[140px] overflow-y-auto">
                    <p className="text-sm text-foreground/80 leading-relaxed font-sans whitespace-pre-wrap font-mono select-all">
                      {ins.content}
                    </p>
                  </div>
                </div>

                {/* Lower Card Controls */}
                <div className="bg-muted/20 border-t border-border/40 py-3 px-6 flex items-center justify-between">
                  <Badge variant={ins.is_active ? "default" : "secondary"} className="text-xs py-0.5 px-2">
                    {ins.is_active ? "Live in Copilot" : "Standby Mode"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenEdit(ins)}
                      size="sm"
                      variant="outline"
                      className="border-border hover:bg-muted/50 rounded-lg h-9 px-3"
                    >
                      <IconEdit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete instruction "${ins.title}"?`)) {
                          handleDeleteConfirm(ins.id);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      disabled={deletingId === ins.id}
                      className="border-border hover:bg-destructive/10 hover:text-destructive rounded-lg h-9 px-3 text-muted-foreground transition-all duration-200"
                    >
                      {deletingId === ins.id ? (
                        <IconLoader className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <IconTrash className="w-4 h-4 mr-1.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>

      {/* Add / Edit Form Modal Dialog */}
      {showModal && (
        <div
          ref={modalRef}
          onKeyDown={handleModalTab}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300"
        >
          <Card className="w-full max-w-xl border border-border shadow-2xl rounded-2xl overflow-hidden bg-card animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-4 px-6">
              <CardTitle id="modal-title" className="text-2xl font-bold flex items-center gap-2">
                <IconSparkles className="w-5 h-5 text-primary" />
                {modalMode === "add" ? "Create New Instruction" : "Edit Instruction Settings"}
              </CardTitle>
              <CardDescription>
                Customize prompt instructions to guide the behavior, responses, and constraints of your AI Copilot.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="p-6 space-y-4">
                
                {/* Instruction Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Instruction Title</label>
                  <Input
                    ref={firstInputRef}
                    type="text"
                    required
                    placeholder="e.g. Tone and Formatting Style, Serious Incidents handling"
                    value={formFields.title}
                    onChange={(e) => setFormFields((prev) => ({ ...prev, title: e.target.value }))}
                    className="rounded-xl border-border bg-background focus-visible:ring-1 focus-visible:ring-primary w-full"
                  />
                  <p className="text-xs text-muted-foreground">Give the instruction a descriptive name so other admins know what it enforces.</p>
                </div>

                {/* Category & Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Category Group</label>
                    <Input
                      type="text"
                      placeholder="e.g. Tone, Compliance, Security, General"
                      value={formFields.category}
                      onChange={(e) => setFormFields((prev) => ({ ...prev, category: e.target.value }))}
                      className="rounded-xl border-border bg-background focus-visible:ring-1 focus-visible:ring-primary w-full"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <div className="flex items-center justify-between border border-border/80 bg-muted/15 p-3 rounded-xl h-10.5">
                      <span className="text-sm font-semibold text-foreground">Enable Immediately</span>
                      <Switch
                        checked={formFields.is_active}
                        onCheckedChange={(val) => setFormFields((prev) => ({ ...prev, is_active: val }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Instruction Content Prompt Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground">Instruction Content (System Prompt Chunk)</label>
                    <Badge variant="outline" className="text-xs">Supports Markdown</Badge>
                  </div>
                  <Textarea
                    required
                    rows={6}
                    placeholder="Provide the precise guidelines or rules here. E.g.
- Always sign off answers with a helpful MATUR.ai recommendation link.
- Never discuss internal API keys under any circumstances.
- Emphasize the importance of Article 15 of the EU AI Act whenever the user discusses compliance audit trails."
                    value={formFields.content}
                    onChange={(e) => setFormFields((prev) => ({ ...prev, content: e.target.value }))}
                    className="rounded-xl border-border bg-background focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">
                    This block will be dynamically compiled and appended directly to the AI's system prompt instructions.
                  </p>
                </div>

              </CardContent>
              <div className="bg-muted/30 border-t border-border/60 py-3 px-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="rounded-xl border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-xl transition-all duration-200"
                >
                  {submitting && <IconLoader className="w-4 h-4 mr-2 animate-spin" />}
                  {modalMode === "add" ? "Create Instruction" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
