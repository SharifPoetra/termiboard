import React, { useEffect, useState } from 'react';
import { Column, Card } from '../types/kanban.types'; // Added Card import type explicitly
import { useBoardStore } from '../../../store/boardStore';
import { CardItem } from './CardItem';
import { Plus, PlusCircle, Trash2, X } from 'lucide-react';

interface ColumnContainerProps {
  column: Column;
}

export const ColumnContainer: React.FC<ColumnContainerProps> = ({ column }) => {
  if (!column) return null;

  const { cards, fetchCards, createCard, deleteColumn, deleteCard } = useBoardStore();
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardContent, setCardContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (column.id) {
      fetchCards(column.id);
    }
  }, [column.id, fetchCards]);

  const columnCards = cards[column.id] || [];

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
      console.error('Failed to inject new matrix card', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (window.confirm(`Execute terminal purge on lane: "${column.name}"?`)) {
      try {
        await deleteColumn(column.id);
      } catch (err) {
        console.error('Purge execution failed', err);
      }
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Purge selected card matrix object?')) {
      try {
        await deleteCard(cardId);
      } catch (err) {
        console.error('Card deletion failed', err);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded flex flex-col max-h-[75vh] w-72 sm:w-80 shrink-0 shadow-md font-mono">
      {/* COLUMN HEADER CONTROLS */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-emerald-500 font-bold text-xs shrink-0">&gt;</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 truncate">{column.name}</h3>
          <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
            {columnCards.length}
          </span>
        </div>

        <button
          onClick={handleDeleteColumn}
          className="text-slate-500 hover:text-red-400 p-1 bg-transparent border-none cursor-pointer transition-colors shrink-0"
          title="Purge Column Lane"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* TASK CARDS STREAM LIST */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar bg-slate-900/30">
        {columnCards.map((card: Card) => (
          <div key={card.id} className="relative group/card">
            <CardItem card={card} />
            <button
              onClick={() => handleDeleteCard(card.id)}
              className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 p-1 rounded bg-slate-950 border border-slate-800/80 cursor-pointer transition-all duration-150 shadow-sm"
              title="Purge Card"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {columnCards.length === 0 && !isAdding && (
          <p className="text-[10px] text-slate-600 text-center py-4 uppercase tracking-wider">[ empty_lane ]</p>
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
              placeholder="Task parameters (content)..."
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
                <Plus size={10} /> Push
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
            <PlusCircle size={12} /> Append Task Card
          </button>
        </div>
      )}
    </div>
  );
};
