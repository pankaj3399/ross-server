import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiService, Project } from "@/lib/api";
import { showToast } from "@/lib/toast";

interface ProjectSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProject: (projectId: string) => void;
  title?: string;
  description?: string;
}

export function ProjectSelectionModal({
  isOpen,
  onOpenChange,
  onSelectProject,
  title = "Select a Project",
  description = "Please select a project to proceed.",
}: ProjectSelectionModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const data = await apiService.getProjects();
        if (isMounted) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
        if (isMounted) {
          showToast.error("Failed to load projects.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">
              No projects found. Please create a project first.
            </div>
          ) : (
            projects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="justify-start h-auto py-3 px-4 w-full"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex flex-col items-start gap-1 w-full overflow-hidden">
                  <span className="font-semibold truncate w-full text-left">{project.name}</span>
                  {project.description && (
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {project.description}
                    </span>
                  )}
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
