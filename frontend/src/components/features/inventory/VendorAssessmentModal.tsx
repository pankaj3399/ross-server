"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  IconCheck, 
  IconLoader2, 
  IconShield, 
  IconScale, 
  IconExternalLink, 
  IconInfoCircle,
  IconDeviceFloppy,
  IconShieldCheck,
  IconChevronRight
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { apiService, VendorAssessment, VendorAssessmentAnswer } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { normalizeProviderKey } from "@/lib/vendorUtils";

interface VendorAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  componentId: string;
  vendorName: string;
  componentName: string;
  onCompleted: () => void;
}

// Client-side representation of questions (must match backend exactly)
interface Option {
  value: string;
  score: number;
  label: string;
}

interface Question {
  id: string;
  section: "profile" | "data" | "governance" | "operational";
  text: string;
  options: Option[];
}

const SECTIONS = [
  { id: "profile", label: "Vendor Profile", icon: IconInfoCircle },
  { id: "data", label: "Data Processing", icon: IconShield },
  { id: "governance", label: "AI Governance", icon: IconScale },
  { id: "operational", label: "Operational Risk", icon: IconShieldCheck }
] as const;



export default function VendorAssessmentModal({
  isOpen,
  onClose,
  projectId,
  componentId,
  vendorName,
  componentName,
  onCompleted
}: VendorAssessmentModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [assessment, setAssessment] = useState<VendorAssessment | null>(null);
  
  const [activeSection, setActiveSection] = useState<"profile" | "data" | "governance" | "operational">("profile");
  const [answers, setAnswers] = useState<Record<string, VendorAssessmentAnswer>>({});
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<string>>(new Set());

  const [vendorQuestions, setVendorQuestions] = useState<Question[]>([]);

  // Determine if vendor has prefilled answers in the template
  const isPrefillVendor = useMemo(() => {
    return normalizeProviderKey(vendorName) !== null;
  }, [vendorName]);

  // Load assessment data
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.all([
      apiService.getVendorAssessmentSchema(),
      apiService.getVendorAssessment(projectId, componentId)
    ])
      .then(([schemaRes, assessRes]) => {
        let currentQuestions: Question[] = [];
        if (schemaRes.success && schemaRes.questions) {
          setVendorQuestions(schemaRes.questions);
          currentQuestions = schemaRes.questions;
        }
        if (assessRes.success && assessRes.data) {
          setAssessment(assessRes.data);
          const initialAnswers = assessRes.data.answers || {};
          setAnswers(initialAnswers);

          // If the assessment was completed, mark all as confirmed
          if (assessRes.data.status === "Completed") {
            setConfirmedQuestions(new Set(currentQuestions.map(q => q.id)));
          } else if (assessRes.data.id !== null) {
            // If it's saved in DB as In Progress, any question with an answer value is confirmed
            const confirmed = new Set<string>();
            Object.keys(initialAnswers).forEach(qId => {
              if (initialAnswers[qId]?.optionValue) {
                confirmed.add(qId);
              }
            });
            setConfirmedQuestions(confirmed);
          } else {
            // It's a fresh template. If it's prefilled, require user to review/confirm them.
            setConfirmedQuestions(new Set());
          }
        }
      })
      .catch(err => {
        console.error("Failed to load vendor assessment:", err);
        showToast.error("Failed to load vendor risk assessment data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, projectId, componentId, vendorName]);

  // Calculate live score and tier based on current answers state
  // WARNING: This local calculation duplicates calculateAssessmentScore on the backend
  // and must be kept in sync whenever backend thresholds or scoring change.
  const liveScorecard = useMemo(() => {
    let score = 0;
    let answeredCount = 0;

    vendorQuestions.forEach(q => {
      const ans = answers[q.id];
      if (ans) {
        const opt = q.options.find(o => o.value === ans.optionValue);
        if (opt) {
          score += opt.score;
          answeredCount++;
        }
      }
    });

    let riskTier: "Low" | "Medium" | "High" | "Critical" = "Low";
    if (score >= 41) riskTier = "Critical";
    else if (score >= 26) riskTier = "High";
    else if (score >= 11) riskTier = "Medium";

    // Use backend-provided score if it matches the current answers to avoid visual lag when editing
    const isUnchanged = assessment && JSON.stringify(answers) === JSON.stringify(assessment.answers);
    const displayScore = isUnchanged ? assessment.score : score;
    const displayRiskTier = isUnchanged ? assessment.riskTier : riskTier;

    return {
      score: displayScore,
      riskTier: displayRiskTier,
      answeredCount,
      confirmedCount: confirmedQuestions.size,
      percentComplete: vendorQuestions.length > 0 ? Math.round((confirmedQuestions.size / vendorQuestions.length) * 100) : 0
    };
  }, [answers, confirmedQuestions, vendorQuestions, assessment]);

  const handleOptionSelect = (questionId: string, optionValue: string) => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: {
          ...(prev[questionId] || { evidence: "", url: "" }),
          optionValue
        }
      };
      
      // If user manually changes an option, they must re-confirm it if it's a prefill vendor
      // For standard vendors, we auto-confirm on selection
      if (!isPrefillVendor) {
        setConfirmedQuestions(curr => {
          const next = new Set(curr);
          next.add(questionId);
          return next;
        });
      } else {
        // Remove from confirmed so they verify the custom change
        setConfirmedQuestions(curr => {
          const next = new Set(curr);
          next.delete(questionId);
          return next;
        });
      }
      
      return updated;
    });
  };

  const handleEvidenceChange = (questionId: string, evidence: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { optionValue: "", url: "" }),
        evidence
      }
    }));
  };

  const handleUrlChange = (questionId: string, url: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { optionValue: "", evidence: "" }),
        url
      }
    }));
  };

  const handleConfirmQuestion = (questionId: string) => {
    const answer = answers[questionId];
    if (!answer || !answer.optionValue) {
      showToast.error("Please select an answer choice before confirming.");
      return;
    }
    setConfirmedQuestions(curr => {
      const next = new Set(curr);
      next.add(questionId);
      return next;
    });
    showToast.success(`Question ${questionId} verified and confirmed!`);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await apiService.saveVendorAssessment(projectId, componentId, answers);
      if (res.success && res.data) {
        setAssessment(res.data);
        showToast.success("Assessment progress saved successfully as draft.");
        onCompleted(); // Refresh inventory list statuses
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
      showToast.error("Failed to save draft progress");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAssessment = async () => {
    // Double check that all 18 are answered and confirmed
    if (confirmedQuestions.size < vendorQuestions.length) {
      showToast.error(`You have only confirmed ${confirmedQuestions.size} out of ${vendorQuestions.length} questions. Please review and confirm all questions.`);
      return;
    }

    setCompleting(true);
    try {
      const res = await apiService.completeVendorAssessment(projectId, componentId, answers);
      if (res.success && res.data) {
        setAssessment(res.data);
        showToast.success("Vendor Risk Assessment completed! CRC controls GOV-3P-01/02/03 are now flipped to 'Evidence Complete'.");
        onCompleted();
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to complete assessment:", err);
      const msg = err?.message || err?.error || "Failed to complete risk assessment. Please check that all inputs are filled correctly.";
      showToast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  // Filter questions for active tab
  const activeQuestions = useMemo(() => {
    return vendorQuestions.filter(q => q.section === activeSection);
  }, [activeSection, vendorQuestions]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] md:max-w-6xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 border border-border/50 rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <IconScale className="h-5.5 w-5.5 text-primary" />
              Vendor AI Risk Assessment: {vendorName}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Component: <span className="font-semibold text-foreground">{componentName}</span> • Grouped by ISO 42001 & EU AI Act compliance criteria.
            </p>
          </div>
          {assessment && (
            <div className="flex items-center gap-2 mr-6">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                assessment.status === "Completed" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {assessment.status === "Completed" ? "Completed" : "Draft (In Progress)"}
              </span>
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Loading assessment details...</span>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT TAB NAVIGATION */}
            <div className="w-64 border-r border-border/50 bg-muted/10 p-4 flex flex-col gap-1">
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                Assessment Sections
              </div>
              {SECTIONS.map((sec) => {
                const SecIcon = sec.icon;
                const sectionQuestions = vendorQuestions.filter(q => q.section === sec.id);
                const confirmedInSection = sectionQuestions.filter(q => confirmedQuestions.has(q.id)).length;
                const isCurrent = activeSection === sec.id;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center justify-between w-full p-3 text-left rounded-xl transition-all ${
                      isCurrent 
                        ? "bg-primary text-primary-foreground font-bold shadow-md" 
                        : "hover:bg-muted/50 text-foreground/75 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      <SecIcon className={`h-4.5 w-4.5 ${isCurrent ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      <span>{sec.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isCurrent 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : confirmedInSection === sectionQuestions.length
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-muted-foreground/15 text-muted-foreground"
                    }`}>
                      {confirmedInSection}/{sectionQuestions.length}
                    </span>
                  </button>
                );
              })}

              <div className="mt-auto p-3 bg-muted/20 border border-border/40 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Compliance Scope
                </span>
                <span className="text-xs text-foreground/80 leading-relaxed font-medium">
                  Completing this assessment satisfies relevant CRC control points.
                </span>
              </div>
            </div>

            {/* MIDDLE PANELS: SCROLLABLE QUESTIONS */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeQuestions.map((q, qIndex) => {
                const answer = answers[q.id] || { optionValue: "", evidence: "", url: "" };
                const isConfirmed = confirmedQuestions.has(q.id);

                return (
                  <div 
                    key={q.id} 
                    className={`p-5 rounded-2xl border transition-all ${
                      isConfirmed 
                        ? "bg-card border-emerald-500/20 shadow-sm" 
                        : "bg-card border-border/60"
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Question {q.id}
                        </span>
                        <h3 className="text-sm font-bold text-foreground mt-1.5 leading-snug">
                          {q.text}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isConfirmed ? (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                            <IconCheck className="h-3.5 w-3.5" /> Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Option Choices */}
                    <div className="grid grid-cols-1 gap-2 mb-4" role="radiogroup" aria-label={`Options for question ${q.id}`}>
                      {q.options.map((opt) => {
                        const isSelected = answer.optionValue === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleOptionSelect(q.id, opt.value)}
                            role="radio"
                            aria-checked={isSelected}
                            className={`p-3 rounded-xl border text-xs text-left w-full cursor-pointer flex items-center justify-between transition-all select-none ${
                              isSelected 
                                ? "bg-primary/5 border-primary text-foreground font-semibold" 
                                : "hover:bg-muted/30 border-border/50 text-foreground/80"
                            }`}
                          >
                            <span className="leading-normal">{opt.label}</span>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-semibold">
                                Score: {opt.score}
                              </span>
                              <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-border/80"
                              }`}>
                                {isSelected && <IconCheck className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Evidence & URL text fields */}
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-foreground">Evidence Justification</label>
                          <Textarea
                            placeholder="Add brief details justifying why this vendor complies..."
                            value={answer.evidence || ""}
                            onChange={(e) => handleEvidenceChange(q.id, e.target.value)}
                            rows={2}
                            className="text-xs rounded-xl min-h-[55px] border-border/60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-foreground">Evidence Reference URL</label>
                          <Input
                            placeholder="https://trust.vendor.com/..."
                            value={answer.url || ""}
                            onChange={(e) => handleUrlChange(q.id, e.target.value)}
                            className="text-xs rounded-xl h-9 border-border/60"
                          />
                        </div>
                      </div>

                      {/* Prefill Review Banner */}
                      {isPrefillVendor && !isConfirmed && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5 mt-2">
                          <IconInfoCircle className="h-4.5 w-4.5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-xs leading-normal flex-1">
                            <span className="font-semibold text-primary">Pre-filled suggestion available.</span> Verify the compliance details and click confirm to approve.
                          </div>
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleConfirmQuestion(q.id)}
                            className="h-7 text-[10px] px-3 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground border-none shadow-sm font-semibold"
                          >
                            Verify & Confirm
                          </Button>
                        </div>
                      )}

                      {/* Manual verification confirm button if not prefilled vendor */}
                      {!isPrefillVendor && !isConfirmed && answer.optionValue && (
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleConfirmQuestion(q.id)}
                            className="h-7 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white border-none shadow-sm font-semibold"
                          >
                            Confirm Answer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT SIDEBAR: SCORECARD & CONTROLS */}
            <div className="w-80 border-l border-border/50 bg-muted/5 p-6 flex flex-col gap-6 overflow-y-auto">
              {/* Progress Card */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl shadow-sm space-y-3">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Assessment Progress
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono">
                    {liveScorecard.confirmedCount}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    / {vendorQuestions.length} Confirmed
                  </span>
                </div>
                <Progress value={liveScorecard.percentComplete} className="h-2" />
                <p className="text-[11px] text-muted-foreground leading-normal">
                  All questions must be reviewed and confirmed to complete.
                </p>
              </div>

              {/* Scorecard Gauge */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl shadow-sm space-y-4 text-center">
                <div>
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Estimated Risk Score
                  </span>
                  <div className="text-4xl font-black font-mono mt-1 text-foreground">
                    {liveScorecard.score}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                    Range: 0 (Compliant) to 54 (Critical Risk)
                  </span>
                </div>

                <div className="border-t border-border/40 pt-4 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-2">
                    Suggested Risk Tier
                  </span>
                  <span className={`text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${
                    liveScorecard.riskTier === "Low"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : liveScorecard.riskTier === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : liveScorecard.riskTier === "High"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {liveScorecard.riskTier}
                  </span>
                </div>
              </div>

              {/* Satisfied Controls Card */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl shadow-sm space-y-3 flex-1 flex flex-col min-h-[180px]">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <IconShield className="h-4.5 w-4.5 text-emerald-500" />
                  Satisfied CRC Controls
                </h4>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Completing this assessment provides audit evidence for the following compliance controls:
                </p>
                <div className="flex flex-col gap-1.5 mt-2">
                  {[
                    { id: "GOV-3P-01", title: "Third-Party AI Risk Management" },
                    { id: "GOV-3P-02", title: "Third-Party Contingency & Incident Response" },
                    { id: "GOV-3P-03", title: "Supplier AI Component Quality Assurance" }
                  ].map((ctrl) => (
                    <a
                      key={ctrl.id}
                      href={`/assess/${projectId}/crc?controlId=${ctrl.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-muted/20 border border-border/40 hover:bg-muted/40 rounded-xl transition-all cursor-pointer text-[10px]"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-emerald-400">
                          {ctrl.id}
                        </span>
                        <span className="text-foreground/80 font-medium truncate max-w-[170px]">
                          {ctrl.title}
                        </span>
                      </div>
                      <IconExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="p-5 border-t border-border/50 bg-muted/5 flex items-center justify-between gap-3 sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl hover:bg-foreground/5 text-muted-foreground font-semibold"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={loading || saving || completing}
              onClick={handleSaveDraft}
              className="rounded-xl border-border/60 hover:bg-muted font-semibold gap-1.5"
            >
              {saving ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconDeviceFloppy className="h-4.5 w-4.5" />
              )}
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={loading || saving || completing || confirmedQuestions.size < vendorQuestions.length}
              onClick={handleCompleteAssessment}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow border-none px-6 gap-1.5"
            >
              {completing ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconCheck className="h-4.5 w-4.5" />
              )}
              Complete Assessment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
