"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useWizardStore } from "@/store/wizardStore";
import ProjectSettingsTabs from "@/components/features/projects/ProjectSettingsTabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WizardSection1 } from "@/components/features/wizard/sections/WizardSection1";
import { WizardSection2 } from "@/components/features/wizard/sections/WizardSection2";
import { WizardSection3 } from "@/components/features/wizard/sections/WizardSection3";
import { WizardSection4 } from "@/components/features/wizard/sections/WizardSection4";
import { WizardSection5 } from "@/components/features/wizard/sections/WizardSection5";
import { WizardSection6 } from "@/components/features/wizard/sections/WizardSection6";
import { IconLoader2, IconSettings, IconShieldCheck, IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { motion } from "framer-motion";

export default function ProjectWizardSettingsPage() {
  const { projectId } = useParams() as { projectId: string };
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    answers,
    engineOutput,
    loading,
    saving,
    loadSavedAnswers,
    resetStore,
  } = useWizardStore();

  const [activeSection, setActiveSection] = useState<number>(1);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedAnswers(projectId);
    }
    return () => {
      resetStore();
    };
  }, [projectId, isAuthenticated, loadSavedAnswers, resetStore]);

  const handleSaveAndReRun = async () => {
    // Perform simple validations
    if (!answers.name || answers.name.trim() === "") {
      showToast.error("System or Program Name is required.");
      return;
    }
    if (!answers.use_case) {
      showToast.error("Primary Use Case is required.");
      return;
    }
    if (!answers.regulatory_role) {
      showToast.error("Regulatory Role is required.");
      return;
    }

    setSavingSettings(true);
    try {
      // 1. Save answers & re-run rules engine
      const res = await apiService.editWizardAnswers(projectId, answers);
      if (!res || !res.success) {
        throw new Error((res as any)?.error || "Failed to update wizard answers");
      }
      
      const risks = Array.isArray(res?.outputs?.suggested_risks) ? res.outputs.suggested_risks : [];
      const components = Array.isArray(res?.outputs?.suggested_components) ? res.outputs.suggested_components : [];

      // 2. Commit/apply the changes to the project
      const applyRes = await apiService.applyWizardProfile(projectId, {
        acceptedRisks: risks.map((r: any) => r.title),
        acceptedComponents: components.map((c: any) => c.component_name),
      });
      if (!applyRes?.success) {
        throw new Error((applyRes as any)?.error || "Failed to apply wizard outputs");
      }

      showToast.success("AI Profile updated and rules engine outputs applied successfully!");
      
      // Reload the saved answers and engine output
      await loadSavedAnswers(projectId);
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || "Failed to update profile settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading || (loading && !engineOutput)) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <IconLoader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Loading compliance profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border/60 max-w-2xl mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-3">Access Restricted</h2>
        <p className="text-muted-foreground mb-8">Please sign in to manage these settings.</p>
      </div>
    );
  }

  const sectionsList = [
    { id: 1, name: "Project Setup" },
    { id: 2, name: "Regulatory Role" },
    { id: 3, name: "Data and Scope" },
    { id: 4, name: "Architecture" },
    { id: 5, name: "Existing Compliance" },
    { id: 6, name: "Sensitive Domain Flags" },
  ];

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case "UNACCEPTABLE": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "LIMITED": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "MINIMAL": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 w-full pb-24">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Project Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your project details and team access.</p>
      </div>

      <ProjectSettingsTabs projectId={projectId} />

      {/* Summary Banner */}
      {engineOutput && (
        <Card className="border border-blue-500/25 bg-blue-500/5 relative overflow-hidden">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active Classification</span>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-foreground">EU Risk Tier:</h3>
                <Badge className={`font-extrabold text-xs border ${getRiskColor(engineOutput.eu_risk_tier)}`}>
                  {engineOutput.eu_risk_tier}
                </Badge>
                <Badge className={`font-extrabold text-xs border ${getRiskColor(engineOutput.internal_risk_tier === "CRITICAL" ? "UNACCEPTABLE" : engineOutput.internal_risk_tier)}`}>
                  INTERNAL: {engineOutput.internal_risk_tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl mt-1 leading-normal">
                {engineOutput.eu_risk_reason}
              </p>
            </div>
            <div className="flex-shrink-0 relative z-10">
              <span className="text-xs text-muted-foreground font-medium block text-right">Frameworks in scope</span>
              <span className="text-xs font-bold text-foreground block text-right mt-0.5">
                {(engineOutput.applicable_frameworks || []).join(", ") || "None"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Settings Editor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Sections List */}
        <div className="md:col-span-1 space-y-1">
          {sectionsList.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                activeSection === sec.id
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-transparent hover:bg-muted text-muted-foreground border-transparent"
              }`}
            >
              {sec.id}. {sec.name}
            </button>
          ))}
        </div>

        {/* Right Form Editor Panel */}
        <Card className="md:col-span-3 border border-border/50">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold">
              {sectionsList[activeSection - 1].name}
            </CardTitle>
            <CardDescription className="text-xs">
              Configure parameters for this profile section
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 min-h-[300px]">
            {activeSection === 1 && <WizardSection1 />}
            {activeSection === 2 && <WizardSection2 />}
            {activeSection === 3 && <WizardSection3 />}
            {activeSection === 4 && <WizardSection4 />}
            {activeSection === 5 && <WizardSection5 />}
            {activeSection === 6 && <WizardSection6 />}
          </CardContent>
          <CardFooter className="border-t border-border/40 py-4 justify-end">
            <Button
              onClick={handleSaveAndReRun}
              disabled={savingSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              {savingSettings ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <IconRefresh className="h-4 w-4" />
                  Save & Re-Run Rules Engine
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
