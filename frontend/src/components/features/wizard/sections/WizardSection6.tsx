"use client";

import React from "react";
import { Label } from "../../../ui/label";
import { Checkbox } from "../../../ui/checkbox";
import { Input } from "../../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { useWizardStore } from "../../../../store/wizardStore";

export function WizardSection6() {
  const { answers, setAnswer } = useWizardStore();

  const domains = [
    { id: "critical_infrastructure", label: "Critical infrastructure control (e.g. power, water, traffic management)" },
    { id: "education_vocational", label: "Education admissions, grading, or student evaluation" },
    { id: "employment_hr", label: "Employment, recruitment, work allocation, or performance screening" },
    { id: "essential_private_services", label: "Essential services & benefits (e.g. credit scoring, emergency dispatch, social welfare)" },
    { id: "law_enforcement", label: "Law enforcement, risk assessment for offenses, or crime profiling" },
    { id: "migration_asylum", label: "Migration, asylum, border control, or visa application assessment" },
    { id: "justice_democracy", label: "Administration of justice, court decisions, or democratic elections" },
    { id: "none", label: "None of the above sensitive domains" },
  ];

  const biometricPurposes = [
    { value: "emotion_recognition", label: "Emotion Recognition (detecting emotional states in workplace/schools)" },
    { value: "biometric_categorization", label: "Biometric Categorization (inferring race, gender, political beliefs)" },
    { value: "biometric_identification", label: "Remote Biometric Identification (biometric scanning / identification)" },
    { value: "public_spaces_identification", label: "Remote Identification in public spaces (crowd scanning/surveillance)" },
    { value: "verification_authentication", label: "1-to-1 Verification (secure login, authentication, face-unlock)" },
    { value: "none", label: "No biometric data is processed" },
  ];

  const path = answers.governance_scope || "system";

  const handleDomainCheckbox = (id: string, checked: boolean) => {
    const currentList = answers.annex_iii_domains || [];
    
    if (id === "none") {
      if (checked) {
        setAnswer("annex_iii_domains", ["none"]);
      } else {
        setAnswer("annex_iii_domains", []);
      }
      return;
    }

    let updatedList = currentList.filter(x => x !== "none");
    if (checked) {
      updatedList.push(id);
    } else {
      updatedList = updatedList.filter(x => x !== id);
    }
    setAnswer("annex_iii_domains", updatedList);
  };

  return (
    <div className="space-y-6 px-0.5">
      {/* Q12: Annex III Sensitive Domains */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q12. {path === "system" ? "Is this AI system deployed in any of the following sensitive domains?" : "Are systems under this program deployed in any of these sensitive domains?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          Systems in these domains are classified as High-Risk under EU AI Act Annex III and require third-party conformity audits.
        </span>
        <div className="space-y-2.5">
          {domains.map((dom) => (
            <div key={dom.id} className="flex items-start gap-2.5 p-1 rounded">
              <Checkbox
                id={`dom-${dom.id}`}
                checked={(answers.annex_iii_domains || []).includes(dom.id)}
                onCheckedChange={(checked) => handleDomainCheckbox(dom.id, !!checked)}
              />
              <Label
                htmlFor={`dom-${dom.id}`}
                className="text-sm font-medium leading-normal cursor-pointer"
              >
                {dom.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Q13: Biometrics Use Case */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q13. {path === "system" ? "Does this AI system process biometric data for any of the following purposes?" : "Do systems under this program process biometric data for these purposes?"}
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          Emotion recognition and categorization of sensitive traits are prohibited under EU AI Act Article 5 unless explicitly exempted.
        </span>
        <Select
          value={answers.biometric_use || ""}
          onValueChange={(val) => setAnswer("biometric_use", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select biometric use purpose..." />
          </SelectTrigger>
          <SelectContent>
            {biometricPurposes.map((bp) => (
              <SelectItem key={bp.value} value={bp.value}>
                {bp.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Q14: Child Safety */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q14. {path === "system" ? "Does this AI system affect or interact with children?" : "Do systems under this program affect or interact with children?"}
        </Label>
        <Select
          value={answers.affects_children || ""}
          onValueChange={(val: "yes" | "no" | "not_sure") => setAnswer("affects_children", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select children safety impact..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes, children are primary users or directly affected</SelectItem>
            <SelectItem value="no">No, designed purely for adult users / business systems</SelectItem>
            <SelectItem value="not_sure">Not sure / Direct impact unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Q15: Publicly Accessible URL */}
      <div className="space-y-3">
        <Label className="text-base font-bold text-foreground">
          Q15. {path === "system" ? "Provide a publicly accessible URL for the system's compliance disclosure (optional)." : "Provide a publicly accessible URL for your organization's AI ethics policy (optional)."}
        </Label>
        <Input
          value={answers.public_url || ""}
          onChange={(e) => setAnswer("public_url", e.target.value)}
          placeholder="https://example.com/ai-compliance"
          type="url"
          className="w-full"
        />
      </div>
    </div>
  );
}
