import React, { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { useSocket } from '../../../hooks/useSocket';
import { ColumnContainer } from '../components/ColumnContainer';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditBoardModal } from '../../../components/ui/EditBoardModal';
import { ArrowLeft, Plus, Terminal, LayoutGrid, Edit2, Trash2 } from 'lucide-react';

interface BoardDetailPageProps {
  boardId: string;
  onBackToDashboard: () => void;
}

export const BoardDetailPage: React.FC<BoardDetailPageProps> = ({ boardId, onBackToDashboard }) => {
  const {
    columns,
    currentBoard,
    boards,
    deleteBoard,
    setCurrentBoard,
    fetchColumns,
    createColumn,
    updateBoard,
    syncUpdateBoard,
    syncAddColumn,
    syncUpdateColumn,
    syncDeleteColumn,
    syncAddCard,
    syncUpdateCard,
    syncDeleteCard,
  } = useBoardStore();

  // Structural control states for modals
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

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

  // Establish isolated secure websocket infrastructure gateway
  const socket = useSocket(boardId);

  // Real-time synchronization event broker pipeline loop
  useEffect(() => {
    if (!socket) return;

    socket.on('board_updated', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: board_updated');
      const boardData = payload?.board || payload;
      syncUpdateBoard(boardData);
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
      const colData = payload?.column || payload;
      syncUpdateColumn(colData);
    });

    socket.on('column_deleted', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: column_deleted');
      const deletedColumnId = payload?.column?.id || payload?.id || payload;
      if (deletedColumnId) {
        syncDeleteColumn(deletedColumnId);
      }
    });

    socket.on('card_created', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_created');
      syncAddCard(payload);
    });

    socket.on('card_updated', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_updated');
      const cardData = payload?.card || payload;
      syncUpdateCard(cardData);
    });

    socket.on('card_moved', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_moved');
      const cardData = payload?.card || payload;
      syncUpdateCard(cardData); // Reuse update mutator for re-positioning
    });

    socket.on('card_deleted', (payload) => {
      console.log('[WS_STREAM] Incoming frame payload: card_deleted');
      const deletedCard = payload?.card || payload;
      if (deletedCard) {
        syncDeleteCard(deletedCard);
      }
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

  // Swapped browser prompt with local component state trigger
  const handleDeleteBoardClick = () => {
    setIsConfirmOpen(true);
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

  // Executes the real pipeline erasure sequence once verified inside the custom alert window
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
            <button
              onClick={() => setEditModalOpen(true)}
              className="text-slate-500 hover:text-cyan-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
              title="Edit Board"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={handleDeleteBoardClick}
              className="text-slate-500 hover:text-cyan-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
              title="Delete Board"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] text-emerald-400 bg-slate-950 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE SYNC</span>
          </div>
        </div>
      </header>

      {/* HORIZONTAL BOARD GRID RUNTIME PANELS */}
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
    </div>
  );
};
