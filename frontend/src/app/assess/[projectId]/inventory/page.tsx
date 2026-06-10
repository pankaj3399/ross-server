"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconArrowLeft,
  IconChevronRight,
  IconPlus,
  IconDownload,
  IconTable,
  IconInfoCircle,
  IconShield,
  IconScale,
  IconAlertTriangle,
  IconCheck,
  IconTrash,
  IconEdit,
  IconExternalLink,
  IconLoader2,
  IconSearch,
  IconFilterOff
} from "@tabler/icons-react";

import { apiService, InventoryComponent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessmentContext } from "@/contexts/AssessmentContext";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import VendorAssessmentModal from "@/components/features/inventory/VendorAssessmentModal";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { showToast } from "@/lib/toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  COMPONENT_TYPES,
  DATA_CATEGORIES,
  RISK_TIERS,
  COMPONENT_STATUSES,
  VENDOR_CATALOG,
  PROVIDERS,
  CRC_CONTROL_LINKAGES,
  suggestRiskTierFrontend,
  VENDOR_COMPLIANCE_URLS,
  type RiskTier,
  type ComponentStatus
} from "@/lib/inventoryConstants";

const RISK_BADGES: Record<string, string> = {
  Low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  High: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Critical: "bg-rose-500/10 text-rose-500 border-rose-500/20"
};

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-green-500/10 text-green-400 border-green-500/20",
  Evaluating: "bg-primary/10 text-primary border-primary/20",
  Deprecated: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
};

export default function ComponentInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: contextLoading } = useAssessmentContext();

  // State variables
  const [components, setComponents] = useState<InventoryComponent[]>([]);
  const [summary, setSummary] = useState({ totalCount: 0, thirdPartyCount: 0, highestRiskTier: "Low" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Selection & Modal States
  const [selectedComponent, setSelectedComponent] = useState<InventoryComponent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [isFeatureCWarningOpen, setIsFeatureCWarningOpen] = useState(false);
  const [assessedComponent, setAssessedComponent] = useState<InventoryComponent | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [formProvider, setFormProvider] = useState<string>("");
  const [formVersion, setFormVersion] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formDataCategories, setFormDataCategories] = useState<string[]>([]);
  const [formRiskTier, setFormRiskTier] = useState<string>("");
  const [formStatus, setFormStatus] = useState<string>("Active");
  const [formModelCardUrl, setFormModelCardUrl] = useState("");
  const [formComplianceUrl, setFormComplianceUrl] = useState("");
  const [formDpaUrl, setFormDpaUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");
  
  const [riskOverride, setRiskOverride] = useState(false);

  const [controlsList, setControlsList] = useState<any[]>([]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [comps, summ, controlsRes] = await Promise.all([
        apiService.getComponents(projectId),
        apiService.getInventorySummary(projectId),
        apiService.getPublishedCRCControls().catch(() => ({ data: [] }))
      ]);
      setComponents(comps);
      setSummary(summ);
      setControlsList(controlsRes?.data || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
      showToast.error("Failed to fetch component inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && isPremium) {
      fetchData();
    }
  }, [projectId, isPremium]);

  // Handle opening assessment modal from query parameters
  useEffect(() => {
    if (components && components.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const openAssessmentId = searchParams.get("openAssessment");
      if (openAssessmentId) {
        const comp = components.find(c => c.id === openAssessmentId || c.componentId === openAssessmentId);
        if (comp) {
          setSelectedComponent(comp);
          setIsDetailOpen(true);
          if (comp.provider.toLowerCase() !== "internal" && comp.provider.toLowerCase() !== "proprietary") {
            setAssessedComponent(comp);
          }
          // Remove openAssessment parameter from URL so it doesn't auto-reopen on reloads
          const url = new URL(window.location.href);
          url.searchParams.delete("openAssessment");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      }
    }
  }, [components]);

  // Compute autosuggested risk tier in real-time
  const computedRiskTier = useMemo(() => {
    if (!formType) return "Low";
    return suggestRiskTierFrontend(formType, formDataCategories);
  }, [formType, formDataCategories]);

  // Sync risk tier state if override is false
  useEffect(() => {
    if (!riskOverride) {
      setFormRiskTier(computedRiskTier);
    }
  }, [computedRiskTier, riskOverride]);

  // Handle provider selection → prefill component options or URL
  const handleProviderChange = (provider: string) => {
    setFormProvider(provider);
    
    // Auto populate compliance URL if known
    if (VENDOR_COMPLIANCE_URLS[provider]) {
      setFormComplianceUrl(VENDOR_COMPLIANCE_URLS[provider]);
    } else {
      setFormComplianceUrl("");
    }

    // Prefill model name if catalog matches
    const models = VENDOR_CATALOG[provider];
    if (models && models.length > 0) {
      setFormName(models[0]);
    }
  };

  // Open Form for Add
  const openAddForm = () => {
    setFormMode("add");
    setFormName("");
    setFormType("Closed Foundation Model");
    setFormProvider("OpenAI");
    setFormVersion("");
    setFormRole("");
    setFormDataCategories([]);
    setRiskOverride(false);
    setFormRiskTier("Low");
    setFormStatus("Active");
    setFormModelCardUrl("");
    setFormComplianceUrl("https://openai.com/security");
    setFormDpaUrl("");
    setFormNotes("");
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const openEditForm = (comp: InventoryComponent) => {
    setFormMode("edit");
    setFormName(comp.componentName);
    setFormType(comp.componentType);
    setFormProvider(comp.provider);
    setFormVersion(comp.version || "");
    setFormRole(comp.roleInSystem);
    setFormDataCategories(comp.dataCategoriesSent);
    setFormRiskTier(comp.riskTier);
    setFormStatus(comp.status);
    setFormModelCardUrl(comp.modelCardUrl || "");
    setFormComplianceUrl(comp.vendorComplianceUrl || "");
    setFormDpaUrl(comp.dpaUrl || "");
    setFormNotes(comp.notes || "");
    
    // If the saved risk tier does not match the suggested risk tier, enable override
    const suggested = suggestRiskTierFrontend(comp.componentType, comp.dataCategoriesSent);
    setRiskOverride(comp.riskTier !== suggested);
    
    setIsFormOpen(true);
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formType || !formProvider || !formRole.trim()) {
      showToast.error( "Please fill in all required fields");
      return;
    }

    try {
      setActionLoading(true);
      const payload: Partial<InventoryComponent> = {
        componentName: formName,
        componentType: formType,
        provider: formProvider,
        version: formVersion || null,
        roleInSystem: formRole,
        dataCategoriesSent: formDataCategories,
        riskTier: formRiskTier as RiskTier,
        status: formStatus as ComponentStatus,
        modelCardUrl: formModelCardUrl || null,
        vendorComplianceUrl: formComplianceUrl || null,
        dpaUrl: formDpaUrl || null,
        notes: formNotes || null
      };

      if (formMode === "add") {
        const newComp = await apiService.createComponent(projectId, payload);
        showToast.success( "Component added to inventory");
        setComponents((prev) => [...prev, newComp]);
      } else {
        if (!selectedComponent) return;
        const updatedComp = await apiService.updateComponent(projectId, selectedComponent.id, payload);
        showToast.success( "Component updated successfully");
        setComponents((prev) => prev.map((c) => (c.id === updatedComp.id ? updatedComp : c)));
        if (selectedComponent.id === updatedComp.id) {
          setSelectedComponent(updatedComp);
        }
      }
      setIsFormOpen(false);
      
      // Refresh summary cards
      const summ = await apiService.getInventorySummary(projectId);
      setSummary(summ);
    } catch (error: any) {
      console.error("Error saving component:", error);
      showToast.error( error.message || "Failed to save component");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Component
  const handleDelete = async () => {
    if (!selectedComponent) return;
    try {
      setActionLoading(true);
      await apiService.deleteComponent(projectId, selectedComponent.id);
      showToast.success( "Component removed from inventory");
      setComponents((prev) => prev.filter((c) => c.id !== selectedComponent.id));
      setIsDetailOpen(false);
      setIsDeleteOpen(false);
      setSelectedComponent(null);
      
      // Refresh summary cards
      const summ = await apiService.getInventorySummary(projectId);
      setSummary(summ);
    } catch (error) {
      console.error("Error deleting component:", error);
      showToast.error( "Failed to delete component");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle CSV Export
  const handleExport = async () => {
    try {
      const filters = {
        type: selectedType === "all" ? undefined : selectedType,
        provider: selectedProvider === "all" ? undefined : selectedProvider,
        risk_tier: selectedRisk === "all" ? undefined : selectedRisk,
        status: selectedStatus === "all" ? undefined : selectedStatus
      };

      const blob = await apiService.exportInventoryCsv(projectId, filters);
      
      const url = window.URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `AI_Component_Inventory_${projectId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast.success("CSV export downloaded successfully");
      } finally {
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("CSV Export failed:", error);
      showToast.error("Failed to export CSV");
    }
  };

  // Data categories toggle helper
  const handleCategoryToggle = (category: string) => {
    setFormDataCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev.filter(item => item !== "No Data Processing"), category]
    );
  };

  const handleNoDataProcessing = () => {
    setFormDataCategories(["No Data Processing"]);
  };

  // Filter components locally
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      const matchesSearch =
        comp.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.componentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === "all" || comp.componentType === selectedType;
      const matchesProvider = selectedProvider === "all" || comp.provider.toLowerCase() === selectedProvider.toLowerCase();
      const matchesRisk = selectedRisk === "all" || comp.riskTier === selectedRisk;
      const matchesStatus = selectedStatus === "all" || comp.status === selectedStatus;

      return matchesSearch && matchesType && matchesProvider && matchesRisk && matchesStatus;
    });
  }, [components, searchQuery, selectedType, selectedProvider, selectedRisk, selectedStatus]);

  // Reset Filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedProvider("all");
    setSelectedRisk("all");
    setSelectedStatus("all");
  };

  // Gating subscription check
  if (!authLoading && !contextLoading && user && !isPremium) {
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

  if (authLoading || contextLoading || loading) {
    return <AssessmentSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-6 space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Link href={`/assess/${projectId}`} className="hover:text-foreground transition-colors">
          Project Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">AI Component Inventory</span>
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            AI Component Inventory
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Document and maintain audit evidence for every AI model, system, dataset, and vector database in use. Required for EU AI Act Annex IV and ISO 42001 compliance.
          </p>
        </div>
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={components.length === 0}
            className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary rounded-xl"
          >
            <IconDownload className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm hover:shadow-md transition-all border-none"
          >
            <IconPlus className="h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>

      {/* Dashboard summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-card/50 backdrop-blur-sm border border-border/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm transition-all duration-300 overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/20 opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Total AI Components
          </div>
          <div className="text-3xl font-black text-foreground mt-2 tracking-tight">
            {summary.totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Registered components in system scope
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative bg-card/50 backdrop-blur-sm border border-border/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm transition-all duration-300 overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/20 opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Third-Party Vendor Dependencies
          </div>
          <div className="text-3xl font-black text-foreground mt-2 tracking-tight">
            {summary.thirdPartyCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Components provided by external vendors
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-card/50 backdrop-blur-sm border border-border/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm transition-all duration-300 overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/20 opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Highest Risk Tier
          </div>
          <div className="mt-2">
            <Badge className={`px-2.5 py-1 text-sm font-bold border rounded-lg ${RISK_BADGES[summary.highestRiskTier] || RISK_BADGES.Low}`}>
              {summary.highestRiskTier}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Based on data categories and model types
          </p>
        </motion.div>
      </div>

      {/* Filter and search Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-card/30 border border-border/55 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/25 focus-visible:border-primary"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full flex-1">
          {/* Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {COMPONENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Provider Filter */}
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {PROVIDERS.map((prov) => (
                <SelectItem key={prov} value={prov.toLowerCase()}>
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Risk Filter */}
          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
              <SelectValue placeholder="All Risks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              {RISK_TIERS.map((tier) => (
                <SelectItem key={tier} value={tier}>
                  {tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {COMPONENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset */}
        {(searchQuery || selectedType !== "all" || selectedProvider !== "all" || selectedRisk !== "all" || selectedStatus !== "all") && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="flex items-center gap-1.5 hover:bg-foreground/5 hover:text-foreground text-muted-foreground text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
          >
            <IconFilterOff className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Main Table view */}
      <div className="bg-card/40 border border-border/65 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {filteredComponents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
            <IconTable className="h-16 w-16 text-muted-foreground/30 mb-4 stroke-[1.2]" />
            <h3 className="text-lg font-bold text-foreground mb-1">No Components Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {components.length === 0
                ? "Your component inventory is empty. Start by adding your first AI system component."
                : "No components match your search and filter criteria. Try adjusting filters."}
            </p>
            {components.length === 0 && (
              <Button
                onClick={openAddForm}
                className="mt-6 bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md border-none flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                Add Your First Component
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card/30">
                <TableRow className="border-b border-border/50">
                  <TableHead className="w-[110px] font-bold text-foreground">ID</TableHead>
                  <TableHead className="font-bold text-foreground">Name</TableHead>
                  <TableHead className="font-bold text-foreground">Type</TableHead>
                  <TableHead className="font-bold text-foreground">Provider</TableHead>
                  <TableHead className="font-bold text-foreground">Risk Tier</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Vendor Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredComponents.map((comp) => (
                    <motion.tr
                      key={comp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setSelectedComponent(comp);
                        setIsDetailOpen(true);
                      }}
                      className="cursor-pointer border-b border-border/40 hover:bg-primary/5 transition-colors duration-200 group/row"
                    >
                      <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                        {comp.componentId}
                      </TableCell>
                      <TableCell className="font-medium text-foreground group-hover/row:text-primary transition-colors">
                        {comp.componentName}
                        {comp.version && (
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal bg-muted px-1.5 py-0.5 rounded-md">
                            v{comp.version}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground/80">{comp.componentType}</TableCell>
                      <TableCell className="text-sm text-foreground/85">{comp.provider}</TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-0.5 text-xs font-semibold border rounded-md ${RISK_BADGES[comp.riskTier] || RISK_BADGES.Low}`}>
                          {comp.riskTier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-0.5 text-xs font-semibold border rounded-md ${STATUS_BADGES[comp.status] || STATUS_BADGES.Active}`}>
                          {comp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          {comp.vendorAssessmentStatus === "Completed" ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                comp.vendorRiskTier === "Low"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : comp.vendorRiskTier === "Medium"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : comp.vendorRiskTier === "High"
                                      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}>
                                Vendor Risk: {comp.vendorRiskTier}
                              </span>
                              {comp.vendorAssessmentCompletedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comp.vendorAssessmentCompletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                              {comp.provider.toLowerCase() !== "internal" && comp.provider.toLowerCase() !== "proprietary" && (
                                <button
                                  onClick={() => setAssessedComponent(comp)}
                                  className="text-[10px] text-primary hover:underline font-semibold"
                                >
                                  Re-assess
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs ${
                                comp.vendorAssessmentStatus === "In Progress"
                                  ? "text-amber-400 font-medium"
                                  : "text-muted-foreground"
                              }`}>
                                {comp.vendorAssessmentStatus}
                              </span>
                              {comp.provider.toLowerCase() !== "internal" && comp.provider.toLowerCase() !== "proprietary" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setAssessedComponent(comp)}
                                        className="h-7 text-[10px] px-2 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-md shrink-0 border border-primary/15"
                                      >
                                        {comp.vendorAssessmentStatus === "In Progress" ? "Resume" : "Assess"}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Run vendor risk assessment questionnaire (Feature C)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Side Panel Drawer (Sheet) for details */}
      <Sheet open={isFormOpen ? false : isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto bg-card border-l border-border/60">
          {selectedComponent && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                    {selectedComponent.componentId}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditForm(selectedComponent)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:bg-foreground/5 hover:text-foreground rounded-lg"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsDeleteOpen(true)}
                      className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <SheetTitle className="text-2xl font-extrabold text-foreground mt-3">
                  {selectedComponent.componentName}
                  {selectedComponent.version && (
                    <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-lg ml-2">
                      Version {selectedComponent.version}
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  AI Component Details & Compliance Links
                </SheetDescription>
              </SheetHeader>

              {/* Status and Risk Grid */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 border border-border/50 rounded-2xl p-4">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Risk Tier
                  </div>
                  <div className="mt-1">
                    <Badge className={`px-2.5 py-0.5 text-xs font-bold border rounded-lg ${RISK_BADGES[selectedComponent.riskTier]}`}>
                      {selectedComponent.riskTier}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Inventory Status
                  </div>
                  <div className="mt-1">
                    <Badge className={`px-2.5 py-0.5 text-xs font-bold border rounded-lg ${STATUS_BADGES[selectedComponent.status]}`}>
                      {selectedComponent.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Core Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">
                  System Architecture
                </h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-muted-foreground font-medium">Type:</div>
                  <div className="col-span-2 text-foreground font-semibold">
                    {selectedComponent.componentType}
                  </div>

                  <div className="text-muted-foreground font-medium">Provider:</div>
                  <div className="col-span-2 text-foreground font-semibold">
                    {selectedComponent.provider}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground">Role in System:</div>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 border border-border/40 rounded-xl p-3">
                    {selectedComponent.roleInSystem}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-muted-foreground">Data Categories Processed:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedComponent.dataCategoriesSent.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">None specified</span>
                    ) : (
                      selectedComponent.dataCategoriesSent.map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="px-2 py-0.5 text-[11px] font-semibold text-foreground/75 border-border/50 rounded-md">
                          {cat}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance Documents */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">
                  Compliance Documentation
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { label: "Model Card / Spec Sheet", url: selectedComponent.modelCardUrl },
                    { label: "Vendor Compliance / Security Portal", url: selectedComponent.vendorComplianceUrl },
                    { label: "Data Processing Agreement (DPA)", url: selectedComponent.dpaUrl }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-xl text-sm">
                      <span className="text-muted-foreground font-medium">{doc.label}</span>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:text-primary/80 font-semibold gap-1 text-xs"
                        >
                          View Link
                          <IconExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Not Uploaded</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CRC Controls Linkages */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-1.5">
                  <IconShield className="h-4 w-4 text-emerald-500" />
                  Relevant CRC Controls
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  The following compliance controls are relevant to this component type under EU AI Act and ISO 42001:
                </p>
                <div className="flex flex-col gap-1.5">
                  {(CRC_CONTROL_LINKAGES[selectedComponent.componentType] || []).length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No linkages mapping defined</span>
                  ) : (
                    (CRC_CONTROL_LINKAGES[selectedComponent.componentType] || []).map((controlId) => {
                      const matched = controlsList.find(c => c.control_id === controlId);
                      const controlTitle = matched?.control_title || "Compliance Control";
                      return (
                        <div
                          key={controlId}
                          onClick={() => {
                            setIsDetailOpen(false);
                            router.push(`/assess/${projectId}/crc?controlId=${controlId}`);
                          }}
                          className="flex items-center justify-between p-2.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-xl text-xs text-foreground/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {controlId}
                            </span>
                            <span className="truncate max-w-[300px]">{controlTitle}</span>
                          </div>
                          <IconChevronRight className="h-3.5 w-3.5 text-emerald-500/60" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Vendor Assessment Stub (Feature C) */}
              {selectedComponent.provider.toLowerCase() !== "internal" && selectedComponent.provider.toLowerCase() !== "proprietary" && (
                <div className="p-4 border border-primary/15 bg-primary/5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <IconScale className="h-4 w-4 text-primary" />
                    Vendor Risk Assessment (Feature C)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-normal">
                    This component is external. Assess compliance risks relating to data transfer, hosting, and safety guidelines.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Status: <span className="text-foreground">{selectedComponent.vendorAssessmentStatus}</span>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setAssessedComponent(selectedComponent)}
                      className="bg-primary hover:bg-primary/90 text-white rounded-lg text-xs h-8"
                    >
                      Run Vendor Assessment
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedComponent.notes && (
                <div className="space-y-1 bg-muted/10 border border-border/30 rounded-xl p-3">
                  <div className="text-xs font-bold text-muted-foreground">Notes:</div>
                  <p className="text-xs text-foreground/85 whitespace-pre-wrap leading-relaxed">
                    {selectedComponent.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Form Modal (Dialog) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground">
              {formMode === "add" ? "Add New AI Component" : "Edit AI Component"}
            </DialogTitle>
            <DialogDescription>
              Document the architectural and vendor dependencies of your AI system model.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Component Type *</label>
                <Select value={formType} onValueChange={(val) => {
                  setFormType(val);
                  // Auto override risk suggestions if not locked
                }}>
                  <SelectTrigger className="rounded-xl border-border/65">
                    <SelectValue placeholder="Select component type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Provider / Vendor *</label>
                <Select value={formProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger className="rounded-xl border-border/65">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-foreground">Component / Model Name *</label>
                {VENDOR_CATALOG[formProvider] ? (
                  <Select value={formName} onValueChange={setFormName}>
                    <SelectTrigger className="rounded-xl border-border/65">
                      <SelectValue placeholder="Select or type component name" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_CATALOG[formProvider].map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="e.g. GPT-4, Custom Embedding Model, Pinecone DB"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="rounded-xl border-border/65"
                    required
                  />
                )}
              </div>

              {/* Version */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Version / Release Tag</label>
                <Input
                  placeholder="e.g. v1.2.0, 2024-05-13, late-2025"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  className="rounded-xl border-border/65"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Inventory Status *</label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="rounded-xl border-border/65">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role in system */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-foreground">Role in AI System *</label>
                <Textarea
                  placeholder="Explain exactly what this component does in your architecture (e.g., 'Primary closed foundation LLM used for user chat generation and summarization of case studies.')"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  rows={2}
                  className="rounded-xl border-border/65 min-h-[60px]"
                  required
                />
              </div>

              {/* Data Categories Multi-select */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Data Categories Sent/Processed *</span>
                  <button
                    type="button"
                    onClick={handleNoDataProcessing}
                    className="text-[10px] text-primary hover:text-primary/85 font-semibold"
                  >
                    Set to 'No Data Processing'
                  </button>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-border/55 rounded-xl p-3 bg-muted/15 max-h-[140px] overflow-y-auto">
                  {DATA_CATEGORIES.map((cat) => {
                    const isChecked = formDataCategories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          if (cat === "No Data Processing") {
                            handleNoDataProcessing();
                          } else {
                            handleCategoryToggle(cat);
                          }
                        }}
                        className={`flex items-start space-x-2 text-xs p-2 rounded-lg cursor-pointer border transition-colors ${
                          isChecked
                            ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                            : "border-transparent text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                          isChecked ? "bg-primary border-primary text-white" : "border-border/80"
                        }`}>
                          {isChecked && <IconCheck className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span className="leading-tight select-none">{cat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Tier Suggestion */}
              <div className="col-span-2 p-3 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground flex items-center gap-1">
                    Risk Assessment Suggested: 
                    <Badge className={`ml-1 px-2 py-0.5 text-[10px] font-bold border rounded-md ${RISK_BADGES[computedRiskTier]}`}>
                      {computedRiskTier}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Automatically calculated from component type and data categories.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setRiskOverride(!riskOverride)}
                      className={`h-4.5 w-8 rounded-full transition-colors relative focus:outline-none ${
                        riskOverride ? "bg-primary" : "bg-zinc-700"
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        riskOverride ? "right-0.5" : "left-0.5"
                      }`} />
                    </button>
                    <span className="text-xs font-semibold text-foreground/80">Override Suggestion</span>
                  </div>

                  {riskOverride && (
                    <Select value={formRiskTier} onValueChange={setFormRiskTier}>
                      <SelectTrigger className="w-28 h-8 text-xs rounded-lg border-border/60">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_TIERS.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Model Card URL</label>
                <Input
                  placeholder="https://example.com/model-card"
                  value={formModelCardUrl}
                  onChange={(e) => setFormModelCardUrl(e.target.value)}
                  className="rounded-xl border-border/65 text-xs"
                />
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Vendor Compliance Portal URL</label>
                <Input
                  placeholder="https://example.com/security"
                  value={formComplianceUrl}
                  onChange={(e) => setFormComplianceUrl(e.target.value)}
                  className="rounded-xl border-border/65 text-xs"
                />
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Data Processing Addendum (DPA) URL</label>
                <Input
                  placeholder="https://example.com/dpa"
                  value={formDpaUrl}
                  onChange={(e) => setFormDpaUrl(e.target.value)}
                  className="rounded-xl border-border/65 text-xs"
                />
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-foreground">Vendor Assessment Status</label>
                <Input
                  value="Not Run"
                  disabled
                  className="rounded-xl border-border/65 text-xs bg-muted/30 text-muted-foreground"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-foreground">Notes</label>
                <Textarea
                  placeholder="Additional architectural notes, internal contact points, custom API scopes, or hosting regions..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl border-border/65 min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl hover:bg-foreground/5 text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow border-none px-6"
              >
                {actionLoading && <IconLoader2 className="h-4 w-4 animate-spin inline mr-1.5" />}
                {formMode === "add" ? "Create Component" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal (Dialog) */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border/60 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-rose-500" />
              Remove AI Component
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this component? This action will permanently delete the component record and audit evidence links. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl hover:bg-foreground/5 text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md border-none px-6"
            >
              {actionLoading && <IconLoader2 className="h-4 w-4 animate-spin inline mr-1.5" />}
              Delete Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor AI Risk Assessment Modal (Feature C) */}
      {assessedComponent && (
        <VendorAssessmentModal
          isOpen={assessedComponent !== null}
          onClose={() => setAssessedComponent(null)}
          projectId={projectId as string}
          componentId={assessedComponent.id}
          vendorName={assessedComponent.provider}
          componentName={assessedComponent.componentName}
          onCompleted={fetchData}
        />
      )}
    </div>
  );
}
