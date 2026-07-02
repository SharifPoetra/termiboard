import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import { Board, Card, Column } from '@termiboard/core';

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
  updateBoard: (boardId: string, boardData: { name?: string; description?: string }) => Promise<void>;
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

  // Drag and Drop Internal Handler
  moveCard: (cardId: string, targetId: string, sourceColumnId: string, targetColumnId: string) => void;
  persistCardPosition: (
    cardId: string,
    targetColumnId: string,
    prevRank: string | null,
    nextRank: string | null,
  ) => Promise<void>;

  // Real-time WS Sync Mutators
  syncUpdateBoard: (board: Board) => void;
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

  // PATCH /api/boards/:id
  updateBoard: async (boardId, boardData) => {
    try {
      const response = await axiosInstance.patch(`/boards/${boardId}`, boardData);
      const updatedBoard = response.data.data.board;

      set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
        currentBoard: state.currentBoard?.id === boardId ? updatedBoard : state.currentBoard,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to modify board parameters' });
      throw err;
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
      const sortedCards = response.data.data.cards.sort((a: Card, b: Card) => a.position.localeCompare(b.position));
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

  // Local state mutator for instant drag-and-drop feedback
  moveCard: (cardId, targetId, sourceColumnId, targetColumnId) => {
    set((state) => {
      const sourceCards = state.cards[sourceColumnId] || [];
      const targetCards = state.cards[targetColumnId] || [];

      const cardToMove = sourceCards.find((c) => c.id === cardId) || targetCards.find((c) => c.id === cardId);
      if (!cardToMove) return state;

      // Scenario 1: Intra-column movement (Same column boundary)
      if (sourceColumnId === targetColumnId) {
        const currentIndex = sourceCards.findIndex((c) => c.id === cardId);
        const targetIndex = sourceCards.findIndex((c) => c.id === targetId);

        if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) return state;

        const mutableCards = [...sourceCards];
        const [movedCard] = mutableCards.splice(currentIndex, 1);
        mutableCards.splice(targetIndex, 0, movedCard);

        return {
          cards: {
            ...state.cards,
            [sourceColumnId]: mutableCards,
          },
        };
      }

      // Scenario 2: Inter-column movement (Cross-column boundary dispatch)
      const cleanSource = sourceCards.filter((c) => c.id !== cardId);

      // Filter out the card if it already sneaked into the target slice via asynchronous updates
      const cleanTarget = targetCards.filter((c) => c.id !== cardId);
      const mutableTarget = [...cleanTarget];

      // Fallback to bottom append if target anchoring element is absent or matches container ID
      let crossTargetIndex = mutableTarget.findIndex((c) => c.id === targetId);
      if (crossTargetIndex === -1) {
        crossTargetIndex = mutableTarget.length;
      }

      const updatedCard = { ...cardToMove, columnId: targetColumnId };
      mutableTarget.splice(crossTargetIndex, 0, updatedCard);

      return {
        cards: {
          ...state.cards,
          [sourceColumnId]: cleanSource,
          [targetColumnId]: mutableTarget,
        },
      };
    });
  },

  // Database synchronization provider to persist final ordering matrix
  // PATCH /api/cards/:id
  persistCardPosition: async (cardId, targetColumnId, prevRank, nextRank) => {
    try {
      await axiosInstance.patch(`/cards/${cardId}`, {
        columnId: targetColumnId,
        prevRank,
        nextRank,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to persist drag positioning to database',
      });
      throw err;
    }
  },

  // --- Real-time WS Sync Mutators ---
  syncUpdateBoard: (updatedBoard) => {
    set((state) => ({
      boards: state.boards.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)),
      currentBoard: state.currentBoard?.id === updatedBoard.id ? updatedBoard : state.currentBoard,
    }));
  },

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
          [card.columnId]: [...columnCards, card].sort((a, b) => a.position.localeCompare(b.position)),
        },
      };
    });
  },

  syncUpdateCard: (updatedCard) => {
    set((state) => {
      const colId = updatedCard.columnId;
      const existing = state.cards[colId]?.find((c) => c.id === updatedCard.id);

      // Skip update if data is identical (prevents repeated re-rendering of duplicate events)
      if (existing && JSON.stringify(existing) === JSON.stringify(updatedCard)) {
        return state;
      }

      // Evacuate card if it shifted column paths externally via WS stream frames
      const nextCards = { ...state.cards };
      Object.keys(nextCards).forEach((cid) => {
        nextCards[cid] = nextCards[cid].filter((c) => c.id !== updatedCard.id);
      });
      const currentTrack = nextCards[colId] || [];
      nextCards[colId] = [...currentTrack, updatedCard].sort((a, b) => a.position.localeCompare(b.position));
      return { cards: nextCards };
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
