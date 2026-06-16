import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import { Board } from '../features/dashboard/types/dashboard.types';

// Kanban Data Structures
export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: string;
  createdAt: string;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  content: string;
  position: string;
  createdAt: string;
}

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  columns: Column[];
  cards: Record<string, Card[]>; // Keyed by columnId for instant mapping lookup
  isLoading: boolean;
  error: string | null;
}

interface BoardActions {
  fetchBoards: () => Promise<void>;
  createBoard: (boardData: { name: string; description: string }) => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
  clearError: () => void;

  // Columns Actions
  fetchColumns: (boardId: string) => Promise<void>;
  createColumn: (columnData: { boardId: string; name: string; position: string }) => Promise<void>;

  // Cards Actions
  fetchCards: (columnId: string) => Promise<void>;
  createCard: (cardData: { columnId: string; title: string; content: string; position: string }) => Promise<void>;

  // Real-time State Mutators (Fired via WebSocket Inbound Gateway events)
  syncAddColumn: (column: Column) => void;
  syncAddCard: (card: Card) => void;
}

export const useBoardStore = create<BoardState & BoardActions>((set, get) => ({
  boards: [],
  currentBoard: null,
  columns: [],
  cards: {},
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  setCurrentBoard: (board) => set({ currentBoard: board }),

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/boards');
      set({ boards: response.data.data.boards, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch boards' });
    }
  },

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
      // Sort columns based on position parameter metadata index
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
      // We don't manually push here because the server will broadcast column_created via WS
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to deploy column lane' });
      throw err;
    }
  },

  // GET /api/cards/:columnId
  fetchCards: async (columnId) => {
    try {
      const response = await axiosInstance.get(`/cards/${columnId}`);
      const sortedCards = response.data.data.cards.sort((a: Card, b: Card) => Number(a.position) - Number(b.position));
      set((state) => ({
        cards: {
          ...state.cards,
          [columnId]: sortedCards,
        },
      }));
    } catch (err: any) {
      console.error(`Failed to stream cards parameters for lane ${columnId}`, err);
    }
  },

  // POST /api/cards
  createCard: async (cardData) => {
    try {
      await axiosInstance.post('/cards', cardData);
      // Handled via real-time socket listeners broadcast loop
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to inject card matrix' });
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
}));
