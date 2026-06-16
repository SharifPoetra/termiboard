import React from 'react';
import { ShieldAlert, Terminal } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
      {/* BACKDROP OVERLAY */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity" />

      {/* MODAL BODY */}
      <div className="bg-slate-900 border border-red-500/40 rounded max-w-sm w-full shadow-2xl shadow-red-950/30 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER BLOCK */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert size={14} className="animate-bounce" />
            <span className="text-[10px] font-bold tracking-widest uppercase">BROKER_NOTICE // EVACUATION_ALARM</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 text-[9px]">
            <Terminal size={10} />
            <span>WS_STREAM</span>
          </div>
        </div>

        {/* CONTENT PAYLOAD CONTAINER */}
        <div className="p-5 text-center space-y-3">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">{title}</h3>
          <p className="text-[11px] text-slate-300 leading-relaxed uppercase bg-slate-950/60 p-4 rounded border border-slate-800/80 font-mono text-left">
            [SYS_ERR] &gt; {message}
          </p>
        </div>

        {/* CONTROLS INTERACTION FOOTER */}
        <div className="bg-slate-950/60 px-4 py-3 border-t border-slate-800/40 flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-[10px] uppercase tracking-wider bg-red-950/30 hover:bg-red-900/40 text-red-400 font-bold py-2 rounded border border-red-950 hover:border-red-500/50 cursor-pointer transition-all duration-150 shadow-inner"
          >
            [ Acknowledge & Terminate Session ]
          </button>
        </div>
      </div>
    </div>
  );
};
