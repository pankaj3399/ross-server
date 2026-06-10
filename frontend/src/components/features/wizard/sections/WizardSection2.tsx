"use client";

import React from "react";
import { Label } from "../../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { useWizardStore } from "../../../../store/wizardStore";

export function WizardSection2() {
  const { answers, setAnswer } = useWizardStore();

  const path = answers.governance_scope || "system";

  return (
    <div className="space-y-6">
      {/* Q5: Regulatory Role */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q5. What is your organization's regulatory role regarding this {path === "system" ? "AI system" : "program"}?
        </Label>
        <span className="block text-xs text-muted-foreground mb-4">
          Under frameworks like the EU AI Act, obligations vary significantly between those who create the technology (Providers) and those who deploy it (Deployers).
        </span>
        <Select
          value={answers.regulatory_role || ""}
          onValueChange={(val: "provider" | "deployer" | "both") => setAnswer("regulatory_role", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select regulatory role..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="provider">Provider (We build/market the AI system)</SelectItem>
            <SelectItem value="deployer">Deployer (We use/operate the AI system in our operations)</SelectItem>
            <SelectItem value="both">Both Provider and Deployer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-2">
        <h4 className="font-bold text-foreground/80">Why this matters:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Providers</strong> bear direct responsibility for conformity assessments, post-market monitoring, and drawing up technical documentation.</li>
          <li><strong>Deployers</strong> are responsible for taking appropriate technical/organizational measures, monitoring operations, and conducting fundamental rights impact assessments when required.</li>
        </ul>
      </div>
    </div>
  );
}
