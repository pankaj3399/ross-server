import { create } from 'zustand';

const ACTIVITY_BAR_WIDTH = 48;
const DEFAULT_WIDTH = 256; // 16rem – compact default, questions truncated
const MIN_WIDTH = 202;
const MAX_WIDTH_RATIO = 0.5; // 50% of viewport

export function getTotalSidebarWidth(isSecondaryOpen: boolean, sidebarWidth: number): number {
  return ACTIVITY_BAR_WIDTH + (isSecondaryOpen ? sidebarWidth : 0);
}

interface SidebarStore {
  sidebarWidth: number;
  isSecondaryOpen: boolean;
  isResizing: boolean;
  setSidebarWidth: (width: number) => void;
  setIsSecondaryOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleSecondaryOpen: () => void;
  setIsResizing: (resizing: boolean) => void;
  initializeWidth: () => void;
}

let saveTimeout: NodeJS.Timeout | null = null;

export const useSidebarStore = create<SidebarStore>((set) => ({
  sidebarWidth: DEFAULT_WIDTH,
  isSecondaryOpen: true,
  isResizing: false,
  setSidebarWidth: (width: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(width, window.innerWidth * MAX_WIDTH_RATIO));
    set({ sidebarWidth: clamped });
    
    if (typeof window !== 'undefined') {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem('sidebar-width', clamped.toString());
      }, 500);
    }
  },
  setIsSecondaryOpen: (open) => {
    set((state) => ({
      isSecondaryOpen: typeof open === 'function' ? open(state.isSecondaryOpen) : open,
    }));
  },
  toggleSecondaryOpen: () => {
    set((state) => ({ isSecondaryOpen: !state.isSecondaryOpen }));
  },
  setIsResizing: (resizing: boolean) => {
    set({ isResizing: resizing });
  },
  initializeWidth: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sidebar-width');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH) {
        const clamped = Math.max(MIN_WIDTH, Math.min(parsed, window.innerWidth * MAX_WIDTH_RATIO));
        set({ sidebarWidth: clamped });
      }
    }
  },
}));

export { ACTIVITY_BAR_WIDTH, MIN_WIDTH, MAX_WIDTH_RATIO };
