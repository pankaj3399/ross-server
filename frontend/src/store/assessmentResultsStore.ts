import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types matching the backend response structure
interface DomainResult {
  domainId: string;
  domainTitle: string;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  isPremium?: boolean;
}

interface OverallResult {
  totalCorrectAnswers: number;
  totalQuestions: number;
  overallPercentage: number;
}

interface AssessmentResults {
  domains: DomainResult[];
  overall: OverallResult;
}

interface ProjectResult {
  projectId: string;
  project: any; // Project data from backend
  results: AssessmentResults;
  submittedAt: string; // ISO timestamp
}

interface AssessmentResultsStore {
  projectResults: ProjectResult[];
  
  // Store assessment results for a project
  setProjectResults: (projectId: string, project: any, results: AssessmentResults) => void;
  
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
      
      setProjectResults: (projectId: string, project: any, results: AssessmentResults) => {
        set((state) => {
          const existingIndex = state.projectResults.findIndex(pr => pr.projectId === projectId);
          
          const newProjectResult: ProjectResult = {
            projectId,
            project,
            results,
            submittedAt: new Date().toISOString(),
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
        
        // Sort by submittedAt descending and return the latest
        const sortedResults = [...state.projectResults].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
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
export type { DomainResult, OverallResult, AssessmentResults, ProjectResult };
