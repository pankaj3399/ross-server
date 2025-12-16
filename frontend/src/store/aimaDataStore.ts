import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PracticeLevels = {
  [level: string]: {
    [stream: string]: Array<string | {
      question_text: string;
      description?: string | null;
    }>;
  };
};

interface PracticeWithLevels {
  title: string;
  description: string;
  levels: PracticeLevels;
}

interface DomainWithPractices {
  id: string;
  title: string;
  description: string;
  is_premium?: boolean;
  practices: Record<string, PracticeWithLevels>;
}

interface AimaDataCache {
  domains: DomainWithPractices[];
  timestamp: number; // Unix timestamp when cache was created
  version?: string; // Optional version identifier from backend
}

interface AimaDataStore {
  cache: AimaDataCache | null;
  getCachedData: () => AimaDataCache | null;
  setCachedData: (domains: DomainWithPractices[], version?: string) => void;
  isCacheValid: (maxAge?: number) => boolean;
  clearCache: () => void;
  hasCache: () => boolean;
}

const DEFAULT_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export const useAimaDataStore = create<AimaDataStore>()(
  persist(
    (set, get) => ({
      cache: null,
      
      getCachedData: () => {
        const state = get();
        if (state.cache && state.isCacheValid()) {
          return state.cache;
        }
        return null;
      },
      
      setCachedData: (domains: DomainWithPractices[], version?: string) => {
        set({
          cache: {
            domains,
            timestamp: Date.now(),
            version,
          },
        });
      },
      
      isCacheValid: (maxAge: number = DEFAULT_CACHE_MAX_AGE) => {
        const state = get();
        if (!state.cache) {
          return false;
        }
        const age = Date.now() - state.cache.timestamp;
        return age < maxAge;
      },
      
      clearCache: () => {
        set({ cache: null });
      },
      
      hasCache: () => {
        const state = get();
        return state.cache !== null;
      },
    }),
    {
      name: 'aima-data-cache',
      partialize: (state) => ({ cache: state.cache }),
    }
  )
);

