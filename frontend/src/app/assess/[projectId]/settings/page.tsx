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
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const fetchProject = useCallback(async (options: { suppressGlobalLoading?: boolean } = {}) => {
        setLoadError(false);
        if (!options.suppressGlobalLoading) {
            setLoading(true);
        }
        try {
            const data = await apiService.getProject(projectId);
            setProject(data);
            setLoadError(false);
        } catch (error) {
            console.error("Failed to fetch project", error);
            setLoadError(true);
            showToast.error("Failed to load project details");
        } finally {
            if (!options.suppressGlobalLoading) {
                setLoading(false);
            }
        }
    }, [projectId]);

    useEffect(() => {
        if (!authLoading) {
            if (isAuthenticated) {
                fetchProject();
            } else {
                setLoading(false);
            }
        }
    }, [isAuthenticated, authLoading, fetchProject]);

    const handleUpdateProject = async (data: {
        name: string;
        description: string;
        aiSystemType: string;
        industry: string;
    }) => {
        setSaving(true);
        try {
            const { project: updatedProject } = await apiService.updateProject(projectId, data);
            setProject(updatedProject);
            showToast.success("Project updated successfully");
        } catch (error: any) {
            showToast.error(error.message || "Failed to update project");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || (loading && !loadError)) {
        return (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <IconLoader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">Loading project settings...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border/60 max-w-2xl mx-auto mt-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconSettings className="w-8 h-8 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Access Restricted</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Please sign in with an authorized account to view and manage these project settings.</p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => window.location.href = "/auth?isLogin=true"}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="text-center py-20 bg-destructive/5 rounded-xl border border-destructive/20 max-w-2xl mx-auto mt-10">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconSettings className="w-8 h-8 text-destructive/40" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-destructive">Loading Error</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">We encountered a problem while retrieving your project details. This might be a temporary connection issue.</p>
                <button 
                    onClick={() => fetchProject()}
                    className="px-6 py-2 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
                <p className="text-muted-foreground">The project you are looking for does not exist or has been removed.</p>
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
