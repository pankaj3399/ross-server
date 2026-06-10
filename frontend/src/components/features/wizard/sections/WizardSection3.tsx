"use client";

import React from "react";
import { Label } from "../../../ui/label";
import { Checkbox } from "../../../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { useWizardStore } from "../../../../store/wizardStore";

export function WizardSection3() {
  const { answers, setAnswer } = useWizardStore();

  const dataCategories = [
    { id: "personal", label: "Standard Personal Data (e.g. email, name, phone)" },
    { id: "sensitive", label: "Sensitive Categories (e.g. health, financial, political, union membership)" },
    { id: "biometric", label: "Biometric or Genetic Data (e.g. facial templates, voiceprints)" },
    { id: "children", label: "Children's Data (minors under 16)" },
    { id: "non_personal", label: "Non-Personal / Industrial Data (e.g. machinery sensors, weather logs)" },
  ];

  const geographies = [
    { id: "eu_eea", label: "European Union / EEA" },
    { id: "us", label: "United States" },
    { id: "global", label: "Global / Multi-Region" },
  ];

  const scales = [
    { value: "local", label: "Local / Small Scale (e.g., single department, city, or small customer base)" },
    { value: "national", label: "National / Medium Scale (e.g., country-wide access, large user groups)" },
    { value: "global_massive", label: "Global or Massive Scale (e.g., millions of active users, global release)" },
  ];

  const path = answers.governance_scope || "system";

  const handleCheckboxChange = (field: "data_categories" | "geographic_scope", id: string, checked: boolean) => {
    const currentList = answers[field] || [];
    if (checked) {
      setAnswer(field, [...currentList, id]);
    } else {
      setAnswer(field, currentList.filter((x: string) => x !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Q6: Data Categories */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q6. {path === "system" ? "Which data categories does this AI system process?" : "Which data categories do systems under this program process?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          Select all that apply. Processing sensitive or biometric categories triggers stricter governance controls.
        </span>
        <div className="space-y-2.5">
          {dataCategories.map((cat) => (
            <div key={cat.id} className="flex items-start gap-2.5 p-2 rounded hover:bg-muted/20">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={(answers.data_categories || []).includes(cat.id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("data_categories", cat.id, !!checked)
                }
              />
              <Label
                htmlFor={`cat-${cat.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {cat.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Q7: Geographic Scope */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q7. {path === "system" ? "What is the geographic deployment scope of the AI system?" : "What is the geographic scope of your organization's AI activities?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          Determines regulatory jurisdiction (e.g., EU AI Act, US NIST, state-level laws).
        </span>
        <div className="space-y-2.5">
          {geographies.map((geo) => (
            <div key={geo.id} className="flex items-start gap-2.5 p-2 rounded hover:bg-muted/20">
              <Checkbox
                id={`geo-${geo.id}`}
                checked={(answers.geographic_scope || []).includes(geo.id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("geographic_scope", geo.id, !!checked)
                }
              />
              <Label
                htmlFor={`geo-${geo.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {geo.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Q8: Scale */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q8. {path === "system" ? "What is the scale of the AI system's user base?" : "What is the scale of users impacted by your AI program?"}
        </Label>
        <Select
          value={answers.scale || ""}
          onValueChange={(val) => setAnswer("scale", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select deployment scale..." />
          </SelectTrigger>
          <SelectContent>
            {scales.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
