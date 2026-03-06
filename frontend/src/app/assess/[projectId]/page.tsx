"use client";

import { useParams, useRouter } from "next/navigation";
import { useAssessmentContext } from "../../../contexts/AssessmentContext";
import { IconAlertTriangle, IconBrain } from "@tabler/icons-react";
import { AssessmentSkeleton } from "../../../components/Skeleton";
import QuestionView from "../../../components/assess/QuestionView";
import CommentsPanel from "../../../components/shared/CommentsPanel";

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;

  const {
    domains,
    loading,
    error,
    projectNotFound,
    questions,
  } = useAssessmentContext();

  // --- Render Loading / Error States ---

  if (loading) {
    return <AssessmentSkeleton />;
  }

  if (projectNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full text-center">
          <IconAlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Project Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            No domains available for this project.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.back()}
              type="button"
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && domains.length === 0 && !projectNotFound && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full text-center">
          <IconAlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Unable to Load Assessment
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              type="button"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              type="button"
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    if (!loading && domains.length > 0) {
      return (
        <div className="flex flex-1 h-full flex-col items-center justify-center p-8 text-center bg-background/50 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <IconBrain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">Select a Practice</h3>
          <p className="text-muted-foreground max-w-sm">
            Navigate through the domains and practices in the sidebar to start answering questions.
          </p>
        </div>
      );
    }
    return <AssessmentSkeleton />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <QuestionView />
      </div>

      <div className="border-t p-6 bg-muted/10 mx-auto w-full max-w-7xl">
        <h3 className="text-lg font-semibold mb-4 px-2">Project Notes & Collaboration</h3>
        <CommentsPanel projectId={projectId as string} objectType="PROJECT" objectId={projectId as string} />
      </div>
    </div>
  );
}
