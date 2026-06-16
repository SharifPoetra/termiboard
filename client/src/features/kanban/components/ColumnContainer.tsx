import React, { useEffect, useState } from 'react';
import { Column } from '../types/kanban.types';
import { useBoardStore } from '../../../store/boardStore';
import { CardItem } from './CardItem';
import { Plus, Terminal, X, PlusCircle } from 'lucide-react';

interface ColumnContainerProps {
  column: Column;
}

export const ColumnContainer: React.FC<ColumnContainerProps> = ({ column }) => {
  const { cards, fetchCards, createCard } = useBoardStore();
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardContent, setCardContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all task card data for this column when first loaded
  useEffect(() => {
    fetchCards(column.id);
  }, [column.id, fetchCards]);

  const columnCards = cards[column.id] || [];

  const handleAddCard = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;

    setIsSubmitting(true);
    try {
      // Calculate the index of the next card position based on the current card count
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded flex flex-col max-h-[75vh] w-72 sm:w-80 shrink-0 shadow-md">
      {/* HEADER LAJUR */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-emerald-500 font-bold text-xs shrink-0">&gt;</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 truncate font-mono">
            {column.name}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
            {columnCards.length}
          </span>
        </div>
      </div>

      {/* TASK CARD LIST */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar bg-slate-900/30">
        {columnCards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}

        {columnCards.length === 0 && !isAdding && (
          <p className="text-[10px] text-slate-600 text-center font-mono py-4 uppercase tracking-wider">
            [ empty_lane ]
          </p>
        )}

        {/* INLINE INPUT FOR NEW CARD CREATION */}
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
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
              disabled={isSubmitting}
            />
            <textarea
              placeholder="Task parameters (content)..."
              value={cardContent}
              onChange={(e) => setCardContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-emerald-500 transition-colors h-14 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[10px] uppercase font-mono tracking-wider text-slate-500 hover:text-slate-400 px-2 py-1 bg-transparent border-none cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-[10px] uppercase font-mono tracking-wider bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
                disabled={isSubmitting || !cardTitle.trim()}
              >
                <Plus size={10} /> Push
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FOOTER ADD CARD BUTTON */}
      {!isAdding && (
        <div className="p-2 border-t border-slate-800/40 bg-slate-900/50">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-1.5 rounded border border-dashed border-slate-800 hover:border-slate-700 text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 bg-transparent cursor-pointer transition-colors"
          >
            <PlusCircle size={12} /> Append Task Card
          </button>
        </div>
      )}
    </div>
  );
};
