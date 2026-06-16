import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import type { Board } from '../features/dashboard/types/dashboard.types';
import type { Column, Card } from '../features/kanban/types/kanban.types';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  columns: Column[];
  cards: Record<string, Card[]>;
  isLoading: boolean;
  error: string | null;
}

interface BoardActions {
  fetchBoards: () => Promise<void>;
  createBoard: (boardData: { name: string; description: string }) => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
  deleteBoard: (boardId: string) => Promise<void>;
  clearError: () => void;

  // Columns Actions
  fetchColumns: (boardId: string) => Promise<void>;
  createColumn: (columnData: { boardId: string; name: string; position: string }) => Promise<void>;
  updateColumn: (columnId: string, columnData: { name?: string; position?: string }) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Cards Actions
  fetchCards: (columnId: string) => Promise<void>;
  createCard: (cardData: { columnId: string; title: string; content: string; position: string }) => Promise<void>;
  updateCard: (
    cardId: string,
    cardData: { title?: string; content?: string; position?: string; columnId?: string },
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;

  // Real-time WS Sync Mutators
  syncAddColumn: (column: Column) => void;
  syncUpdateColumn: (column: Column) => void;
  syncDeleteColumn: (columnId: string) => void;
  syncAddCard: (card: Card) => void;
  syncUpdateCard: (card: Card) => void;
  syncDeleteCard: (card: Card) => void;
}

export const useBoardStore = create<BoardState & BoardActions>((set) => ({
  boards: [],
  currentBoard: null,
  columns: [],
  cards: {},
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  setCurrentBoard: (board) => set({ currentBoard: board }),

  // GET /api/boards
  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/boards');
      set({ boards: response.data.data.boards, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch boards' });
    }
  },

  // DELETE /api/boards/:id
  deleteBoard: async (boardId) => {
    try {
      await axiosInstance.delete(`/boards/${boardId}`);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to terminate board' });
      throw err;
    }
  },

  // POST /api/boards
  createBoard: async (boardData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post('/boards', boardData);
      const newBoard = response.data.data.board;
      set((state) => ({ boards: [newBoard, ...state.boards], isLoading: false }));
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to initialize board' });
      throw err;
    }
  },

  // GET /api/columns/:boardId
  fetchColumns: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/columns/${boardId}`);
      const sortedColumns = response.data.data.columns.sort(
        (a: Column, b: Column) => Number(a.position) - Number(b.position),
      );
      set({ columns: sortedColumns, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch columns' });
    }
  },

  // POST /api/columns
  createColumn: async (columnData) => {
    try {
      await axiosInstance.post('/columns', columnData);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to deploy column lane' });
      throw err;
    }
  },

  // PATCH /api/columns/:id
  updateColumn: async (columnId, columnData) => {
    try {
      await axiosInstance.patch(`/columns/${columnId}`, columnData);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to adjust column parameters' });
      throw err;
    }
  },

  // DELETE /api/columns/:id
  deleteColumn: async (columnId) => {
    try {
      await axiosInstance.delete(`/columns/${columnId}`);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to terminate column lane' });
      throw err;
    }
  },

  // GET /api/cards/:columnId
  fetchCards: async (columnId) => {
    try {
      const response = await axiosInstance.get(`/cards/${columnId}`);
      const sortedCards = response.data.data.cards.sort((a: Card, b: Card) => Number(a.position) - Number(b.position));
      set((state) => ({
        cards: { ...state.cards, [columnId]: sortedCards },
      }));
    } catch (err: any) {
      console.error(`Failed to stream cards parameters for lane ${columnId}`, err);
    }
  },

  // POST /api/cards
  createCard: async (cardData) => {
    try {
      await axiosInstance.post('/cards', cardData);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to inject card matrix' });
      throw err;
    }
  },

  // PATCH /api/cards/:id
  updateCard: async (cardId, cardData) => {
    try {
      await axiosInstance.patch(`/cards/${cardId}`, cardData);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to modify card matrix' });
      throw err;
    }
  },

  // DELETE /api/cards/:id
  deleteCard: async (cardId) => {
    try {
      await axiosInstance.delete(`/cards/${cardId}`);
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to purge card object' });
      throw err;
    }
  },

  // --- Real-time WS Sync Mutators ---
  syncAddColumn: (column) => {
    set((state) => {
      if (state.columns.some((c) => c.id === column.id)) return state;
      return {
        columns: [...state.columns, column].sort((a, b) => Number(a.position) - Number(b.position)),
      };
    });
  },

  syncUpdateColumn: (updatedColumn) => {
    set((state) => ({
      columns: state.columns
        .map((c) => (c.id === updatedColumn.id ? updatedColumn : c))
        .sort((a, b) => Number(a.position) - Number(b.position)),
    }));
  },

  syncDeleteColumn: (columnId) => {
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== columnId),
    }));
  },

  syncAddCard: (card) => {
    set((state) => {
      const columnCards = state.cards[card.columnId] || [];
      if (columnCards.some((c) => c.id === card.id)) return state;
      return {
        cards: {
          ...state.cards,
          [card.columnId]: [...columnCards, card].sort((a, b) => Number(a.position) - Number(b.position)),
        },
      };
    });
  },

  syncUpdateCard: (updatedCard) => {
    set((state) => {
      const colId = updatedCard.columnId;
      const currentTrack = state.cards[colId] || [];
      return {
        cards: {
          ...state.cards,
          [colId]: currentTrack
            .map((c) => (c.id === updatedCard.id ? updatedCard : c))
            .sort((a, b) => Number(a.position) - Number(b.position)),
        },
      };
    });
  },

  syncDeleteCard: (card) => {
    set((state) => {
      if (!card || !card.columnId) return state;
      const columnCards = state.cards[card.columnId] || [];
      return {
        cards: {
          ...state.cards,
          [card.columnId]: columnCards.filter((c) => c.id !== card.id),
        },
      };
    });
  },
}));
