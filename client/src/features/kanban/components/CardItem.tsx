import React from 'react';
import { Card } from '../types/kanban.types';
import { useBoardStore } from '../../../store/boardStore';
import { Calendar, Hash, Edit2, X } from 'lucide-react';

interface CardItemProps {
  card: Card;
}

export const CardItem: React.FC<CardItemProps> = ({ card }) => {
  const { updateCard, deleteCard } = useBoardStore();

  const handleEditTitle = () => {
    const newTitle = window.prompt('Modify Task Parameter Title:', card.title);
    if (newTitle && newTitle.trim() !== card.title) {
      updateCard(card.id, { title: newTitle.trim() });
    }
  };

  const handleDeleteCard = () => {
    if (window.confirm('Purge selected card matrix object?')) {
      try {
        deleteCard(card.id);
      } catch (err) {
        console.error('Card deletion failed', err);
      }
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded shadow-sm group transition-all duration-150 min-w-0 break-words relative">
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
          <Hash size={10} className="shrink-0" /> {card.id ? card.id.substring(0, 6) : 'matrix'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={10} /> {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : '16/6/2026'}
        </span>
      </div>

      {/* ACTION TOOLBAR: edit and delete card */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10 bg-slate-950/90 pl-1 py-0.5 rounded backdrop-blur-xs">
        <button
          onClick={handleEditTitle}
          className="text-slate-500 hover:text-emerald-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer shadow-sm transition-colors"
          title="Patch Card Parameters"
        >
          <Edit2 size={10} />
        </button>
        <button
          onClick={handleDeleteCard}
          className="text-slate-400 hover:text-red-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer shadow-sm transition-colors"
          title="Purge Card"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
};
