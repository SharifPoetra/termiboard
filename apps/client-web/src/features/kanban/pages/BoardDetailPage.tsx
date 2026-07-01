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
    syncUpdateCard,
    syncDeleteCard,
  } = useBoardStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // State and ref tracking for the mobile action dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Guard flag to temporarily ignore incoming echo reflections from WS during local dragging
  const isLocallyDragging = useRef(false);

  // Isolate native clicks and text selections from mobile/pointer panning gestures
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

  const onBackToDashboardRef = useRef(onBackToDashboard);
  useEffect(() => {
    onBackToDashboardRef.current = onBackToDashboard;
  }, [onBackToDashboard]);

  // Intercept click signals outside the viewport boundaries to close the dropdown
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

  // Secure real-time WebSocket event broker stream gateway
  useEffect(() => {
    if (!socket) return;

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
      syncUpdateCard(payload);
    });

    socket.on('card_moved', (payload) => {
      if (isLocallyDragging.current) return;
      console.log('[WS_STREAM] Incoming frame payload: card_moved');
      syncUpdateCard(payload);
    });

    socket.on('card_deleted', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_deleted');
      syncDeleteCard(payload);
    });

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
    };
  }, [socket, syncAddColumn, syncUpdateColumn, syncDeleteColumn, syncAddCard, syncUpdateCard, syncDeleteCard]);

  const handleDeleteBoardClick = () => {
    setIsConfirmOpen(true);
    setDropdownOpen(false); // Close dropdown upon triggering modal
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);

    let activeColumnId: string | null = null;
    Object.keys(cards).forEach((colId) => {
      if (cards[colId].some((c) => c.id === cardId)) {
        activeColumnId = colId;
      }
    });

    let overColumnId: string | null = overId;
    if (!columns.some((col) => col.id === overId)) {
      Object.keys(cards).forEach((colId) => {
        if (cards[colId].some((c) => c.id === overId)) {
          overColumnId = colId;
        }
      });
    }

    // Only update state if card crosses lanes to prevent infinite loop crashes inside the same column
    if (activeColumnId && overColumnId && activeColumnId !== overColumnId) {
      moveCard(cardId, overId);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);
    isLocallyDragging.current = false;
    if (!over) return;

    const cardId = String(active.id);
    const targetId = String(over.id);

    // Resolve the target column ID whether dropped over a column area or a card object
    let finalColumnId = targetId;
    if (!cards[targetId]) {
      Object.keys(cards).forEach((colId) => {
        if (cards[colId].some((c) => c.id === targetId)) {
          finalColumnId = colId;
        }
      });
    }

    // Always trigger local mutation to sync layout states first
    moveCard(cardId, targetId);

    // Fetch snapshot of the freshly mutated track directly from state
    const currentList = useBoardStore.getState().cards[finalColumnId] || [];

    // Locate the exact physical placement index where the card ended up
    const finalIndex = currentList.findIndex((c) => c.id === cardId);

    if (finalIndex !== -1) {
      const prevCard = currentList[finalIndex - 1];
      const nextCard = currentList[finalIndex + 1];

      // Take the string position value as the upper/lower bound rank
      const prevRank = prevCard ? prevCard.position : null;
      const nextRank = nextCard ? nextCard.position : null;
      try {
        await persistCardPosition(cardId, finalColumnId, prevRank, nextRank);
      } catch (err) {
        console.error('Database sync deferred:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30 overflow-x-auto">
      {/* DASHBOARD WORKSPACE HEADER NAVBAR */}
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

            {/* HIDDEN ON MOBILE: Desktop individual button array actions */}
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
          {/* HIDDEN ON MOBILE: Desktop invite collaborator trigger */}
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

          {/* MOBILE ACTION DROPDOWN: Aggregates Invite, Edit, and Delete in responsive viewports */}
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

      {/* HORIZONTAL BOARD GRID RUNTIME PANELS */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <main className="flex-1 p-4 md:p-6 overflow-x-auto flex items-start gap-4 custom-scrollbar select-none">
          {columns.map((column) => (
            <ColumnContainer key={column.id} column={column} />
          ))}

          {/* COMPONENT CREATION FOR NEW COLUMNS */}
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
