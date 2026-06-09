"use client";

import React from "react";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { useWizardStore } from "../../../../store/wizardStore";

export function WizardSection1() {
  const { answers, setAnswer } = useWizardStore();

  const useCases = [
    { value: "employment_hr", label: "Employment, Recruitment, and HR Screening" },
    { value: "education_vocational", label: "Education and Vocational Training Assessment/Grading" },
    { value: "critical_infrastructure", label: "Critical Infrastructure Management (Water, Power, Transport)" },
    { value: "medical_diagnosis", label: "Medical Diagnosis and Clinical Decision Support" },
    { value: "customer_service_chatbot", label: "Customer Service Chatbot / Generative Assistant" },
    { value: "synthetic_media", label: "Synthetic Media (Deepfakes, Image/Audio Generation)" },
    { value: "social_scoring", label: "Social Scoring / Social Trust Evaluator" },
    { value: "cognitive_behavioral_manipulation", label: "Cognitive Behavioral Manipulation System" },
    { value: "general_utility", label: "General Utility / General Purpose AI" },
    { value: "other", label: "Other Standard Business Application" },
  ];

  const path = answers.governance_scope || "system";

  return (
    <div className="space-y-6">
      {/* Q1: Governance Scope */}
      <div className="space-y-2">
        <Label className="text-base font-bold text-foreground">
          Q1. Governance Scope
        </Label>
        <span className="block text-xs text-muted-foreground mb-2">
          Choose whether this profile represents a single system or an organization-wide program.
        </span>
        <Select
          value={answers.governance_scope || ""}
          onValueChange={(val: "system" | "organization") => setAnswer("governance_scope", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select scope type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">Single AI System (Path A)</SelectItem>
            <SelectItem value="organization">AI Governance Program / Organization-Wide (Path B)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Q2: Name */}
      <div className="space-y-2">
        <Label className="text-base font-bold text-foreground">
          Q2. {path === "system" ? "What is the name of this AI System?" : "What is the name of this AI Governance Program?"}
        </Label>
        <Input
          value={answers.name || ""}
          onChange={(e) => setAnswer("name", e.target.value)}
          placeholder={path === "system" ? "e.g. TalentSift CV Analyzer" : "e.g. Corporate AI Compliance Initiative"}
          className="w-full"
          required
        />
      </div>

      {/* Q3: Description */}
      <div className="space-y-2">
        <Label className="text-base font-bold text-foreground">
          Q3. {path === "system" ? "Provide a brief description of the AI system's functionality." : "Provide a brief description of the AI program's scope."}
        </Label>
        <Textarea
          value={answers.description || ""}
          onChange={(e) => setAnswer("description", e.target.value)}
          placeholder={path === "system" ? "Describe what the system does, its inputs, and intended outputs..." : "Describe the scope of teams, departments, and AI systems governed under this program..."}
          className="w-full min-h-[80px]"
        />
      </div>

      {/* Q4: Use Case */}
      <div className="space-y-2">
        <Label className="text-base font-bold text-foreground">
          Q4. {path === "system" ? "What is the primary use case of the AI system?" : "What is the primary use case of systems governed under this program?"}
        </Label>
        <Select
          value={answers.use_case || ""}
          onValueChange={(val) => setAnswer("use_case", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select primary use case..." />
          </SelectTrigger>
          <SelectContent>
            {useCases.map((uc) => (
              <SelectItem key={uc.value} value={uc.value}>
                {uc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
