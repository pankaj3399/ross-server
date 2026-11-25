"use client";

import React, { useState, useEffect } from "react";
import { IconFolder, IconCpu, IconBriefcase, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRY_OPTIONS, AI_SYSTEM_TYPES, MAX_DESCRIPTION_LENGTH } from "@/lib/constants";
import { sanitizePlainText } from "@/lib/sanitize";
import { showToast } from "@/lib/toast";


interface ProjectEditFormProps {
  initialData: {
    name: string;
    description: string;
    aiSystemType: string;
    industry: string;
  };
  onSubmit: (data: {
    name: string;
    description: string;
    aiSystemType: string;
    industry: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function ProjectEditForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Changes",
}: ProjectEditFormProps) {
  const [data, setData] = useState(initialData);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    aiSystemType?: string;
    industry?: string;
  }>({});
  
  // Sync state when initialData prop changes
  useEffect(() => {
    setData(initialData);
    setValidationErrors({});
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanName = sanitizePlainText(data.name, 50);
    const cleanAiSystemType = (data.aiSystemType || "").trim();
    const cleanIndustry = (data.industry || "").trim();
    const nextErrors: { name?: string; aiSystemType?: string; industry?: string } = {};

    if (!cleanName) {
      nextErrors.name = "Project name is required.";
    }
    if (!cleanAiSystemType) {
      nextErrors.aiSystemType = "Please select an AI System Type.";
    }
    if (!cleanIndustry) {
      nextErrors.industry = "Please select an Industry.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      showToast.error("Please fill in all required project fields.");
      return;
    }

    setValidationErrors({});
    await onSubmit({
      ...data,
      name: cleanName,
      aiSystemType: cleanAiSystemType,
      industry: cleanIndustry,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-name">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <IconFolder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="project-name"
            value={data.name}
            onChange={(e) => {
              setData({ ...data, name: e.target.value });
              if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Enter project name"
            required
            className="pl-10"
            maxLength={50}
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-destructive">
            {validationErrors.name || ""}
          </span>
          <span
            className={`text-[10px] ${data.name.length >= 50 ? "text-destructive font-bold" : "text-muted-foreground"}`}
          >
            {data.name.length}/50
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          value={data.description || ""}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Describe your AI system"
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
        <div className="flex justify-end pt-1">
          <span
            className={`text-[10px] ${(data.description || "").length >= MAX_DESCRIPTION_LENGTH ? "text-destructive font-bold" : "text-muted-foreground"}`}
          >
            {(data.description || "").length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 min-w-0">
          <Label htmlFor="ai-system-type">
            AI System Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.aiSystemType}
            onValueChange={(value) => {
              setData({ ...data, aiSystemType: value });
              if (validationErrors.aiSystemType) setValidationErrors((prev) => ({ ...prev, aiSystemType: undefined }));
            }}
          >
            <SelectTrigger id="ai-system-type" className="w-full">
              <div className="flex items-center gap-2 min-w-0 w-full">
                <IconCpu className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">
                  <SelectValue placeholder="Select AI System Type" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {AI_SYSTEM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.aiSystemType && (
            <p className="text-[11px] text-destructive">{validationErrors.aiSystemType}</p>
          )}
        </div>

        <div className="space-y-2 min-w-0">
          <Label htmlFor="industry">
            Industry <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.industry}
            onValueChange={(value) => {
              setData({ ...data, industry: value });
              if (validationErrors.industry) setValidationErrors((prev) => ({ ...prev, industry: undefined }));
            }}
          >
            <SelectTrigger id="industry" className="w-full">
              <div className="flex items-center gap-2 min-w-0 w-full">
                <IconBriefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">
                  <SelectValue placeholder="Select Industry" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.industry && (
            <p className="text-[11px] text-destructive">{validationErrors.industry}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
