"use client";

import React, { useState } from "react";
import { useWizardGate } from "../../../hooks/useWizardGate";
import { PreWizardScreen } from "./PreWizardScreen";
import { SystemProfileWizard } from "./SystemProfileWizard";
import { WizardConfirmation } from "./WizardConfirmation";
import { useAuth } from "../../../contexts/AuthContext";
import { Skeleton } from "../../ui/skeleton";
import { Button } from "../../ui/button";

interface WizardGateProviderProps {
  projectId: string;
  featureName: string;
  children: React.ReactNode;
}

export function WizardGateProvider({ projectId, featureName, children }: WizardGateProviderProps) {
  const { user } = useAuth();
  const { loading, wizardCompleted, wizardApplied, refreshWizardStatus } = useWizardGate(projectId);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [isSkipped, setIsSkipped] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`wizard_skipped_${projectId}`) === "true";
    }
    return false;
  });

  const handleSkip = () => {
    setIsSkipped(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`wizard_skipped_${projectId}`, "true");
    }
  };

  // Free users never see the wizard gate
  const isPremium = user && ["basic_premium", "pro_premium", "trial"].includes(user.subscription_status);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto mt-12">
        <Skeleton className="h-12 w-3/4 bg-muted/50 rounded-lg" />
        <Skeleton className="h-6 w-1/2 bg-muted/50 rounded-lg" />
        <Skeleton className="h-[350px] w-full bg-muted/30 rounded-xl" />
      </div>
    );
  }

  // Free users or skipped users render children directly
  if (!isPremium) {
    return <>{children}</>;
  }

  // If wizard completed but not yet applied, show Confirmation Page
  if (wizardCompleted && !wizardApplied) {
    return (
      <div className="min-h-[85vh]">
        <WizardConfirmation
          projectId={projectId}
          onApplyComplete={refreshWizardStatus}
          onAdjustAnswers={() => setShowWizardModal(true)}
        />
        {showWizardModal && (
          <SystemProfileWizard
            projectId={projectId}
            isOpen={showWizardModal}
            onClose={() => {
              setShowWizardModal(false);
              refreshWizardStatus();
            }}
          />
        )}
      </div>
    );
  }

  // Main feature content with non-blocking AI Profile Setup Banner if wizard is pending
  return (
    <>
      {!wizardCompleted && !isSkipped && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold shrink-0">
              ⚡ AI Profile Setup
            </div>
            <div>
              <span className="font-bold text-foreground block">Enhance {featureName} with Automated Profile Seeding</span>
              <span className="text-muted-foreground">Configure your system profile to auto-classify EU AI Act risk tiers and tailor CRC flags. You can also prepopulate manual data directly below.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setShowWizardModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-xs"
            >
              Configure AI Profile &rarr;
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      {children}
      {showWizardModal && (
        <SystemProfileWizard
          projectId={projectId}
          isOpen={showWizardModal}
          onClose={() => {
            setShowWizardModal(false);
            refreshWizardStatus();
          }}
        />
      )}
    </>
  );
}
