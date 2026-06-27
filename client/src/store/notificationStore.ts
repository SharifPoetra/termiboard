import { create } from 'zustand';
import axiosInstance from '../lib/axios';

export interface Invitation {
  id: string;
  boardId: string;
  userId: string;
  role: string;
  status: 'pending' | 'active';
  createdAt: string;
  // Optional: If the backend sends additional board name payload metadata
  boardName?: string;
}

interface NotificationState {
  invitations: Invitation[];
  isLoading: boolean;
}

interface NotificationActions {
  addInvitation: (invitation: Invitation) => void;
  acceptInvitation: (boardId: string) => Promise<void>;
  rejectInvitation: (boardId: string) => Promise<void>;
  // Pending: need endpoint to fetch pending invitations upon initial application boot
  fetchPendingInvitations: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set) => ({
  invitations: [],
  isLoading: false,

  addInvitation: (invitation) => {
    set((state) => {
      // Prevent duplication of incoming stream notifications
      if (state.invitations.some((inv) => inv.id === invitation.id)) return state;
      return { invitations: [invitation, ...state.invitations] };
    });
  },

  acceptInvitation: async (boardId) => {
    try {
      // POST /api/boards/invite/accept
      await axiosInstance.post('/boards/invite/accept', { boardId });
      // Evacuate invitation object from local state array tracking matrix upon successful confirmation
      set((state) => ({
        invitations: state.invitations.filter((inv) => inv.boardId !== boardId),
      }));
    } catch (err) {
      console.error('Failed to accept board invitation', err);
      throw err;
    }
  },

  rejectInvitation: async (boardId) => {
    try {
      // POST /api/boards/invite/reject
      await axiosInstance.post('/boards/invite/reject', { boardId });
      // Evacuate invitation object from local state array tracking matrix upon successful rejection
      set((state) => ({
        invitations: state.invitations.filter((inv) => inv.boardId !== boardId),
      }));
    } catch (err) {
      console.error('Failed to reject board invitation', err);
      throw err;
    }
  },

  // Invoked during application startup sequence to reconcile missing pending invite arrays
  fetchPendingInvitations: async () => {
    // TODO: Make an endpoint to fetch pending invitations
    try {
      // Example endpoint mapping parameters: GET /api/boards/invitations/pending
      // const response = await axiosInstance.get('/boards/invitations/pending');
      // set({ invitations: response.data.data.invitations });
    } catch (err) {
      console.error('Failed to fetch pending invitations', err);
    }
  },
}));
