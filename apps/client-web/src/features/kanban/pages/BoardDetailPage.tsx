import React, { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { useSocket } from '../../../hooks/useSocket';
import { ColumnContainer } from '../components/ColumnContainer';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditBoardModal } from '../../../components/ui/EditBoardModal';
import { InviteUserModal } from '../../../components/ui/InviteUserModal';
import { CardItem } from '../components/CardItem';
import { Card } from '@termiboard/core';
import { ArrowLeft, Plus, Terminal, LayoutGrid, Edit2, Trash2, UserPlus, MoreVertical } from 'lucide-react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core';

interface BoardDetailPageProps {
  boardId: string;
  onBackToDashboard: () => void;
}

export const BoardDetailPage: React.FC<BoardDetailPageProps> = ({ boardId, onBackToDashboard }) => {
  const {
    columns,
    cards,
    currentBoard,
    boards,
    deleteBoard,
    setCurrentBoard,
    fetchColumns,
    createColumn,
    updateBoard,
    moveCard,
    persistCardPosition,
    syncUpdateBoard,
    syncAddColumn,
    syncUpdateColumn,
    syncDeleteColumn,
    syncAddCard,
    syncUpdateCards,
    syncDeleteCard,
  } = useBoardStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Transient state for drag animations to prevent infinite render loops from Zustand dispatches
  const [localCards, setLocalCards] = useState<Record<string, Card[]>>(() => useBoardStore.getState().cards);
  const localCardsRef = useRef(localCards);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pendingCardUpdatesRef = useRef<Map<string, Card>>(new Map());
  const pendingCardUpdateFrameRef = useRef<number | null>(null);

  // Guard flag to block incoming WebSocket updates during local dragging calculations
  const isLocallyDragging = useRef(false);

  const findCardColumnId = (cardGroups: Record<string, Card[]>, cardId: string) =>
    Object.entries(cardGroups).find(([, columnCards]) => columnCards.some((card) => card.id === cardId))?.[0] ?? null;

  // Delay gesture activation to preserve native mobile/pointer scroll and text selection
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  useEffect(() => {
    fetchColumns(boardId);
  }, [boardId, fetchColumns]);

  useEffect(() => {
    const active = boards.find((b) => b.id === boardId) || null;
    setCurrentBoard(active);
  }, [boardId, boards, setCurrentBoard]);

  // Re-sync local view only on mounting or external stream updates, ignored while dragging
  useEffect(() => {
    localCardsRef.current = localCards;
  }, [localCards]);

  useEffect(() => {
    if (isLocallyDragging.current) return;
    setLocalCards(cards);
  }, [cards]);

  const onBackToDashboardRef = useRef(onBackToDashboard);
  useEffect(() => {
    onBackToDashboardRef.current = onBackToDashboard;
  }, [onBackToDashboard]);

  // Collapse responsive action menu when clicking outside boundaries
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const socket = useSocket({ boardId });

  // Real-time WebSocket event pipeline listener
  useEffect(() => {
    if (!socket) return;
    const pendingCardUpdates = pendingCardUpdatesRef.current;

    const queueCardUpdate = (card: Card) => {
      pendingCardUpdates.set(card.id, card);
      if (pendingCardUpdateFrameRef.current !== null) return;

      pendingCardUpdateFrameRef.current = requestAnimationFrame(() => {
        pendingCardUpdateFrameRef.current = null;
        const pendingCards = Array.from(pendingCardUpdates.values());
        pendingCardUpdates.clear();
        syncUpdateCards(pendingCards);
      });
    };

    console.log('[DEBUG] Registering listeners on socket id:', socket.id);
    console.log('[DEBUG] card_moved listener count BEFORE:', socket.listeners('card_moved').length);

    socket.on('board_updated', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: board_updated');
      syncUpdateBoard(payload);
    });

    socket.on('board_deleted', () => {
      console.log('[WS_STREAM] Parent board was purged. Evacuating...');
      sessionStorage.setItem('TERMINAL_EVAC_SIGNAL', 'true');
      onBackToDashboardRef.current();
    });

    socket.on('column_created', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: column_created');
      syncAddColumn(payload);
    });

    socket.on('column_updated', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: column_updated');
      syncUpdateColumn(payload);
    });

    socket.on('column_deleted', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: column_deleted');
      syncDeleteColumn(payload.id);
    });

    socket.on('card_created', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_created');
      syncAddCard(payload);
    });

      socket.on('card_updated', (payload) => {
        if (isLocallyDragging.current) return;
        console.log('[WS_STREAM] Incoming frame payload: card_updated');
      queueCardUpdate(payload);
    });

    socket.on('card_moved', (payload) => {
      if (isLocallyDragging.current) return;
      console.log('[WS_STREAM] Incoming frame payload: card_moved');
      queueCardUpdate(payload);
    });

    socket.on('card_deleted', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_deleted');
      syncDeleteCard(payload);
    });

    console.log('[DEBUG] card_moved listener count AFTER:', socket.listeners('card_moved').length);
    return () => {
      socket.off('board_deleted');
      socket.off('board_updated');
      socket.off('column_created');
      socket.off('column_updated');
      socket.off('column_deleted');
      socket.off('card_created');
      socket.off('card_updated');
      socket.off('card_moved');
      socket.off('card_deleted');
      if (pendingCardUpdateFrameRef.current !== null) {
        cancelAnimationFrame(pendingCardUpdateFrameRef.current);
        pendingCardUpdateFrameRef.current = null;
        pendingCardUpdates.clear();
      }
    };
  }, [socket, syncUpdateBoard, syncAddColumn, syncUpdateColumn, syncDeleteColumn, syncAddCard, syncUpdateCards, syncDeleteCard]);

  const EMPTY_CARDS: Card[] = [];

  const handleDeleteBoardClick = () => {
    setIsConfirmOpen(true);
    setDropdownOpen(false);
  };

  const handleExecuteUpdateBoard = async (name: string, description: string) => {
    try {
      await updateBoard(boardId, { name, description });
    } catch (err) {
      console.error('Board edit aborted', err);
    } finally {
      setEditModalOpen(false);
    }
  };

  const handleExecuteDeleteBoard = async () => {
    try {
      await deleteBoard(boardId);
      onBackToDashboard();
    } catch (err) {
      console.error('Board elimination aborted', err);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleCreateColumn = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    try {
      const nextPosition = String(columns.length + 1);
      await createColumn({ boardId, name: newColumnName, position: nextPosition });
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (err) {
      console.error('Failed to append new lane sequence', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    isLocallyDragging.current = true;
    const cardId = String(event.active.id);
    let foundCard: Card | null = null;

    Object.keys(cards).forEach((colId) => {
      const target = cards[colId].find((c) => c.id === cardId);
      if (target) foundCard = target;
    });

    setActiveCard(foundCard);
  };

  // Rearrange local state instantly to trigger visual shifts without hitting Zustand store mid-flight
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);
    if (cardId === overId) return;

    const activeColumnId = String(active.data.current?.sortable?.containerId || active.data.current?.columnId || '');

    let overColumnId: string | null = null;
    if (over.data.current?.type === 'Column') {
      overColumnId = overId;
    } else if (over.data.current?.type === 'Card') {
      overColumnId = String(over.data.current.columnId);
    }

    if (!activeColumnId || !overColumnId) return;

    setLocalCards((prev) => {
      const currentColumnId = findCardColumnId(prev, cardId) ?? activeColumnId;
      const sourceCards = prev[currentColumnId] || [];
      const targetCards = prev[overColumnId!] || [];
      const cardToMove = sourceCards.find((c) => c.id === cardId);
      if (!cardToMove) return prev;

      if (currentColumnId !== overColumnId) {
        const cleanSource = sourceCards.filter((c) => c.id !== cardId);
        const mutableTarget = targetCards.filter((c) => c.id !== cardId);
        let targetIndex = mutableTarget.findIndex((c) => c.id === overId);
        if (targetIndex === -1) targetIndex = mutableTarget.length;

        mutableTarget.splice(targetIndex, 0, { ...cardToMove, columnId: overColumnId });
        return { ...prev, [currentColumnId]: cleanSource, [overColumnId!]: mutableTarget };
      } else {
        const currentIndex = sourceCards.findIndex((c) => c.id === cardId);
        const targetIndex = sourceCards.findIndex((c) => c.id === overId);
        if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) return prev;

        const mutableCards = [...sourceCards];
        const [movedCard] = mutableCards.splice(currentIndex, 1);
        mutableCards.splice(targetIndex, 0, movedCard);
        return { ...prev, [activeColumnId]: mutableCards };
      }
    });
  };

  // Run single atomic commit on element release: Sync Zustand state, recalculate Lexorank, flush to backend
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    isLocallyDragging.current = false;

    if (!over) {
      setLocalCards(useBoardStore.getState().cards);
      return;
    }

    const cardId = String(active.id);
    const targetId = String(over.id);
    const sourceColumnId = findCardColumnId(useBoardStore.getState().cards, cardId) ?? String(active.data.current?.columnId ?? '');

    let targetColumnId = sourceColumnId;
    if (over.data.current?.type === 'Column') {
      targetColumnId = targetId;
    } else if (over.data.current?.type === 'Card') {
      targetColumnId = String(over.data.current.columnId);
    }

    moveCard(cardId, targetId, sourceColumnId, targetColumnId);

    const currentList = localCardsRef.current[targetColumnId] || [];
    const finalIndex = currentList.findIndex((c) => c.id === cardId);

    if (finalIndex !== -1) {
      const prevCard = currentList[finalIndex - 1];
      const nextCard = currentList[finalIndex + 1];
      try {
        await persistCardPosition(cardId, targetColumnId, prevCard?.position ?? null, nextCard?.position ?? null);
      } catch (err) {
        console.error('Database sync deferred:', err);
        setLocalCards(useBoardStore.getState().cards);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30 overflow-x-auto">
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="text-emerald-400 animate-pulse shrink-0" size={18} />
            <span className="text-xs md:text-sm font-bold text-slate-200 truncate tracking-wide flex items-center gap-2">
              BOARD // {currentBoard ? currentBoard.name : `${boardId.substring(0, 8)}...`}
            </span>

            <button
              onClick={() => setEditModalOpen(true)}
              className="hidden md:inline-block text-slate-500 hover:text-cyan-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
              title="Edit Board"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={handleDeleteBoardClick}
              className="hidden md:inline-block text-slate-500 hover:text-cyan-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
              title="Delete Board"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="hidden md:flex bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 px-2.5 py-1 rounded text-xs items-center gap-1.5 transition-all duration-150 cursor-pointer uppercase font-bold"
          >
            <UserPlus size={12} />
            <span>Invite</span>
          </button>

          <div className="text-[10px] text-emerald-400 bg-slate-950 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE SYNC</span>
          </div>

          <div className="relative md:hidden" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <MoreVertical size={14} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded shadow-xl z-50 overflow-hidden text-[11px]">
                <button
                  onClick={() => {
                    setInviteModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-slate-300 hover:text-emerald-400 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors"
                >
                  <UserPlus size={12} />
                  <span>Invite User</span>
                </button>
                <button
                  onClick={() => {
                    setEditModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-slate-300 hover:text-cyan-400 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-850"
                >
                  <Edit2 size={11} />
                  <span>Edit Board</span>
                </button>
                <button
                  onClick={handleDeleteBoardClick}
                  className="w-full px-3 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-850"
                >
                  <Trash2 size={11} />
                  <span>Delete Board</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={(args) => {
          // Smart intersection fallback when component centers misalign during rapid sweeping movements
          const defaultCollisions = rectIntersection(args);
          if (defaultCollisions.length > 0) return defaultCollisions;
          return pointerWithin(args);
        }}
      >
        <main className="flex-1 p-4 md:p-6 overflow-x-auto flex items-start gap-4 custom-scrollbar select-none">
          {columns.map((column) => {
            const columnCards = localCards[column.id] ?? EMPTY_CARDS;
            return <ColumnContainer key={column.id} column={column} localCards={columnCards} />;
          })}

          <div className="w-72 sm:w-80 shrink-0">
            {isAddingColumn ? (
              <form
                onSubmit={handleCreateColumn}
                className="bg-slate-900 border border-emerald-500/20 p-4 rounded space-y-3 shadow-lg"
              >
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">
                    Column Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., In Progress"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2 justify-end text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer px-2 py-1 uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded cursor-pointer transition-colors uppercase flex items-center gap-1"
                    disabled={!newColumnName.trim()}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full py-4 rounded border border-dashed border-slate-800 hover:border-emerald-500/20 bg-slate-900/20 hover:bg-slate-900/60 text-xs text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 uppercase tracking-wider"
              >
                <LayoutGrid size={14} /> [ Add Column ]
              </button>
            )}
          </div>
        </main>
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard ? (
            <div className="opacity-80 scale-105 rotate-1 transform transition-transform cursor-grabbing w-72 sm:w-80">
              <CardItem card={activeCard} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Board"
        message="Are you sure you want to permanently delete this board? This will delete all columns and cards inside it."
        onConfirm={handleExecuteDeleteBoard}
        onCancel={() => setIsConfirmOpen(false)}
      />
      <EditBoardModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={currentBoard ? { name: currentBoard.name, description: currentBoard.description || '' } : null}
        onConfirm={handleExecuteUpdateBoard}
      />
      <InviteUserModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} boardId={boardId} />
    </div>
  );
};
