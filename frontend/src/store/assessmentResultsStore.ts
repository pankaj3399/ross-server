import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types matching the backend response structure
interface DomainResult {
  domainId: string;
  domainTitle: string;
  maturityScore: number;
  practiceScores: {
    practiceId: string;
    practiceTitle: string;
    maturityScore: number;
    totalQuestions: number;
  }[];
  totalQuestions: number;
  percentage: number; // For compatibility
  isPremium?: boolean;
}

interface OverallResult {
  overallMaturityScore: number;
  totalQuestions: number;
  overallPercentage: number; // For compatibility
}

interface AssessmentResults {
  domains: DomainResult[];
  overall: OverallResult;
}

interface ProjectCapabilities {
  premiumInsights?: boolean;
  canGenerateInsights?: boolean;
}

interface ProjectResult {
  projectId: string;
  project: any; // Project data from backend
  results: AssessmentResults;
  submittedAt: string | null; // ISO timestamp from the server; null until backfilled
  capabilities?: ProjectCapabilities;
}

interface AssessmentResultsStore {
  projectResults: ProjectResult[];

  // Store assessment results for a project
  setProjectResults: (projectId: string, project: any, results: AssessmentResults, capabilities?: ProjectCapabilities) => void;
  
  // Get assessment results for a specific project
  getProjectResults: (projectId: string) => ProjectResult | null;
  
  // Get all stored results
  getAllResults: () => ProjectResult[];
  
  // Clear results for a specific project
  clearProjectResults: (projectId: string) => void;
  
  // Clear all results
  clearAllResults: () => void;
  
  // Check if project has results
  hasProjectResults: (projectId: string) => boolean;
  
  // Get latest submitted project
  getLatestSubmittedProject: () => ProjectResult | null;
}

export const useAssessmentResultsStore = create<AssessmentResultsStore>()(
  persist(
    (set, get) => ({
      projectResults: [],
      
      setProjectResults: (projectId: string, project: any, results: AssessmentResults, capabilities?: ProjectCapabilities) => {
        set((state) => {
          const existingIndex = state.projectResults.findIndex(pr => pr.projectId === projectId);

          // Prefer the server's persisted submission timestamp (carried on the
          // project row as submitted_at, or on the results payload if a caller
          // attached one). Fall back to whatever was already cached so we
          // don't clobber a real timestamp with a fresh wall-clock value.
          // When no server-side timestamp is available anywhere, leave
          // submittedAt null and let UI/PDF render a fallback label rather
          // than inventing a misleading "submitted today" date.
          const incomingSubmittedAt =
            (results as any)?.submitted_at ??
            project?.submitted_at ??
            null;
          const existingSubmittedAt =
            existingIndex >= 0 ? state.projectResults[existingIndex].submittedAt : null;
          const submittedAt: string | null = incomingSubmittedAt
            ? new Date(incomingSubmittedAt).toISOString()
            : existingSubmittedAt ?? null;

          const newProjectResult: ProjectResult = {
            projectId,
            project,
            results,
            submittedAt,
            capabilities,
          };
          
          if (existingIndex >= 0) {
            // Update existing results
            const updatedResults = [...state.projectResults];
            updatedResults[existingIndex] = newProjectResult;
            return { projectResults: updatedResults };
          } else {
            // Add new results
            return { projectResults: [...state.projectResults, newProjectResult] };
          }
        });
      },
      
      getProjectResults: (projectId: string) => {
        const state = get();
        return state.projectResults.find(pr => pr.projectId === projectId) || null;
      },
      
      getAllResults: () => {
        const state = get();
        return state.projectResults;
      },
      
      clearProjectResults: (projectId: string) => {
        set((state) => ({
          projectResults: state.projectResults.filter(pr => pr.projectId !== projectId)
        }));
      },
      
      clearAllResults: () => {
        set({ projectResults: [] });
      },
      
      hasProjectResults: (projectId: string) => {
        const state = get();
        return state.projectResults.some(pr => pr.projectId === projectId);
      },
      
      getLatestSubmittedProject: () => {
        const state = get();
        if (state.projectResults.length === 0) return null;
        
        // Sort by submittedAt descending and return the latest. Treat null
        // timestamps as the epoch so they sort to the bottom rather than
        // throwing on Date(null).
        const tsOrZero = (v: string | null) => (v ? new Date(v).getTime() : 0);
        const sortedResults = [...state.projectResults].sort(
          (a, b) => tsOrZero(b.submittedAt) - tsOrZero(a.submittedAt)
        );
        
        return sortedResults[0];
      },
    }),
    {
      name: 'assessment-results-store',
      // Only persist the essential data, not the entire store
      partialize: (state) => ({ projectResults: state.projectResults }),
    }
  )
);

// Export types for use in components
export type { DomainResult, OverallResult, AssessmentResults, ProjectResult, ProjectCapabilities };
