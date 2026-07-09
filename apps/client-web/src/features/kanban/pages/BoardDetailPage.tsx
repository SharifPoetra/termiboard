import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useBoardStore } from '../../../store/boardStore';
import { ColumnContainer } from '../components/ColumnContainer';
import { CardItem } from '../components/CardItem';
import { BoardHeader } from '../components/BoardHeader';
import { AddColumnForm } from '../components/AddColumnForm';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditBoardModal } from '../../../components/ui/EditBoardModal';
import { InviteUserModal } from '../../../components/ui/InviteUserModal';
import { BoardMembersModal } from '../../../components/ui/BoardMembersModal';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBoardSocket } from '../hooks/useBoardSocket';
import { Card } from '@termiboard/core';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import { LayoutGrid, Plus } from 'lucide-react';

export const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  if (!boardId) return null;

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
  } = useBoardStore();

  const { user } = useAuthStore();

  // Drag & drop hook
  const {
    localCards,
    setLocalCards,
    activeCard,
    persistingCardId,
    isLocallyDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragAndDrop(boardId);

  // WebSocket hook
  useBoardSocket(boardId, user?.id);

  // --- Modal & UI State ---
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Sensors configuration
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

  // Fetch columns on mount
  useEffect(() => {
    fetchColumns(boardId);
  }, [boardId, fetchColumns]);

  // Sync current board from boards list
  useEffect(() => {
    const active = boards.find((b) => b.id === boardId) || null;
    setCurrentBoard(active);
  }, [boardId, boards, setCurrentBoard]);

  // Sync local cards from store unless dragging
  useEffect(() => {
    if (isLocallyDragging.current) return;
    setLocalCards(cards);
  }, [cards, setLocalCards]);

  // --- Board Actions ---
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

  const EMPTY_CARDS: Card[] = [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30 overflow-x-auto">
      {/* Header */}
      <BoardHeader
        boardName={currentBoard?.name || ''}
        boardId={boardId}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setIsConfirmOpen(true)}
        onLeave={() => setIsLeaveModalOpen(true)}
        onInvite={() => setInviteModalOpen(true)}
        onMembers={() => setIsMembersModalOpen(true)}
      />

      {/* Kanban Board */}
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
          {columns.length === 0 ? (
            isAddingColumn ? (
              // Show form in center when adding first column
              <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
                <div className="w-72 sm:w-80">
                  <AddColumnForm
                    isAdding={isAddingColumn}
                    columnName={newColumnName}
                    onColumnNameChange={setNewColumnName}
                    onStartAdding={() => setIsAddingColumn(true)}
                    onCancel={() => setIsAddingColumn(false)}
                    onSubmit={handleCreateColumn}
                  />
                </div>
              </div>
            ) : (
              /* Empty board state */
              <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center space-y-4 max-w-sm">
                  <LayoutGrid className="text-slate-700 mx-auto" size={40} />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">// Board Empty</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This workspace has no columns yet. Create your first column to start organizing tasks.
                  </p>
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded text-xs uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    <Plus size={12} /> Add First Column
                  </button>
                </div>
              </div>
            )
          ) : (
            <>
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

              {/* Add Column */}
              <div className="w-72 sm:w-80 shrink-0">
                <AddColumnForm
                  isAdding={isAddingColumn}
                  columnName={newColumnName}
                  onColumnNameChange={setNewColumnName}
                  onStartAdding={() => setIsAddingColumn(true)}
                  onCancel={() => setIsAddingColumn(false)}
                  onSubmit={handleCreateColumn}
                />
              </div>
            </>
          )}
        </main>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard ? (
            <div className="opacity-80 scale-105 rotate-1 transform transition-transform cursor-grabbing w-72 sm:w-80">
              <CardItem card={activeCard} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>

      {/* Modals */}
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
