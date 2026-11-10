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
import { IconFolder, IconCpu } from "@tabler/icons-react";
import { CARD_THEMES } from "@/lib/constants";

const LOCAL_MODAL_THEMES = [
  { // Indigo
    bgAndHover: "bg-indigo-500/[0.02] hover:bg-indigo-500/5 hover:border-indigo-500/40",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  { // Red
    bgAndHover: "bg-destructive/[0.01] hover:bg-destructive/5 hover:border-destructive/50",
    icon: "text-destructive",
  },
  { // Yellow
    bgAndHover: "bg-warning/[0.02] hover:bg-warning/5 hover:border-warning/60",
    icon: "text-warning-foreground dark:text-warning",
  },
  { // Green
    bgAndHover: "bg-success/[0.01] hover:bg-success/5 hover:border-success/50",
    icon: "text-success",
  },
  { // Purple
    bgAndHover: "bg-purple-500/[0.02] hover:bg-purple-500/5 hover:border-purple-500/40",
    icon: "text-purple-600 dark:text-purple-400",
  }
];

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
    const fetchProjects = async (retry = 0) => {
      if (!isOpen) return;
      if (retry === 0) setIsLoading(true);
      try {
        const data = await apiService.getProjects();
        if (isMounted) {
          setProjects(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Failed to load projects in modal (attempt ${retry + 1}):`, error);
        if (retry < 2 && isMounted) {
          setTimeout(() => {
            if (isMounted && isOpen) {
              fetchProjects(retry + 1);
            }
          }, (retry + 1) * 600);
          return;
        }
        if (isMounted) {
          showToast.error("Failed to load projects.");
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
            projects.map((project, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const localTheme = LOCAL_MODAL_THEMES[index % LOCAL_MODAL_THEMES.length];
              return (
                <Button
                  key={project.id}
                  variant="outline"
                  className={`justify-start h-auto py-3 px-4 w-full border transition-all duration-200 ${theme.border} ${localTheme.bgAndHover}`}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <IconFolder className={`w-5 h-5 shrink-0 ${localTheme.icon}`} />
                    <div className="flex items-center justify-between flex-1 min-w-0 w-full gap-2">
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-semibold truncate w-full text-left text-foreground">{project.name}</span>
                        {project.description && (
                          <span className="text-xs text-muted-foreground truncate w-full text-left mt-0.5">
                            {project.description}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] py-0.5 px-2 rounded-full font-semibold flex items-center gap-1 shrink-0 ${theme.badge} self-start mt-0.5`}>
                        <IconCpu className="w-2.5 h-2.5 shrink-0" />
                        <span>{project.ai_system_type || "General AI System"}</span>
                      </span>
                    </div>
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
