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

const VENDOR_QUESTIONS: Question[] = [
  // Section 1: Vendor Profile
  {
    id: "VP-1",
    section: "profile",
    text: "Vendor Corporate Standing & Certifications",
    options: [
      { value: "0", score: 0, label: "ISO 27001 + SOC 2 Type II certified by reputable third-party auditors" },
      { value: "1", score: 1, label: "SOC 2 Type II or ISO 27001 only (lacks one of the two)" },
      { value: "2", score: 2, label: "SOC 2 Type I or self-assessment compliance questionnaire only" },
      { value: "3", score: 3, label: "No independent third-party security audits or certifications" }
    ]
  },
  {
    id: "VP-2",
    section: "profile",
    text: "Liability & Indemnification for AI Outputs",
    options: [
      { value: "0", score: 0, label: "Full intellectual property and copyright indemnification for generated outputs" },
      { value: "1", score: 1, label: "Limited liability or cap on IP/output indemnification" },
      { value: "2", score: 2, label: "Standard commercial liability with explicit disclaimers for AI outputs" },
      { value: "3", score: 3, label: "Total disclaimer of liability, placing all output risks on the customer" }
    ]
  },
  {
    id: "VP-3",
    section: "profile",
    text: "Regulatory Alignment & Compliance (GDPR, EU AI Act, HIPAA)",
    options: [
      { value: "0", score: 0, label: "Documented compliance program aligned with GDPR, EU AI Act, and HIPAA (if applicable)" },
      { value: "1", score: 1, label: "Partial alignment (GDPR compliant, EU AI Act readiness program in progress)" },
      { value: "2", score: 2, label: "General compliance statement with no specific AI regulatory frameworks addressed" },
      { value: "3", score: 3, label: "No stated commitments or alignment with AI or major data protection regulations" }
    ]
  },
  {
    id: "VP-4",
    section: "profile",
    text: "Subprocessor Risk & Downstream Auditing",
    options: [
      { value: "0", score: 0, label: "Zero third-party subprocessors used for core AI hosting or model execution" },
      { value: "1", score: 1, label: "Subprocessors used but subject to strict DPAs, security reviews, and audits" },
      { value: "2", score: 2, label: "Subprocessors used with minimal oversight or ad-hoc security reviews" },
      { value: "3", score: 3, label: "Subprocessors list is not disclosed, audited, or bound by strict DPAs" }
    ]
  },
  {
    id: "VP-5",
    section: "profile",
    text: "Financial Stability & Operational Track Record",
    options: [
      { value: "0", score: 0, label: "Established enterprise or public company with low default risk" },
      { value: "1", score: 1, label: "Growth-stage startup with major venture backing (e.g. Series C+)" },
      { value: "2", score: 2, label: "Early-stage startup with limited cash runway or funding disclosures" },
      { value: "3", score: 3, label: "Bootstrap entity or financially distressed vendor with high churn/discontinuation risk" }
    ]
  },
  // Section 2: Data Processing
  {
    id: "DP-1",
    section: "data",
    text: "Customer Data Usage for Model Training",
    options: [
      { value: "0", score: 0, label: "Default zero-usage policy: customer input data is never used to train models" },
      { value: "1", score: 1, label: "Opt-out available by default via API, but requires opt-out request for UI/Console" },
      { value: "2", score: 2, label: "Opt-out only available on custom enterprise plans or high-tier licensing" },
      { value: "3", score: 3, label: "Data is actively used for model training and improvement with no opt-out" }
    ]
  },
  {
    id: "DP-2",
    section: "data",
    text: "Data Encryption & Key Management",
    options: [
      { value: "0", score: 0, label: "Encryption in transit (TLS 1.3) & at rest (AES-256) with Customer-Managed Keys (BYOK)" },
      { value: "1", score: 1, label: "Encryption in transit & at rest using vendor-managed keys" },
      { value: "2", score: 2, label: "Encryption in transit only; at rest encryption is basic or unspecified" },
      { value: "3", score: 3, label: "No transit encryption standards or at-rest encryption enforced" }
    ]
  },
  {
    id: "DP-3",
    section: "data",
    text: "Data Retention & Zero Data Retention (ZDR)",
    options: [
      { value: "0", score: 0, label: "Zero Data Retention (ZDR) policy supported: inputs processed strictly in memory" },
      { value: "1", score: 1, label: "Short-term logging (<30 days) strictly for abuse detection and security reviews" },
      { value: "2", score: 2, label: "Retention of data up to 90 days before automated purge" },
      { value: "3", score: 3, label: "Indefinite data caching and logging with no clear automated purge policy" }
    ]
  },
  {
    id: "DP-4",
    section: "data",
    text: "Data Residency & Geographic Hosting Control",
    options: [
      { value: "0", score: 0, label: "Customer can fully pin data processing and storage to specific geo-regions (e.g. EU-only)" },
      { value: "1", score: 1, label: "Primary processing in selected region; backup or metadata stored globally" },
      { value: "2", score: 2, label: "Multi-region routing with Standard Contractual Clauses (SCCs) in place" },
      { value: "3", score: 3, label: "Undisclosed routing; data processed globally with no residency guarantees" }
    ]
  },
  // Section 3: AI-Specific Governance
  {
    id: "AG-1",
    section: "governance",
    text: "Model Robustness & Adversarial Testing",
    options: [
      { value: "0", score: 0, label: "Regular independent red-teaming, jailbreak resistance logs, and vulnerability disclosures published" },
      { value: "1", score: 1, label: "Internal red-teaming performed, reports/summaries available under NDA" },
      { value: "2", score: 2, label: "Ad-hoc internal testing only; no public security evaluations" },
      { value: "3", score: 3, label: "No adversarial testing or vulnerability metrics available" }
    ]
  },
  {
    id: "AG-2",
    section: "governance",
    text: "Bias, Fairness & Discrimination Mitigations",
    options: [
      { value: "0", score: 0, label: "Published model cards, bias evaluation datasets, and quantitative fairness logs" },
      { value: "1", score: 1, label: "Model cards published but lacking quantitative bias evaluation details" },
      { value: "2", score: 2, label: "Policy statements against bias with no empirical test reports or disclosures" },
      { value: "3", score: 3, label: "No bias evaluations or documentation provided" }
    ]
  },
  {
    id: "AG-3",
    section: "governance",
    text: "Model Explainability & Transparency",
    options: [
      { value: "0", score: 0, label: "Disclosures on model architecture, training datasources, and system limits published" },
      { value: "1", score: 1, label: "General system limits and prompt guidelines documented; internals fully blackboxed" },
      { value: "2", score: 2, label: "Minimal API documentation only; no model limitation logs" },
      { value: "3", score: 3, label: "Fully proprietary black-box system with zero training data or limitation disclosures" }
    ]
  },
  {
    id: "AG-4",
    section: "governance",
    text: "IP Infringement Filters & Training Provenance",
    options: [
      { value: "0", score: 0, label: "Automated copyright filters, licensed training data, and full IP infringement protection" },
      { value: "1", score: 1, label: "Copyright filters active on models, but limited IP legal protections" },
      { value: "2", score: 2, label: "General policies regarding training data compliance; no runtime IP filters" },
      { value: "3", score: 3, label: "Training data provenance and IP protection policies undisclosed" }
    ]
  },
  {
    id: "AG-5",
    section: "governance",
    text: "Content Moderation & Safety Guardrails",
    options: [
      { value: "0", score: 0, label: "Real-time safety moderation APIs, input/output content filters, and policy enforcement" },
      { value: "1", score: 1, label: "Opt-in safety filtering tools available on request" },
      { value: "2", score: 2, label: "Basic keyword blocking or system instructions only" },
      { value: "3", score: 3, label: "No moderation or content safety guardrails provided" }
    ]
  },
  // Section 4: Operational Risk
  {
    id: "OR-1",
    section: "operational",
    text: "Service Availability & SLA Commitments",
    options: [
      { value: "0", score: 0, label: "Contractual SLA committing to >=99.9% uptime with financial credits" },
      { value: "1", score: 1, label: "SLA committing to 99.0% - 99.9% uptime with no financial credits" },
      { value: "2", score: 2, label: "Best-effort uptime with a public status page" },
      { value: "3", score: 3, label: "No uptime SLA or status tracking page provided" }
    ]
  },
  {
    id: "OR-2",
    section: "operational",
    text: "Disaster Recovery & Business Continuity (BC/DR)",
    options: [
      { value: "0", score: 0, label: "Annual BC/DR testing, RTO < 4 hrs, RPO < 1 hr, and multi-region failover" },
      { value: "1", score: 1, label: "Documented BC/DR plan with RTO < 24 hrs and daily backups" },
      { value: "2", score: 2, label: "Daily backups performed, but no documented recovery test metrics" },
      { value: "3", score: 3, label: "No BC/DR policies or backup verification logs" }
    ]
  },
  {
    id: "OR-3",
    section: "operational",
    text: "Model Lifecycle & Deprecation Guarantees",
    options: [
      { value: "0", score: 0, label: "Minimum 12-month deprecation notice for model APIs with migration guides" },
      { value: "1", score: 1, label: "6-month deprecation notice policy" },
      { value: "2", score: 2, label: "Ad-hoc model updates and retirement notices (<60 days notice)" },
      { value: "3", score: 3, label: "Models retired or updated silently with zero customer notice" }
    ]
  },
  {
    id: "OR-4",
    section: "operational",
    text: "Incident Response & Data Breach Reporting SLA",
    options: [
      { value: "0", score: 0, label: "Contractual breach notification within 72 hours, backed by dedicated security team" },
      { value: "1", score: 1, label: "Breach notification within 72 hours under general terms" },
      { value: "2", score: 2, label: "Best-effort breach notification with no SLA commitments" },
      { value: "3", score: 3, label: "No commitments on breach notification timelines" }
    ]
  }
];

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

  // Determine if vendor has prefilled answers in the template
  const isPrefillVendor = useMemo(() => {
    const providerKey = vendorName.toLowerCase().trim();
    return [
      "openai", "anthropic", "google", "aws bedrock", "azure openai", "microsoft", "cohere"
    ].some(v => providerKey.includes(v));
  }, [vendorName]);

  // Load assessment data
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    apiService.getVendorAssessment(projectId, componentId)
      .then(res => {
        if (res.success && res.data) {
          setAssessment(res.data);
          const initialAnswers = res.data.answers || {};
          setAnswers(initialAnswers);

          // If the assessment was completed, mark all as confirmed
          if (res.data.status === "Completed") {
            setConfirmedQuestions(new Set(VENDOR_QUESTIONS.map(q => q.id)));
          } else if (res.data.id !== null) {
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
  const liveScorecard = useMemo(() => {
    let score = 0;
    let answeredCount = 0;

    VENDOR_QUESTIONS.forEach(q => {
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

    return {
      score,
      riskTier,
      answeredCount,
      confirmedCount: confirmedQuestions.size,
      percentComplete: Math.round((confirmedQuestions.size / VENDOR_QUESTIONS.length) * 100)
    };
  }, [answers, confirmedQuestions]);

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
      if (res.success) {
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
    if (confirmedQuestions.size < VENDOR_QUESTIONS.length) {
      showToast.error(`You have only confirmed ${confirmedQuestions.size} out of ${VENDOR_QUESTIONS.length} questions. Please review and confirm all questions.`);
      return;
    }

    setCompleting(true);
    try {
      const res = await apiService.completeVendorAssessment(projectId, componentId, answers);
      if (res.success) {
        showToast.success("Vendor Risk Assessment completed! CRC controls GOV-3P-01/02/03 are now flipped to 'Evidence Complete'.");
        onCompleted();
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to complete assessment:", err);
      const msg = err?.error || "Failed to complete risk assessment. Please check that all inputs are filled correctly.";
      showToast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  // Filter questions for active tab
  const activeQuestions = useMemo(() => {
    return VENDOR_QUESTIONS.filter(q => q.section === activeSection);
  }, [activeSection]);

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
                const sectionQuestions = VENDOR_QUESTIONS.filter(q => q.section === sec.id);
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
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {q.options.map((opt) => {
                        const isSelected = answer.optionValue === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => handleOptionSelect(q.id, opt.value)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all select-none ${
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
                          </div>
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
                    / {VENDOR_QUESTIONS.length} Confirmed
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
              disabled={loading || saving || completing || confirmedQuestions.size < VENDOR_QUESTIONS.length}
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
