import { create } from "zustand";
import { apiService } from "@/lib/api";

export interface Invitation {
  id: string;
  token: string;
  project: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string;
  } | null;
  role: string;
  expires_at: string;
  created_at: string;
}

interface NotificationState {
  invitations: Invitation[];
  loading: boolean;
  fetchInvitations: () => Promise<void>;
  removeInvitation: (token: string) => void;
  setInvitations: (invitations: Invitation[]) => void;
  clearInvitations: () => void;
}

let fetchInvitationsPromise: Promise<void> | null = null;

export const useNotificationStore = create<NotificationState>((set) => ({
  invitations: [],
  loading: false,

  fetchInvitations: async () => {
    if (fetchInvitationsPromise) {
      return fetchInvitationsPromise;
    }

    set({ loading: true });

    fetchInvitationsPromise = (async () => {
      try {
        const data = await apiService.getMyInvitations();
        set({ invitations: data.invitations || [], loading: false });
      } catch (error) {
        console.error("Failed to fetch invitations:", error);
        set({ invitations: [], loading: false });
      } finally {
        fetchInvitationsPromise = null;
      }
    })();

    return fetchInvitationsPromise;
  },

  removeInvitation: (token: string) => {
    set((state) => ({
      invitations: state.invitations.filter((inv) => inv.token !== token),
    }));
  },

  setInvitations: (invitations: Invitation[]) => {
    set({ invitations });
  },

  clearInvitations: () => {
    set({ invitations: [], loading: false });
  },
}));
