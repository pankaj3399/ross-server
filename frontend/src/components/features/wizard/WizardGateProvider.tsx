"use client";

import React, { useState } from "react";
import { useWizardGate } from "../../../hooks/useWizardGate";
import { PreWizardScreen } from "./PreWizardScreen";
import { SystemProfileWizard } from "./SystemProfileWizard";
import { WizardConfirmation } from "./WizardConfirmation";
import { useAuth } from "../../../contexts/AuthContext";
import { Skeleton } from "../../ui/skeleton";

interface WizardGateProviderProps {
  projectId: string;
  featureName: string;
  children: React.ReactNode;
}

export function WizardGateProvider({ projectId, featureName, children }: WizardGateProviderProps) {
  const { user } = useAuth();
  const { loading, wizardCompleted, wizardApplied, refreshWizardStatus } = useWizardGate(projectId);
  const [skipped, setSkipped] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);

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

  // Render main content if user has fully applied the wizard outputs, is free, or skipped
  if ((wizardCompleted && wizardApplied) || !isPremium || skipped) {
    return (
      <>
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

  // If the wizard is completed but not yet applied, show the Confirmation Page
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

  // Otherwise, show the pre-wizard gate card
  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <PreWizardScreen
        featureName={featureName}
        onStart={() => setShowWizardModal(true)}
        onSkip={() => setSkipped(true)}
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
