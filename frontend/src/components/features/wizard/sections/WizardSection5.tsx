"use client";

import React from "react";
import { Label } from "../../../ui/label";
import { Checkbox } from "../../../ui/checkbox";
import { useWizardStore } from "../../../../store/wizardStore";

export function WizardSection5() {
  const { answers, setAnswer } = useWizardStore();

  const certifications = [
    { id: "iso_42001", label: "ISO/IEC 42001 (AI Management System)" },
    { id: "soc2", label: "SOC 2 Type II (Security, Availability, Privacy)" },
    { id: "hipaa", label: "HIPAA Compliance (Protected Health Information)" },
    { id: "nist_ai_rmf", label: "NIST AI Risk Management Framework Alignment" },
    { id: "none", label: "None of the above / Starting from scratch" },
  ];

  const path = answers.governance_scope || "system";

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const currentList = answers.existing_certifications || [];
    
    if (id === "none") {
      if (checked) {
        setAnswer("existing_certifications", ["none"]);
      } else {
        setAnswer("existing_certifications", []);
      }
      return;
    }

    let updatedList = currentList.filter(x => x !== "none");
    if (checked) {
      updatedList.push(id);
    } else {
      updatedList = updatedList.filter(x => x !== id);
    }
    setAnswer("existing_certifications", updatedList);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q11. {path === "system" ? "What existing certifications does this AI system conform to?" : "What certifications does your organization conform to?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-4">
          Select all that apply. Existing conformances pre-populate audit evidence and map equivalent controls.
        </span>
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div key={cert.id} className="flex items-start gap-2.5 p-2 rounded hover:bg-muted/20">
              <Checkbox
                id={`cert-${cert.id}`}
                checked={(answers.existing_certifications || []).includes(cert.id)}
                onCheckedChange={(checked) => handleCheckboxChange(cert.id, !!checked)}
              />
              <Label
                htmlFor={`cert-${cert.id}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {cert.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300">
        💡 If you have already achieved SOC 2 or HIPAA compliance, MATUR.ai will automatically cross-map control evidence to satisfy equivalent requirements under the EU AI Act or ISO 42001, saving administrative overhead.
      </div>
    </div>
  );
}
