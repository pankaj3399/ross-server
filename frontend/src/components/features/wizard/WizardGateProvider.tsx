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

  // Free users render children directly
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

  // Wizard not completed — strictly gate access behind the onboarding screen
  if (!wizardCompleted) {
    return (
      <>
        <PreWizardScreen
          featureName={featureName}
          onStart={() => setShowWizardModal(true)}
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
      </>
    );
  }

  // Wizard completed and applied — render feature content
  return <>{children}</>;
}
