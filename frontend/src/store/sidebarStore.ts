import { create } from 'zustand';

const DEFAULT_WIDTH = 256; // 16rem – compact default, questions truncated
const MIN_WIDTH = 202;
const MAX_WIDTH_RATIO = 0.5; // 50% of viewport

interface SidebarStore {
  sidebarWidth: number;
  isResizing: boolean;
  setSidebarWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
  initializeWidth: () => void;
}

let saveTimeout: NodeJS.Timeout | null = null;

export const useSidebarStore = create<SidebarStore>((set) => ({
  sidebarWidth: DEFAULT_WIDTH,
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

export { MIN_WIDTH, MAX_WIDTH_RATIO };
