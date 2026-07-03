import React, { useState } from 'react';
import { Card } from '@termiboard/core';
import { useBoardStore } from '../../../store/boardStore';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditCardModal } from '../../../components/ui/EditCardModal';
import { Calendar, Hash, Edit2, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';
import { Feedback } from '@dnd-kit/dom';
import { closestCenter } from '@dnd-kit/collision';

interface CardItemProps {
  card: Card;
  isOverlay?: boolean;
  index?: number;
}

export const CardItem: React.FC<CardItemProps> = React.memo(({ card, isOverlay = false, index = 0 }) => {
  const { updateCard, deleteCard } = useBoardStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Connect to dnd-kit sortable
  const sortable = useSortable({
    id: card.id,
    index,
    disabled: isOverlay,
    data: { type: 'Card', columnId: card.columnId },
    plugins: isOverlay ? [] : [Feedback.configure({ feedback: 'clone' })],
    collisionDetector: closestCenter,
  });

  const { ref, isDragging } = sortable;

  // Hide original element during drag, only show overlay
  const style = {
    opacity: isDragging && !isOverlay ? 0 : 1,
    touchAction: 'none',
  };

  const handleSaveCardData = async (newTitle: string, newContent: string) => {
    try {
      await updateCard(card.id, { title: newTitle, content: newContent });
    } catch (err) {
      console.error('Failed to update card', err);
    } finally {
      setIsEditOpen(false);
    }
  };

  const handleExecuteDeleteCard = async () => {
    try {
      await deleteCard(card.id);
    } catch (err) {
      console.error('Card deletion failed', err);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div
      ref={ref}
      style={style}
      className={`bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded shadow-sm group min-w-0 break-words relative select-none ${
        isOverlay
          ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg cursor-grabbing scale-105'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors font-mono tracking-wide mb-1 pr-14 whitespace-normal break-words leading-relaxed">
        {card.title}
      </h4>

      {card.content && (
        <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {card.content}
        </p>
      )}

      <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono border-t border-slate-900/50 pt-2">
        <span className="flex items-center gap-0.5 truncate">
          <Hash size={10} className="shrink-0" /> {card.id ? card.id.substring(0, 6) : 'task'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={10} /> {new Date(card.createdAt).toLocaleDateString()}
        </span>
      </div>

      {!isOverlay && (
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10 bg-slate-950/90 pl-1 py-0.5 rounded backdrop-blur-xs"
          // Prevent button clicks from interfering with drag
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsEditOpen(true)}
            className="text-slate-500 hover:text-emerald-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer shadow-sm transition-colors"
            title="Edit Task"
          >
            <Edit2 size={10} />
          </button>
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="text-slate-400 hover:text-red-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer shadow-sm transition-colors"
            title="Delete Task"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {!isOverlay && (
        <>
          <EditCardModal
            isOpen={isEditOpen}
            initialTitle={card.title}
            initialContent={card.content || ''}
            onSave={handleSaveCardData}
            onCancel={() => setIsEditOpen(false)}
          />
          <ConfirmModal
            isOpen={isConfirmOpen}
            title="Delete Card"
            message={`Delete task "${card.title}"?`}
            onConfirm={handleExecuteDeleteCard}
            onCancel={() => setIsConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
});

CardItem.displayName = 'CardItem';
