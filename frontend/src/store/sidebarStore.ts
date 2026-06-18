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

export const useSidebarStore = create<SidebarStore>((set) => ({
  sidebarWidth: DEFAULT_WIDTH,
  isResizing: false,
  setSidebarWidth: (width: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(width, window.innerWidth * MAX_WIDTH_RATIO));
    console.log(`[sidebarStore] setSidebarWidth: input = ${width}, clamped = ${clamped}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-width', clamped.toString());
    }
    set({ sidebarWidth: clamped });
  },
  setIsResizing: (resizing: boolean) => {
    console.log(`[sidebarStore] setIsResizing: ${resizing}`);
    set({ isResizing: resizing });
  },
  initializeWidth: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sidebar-width');
    console.log(`[sidebarStore] initializeWidth: stored = ${stored}`);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH) {
        const clamped = Math.max(MIN_WIDTH, Math.min(parsed, window.innerWidth * MAX_WIDTH_RATIO));
        console.log(`[sidebarStore] initializeWidth: applying clamped = ${clamped}`);
        set({ sidebarWidth: clamped });
      }
    }
  },
}));

export { MIN_WIDTH, MAX_WIDTH_RATIO };
