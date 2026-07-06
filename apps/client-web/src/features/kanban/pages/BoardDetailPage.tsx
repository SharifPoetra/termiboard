import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useBoardStore } from '../../../store/boardStore';
import { useSocket } from '../../../hooks/useSocket';
import { ColumnContainer } from '../components/ColumnContainer';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditBoardModal } from '../../../components/ui/EditBoardModal';
import { InviteUserModal } from '../../../components/ui/InviteUserModal';
import { BoardMembersModal } from '../../../components/ui/BoardMembersModal';
import { CardItem } from '../components/CardItem';
import { Card } from '@termiboard/core';
import {
  ArrowLeft,
  Plus,
  Terminal,
  LayoutGrid,
  Edit2,
  Trash2,
  UserPlus,
  MoreVertical,
  LogOut,
  Users,
} from 'lucide-react';

import { DragDropProvider, DragOverlay, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/react';
import { PointerSensor } from '@dnd-kit/dom';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { move } from '@dnd-kit/helpers';

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  if (!boardId) return null; // Should be caught by route

  const {
    columns,
    cards,
    currentBoard,
    boards,
    deleteBoard,
    kickMember,
    setCurrentBoard,
    fetchColumns,
    createColumn,
    updateBoard,
    persistCardPosition,
    syncUpdateBoard,
    syncAddColumn,
    syncUpdateColumn,
    syncDeleteColumn,
    syncAddCard,
    syncUpdateCards,
    syncDeleteCard,
  } = useBoardStore();

  const { user } = useAuthStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [persistingCardId, setPersistingCardId] = useState<string | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Draft state for drag preview to avoid Zustand re-renders during drag
  const [localCards, setLocalCards] = useState<Record<string, Card[]>>(() => useBoardStore.getState().cards);
  const localCardsRef = useRef(localCards);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pendingCardUpdatesRef = useRef<Map<string, Card>>(new Map());
  const pendingCardUpdateFrameRef = useRef<number | null>(null);
  const dragSnapshotRef = useRef<Record<string, Card[]>>({});

  // Block WS updates while dragging locally
  const isLocallyDragging = useRef(false);

  const findCardColumnId = (cardGroups: Record<string, Card[]>, cardId: string) =>
    Object.entries(cardGroups).find(([, columnCards]) => columnCards.some((card) => card.id === cardId))?.[0] ?? null;

  // Delay drag start to preserve scroll on touch devices
  const sensors = [
    PointerSensor.configure({
      activationConstraints: [
        new PointerActivationConstraints.Delay({
          value: 250,
          tolerance: 5,
        }),
      ],
    }),
  ];

  useEffect(() => {
    fetchColumns(boardId);
  }, [boardId, fetchColumns]);

  useEffect(() => {
    const active = boards.find((b) => b.id === boardId) || null;
    setCurrentBoard(active);
  }, [boardId, boards, setCurrentBoard]);

  useEffect(() => {
    localCardsRef.current = localCards;
  }, [localCards]);

  // Sync local cards from store unless dragging
  useEffect(() => {
    if (isLocallyDragging.current) return;
    setLocalCards(cards);
  }, [cards]);

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

  // WebSocket listeners
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

    socket.on('member_kicked', (payload: { boardId: string; userId: string }) => {
      if (payload.userId === user?.id) {
        console.log('[WS_STREAM] You have been kicked from the board. Evacuating...');
        sessionStorage.setItem('TERMINAL_EVAC_SIGNAL', 'true');
        navigate('/dashboard');
      }
    });

    socket.on('member_left', (_payload: { boardId: string; userId: string }) => {
      console.log('[WS_STREAM] A member has left the board');
      // Optional: refresh board list or update UI
    });

    socket.on('board_updated', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: board_updated');
      syncUpdateBoard(payload);
    });

    socket.on('board_deleted', () => {
      console.log('[WS_STREAM] Parent board was purged. Evacuating...');
      sessionStorage.setItem('TERMINAL_EVAC_SIGNAL', 'true');
      navigate('/dashboard');
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

    return () => {
      socket.off('board_updated');
      socket.off('board_deleted');
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
  }, [
    socket,
    syncUpdateBoard,
    syncAddColumn,
    syncUpdateColumn,
    syncDeleteColumn,
    syncAddCard,
    syncUpdateCards,
    syncDeleteCard,
    navigate,
  ]);

  const EMPTY_CARDS: Card[] = [];

  const handleDeleteBoardClick = () => {
    setIsConfirmOpen(true);
    setDropdownOpen(false);
  };

  const handleExecuteUpdateBoard = async (name: string, description: string) => {
    try {
      await updateBoard(boardId, { name, description });
    } catch (err) {
      console.error('Board update failed', err);
    } finally {
      setEditModalOpen(false);
    }
  };

  const handleExecuteDeleteBoard = async () => {
    try {
      await deleteBoard(boardId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Board delete failed', err);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleLeaveBoard = async () => {
    if (!user?.id) return;
    try {
      await kickMember(boardId, user.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Leave board failed', err);
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
      console.error('Create column failed', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    isLocallyDragging.current = true;
    dragSnapshotRef.current = useBoardStore.getState().cards;

    const cardId = String(event.operation.source?.id);
    const foundCard =
      Object.values(cards)
        .flat()
        .find((c) => c.id === cardId) || null;
    setActiveCard(foundCard);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation;
    if (!target) return;

    const cardId = String(source?.id);
    const overId = String(target.id);
    if (cardId === overId) return;

    const activeColumnId = String(source?.data?.columnId || '');
    const overColumnId = target.data?.type === 'Column' ? overId : String(target.data?.columnId);
    if (!activeColumnId || !overColumnId) return;

    setLocalCards((prev) => {
      const currentColumnId = findCardColumnId(prev, cardId) ?? activeColumnId;
      const sourceCards = prev[currentColumnId] || [];
      const cardToMove = sourceCards.find((c) => c.id === cardId);
      if (!cardToMove) return prev;

      if (currentColumnId !== overColumnId) {
        const newSource = sourceCards.filter((c) => c.id !== cardId);
        const targetCards = prev[overColumnId] || [];
        const cardWithNewCol = { ...cardToMove, columnId: overColumnId };

        if (target.data?.type === 'Column') {
          return {
            ...prev,
            [currentColumnId]: newSource,
            [overColumnId]: [...targetCards.filter((c) => c.id !== cardId), cardWithNewCol],
          };
        }

        const baseTarget = [...targetCards.filter((c) => c.id !== cardId), cardWithNewCol];
        const newTarget = move(baseTarget, event);
        return { ...prev, [currentColumnId]: newSource, [overColumnId]: newTarget };
      }

      const newCards = move(sourceCards, event);
      return { ...prev, [currentColumnId]: newCards };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { source, target } = event.operation;
    setActiveCard(null);
    isLocallyDragging.current = false;

    if (event.canceled || !target) {
      setLocalCards(dragSnapshotRef.current);
      return;
    }

    const cardId = String(source?.id);
    const targetColumnId = target.data?.type === 'Column' ? String(target.id) : String(target.data?.columnId);

    const finalList = localCardsRef.current[targetColumnId] || [];
    const finalIndex = finalList.findIndex((c) => c.id === cardId);
    const prevCard = finalList[finalIndex - 1];
    const nextCard = finalList[finalIndex + 1];

    useBoardStore.setState({ cards: localCardsRef.current });
    setPersistingCardId(cardId);

    try {
      await persistCardPosition(cardId, targetColumnId, prevCard?.position ?? null, nextCard?.position ?? null);
    } catch (err) {
      console.error('Persist failed, rollback', err);
      useBoardStore.setState({ cards: dragSnapshotRef.current });
      setLocalCards(dragSnapshotRef.current);
    } finally {
      setPersistingCardId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30 overflow-x-auto">
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
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
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="hidden md:inline-block text-slate-500 hover:text-amber-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
              title="Leave Board"
            >
              <LogOut size={11} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="hidden md:flex bg-slate-950 border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 px-2.5 py-1 rounded text-xs items-center gap-1.5 transition-all duration-150 cursor-pointer uppercase font-bold"
          >
            <UserPlus size={12} />
            <span>Invite</span>
          </button>
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="hidden md:flex bg-slate-950 border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 px-2.5 py-1 rounded text-xs items-center gap-1.5 transition-all duration-150 cursor-pointer uppercase font-bold"
          >
            <Users size={12} />
            <span>Members</span>
          </button>
          <div className="text-[10px] text-emerald-400 bg-slate-950 border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm shrink-0">
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
                    setDropdownOpen(false);
                    setIsMembersModalOpen(true);
                  }}
                  className="w-full px-3 py-2.5 text-left text-slate-300 hover:text-cyan-400 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-850"
                >
                  <Users size={12} />
                  <span>View Members</span>
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
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsLeaveModalOpen(true);
                  }}
                  className="w-full px-3 py-2.5 text-left text-amber-400 hover:text-amber-300 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-850"
                >
                  <LogOut size={11} />
                  <span>Leave Board</span>
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

      <DragDropProvider
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main
          style={{ touchAction: 'pan-x pan-y' }}
          className="flex-1 p-4 md:p-6 overflow-x-auto flex items-start gap-4 custom-scrollbar select-none"
        >
          {columns.map((column) => {
            const columnCards = localCards[column.id] ?? EMPTY_CARDS;
            return (
              <ColumnContainer
                key={column.id}
                column={column}
                localCards={columnCards}
                persistingCardId={persistingCardId}
              />
            );
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
      </DragDropProvider>
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
      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="Leave Board"
        message="Are you sure you want to leave this board? You will be removed from the member list."
        onConfirm={handleLeaveBoard}
        onCancel={() => setIsLeaveModalOpen(false)}
      />
      <BoardMembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} boardId={boardId!} />
    </div>
  );
};
