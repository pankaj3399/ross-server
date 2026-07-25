"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, CheckCircle2, XCircle, Info, ChevronDown, ChevronUp, 
  Layers, AlertTriangle, Cpu, Check, Play, Settings2, Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { toast } from "sonner";
import { useWizardStore } from "../../../store/wizardStore";

import { apiService } from "../../../lib/api";
import { Save, History, AlertCircle } from "lucide-react";

interface ScrollIndicatorWrapperProps {
  children: React.ReactNode;
  maxHeightClass?: string;
}

function ScrollIndicatorWrapper({ children, maxHeightClass = "max-h-[400px]" }: ScrollIndicatorWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 10;
    setShowIndicator(isScrollable && !isAtBottom);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Check on mount / expansion
    const timer = setTimeout(checkScroll, 150);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [children]);

  const handleScroll = () => {
    checkScroll();
  };

  return (
    <div className="relative w-full">
      <CardContent
        ref={containerRef}
        onScroll={handleScroll}
        className={`p-4 space-y-4 bg-muted/10 overflow-y-auto ${maxHeightClass}`}
      >
        {children}
      </CardContent>
      
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none bg-gradient-to-t from-card via-card/75 to-transparent flex flex-col items-center justify-end pb-2 z-10"
          >
            <button
              type="button"
              aria-label="Scroll down to view more options"
              className="p-1.5 rounded-full bg-card/95 border border-border/40 shadow-lg backdrop-blur-sm pointer-events-auto cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center"
              onClick={() => {
                containerRef.current?.scrollBy({ top: 150, behavior: "smooth" });
              }}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface WizardConfirmationProps {
  projectId: string;
  onApplyComplete: () => void;
  onAdjustAnswers: () => void;
}

export function WizardConfirmation({ projectId, onApplyComplete, onAdjustAnswers }: WizardConfirmationProps) {
  const { engineOutput, loadSavedAnswers, applyProfile, saveProgress, answers, saving, loading } = useWizardStore();
  const [acknowledgedUnacceptable, setAcknowledgedUnacceptable] = useState(false);
  const [acknowledgedExistingData, setAcknowledgedExistingData] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("risks");
  
  // Selective confirm states
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  // Existing Data Review State (Migration Diff)
  const [existingData, setExistingData] = useState<{
    completedControlsCount: number;
    manualRisks: any[];
    manualComponents: any[];
    hasManualData: boolean;
  }>({
    completedControlsCount: 0,
    manualRisks: [],
    manualComponents: [],
    hasManualData: false,
  });

  useEffect(() => {
    loadSavedAnswers(projectId);
  }, [projectId, loadSavedAnswers]);

  useEffect(() => {
    async function checkExistingData() {
      try {
        const [responsesRes, risksRes, inventoryRes] = await Promise.allSettled([
          apiService.getCRCResponses(projectId),
          apiService.getCRCRisks(projectId),
          apiService.getComponents(projectId),
        ]);

        let completedControlsCount = 0;
        if (responsesRes.status === "fulfilled" && responsesRes.value?.responses) {
          completedControlsCount = Object.keys(responsesRes.value.responses).length;
        }

        let manualRisks: any[] = [];
        if (risksRes.status === "fulfilled" && Array.isArray(risksRes.value?.data)) {
          manualRisks = risksRes.value.data;
        }

        let manualComponents: any[] = [];
        if (inventoryRes.status === "fulfilled" && Array.isArray(inventoryRes.value)) {
          manualComponents = inventoryRes.value;
        }

        const hasManualData = completedControlsCount > 0 || manualRisks.length > 0 || manualComponents.length > 0;
        setExistingData({
          completedControlsCount,
          manualRisks,
          manualComponents,
          hasManualData,
        });
      } catch (err) {
        console.error("Error checking existing project data:", err);
      }
    }
    checkExistingData();
  }, [projectId]);

  // Pre-populate selections when engine outputs are loaded
  useEffect(() => {
    if (engineOutput) {
      if (engineOutput.suggested_risks) {
        setSelectedRisks(engineOutput.suggested_risks.map((r: any) => r.title));
      }
      if (engineOutput.suggested_components) {
        setSelectedComponents(engineOutput.suggested_components.map((c: any) => c.component_name));
      }
    }
  }, [engineOutput]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="h-10 bg-muted animate-pulse rounded w-1/2" />
        <div className="h-24 bg-muted animate-pulse rounded w-full" />
        <div className="h-64 bg-muted animate-pulse rounded w-full" />
      </div>
    );
  }

  if (!engineOutput) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">No Compliance Profile Found</h2>
        <p className="text-muted-foreground">
          We couldn't load the compliance profile output for this project. Please complete the setup wizard first.
        </p>
        <Button onClick={() => loadSavedAnswers(projectId)} variant="outline">
          Retry Loading
        </Button>
      </div>
    );
  }

  const {
    eu_risk_tier,
    internal_risk_tier,
    eu_risk_reason,
    applicable_frameworks = [],
    control_flags = {},
    suggested_risks = [],
    suggested_components = [],
    vulnerability_scope = [],
    bias_scope = [],
    article5_warning = false,
    article50_note = false,
    gpai_warning = false,
    informational_notes = [],
  } = engineOutput;

  // Count control statuses
  const controlsList = Object.values(control_flags) as any[];
  const mandatoryCount = controlsList.filter(c => c.flag === "MANDATORY").length;
  const recommendedCount = controlsList.filter(c => c.flag === "RECOMMENDED").length;
  const optionalCount = controlsList.filter(c => c.flag === "OPTIONAL").length;

  const toggleRisk = (title: string) => {
    setSelectedRisks(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const toggleComponent = (name: string) => {
    setSelectedComponents(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSaveDraftAndExit = async () => {
    try {
      await saveProgress(projectId);
      toast.success("Wizard answers saved as draft. No profile changes were applied.");
      onApplyComplete();
    } catch (err) {
      toast.error("Failed to save draft.");
    }
  };

  const handleApply = async () => {
    if (eu_risk_tier === "UNACCEPTABLE" && !acknowledgedUnacceptable) {
      toast.error("You must acknowledge the Prohibited AI Practice warning before applying this profile.");
      return;
    }
    if (existingData.hasManualData && !acknowledgedExistingData) {
      toast.error("You must acknowledge the Existing Data Review before applying this profile.");
      return;
    }

    try {
      // Store 48-hour rollback snapshot if project had manual data
      if (existingData.hasManualData) {
        localStorage.setItem(`wizard_rollback_snapshot_${projectId}`, JSON.stringify({
          timestamp: Date.now(),
          answers,
          existingDataSummary: {
            completedControlsCount: existingData.completedControlsCount,
            risksCount: existingData.manualRisks.length,
            componentsCount: existingData.manualComponents.length,
          }
        }));
      }

      await applyProfile(projectId, {
        acceptedRisks: selectedRisks,
        acceptedComponents: selectedComponents,
      });
      toast.success("Compliance profile applied successfully!");
      onApplyComplete();
    } catch (err) {
      toast.error("Failed to apply profile outputs.");
    }
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case "UNACCEPTABLE": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "LIMITED": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "MINIMAL": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 7: Outputs Confirmation</span>
          <h1 className="text-3xl font-extrabold text-foreground mt-1">
            Your AI System Compliance Profile is Ready
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review the determined risk categories, frameworks, and auto-generated seeding actions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAdjustAnswers} disabled={saving} className="text-xs">
            <Settings2 className="h-4 w-4 mr-1.5" /> Adjust Answers
          </Button>
        </div>
      </div>

      {/* Existing Data Migration Diff Review */}
      {existingData.hasManualData && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 text-amber-400">
              <History className="h-6 w-6 flex-shrink-0" />
              <CardTitle className="text-lg font-bold">Existing Data Review (Migration Diff)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-200/90 leading-relaxed">
              This project contains pre-existing manual data: 
              <strong> {existingData.completedControlsCount} completed CRC controls</strong>, 
              <strong> {existingData.manualRisks.length} manual risks</strong>, and 
              <strong> {existingData.manualComponents.length} manual inventory components</strong>. 
              Applying this profile will merge new framework flags and starter suggestions without overwriting your manual progress.
            </p>
            <div className="flex items-start gap-3 p-3 rounded bg-amber-500/10 border border-amber-500/20">
              <Checkbox 
                id="ack-existing-data" 
                checked={acknowledgedExistingData} 
                onCheckedChange={(checked) => setAcknowledgedExistingData(!!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="ack-existing-data" className="text-xs text-amber-200 font-medium cursor-pointer leading-normal">
                I have reviewed the existing project data and confirm applying this compliance profile will merge settings without silently overwriting manual progress.
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings & Notices */}
      {article5_warning && (
        <Card className="border-red-500/30 bg-red-500/5 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="h-6 w-6 flex-shrink-0" />
              <CardTitle className="text-lg font-bold">WARNING: Prohibited AI Practice Detected</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-300/90 leading-relaxed">
              This system appears to engage in a <strong>Prohibited AI Practice</strong> under Article 5 of the EU AI Act ({eu_risk_reason}). Placing these systems on the market or putting them into service within the EU is prohibited and carries severe legal penalties (up to €35M or 7% of global annual turnover).
            </p>
            <div className="flex items-start gap-3 p-3 rounded bg-red-500/10 border border-red-500/20">
              <Checkbox 
                id="ack-unacceptable" 
                checked={acknowledgedUnacceptable} 
                onCheckedChange={(checked) => setAcknowledgedUnacceptable(!!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="ack-unacceptable" className="text-xs text-red-200 font-medium cursor-pointer leading-normal">
                I acknowledge that this system is flagged as a Prohibited AI Practice under EU AI Act Article 5 and understand the severe legal/compliance implications of proceeding.
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid: Risk Tier & Frameworks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Classification */}
        <Card className="md:col-span-2 border border-border/50 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground uppercase tracking-wider">Risk Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={`px-3 py-1.5 text-xs font-extrabold border ${getRiskColor(eu_risk_tier)}`}>
                EU TIER: {eu_risk_tier}
              </Badge>
              <Badge className={`px-3 py-1.5 text-xs font-extrabold border ${getRiskColor(internal_risk_tier === "CRITICAL" ? "UNACCEPTABLE" : internal_risk_tier)}`}>
                INTERNAL: {internal_risk_tier}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
              {eu_risk_reason}
            </p>
          </CardContent>
        </Card>

        {/* Frameworks & Controls */}
        <Card className="border border-border/50 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground uppercase tracking-wider">Applicable Frameworks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              {applicable_frameworks.map((f: string) => {
                const isEUProhibited = f === "EU AI Act" && eu_risk_tier === "UNACCEPTABLE";
                return (
                  <div 
                    key={f} 
                    className={`flex items-center justify-between gap-2 text-sm font-semibold p-2 rounded border transition-all ${
                      isEUProhibited 
                        ? "bg-red-500/10 border-red-500/30 text-red-400" 
                        : "bg-muted/20 border-border/20 text-foreground/90"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isEUProhibited ? (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                      )}
                      <span>{f}</span>
                    </div>
                    {isEUProhibited && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        NOT IN COMPLIANCE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {eu_risk_tier === "UNACCEPTABLE" && (
              <p className="text-[11px] text-red-300/80 leading-snug mt-2 p-2 bg-red-500/5 rounded border border-red-500/20">
                <strong>Compliance Note:</strong> You are <strong>not blocked from using MATUR.ai</strong>, but blocked from claiming EU AI Act compliance until you edit answers or document a legal review.
              </p>
            )}
            <div className="pt-2 border-t border-border/30 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold block">CRC Control Summary</span>
              <div className="flex justify-between text-xs">
                <span className="text-red-400 font-semibold">{mandatoryCount} Mandatory</span>
                <span className="text-amber-400 font-semibold">{recommendedCount} Recommended</span>
                <span className="text-slate-400">{optionalCount} Optional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informational Notes */}
      {informational_notes.length > 0 && (
        <div className="space-y-2">
          {informational_notes.map((note: string, i: number) => (
            <div key={i} className="p-3.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300/95 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* Risks Seeding */}
        <Card className="border border-border/50 overflow-hidden">
          <button
            onClick={() => toggleSection("risks")}
            className="w-full flex justify-between items-center p-4 bg-muted/20 hover:bg-muted/30 transition-colors border-b border-border/40"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-foreground">1. Risk Register Starter Entries ({selectedRisks.length}/{suggested_risks.length} Selected)</span>
            </div>
            {expandedSection === "risks" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          <AnimatePresence>
            {expandedSection === "risks" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <ScrollIndicatorWrapper maxHeightClass="max-h-[400px]">
                  {suggested_risks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No starter risks suggested for this profile.</p>
                  ) : (
                    suggested_risks.map((risk: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border transition-all ${
                          selectedRisks.includes(risk.title) 
                            ? "border-indigo-500/30 bg-indigo-500/5" 
                            : "border-border/40 bg-muted/10 opacity-70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 items-start">
                            <Checkbox 
                              id={`risk-${idx}`}
                              checked={selectedRisks.includes(risk.title)}
                              onCheckedChange={() => toggleRisk(risk.title)}
                              className="mt-1"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Label htmlFor={`risk-${idx}`} className="font-bold text-sm sm:text-base text-foreground/90 cursor-pointer">
                                  {risk.title}
                                </Label>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 bg-muted">
                                  {risk.category}
                                </Badge>
                                <Badge className={`text-[10px] uppercase font-extrabold py-0 bg-muted ${
                                  risk.rating === "Critical" || risk.rating === "High" ? "text-red-400 border-red-500/20" : "text-amber-400 border-amber-500/20"
                                }`}>
                                  {risk.rating} Rating
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-2">{risk.description}</p>
                              <div className="mt-3 text-xs bg-muted/30 border border-border/30 p-2.5 rounded-lg">
                                <span className="font-bold text-foreground block mb-0.5">Proposed Mitigation:</span>
                                {risk.mitigation_plan}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollIndicatorWrapper>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Components Seeding */}
        <Card className="border border-border/50 overflow-hidden">
          <button
            onClick={() => toggleSection("components")}
            className="w-full flex justify-between items-center p-4 bg-muted/20 hover:bg-muted/30 transition-colors border-b border-border/40"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <span className="font-bold text-foreground">2. Component Inventory Starter Rows ({selectedComponents.length}/{suggested_components.length} Selected)</span>
            </div>
            {expandedSection === "components" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          <AnimatePresence>
            {expandedSection === "components" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <ScrollIndicatorWrapper maxHeightClass="max-h-[400px]">
                  {suggested_components.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No starter components suggested for this profile.</p>
                  ) : (
                    suggested_components.map((comp: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border transition-all ${
                          selectedComponents.includes(comp.component_name) 
                            ? "border-indigo-500/30 bg-indigo-500/5" 
                            : "border-border/40 bg-muted/10 opacity-70"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id={`comp-${idx}`}
                            checked={selectedComponents.includes(comp.component_name)}
                            onCheckedChange={() => toggleComponent(comp.component_name)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Label htmlFor={`comp-${idx}`} className="font-bold text-sm sm:text-base text-foreground/90 cursor-pointer">
                                {comp.component_name}
                              </Label>
                              <Badge variant="outline" className="text-[10px] bg-muted">
                                {comp.component_type}
                              </Badge>
                              <Badge className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-0">
                                Provider: {comp.provider}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2">{comp.role_in_system}</p>
                            <div className="mt-3 flex gap-2 text-xs">
                              <span className="text-muted-foreground">Status: <span className="font-semibold text-emerald-400">{comp.status}</span></span>
                              <span className="text-muted-foreground">| Risk Tier: <span className="font-semibold text-red-400">{comp.risk_tier}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollIndicatorWrapper>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Downstream Configurations Summary */}
        <Card className="border border-border/50 overflow-hidden">
          <button
            onClick={() => toggleSection("downstream")}
            className="w-full flex justify-between items-center p-4 bg-muted/20 hover:bg-muted/30 transition-colors border-b border-border/40"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <span className="font-bold text-foreground">3. Automation & Scope Settings (DPIA / Vulnerability / Bias)</span>
            </div>
            {expandedSection === "downstream" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          <AnimatePresence>
            {expandedSection === "downstream" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <CardContent className="p-4 space-y-6 bg-muted/20">
                  {/* Vuln Scope */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Vulnerability Assessment Scope (OWASP LLM Pre-selections)
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {vulnerability_scope.map((v: string) => (
                        <span key={v} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bias Scope */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Bias & Ethical Testing Scope (Protected Attributes)
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {bias_scope.map((b: string) => (
                        <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Prohibited practice acknowledgment banner if unacceptable */}
      {eu_risk_tier === "UNACCEPTABLE" && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mt-6">
          <div className="flex gap-3 items-start md:items-center">
            <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-200">Prohibited AI Practice detected</p>
              <p className="text-xs text-red-300/80 leading-relaxed mt-0.5">
                This system engages in a practice prohibited under Article 5. Proceeding requires acknowledging these compliance risks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 w-full md:w-auto">
            <Checkbox 
              id="ack-unacceptable-bottom" 
              checked={acknowledgedUnacceptable} 
              onCheckedChange={(checked) => setAcknowledgedUnacceptable(!!checked)}
            />
            <Label htmlFor="ack-unacceptable-bottom" className="text-xs text-red-200 font-semibold cursor-pointer select-none">
              Acknowledge compliance risks
            </Label>
          </div>
        </div>
      )}

      {/* Apply Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/40 justify-end items-center">
        <Button
          onClick={handleSaveDraftAndExit}
          variant="secondary"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-6 font-bold flex items-center justify-center gap-2 border border-border/60"
        >
          <Save className="h-4 w-4 text-muted-foreground" />
          Save &amp; Exit (Draft)
        </Button>
        <Button 
          onClick={onAdjustAnswers} 
          variant="outline" 
          disabled={saving}
          className="w-full sm:w-auto px-6 py-6 font-bold"
        >
          Adjust Answers
        </Button>
        <Button
          onClick={handleApply}
          disabled={
            saving || 
            (eu_risk_tier === "UNACCEPTABLE" && !acknowledgedUnacceptable) ||
            (existingData.hasManualData && !acknowledgedExistingData)
          }
          className="w-full sm:w-auto px-8 py-6 bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? "Applying Profile..." : "Apply Profile & Open Platform"}
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
