"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService, Project } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IconLoader2, IconSettings, IconArrowLeft, IconTrash } from "@tabler/icons-react";
import ProjectEditForm from "@/components/features/projects/ProjectEditForm";
import ProjectSettingsTabs from "@/components/features/projects/ProjectSettingsTabs";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { isPremiumStatus } from "@/lib/constants";

export default function ProjectSettingsPage() {
    const router = useRouter();
    const { projectId } = useParams() as { projectId: string };
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const handleDeleteProject = async () => {
        setDeleting(true);
        try {
            await apiService.deleteProject(projectId);
            showToast.success("Project moved to trash");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Failed to delete project", error);
            showToast.error(error.message || "Failed to delete project");
            setDeleting(false);
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
                        onClick={() => router.push(`/auth?isLogin=true&redirect=${encodeURIComponent(`/assess/${projectId}/settings`)}`)}
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

    const premiumStatus = user?.subscription_status ? isPremiumStatus(user.subscription_status) : false;
    const projectBreadcrumbHref = premiumStatus
        ? `/assess/${projectId}/crc/dashboard`
        : `/assess/${projectId}`;

    return (
        <div className="flex-1 flex flex-col w-full">
            {/* Header */}
            <div className="bg-sidebar border-b border-sidebar-border px-8 py-3 flex-none sticky top-0 z-20 shadow-xs w-full mb-8">
                <div className="w-full flex flex-col gap-2">
                    {/* Top: Breadcrumb */}
                    <div className="flex items-center justify-between text-xs">
                        <Breadcrumb
                            projectName={project.name || "Loading..."}
                            projectHref={projectBreadcrumbHref}
                            items={[{ label: "Project Settings" }]}
                        />
                    </div>

                    {/* Bottom: Main row */}
                    <div className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => router.back()}
                                type="button"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-border/60 hover:bg-muted text-xs text-foreground/80 hover:text-foreground transition-all shadow-2xs shrink-0 cursor-pointer"
                            >
                                <IconArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                            <div className="h-5 w-px bg-border shrink-0" />
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                <IconSettings className="w-4 h-4 text-primary shrink-0" style={{ color: "var(--section-settings)" }} />
                                <h1 className="text-sm font-bold text-foreground truncate">
                                    Project Settings
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 w-full pb-12 space-y-6">
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

                {/* Danger Zone - Owner Only */}
                {user?.id && project?.user_id && user.id === project.user_id && (
                    <Card className="border-destructive/20 shadow-md ring-1 ring-destructive/5 mt-8">
                        <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                                <IconTrash className="w-5 h-5 text-destructive" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>
                                Permanently move this project to trash. You can recover it from your Dashboard for up to 30 days.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Delete Project</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Moving this project to trash will disable access to all associated assessments and data.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteModal(true)}
                                className="shrink-0 font-medium flex items-center gap-2"
                            >
                                <IconTrash className="w-4 h-4" />
                                Delete Project
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <IconTrash className="w-5 h-5" />
                            Delete Project
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{project.name}&quot;</span>? This will move the project to trash. You can recover it from your Dashboard settings within 30 days.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Project"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
