"use client";

import React from "react";
import { Label } from "../../../ui/label";
import { Checkbox } from "../../../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { useWizardStore } from "../../../../store/wizardStore";

export function WizardSection4() {
  const { answers, setAnswer } = useWizardStore();

  const providers = [
    { id: "openai", label: "OpenAI (GPT-4, etc.)" },
    { id: "anthropic", label: "Anthropic (Claude, etc.)" },
    { id: "google", label: "Google Cloud / Gemini" },
    { id: "meta", label: "Meta (LLaMA - self-hosted/cloud)" },
    { id: "huggingface", label: "HuggingFace Hub / Open Source Models" },
  ];

  const automationLevels = [
    { value: "human_in_the_loop", label: "Human-in-the-loop (AI advises, human reviews & approves every action)" },
    { value: "semi_autonomous", label: "Semi-autonomous (AI executes actions, human has real-time override/kill-switch)" },
    { value: "autonomous", label: "Fully Autonomous (AI acts and decides independently without human validation)" },
  ];

  const path = answers.governance_scope || "system";

  const handleProviderCheckbox = (id: string, checked: boolean) => {
    const currentList = answers.third_party_providers || [];
    if (checked) {
      setAnswer("third_party_providers", [...currentList, id]);
    } else {
      setAnswer("third_party_providers", currentList.filter((x: string) => x !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Q9: Third Party Models */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q9. {path === "system" ? "Does this AI system utilize third-party foundation models?" : "Do systems under this program utilize third-party foundation models?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          General Purpose AI (GPAI) integration shifts parts of data compliance and vulnerability risks to model providers.
        </span>
        <Select
          value={answers.uses_third_party_models || ""}
          onValueChange={(val: "yes" | "no" | "not_sure") => {
            setAnswer("uses_third_party_models", val);
            if (val !== "yes") {
              setAnswer("third_party_providers", []);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose third-party model usage..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes, we integrate third-party APIs/pre-trained models</SelectItem>
            <SelectItem value="no">No, we train our models from scratch / use fully proprietary code</SelectItem>
            <SelectItem value="not_sure">Not sure / Evaluating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Q9 Step 2: Providers List (conditional) */}
      {answers.uses_third_party_models === "yes" && (
        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50 animate-in fade-in duration-200">
          <Label className="text-sm font-bold text-foreground">
            Select the model providers in use:
          </Label>
          <div className="space-y-2.5 mt-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-start gap-2.5 p-1 rounded">
                <Checkbox
                  id={`prov-${p.id}`}
                  checked={(answers.third_party_providers || []).includes(p.id)}
                  onCheckedChange={(checked) => handleProviderCheckbox(p.id, !!checked)}
                />
                <Label
                  htmlFor={`prov-${p.id}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {p.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q10: Automation Level */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q10. {path === "system" ? "What is the level of autonomy of this AI system?" : "What is the level of autonomy allowed for systems under this program?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          Autonomous execution increases safety and operational risks, necessitating higher-tier safeguards.
        </span>
        <Select
          value={answers.automation_level || ""}
          onValueChange={(val) => setAnswer("automation_level", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select autonomy level..." />
          </SelectTrigger>
          <SelectContent>
            {automationLevels.map((lvl) => (
              <SelectItem key={lvl.value} value={lvl.value}>
                {lvl.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
