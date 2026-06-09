"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../lib/api";

export function useWizardGate(projectId?: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const [wizardInProgress, setWizardInProgress] = useState(false);
  const [wizardApplied, setWizardApplied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const checkStatus = useCallback(async () => {
    if (!projectId || !user) {
      setLoading(false);
      return;
    }

    // Free users bypass the wizard gate completely
    const isPremium = ["basic_premium", "pro_premium", "trial"].includes(user.subscription_status);
    if (!isPremium) {
      setWizardCompleted(true);
      setWizardInProgress(false);
      setWizardApplied(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.getWizardStatus(projectId);
      if (res && res.success) {
        setWizardCompleted(res.status === "completed");
        setWizardInProgress(res.status === "in_progress");
        setWizardApplied(res.appliedAt !== null);
        setCurrentStep(res.step || 1);
      } else {
        setWizardCompleted(false);
        setWizardInProgress(false);
        setWizardApplied(false);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Failed to check wizard status:", error);
      // Fallback: don't block in case of network errors
      setWizardCompleted(true);
      setWizardApplied(true);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    loading,
    wizardCompleted,
    wizardInProgress,
    wizardApplied,
    currentStep,
    refreshWizardStatus: checkStatus,
  };
}
