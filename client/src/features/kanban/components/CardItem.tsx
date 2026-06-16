import React from 'react';
import { Card } from '../types/kanban.types';
import { Calendar, Hash } from 'lucide-react';

interface CardItemProps {
  card: Card;
}

export const CardItem: React.FC<CardItemProps> = ({ card }) => {
  return (
    <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded shadow-sm group transition-all duration-150 min-w-0 break-words">
      <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors font-mono tracking-wide mb-1">
        {card.title}
      </h4>
      {card.content && (
        <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-3 whitespace-pre-wrap">{card.content}</p>
      )}
      <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono border-t border-slate-900/50 pt-2">
        <span className="flex items-center gap-0.5 truncate">
          <Hash size={10} className="shrink-0" /> {card.id.substring(0, 6)}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={10} /> {new Date(card.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
