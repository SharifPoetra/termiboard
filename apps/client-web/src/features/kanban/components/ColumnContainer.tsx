import React, { useEffect, useState } from 'react';
import { Column, Card } from '@termiboard/core';
import { useBoardStore } from '../../../store/boardStore';
import { CardItem } from './CardItem';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Plus, PlusCircle, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ColumnContainerProps {
  column: Column;
  localCards?: Card[];
}

export const ColumnContainer: React.FC<ColumnContainerProps> = ({ column, localCards }) => {
  if (!column) return null;

  const { cards, fetchCards, createCard, updateColumn, deleteColumn } = useBoardStore();

  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardContent, setCardContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // dnd-kit droppable connection to make this column container targetable by dragged items
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      columnId: column.id,
    },
  });

  // Sync internal input state whenever column name is mutated from external WS stream
  useEffect(() => {
    setColumnName(column.name);
  }, [column.name]);

  useEffect(() => {
    if (column.id && !useBoardStore.getState().cards[column.id]) {
      fetchCards(column.id);
    }
  }, [column.id]);

  const columnCards = localCards || cards[column.id] || [];

  // Extract clean array of primitive IDs required by SortableContext strategy to map items correctly
  const cardIds = columnCards.map((c) => c.id);

  const handleUpdateColumnName = async () => {
    if (!columnName.trim() || columnName === column.name) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateColumn(column.id, { name: columnName });
    } catch (err) {
      console.error('Failed to update column name', err);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleAddCard = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const nextPosition = String(columnCards.length + 1);
      await createCard({
        columnId: column.id,
        title: cardTitle,
        content: cardContent,
        position: nextPosition,
      });
      setCardTitle('');
      setCardContent('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create task card', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumnClick = () => {
    setIsConfirmOpen(true);
  };

  const handleExecuteDeleteColumn = async () => {
    try {
      await deleteColumn(column.id);
    } catch (err) {
      console.error('Column deletion failed', err);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="bg-slate-900 border border-slate-800 rounded flex flex-col max-h-[75vh] w-72 sm:w-80 shrink-0 shadow-md font-mono"
    >
      {/* COLUMN HEADER CONTROLS */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
          <span className="text-emerald-500 font-bold text-xs shrink-0">&gt;</span>
          {isEditingTitle ? (
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onBlur={handleUpdateColumnName}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateColumnName()}
              className="bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs font-bold text-slate-100 uppercase focus:outline-none w-full"
              autoFocus
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-bold uppercase tracking-widest text-slate-300 truncate cursor-pointer hover:text-emerald-400 flex items-center gap-1 min-w-0"
              title="Click to rename column"
            >
              <span className="truncate">{column.name}</span>
            </h3>
          )}
          <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
            {columnCards.length}
          </span>
        </div>

        <button
          onClick={handleDeleteColumnClick}
          className="text-slate-500 hover:text-red-400 p-1 bg-transparent border-none cursor-pointer transition-colors shrink-0"
          title="Delete Column"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* TASK CARDS STREAM LIST */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar bg-slate-900/30">
        <SortableContext id={column.id} items={cardIds} strategy={verticalListSortingStrategy}>
          {columnCards.map((card: Card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>

        {columnCards.length === 0 && !isAdding && (
          <p className="text-[10px] text-slate-600 text-center py-4 uppercase tracking-wider">[ Column Empty ]</p>
        )}

        {/* INLINE CARD CREATION FORM */}
        {isAdding && (
          <form
            onSubmit={handleAddCard}
            className="bg-slate-950 border border-emerald-500/30 p-3 rounded space-y-2 shadow-inner"
          >
            <input
              type="text"
              placeholder="Task title..."
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
              disabled={isSubmitting}
            />
            <textarea
              placeholder="Task description..."
              value={cardContent}
              onChange={(e) => setCardContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors h-14 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-[10px] uppercase bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
                disabled={isSubmitting || !cardTitle.trim()}
              >
                <Plus size={10} /> Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FOOTER ACTION CONTROL */}
      {!isAdding && (
        <div className="p-2 border-t border-slate-800/40 bg-slate-900/50">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-1.5 rounded border border-dashed border-slate-800 hover:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 bg-transparent cursor-pointer transition-colors"
          >
            <PlusCircle size={12} /> Add Task Card
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Column"
        message={`Are you sure you want to delete the column "${column.name}"? This action will permanently remove all task cards inside it.`}
        onConfirm={handleExecuteDeleteColumn}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
