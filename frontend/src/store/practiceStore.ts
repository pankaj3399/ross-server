import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PracticeQuestionDetail } from '../lib/api';

type PracticeLevels = {
  [level: string]: {
    [stream: string]: Array<string | PracticeQuestionDetail>;
  };
};

interface PracticeWithLevels {
  title: string;
  description: string;
  levels: PracticeLevels;
}

interface ProjectState {
  projectId: string;
  practice: PracticeWithLevels | null;
  currentDomainId: string;
  currentPracticeId: string;
  currentQuestionIndex: number;
}

interface PracticeStore {
  projectStates: ProjectState[];
  
  // Get state for a specific project
  getProjectState: (projectId: string) => ProjectState | null;
  
  // Set state for a specific project
  setProjectState: (projectId: string, state: Partial<Omit<ProjectState, 'projectId'>>) => void;
  
  // Clear state for a specific project
  clearProjectState: (projectId: string) => void;
  
  // Clear all states
  reset: () => void;
}

export const usePracticeStore = create<PracticeStore>()(
  persist(
    (set, get) => ({
      projectStates: [],
      
      getProjectState: (projectId: string) => {
        const state = get();
        return state.projectStates.find(ps => ps.projectId === projectId) || null;
      },
      
      setProjectState: (projectId: string, newState: Partial<Omit<ProjectState, 'projectId'>>) => {
        set((state) => {
          const existingIndex = state.projectStates.findIndex(ps => ps.projectId === projectId);
          
          if (existingIndex >= 0) {
            // Update existing project state
            const updatedStates = [...state.projectStates];
            updatedStates[existingIndex] = {
              ...updatedStates[existingIndex],
              ...newState,
            };
            return { projectStates: updatedStates };
          } else {
            // Create new project state
            const newProjectState: ProjectState = {
              projectId,
              practice: null,
              currentDomainId: '',
              currentPracticeId: '',
              currentQuestionIndex: 0,
              ...newState,
            };
            return { projectStates: [...state.projectStates, newProjectState] };
          }
        });
      },
      
      clearProjectState: (projectId: string) => {
        set((state) => ({
          projectStates: state.projectStates.filter(ps => ps.projectId !== projectId)
        }));
      },
      
      reset: () => set({ projectStates: [] }),
    }),
    {
      name: 'practice-store',
    }
  )
);