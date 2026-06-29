import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import { BoardMember } from '@termiboard/core';

interface NotificationState {
  invitations: BoardMember[];
  isLoading: boolean;
}

interface NotificationActions {
  addInvitation: (invitation: BoardMember) => void;
  acceptInvitation: (boardId: string) => Promise<void>;
  rejectInvitation: (boardId: string) => Promise<void>;
  // Invoked to fetch pending invitations upon initial application boot or refresh
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

  // Invoked during application startup sequence to reconcile missing pending invite arrays from database
  fetchPendingInvitations: async () => {
    set({ isLoading: true });
    try {
      // GET /api/boards/invite/pending
      const response = await axiosInstance.get('/boards/invite/pending');

      // Hydrate local state array with persistence layer database records
      set({
        invitations: response.data.data.invitations || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch pending invitations from database matrix', err);
      set({ isLoading: false });
    }
  },
}));
