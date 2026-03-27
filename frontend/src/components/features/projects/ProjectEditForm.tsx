"use client";

import React, { useState } from "react";
import { IconFolder, IconRobot, IconBriefcase, IconLoader2 } from "@tabler/icons-react";
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
import { INDUSTRY_OPTIONS, AI_SYSTEM_TYPES } from "@/lib/constants";
import { Project } from "@/lib/api";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
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
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Enter project name"
            required
            className="pl-10"
            maxLength={50}
          />
        </div>
        <div className="flex justify-end pt-1">
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
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Describe your AI system"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>AI System Type</Label>
          <Select
            value={data.aiSystemType}
            onValueChange={(value) => setData({ ...data, aiSystemType: value })}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <IconRobot className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select AI System Type" />
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
        </div>

        <div className="space-y-2">
          <Label>Industry</Label>
          <Select
            value={data.industry}
            onValueChange={(value) => setData({ ...data, industry: value })}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Industry" />
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
