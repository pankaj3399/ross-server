import { create } from 'zustand';

interface PriceState {
  prices: { basic: number | null; pro: number | null };
  loading: boolean;
  fetched: boolean;
  setPrices: (prices: { basic: number | null; pro: number | null }) => void;
  setPriceLoading: (loading: boolean) => void;
  setFetched: (fetched: boolean) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: { basic: null, pro: null },
  loading: false,
  fetched: false,
  setPrices: (prices) => set({ prices }),
  setPriceLoading: (loading) => set({ loading }),
  setFetched: (fetched) => set({ fetched }),
}));

