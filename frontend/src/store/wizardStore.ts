import { create } from "zustand";
import { apiService } from "../lib/api";

export interface WizardAnswers {
  governance_scope?: "system" | "organization";
  name: string;
  description: string;
  use_case?: string;
  regulatory_role?: "provider" | "deployer" | "both";
  data_categories: string[];
  geographic_scope: string[];
  scale?: string;
  uses_third_party_models?: "yes" | "no" | "not_sure";
  third_party_providers: string[];
  automation_level?: string;
  existing_certifications: string[];
  annex_iii_domains: string[];
  biometric_use?: string;
  affects_children?: "yes" | "no" | "not_sure";
  public_url: string;
}

const initialAnswers: WizardAnswers = {
  governance_scope: undefined,
  name: "",
  description: "",
  use_case: undefined,
  regulatory_role: undefined,
  data_categories: [],
  geographic_scope: [],
  scale: undefined,
  uses_third_party_models: undefined,
  third_party_providers: [],
  automation_level: undefined,
  existing_certifications: [],
  annex_iii_domains: [],
  biometric_use: undefined,
  affects_children: undefined,
  public_url: "",
};

interface WizardState {
  answers: WizardAnswers;
  currentSection: number;
  loading: boolean;
  saving: boolean;
  engineOutput: any;
  setAnswer: <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => void;
  setAnswers: (answers: Partial<WizardAnswers>) => void;
  nextSection: () => void;
  prevSection: () => void;
  setSection: (section: number) => void;
  loadSavedAnswers: (projectId: string) => Promise<void>;
  saveProgress: (projectId: string) => Promise<void>;
  completeWizard: (projectId: string) => Promise<any>;
  applyProfile: (projectId: string, payload?: { acceptedRisks?: string[]; acceptedComponents?: string[] }) => Promise<void>;
  resetStore: () => void;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  answers: { ...initialAnswers },
  currentSection: 1,
  loading: false,
  saving: false,
  engineOutput: null,

  setAnswer: (key, value) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value,
      },
    }));
  },

  setAnswers: (newAnswers) => {
    set((state) => ({
      answers: {
        ...state.answers,
        ...newAnswers,
      },
    }));
  },

  nextSection: () => {
    set((state) => ({
      currentSection: Math.min(state.currentSection + 1, 6),
    }));
  },

  prevSection: () => {
    set((state) => ({
      currentSection: Math.max(state.currentSection - 1, 1),
    }));
  },

  setSection: (section) => {
    set({ currentSection: section });
  },

  loadSavedAnswers: async (projectId) => {
    set({ loading: true });
    try {
      const res = await apiService.getWizardAnswers(projectId);
      if (res && res.success && res.answers) {
        const dbAnswers = res.answers;
        set({
          answers: {
            governance_scope: dbAnswers.governance_scope || undefined,
            name: dbAnswers.name || "",
            description: dbAnswers.description || "",
            use_case: dbAnswers.use_case || undefined,
            regulatory_role: dbAnswers.regulatory_role || undefined,
            data_categories: dbAnswers.data_categories || [],
            geographic_scope: dbAnswers.geographic_scope || [],
            scale: dbAnswers.scale || undefined,
            uses_third_party_models: dbAnswers.uses_third_party_models || undefined,
            third_party_providers: dbAnswers.third_party_providers || [],
            automation_level: dbAnswers.automation_level || undefined,
            existing_certifications: dbAnswers.existing_certifications || [],
            annex_iii_domains: dbAnswers.annex_iii_domains || [],
            biometric_use: dbAnswers.biometric_use || undefined,
            affects_children: dbAnswers.affects_children || undefined,
            public_url: dbAnswers.public_url || "",
          },
          currentSection: dbAnswers.wizard_step || 1,
        });

        // Also fetch engine outputs if they exist
        const engineRes = await apiService.getWizardEngineOutput(projectId);
        if (engineRes && engineRes.success && engineRes.outputs) {
          set({ engineOutput: engineRes.outputs });
        }
      } else {
        // Fallback: load project name/description as starter
        try {
          const projectRes = await apiService.getProject(projectId);
          if (projectRes) {
            set({
              answers: {
                ...initialAnswers,
                name: projectRes.name || "",
                description: projectRes.description || "",
              },
            });
          }
        } catch (e) {
          console.warn("Failed to prefill project name/description:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load wizard answers:", error);
    } finally {
      set({ loading: false });
    }
  },

  saveProgress: async (projectId) => {
    const { answers, currentSection } = get();
    set({ saving: true });
    try {
      await apiService.saveWizardAnswers(projectId, {
        ...answers,
        wizard_step: currentSection,
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  completeWizard: async (projectId) => {
    set({ saving: true });
    try {
      // First save progress
      const { answers } = get();
      await apiService.saveWizardAnswers(projectId, {
        ...answers,
        wizard_step: 6,
      });

      // Complete wizard run
      const res = await apiService.completeWizard(projectId);
      if (res && res.success) {
        set({ engineOutput: res.outputs });
        return res.outputs;
      } else {
        throw new Error((res as any)?.error || "Failed to complete wizard");
      }
    } catch (error) {
      console.error("Failed to complete wizard:", error);
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  applyProfile: async (projectId, payload?: { acceptedRisks?: string[]; acceptedComponents?: string[] }) => {
    set({ saving: true });
    try {
      await apiService.applyWizardProfile(projectId, payload);
    } catch (error) {
      console.error("Failed to apply profile:", error);
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  resetStore: () => {
    set({
      answers: { ...initialAnswers },
      currentSection: 1,
      loading: false,
      saving: false,
      engineOutput: null,
    });
  },
}));
