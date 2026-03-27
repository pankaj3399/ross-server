"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiService, Project } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { IconLoader2, IconSettings } from "@tabler/icons-react";
import ProjectEditForm from "@/components/features/projects/ProjectEditForm";
import ProjectSettingsTabs from "@/components/features/projects/ProjectSettingsTabs";

export default function ProjectSettingsPage() {
    const { projectId } = useParams() as { projectId: string };
    const { isAuthenticated } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchProject = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.getProject(projectId);
            setProject(data);
        } catch (error) {
            console.error("Failed to fetch project", error);
            showToast.error("Failed to load project details");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProject();
        }
    }, [isAuthenticated, fetchProject]);

    const handleUpdateProject = async (data: {
        name: string;
        description: string;
        aiSystemType: string;
        industry: string;
    }) => {
        setSaving(true);
        try {
            await apiService.updateProject(projectId, data);
            await fetchProject(); // refresh local state and wait for it
            showToast.success("Project updated successfully");
        } catch (error: any) {
            showToast.error(error.message || "Failed to update project");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Project not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary to-primary">
                        Project Settings
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your project details and team access.
                    </p>
                </div>
            </div>

            <ProjectSettingsTabs projectId={projectId} />

            <Card className="border-primary/20 shadow-md ring-1 ring-primary/5">
                <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <IconSettings className="w-5 h-5 text-primary" />
                        Project Details
                    </CardTitle>
                    <CardDescription>
                        General information about your AI system and project assessment.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <ProjectEditForm
                        initialData={{
                            name: project.name,
                            description: project.description || "",
                            aiSystemType: project.ai_system_type || "",
                            industry: project.industry || "",
                        }}
                        onSubmit={handleUpdateProject}
                        isLoading={saving}
                        submitLabel="Update Project"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
