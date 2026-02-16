"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiService } from "@/lib/api";
import { safeRenderHTML } from "@/lib/htmlUtils";
import { showToast } from "@/lib/toast";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconArrowRight,
  IconShieldCheck,
  IconAlertCircle,
  IconLoader2,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { SecureTextarea } from "@/components/shared/SecureTextarea";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { PREMIUM_STATUS } from "@/lib/constants";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";

// --- Interfaces ---

interface Control {
  id: string;
  control_id: string;
  control_title: string;
  category: string;
  priority: string;
  status: string;
  version: number;
  applicable_to: string[];
  control_statement: string;
  control_objective: string;
  risk_description: string;
  implementation: {
    requirements: string[];
    steps: string[];
    timeline: string;
  };
  evidence_requirements: string[];
  compliance_mapping: {
    eu_ai_act: Array<{ ref: string; context: string }>;
    nist_ai_rmf: Array<{ ref: string; context: string }>;
    iso_42001: Array<{ ref: string; context: string }>;
  };
  aima_mapping: {
    domain: string;
    area: string;
    maturity_enhancement: string;
  };
  created_at: string;
  updated_at: string;
}

interface CRCResponse {
  value: number;
  notes: string;
  updatedAt: string;
}

// --- Constants ---

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-success/15 text-success border-success/30",
};

const ANSWER_OPTIONS = [
  { value: 0, label: "No", description: "Not implemented or not applicable" },
  { value: 0.5, label: "Partially", description: "Partially implemented or in progress" },
  { value: 1, label: "Yes", description: "Fully implemented and operational" },
];

// --- Main Page Component ---

export default function CRCAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, loading: authLoading } = useAuth();

  const isPremium = user?.subscription_status
    ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number])
    : false;
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [controls, setControls] = useState<Control[]>([]);
  const [responses, setResponses] = useState<Record<string, CRCResponse>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Track which categories are expanded in the left sidebar
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Gate non-premium users
  if (!authLoading && user && !isPremium) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-screen">
        <SubscriptionModal
          isOpen={true}
          onClose={() => {
            router.push(`/assess/${projectId}`);
          }}
        />
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to subscription...</p>
        </div>
      </div>
    );
  }

  // Fetch controls and existing responses
  useEffect(() => {
    if (!user || !isPremium) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [controlsRes, responsesRes] = await Promise.all([
          apiService.getPublishedCRCControls(),
          apiService.getCRCResponses(projectId),
        ]);

        setControls(controlsRes.data);
        setResponses(responsesRes.responses || {});

        // Initialize local notes from saved responses
        const notesMap: Record<string, string> = {};
        Object.entries(responsesRes.responses || {}).forEach(([controlId, resp]) => {
          notesMap[controlId] = resp.notes || "";
        });
        setLocalNotes(notesMap);

        // Expand first category by default
        if (controlsRes.data.length > 0) {
          setExpandedCategories(new Set([controlsRes.data[0].category]));
        }
      } catch (error) {
        console.error("Error fetching CRC data:", error);
        showToast.error("Failed to load CRC controls");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Save answer
  const handleAnswerChange = useCallback(async (controlId: string, value: number) => {
    const previousResponse = responses[controlId];
    const notes = localNotes[controlId] || "";

    // Optimistic update
    setResponses(prev => ({
      ...prev,
      [controlId]: { value, notes, updatedAt: new Date().toISOString() },
    }));

    setSaving(true);
    try {
      await apiService.saveCRCResponse(projectId, { controlId, value, notes });
    } catch (error) {
      // Rollback on error
      if (previousResponse) {
        setResponses(prev => ({ ...prev, [controlId]: previousResponse }));
      } else {
        setResponses(prev => {
          const copy = { ...prev };
          delete copy[controlId];
          return copy;
        });
      }
      showToast.error("Failed to save response");
    } finally {
      setSaving(false);
    }
  }, [projectId, responses, localNotes]);

  // Save notes
  const handleNoteSave = useCallback(async (controlId: string, notes: string) => {
    const currentResponse = responses[controlId];
    if (currentResponse === undefined) return; // Must answer the question first

    setSaving(true);
    try {
      await apiService.saveCRCResponse(projectId, {
        controlId,
        value: currentResponse.value,
        notes,
      });
      setResponses(prev => ({
        ...prev,
        [controlId]: { ...prev[controlId], notes, updatedAt: new Date().toISOString() },
      }));
    } catch (error) {
      showToast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }, [projectId, responses]);

  // Navigation
  const handleNext = () => {
    if (currentIndex < controls.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDetails(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowDetails(false);
    }
  };

  const handleControlSelect = (index: number) => {
    setCurrentIndex(index);
    setShowDetails(false);
  };

  // Group controls by category for sidebar
  const controlsByCategory = controls.reduce((acc, control, index) => {
    if (!acc[control.category]) acc[control.category] = [];
    acc[control.category].push({ ...control, globalIndex: index });
    return acc;
  }, {} as Record<string, (Control & { globalIndex: number })[]>);

  const categories = Object.keys(controlsByCategory).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // Progress
  const totalControls = controls.length;
  const answeredControls = Object.keys(responses).length;
  const progress = totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;

  if (loading) {
    return <AssessmentSkeleton />;
  }

  if (controls.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="text-center max-w-md px-4">
          <IconAlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">No CRC Controls Available</h1>
          <p className="text-muted-foreground mb-6">
            There are currently no published compliance readiness controls. Please check back later.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border text-foreground hover:bg-muted rounded-xl transition-all duration-300"
          >
            <IconArrowLeft className="w-4 h-4 inline mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentControl = controls[currentIndex];
  const currentResponse = responses[currentControl.id];
  const currentAnswer = currentResponse?.value;
  const currentNote = localNotes[currentControl.id] || "";

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* LEFT SIDEBAR: Category + Control Navigation */}
      <div className="w-72 flex-none bg-card border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <IconShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground text-sm">CRC Controls</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {answeredControls} of {totalControls} completed
          </p>
          <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="py-2">
          {categories.map((category) => (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                {expandedCategories.has(category) ? (
                  <IconChevronDown className="w-3.5 h-3.5 text-primary flex-none" />
                ) : (
                  <IconChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-none" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/80 truncate">
                  {category}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {controlsByCategory[category].filter(c => responses[c.id] !== undefined).length}/{controlsByCategory[category].length}
                </span>
              </button>

              {expandedCategories.has(category) && (
                <div className="pb-1">
                  {controlsByCategory[category].map((control) => {
                    const isActive = control.globalIndex === currentIndex;
                    const isAnswered = responses[control.id] !== undefined;

                    return (
                      <button
                        key={control.id}
                        type="button"
                        onClick={() => handleControlSelect(control.globalIndex)}
                        className={`w-full flex items-center gap-2 pl-9 pr-4 py-2 text-left transition-colors text-sm ${isActive
                            ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                            : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                          }`}
                      >
                        {isAnswered ? (
                          <IconCheck className="w-3.5 h-3.5 text-success flex-none" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-border flex-none" />
                        )}
                        <span className="truncate text-[13px]">{control.control_id}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-background border-b border-border p-4 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                type="button"
                className="flex items-center gap-2 ml-2 text-primary hover:text-primary/80 transition-colors"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Compliance Readiness Controls
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentControl.category} • Control {currentIndex + 1} of {totalControls}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saving && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Control {currentIndex + 1} of {totalControls}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Control Card */}
            <motion.div
              key={currentControl.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-8"
            >
              {/* Control Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-xs font-mono">
                    {currentControl.control_id}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[currentControl.priority] || "bg-muted text-muted-foreground"}>
                    {currentControl.priority} Priority
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentControl.category}
                  </Badge>
                </div>

                {/* Control Title = The Question */}
                <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                  {currentControl.control_title}
                </h2>

                {/* Control Statement (rendered as HTML) */}
                {currentControl.control_statement && (
                  <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <div dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentControl.control_statement) }} />
                  </div>
                )}

                {/* Control Objective */}
                {currentControl.control_objective && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Objective: </span>
                    <span dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentControl.control_objective) }} />
                  </div>
                )}
              </div>

              {/* Expandable Implementation Details */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 mb-4 transition-colors"
              >
                {showDetails ? (
                  <IconChevronDown className="w-4 h-4" />
                ) : (
                  <IconChevronRight className="w-4 h-4" />
                )}
                {showDetails ? "Hide" : "Show"} Implementation Details & Requirements
              </button>

              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 space-y-4 border-t border-border pt-4"
                >
                  {/* Risk Description */}
                  {currentControl.risk_description && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">Risk Description</h4>
                      <div
                        className="text-sm text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentControl.risk_description) }}
                      />
                    </div>
                  )}

                  {/* Implementation */}
                  {currentControl.implementation && (currentControl.implementation.requirements?.filter(r => r).length > 0 || currentControl.implementation.steps?.filter(s => s).length > 0) && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-2">Implementation</h4>
                      {currentControl.implementation.requirements?.filter(r => r).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-foreground/70 mb-1">Requirements:</p>
                          <ul className="space-y-1 ml-4">
                            {currentControl.implementation.requirements.filter(r => r).map((req, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-disc">{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentControl.implementation.steps?.filter(s => s).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground/70 mb-1">Steps:</p>
                          <ol className="space-y-1 ml-4">
                            {currentControl.implementation.steps.filter(s => s).map((step, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-decimal">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {currentControl.implementation.timeline && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Timeline:</span> {currentControl.implementation.timeline}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Evidence Requirements */}
                  {currentControl.evidence_requirements?.filter(e => e).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">Evidence Requirements</h4>
                      <ul className="space-y-1 ml-4">
                        {currentControl.evidence_requirements.filter(e => e).map((evidence, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground list-disc">{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Compliance Mapping */}
                  {currentControl.compliance_mapping && (
                    (() => {
                      const hasEU = currentControl.compliance_mapping.eu_ai_act?.length > 0;
                      const hasNIST = currentControl.compliance_mapping.nist_ai_rmf?.length > 0;
                      const hasISO = currentControl.compliance_mapping.iso_42001?.length > 0;
                      if (!hasEU && !hasNIST && !hasISO) return null;
                      return (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2">Compliance Mapping</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {hasEU && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-foreground/70 mb-1">EU AI Act</p>
                                {currentControl.compliance_mapping.eu_ai_act.map((item, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{item.ref}</span>
                                    {item.context && ` — ${item.context}`}
                                  </p>
                                ))}
                              </div>
                            )}
                            {hasNIST && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-foreground/70 mb-1">NIST AI RMF</p>
                                {currentControl.compliance_mapping.nist_ai_rmf.map((item, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{item.ref}</span>
                                    {item.context && ` — ${item.context}`}
                                  </p>
                                ))}
                              </div>
                            )}
                            {hasISO && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-foreground/70 mb-1">ISO 42001</p>
                                {currentControl.compliance_mapping.iso_42001.map((item, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{item.ref}</span>
                                    {item.context && ` — ${item.context}`}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              )}

              {/* Answer Radio Buttons — Yes / Partially / No */}
              <div className="space-y-3">
                {ANSWER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${currentAnswer === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                  >
                    <div className="relative flex items-center justify-center mt-1">
                      <input
                        type="radio"
                        name={`answer-${currentControl.id}`}
                        value={option.value}
                        checked={currentAnswer === option.value}
                        onChange={() => handleAnswerChange(currentControl.id, option.value)}
                        className="sr-only peer"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 peer-focus-visible:ring peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 ${currentAnswer === option.value
                          ? "border-primary bg-primary"
                          : "border-border bg-transparent"
                        }`}>
                        {currentAnswer === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Notes Section */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Your Notes
                </h3>
                <SecureTextarea
                  value={currentNote}
                  onChange={(note) =>
                    setLocalNotes(prev => ({ ...prev, [currentControl.id]: note }))
                  }
                  onSave={(value) => handleNoteSave(currentControl.id, value)}
                  placeholder="Add your notes about this control — evidence, gaps, action items..."
                  maxLength={5000}
                  className="w-full"
                />
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pb-8">
              <button
                onClick={handlePrevious}
                type="button"
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-border text-foreground hover:bg-muted"
              >
                <IconArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNext}
                type="button"
                disabled={currentIndex === controls.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
                <IconArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
