import React from 'react';
import { AlertTriangle, Terminal } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
      {/* BACKDROP OVERLAY */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onCancel} />

      {/* MODAL BODY CONTROLLER */}
      <div className="bg-slate-900 border border-red-900/60 rounded max-w-md w-full shadow-2xl shadow-red-950/20 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER GLITCH/WARNING PATTERN */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">SYSTEM_ALERT // CRITICAL_EXECUTION</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 text-[9px]">
            <Terminal size={10} />
            <span>NODE_WARN</span>
          </div>
        </div>

        {/* CONTENT PACK BLOCK */}
        <div className="p-4 md:p-5">
          <h3 className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">{title}</h3>
          <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed uppercase bg-slate-950/40 p-3 rounded border border-slate-800/60 font-mono">
            &gt; {message}
          </p>
        </div>

        {/* CONTROLS INTERACTION FOOTER */}
        <div className="bg-slate-950/60 px-4 py-3 border-t border-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] uppercase tracking-wider bg-green-950/40 hover:bg-green-900/30 text-green-400 font-bold px-3 py-1.5 rounded border border-green-900/40 cursor-pointer transition-colors shadow-sm shadow-green-950"
          >
            [ Abort ]
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-[10px] uppercase tracking-wider bg-red-950/40 hover:bg-red-900/30 text-red-400 font-bold px-3 py-1.5 rounded border border-red-900/40 cursor-pointer transition-colors shadow-sm shadow-red-950"
          >
            [ Confirm ]
          </button>
        </div>
      </div>
    </div>
  );
};
