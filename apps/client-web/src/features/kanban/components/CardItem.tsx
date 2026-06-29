import React, { useState } from 'react';
import { Card } from '@termiboard/core';
import { useBoardStore } from '../../../store/boardStore';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { EditCardModal } from '../../../components/ui/EditCardModal';
import { Calendar, Hash, Edit2, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CardItemProps {
  card: Card;
  isOverlay?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({ card, isOverlay = false }) => {
  const { updateCard, deleteCard } = useBoardStore();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Connect component to dnd-kit sortable engine, disabling it if used inside DragOverlay
  const sortable = useSortable({ id: card.id, disabled: isOverlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the original element in the column layout while its overlay is being dragged
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
  };

  const handleEditCardClick = () => {
    setIsEditOpen(true);
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

  const handleDeleteCardClick = () => {
    setIsConfirmOpen(true);
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
      ref={setNodeRef}
      style={style}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
      className={`bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded shadow-sm group min-w-0 break-words relative select-none ${
        isOverlay
          ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg cursor-grabbing scale-105'
          : 'cursor-grab active:cursor-grabbing'
      } ${isDragging && !isOverlay ? 'border-dashed border-emerald-500/40 bg-emerald-950/10' : ''}`}
    >
      {/* TASK CARD TITLE */}
      <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors font-mono tracking-wide mb-1 pr-14 whitespace-normal break-words leading-relaxed">
        {card.title}
      </h4>

      {/* TASK CONTENT PARAMETERS */}
      {card.content && (
        <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-3 whitespace-pre-wrap break-words">
          {card.content}
        </p>
      )}

      {/* METADATA FOOTER LAYER */}
      <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono border-t border-slate-900/50 pt-2">
        <span className="flex items-center gap-0.5 truncate">
          <Hash size={10} className="shrink-0" /> {card.id ? card.id.substring(0, 6) : 'task'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={10} /> {new Date(card.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* ACTION TOOLBAR */}
      {!isOverlay && (
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10 bg-slate-950/90 pl-1 py-0.5 rounded backdrop-blur-xs"
          // Stop propagation to prevent trigger actions from throwing off dnd-kit gesture sensors
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEditCardClick}
            className="text-slate-500 hover:text-emerald-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer shadow-sm transition-colors"
            title="Edit Task"
          >
            <Edit2 size={10} />
          </button>
          <button
            onClick={handleDeleteCardClick}
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
            title="Purge Card Matrix Object"
            message={`Are you sure you want to delete the task card: "${card.title}"? This action cannot be undone.`}
            onConfirm={handleExecuteDeleteCard}
            onCancel={() => setIsConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
};
