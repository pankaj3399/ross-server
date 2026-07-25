"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { Progress } from "../../ui/progress";
import { Button } from "../../ui/button";
import { useWizardStore } from "../../../store/wizardStore";
import { WizardSection1 } from "./sections/WizardSection1";
import { WizardSection2 } from "./sections/WizardSection2";
import { WizardSection3 } from "./sections/WizardSection3";
import { WizardSection4 } from "./sections/WizardSection4";
import { WizardSection5 } from "./sections/WizardSection5";
import { WizardSection6 } from "./sections/WizardSection6";
import { ArrowLeft, ArrowRight, Save, CheckCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SystemProfileWizardProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SystemProfileWizard({ projectId, isOpen, onClose }: SystemProfileWizardProps) {
  const {
    answers,
    currentSection,
    loading,
    saving,
    loadSavedAnswers,
    setSection,
    nextSection,
    prevSection,
    saveProgress,
    completeWizard,
    resetStore,
  } = useWizardStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 10;
    setShowIndicator(isScrollable && !isAtBottom);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 200);

    const el = scrollRef.current;
    if (el) {
      const resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
      };
    }
    return () => clearTimeout(timer);
  }, [currentSection, loading, isOpen, answers, validationError]);

  const handleScroll = () => {
    checkScroll();
  };

  useEffect(() => {
    if (isOpen) {
      loadSavedAnswers(projectId);
    }
    return () => {
      // Don't reset completely if we want to preserve state, but reset on unmount is clean
      resetStore();
    };
  }, [projectId, isOpen, loadSavedAnswers, resetStore]);

  useEffect(() => {
    setValidationError(null);
  }, [answers, currentSection]);

  const sectionNames = [
    "Project Setup",
    "Regulatory Role",
    "Data and Scope",
    "Architecture",
    "Existing Compliance",
    "Sensitive Domain Flags",
  ];

  // Client-side validation for the current active section
  const validateCurrentSection = (): boolean => {
    setValidationError(null);

    if (currentSection === 1) {
      if (!answers.governance_scope) {
        setValidationError("Please select the Governance Scope (Q1).");
        return false;
      }
      if (!answers.name || answers.name.trim() === "") {
        setValidationError("Please enter a name for the system or program (Q2).");
        return false;
      }
      if (!answers.use_case) {
        setValidationError("Please select a primary use case (Q4).");
        return false;
      }
    }

    if (currentSection === 2) {
      if (!answers.regulatory_role) {
        setValidationError("Please select your regulatory role (Q5).");
        return false;
      }
    }

    if (currentSection === 3) {
      if (!answers.data_categories || answers.data_categories.length === 0) {
        setValidationError("Please select at least one data category (Q6).");
        return false;
      }
      if (!answers.geographic_scope || answers.geographic_scope.length === 0) {
        setValidationError("Please select at least one geographic scope (Q7).");
        return false;
      }
      if (!answers.scale) {
        setValidationError("Please select the deployment scale (Q8).");
        return false;
      }
    }

    if (currentSection === 4) {
      if (!answers.uses_third_party_models) {
        setValidationError("Please select if you use third-party models (Q9).");
        return false;
      }
      if (answers.uses_third_party_models === "yes" && (!answers.third_party_providers || answers.third_party_providers.length === 0)) {
        setValidationError("Since you use third-party models, please select at least one provider.");
        return false;
      }
      if (!answers.automation_level) {
        setValidationError("Please select the autonomy level of the system (Q10).");
        return false;
      }
    }

    if (currentSection === 5) {
      if (!answers.existing_certifications || answers.existing_certifications.length === 0) {
        setValidationError("Please select at least one certification option (or select 'None').");
        return false;
      }
    }

    if (currentSection === 6) {
      if (!answers.annex_iii_domains || answers.annex_iii_domains.length === 0) {
        setValidationError("Please select at least one sensitive domain option (or select 'None').");
        return false;
      }
      if (!answers.biometric_use) {
        setValidationError("Please select a biometric use purpose (Q13).");
        return false;
      }
      if (!answers.affects_children) {
        setValidationError("Please select child safety impact (Q14).");
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentSection()) return;

    try {
      await saveProgress(projectId);
      nextSection();
    } catch (err) {
      toast.error("Failed to save progress. Please try again.");
    }
  };

  const handleSaveAndExit = async () => {
    try {
      await saveProgress(projectId);
      toast.success("Progress saved successfully.");
      onClose();
    } catch (err) {
      toast.error("Failed to save progress.");
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentSection()) return;

    try {
      await completeWizard(projectId);
      toast.success("AI Profile generated successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to complete profile generation.");
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 1: return <WizardSection1 />;
      case 2: return <WizardSection2 />;
      case 3: return <WizardSection3 />;
      case 4: return <WizardSection4 />;
      case 5: return <WizardSection5 />;
      case 6: return <WizardSection6 />;
      default: return null;
    }
  };

  const progressPercent = Math.round((currentSection / 6) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSaveAndExit()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-6">
        <DialogHeader className="pb-4 border-b border-border/40">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                AI System Profile Wizard
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Setup your compliance and risk parameters
              </DialogDescription>
            </div>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
              Section {currentSection} of 6
            </span>
          </div>
          
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>{sectionNames[currentSection - 1]}</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-muted/40" />
          </div>
        </DialogHeader>

        {/* Form Body */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-6 my-2 px-1.5"
          >
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-24 bg-muted animate-pulse rounded w-full" />
                <div className="h-12 bg-muted animate-pulse rounded w-full" />
              </div>
            ) : (
              renderSection()
            )}

            {validationError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold">
                ⚠️ {validationError}
              </div>
            )}
          </div>

          <AnimatePresence>
            {showIndicator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none bg-gradient-to-t from-background via-background/75 to-transparent flex flex-col items-center justify-end pb-2 z-10"
              >
                <button
                  type="button"
                  aria-label="Scroll down to view more options"
                  className="p-1.5 rounded-full bg-card/95 border border-border/40 shadow-lg backdrop-blur-sm pointer-events-auto cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center"
                  onClick={() => {
                    scrollRef.current?.scrollBy({ top: 150, behavior: "smooth" });
                  }}
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/40 flex justify-between items-center gap-3">
          <Button
            variant="ghost"
            onClick={prevSection}
            disabled={currentSection === 1 || loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAndExit}
              disabled={loading || saving}
              className="text-xs flex items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" /> Save & Exit
            </Button>

            {currentSection < 6 ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={loading || saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1.5"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={loading || saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Complete Setup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
