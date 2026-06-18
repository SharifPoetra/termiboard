import React, { useState, useEffect } from 'react';
import { Terminal, Cpu } from 'lucide-react';

interface EditBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description: string) => Promise<void>;
  initialData: { name: string; description: string } | null;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({ isOpen, onClose, onConfirm, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync internal state with props whenever modal toggles open or initialData streams in
  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Matrix identity path (name) cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onConfirm(name.trim(), description.trim());
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to patch database matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
      {/* BACKDROP OVERLAY */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* MODAL CONTAINER */}
      <div className="bg-slate-900 border border-emerald-900/60 rounded max-w-md w-full shadow-2xl shadow-emerald-950/20 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER BLOCK */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              BOARD_MODIFIER // PATCH_STREAM_PARAMETERS
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 text-[9px]">
            <Terminal size={10} />
            <span>CORE_SYS</span>
          </div>
        </div>

        {/* FORM INJECTOR */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 md:p-5 space-y-4">
            {error && (
              <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider bg-red-950/20 border border-red-900/30 px-3 py-2 rounded">
                &gt;_ ERROR: {error}
              </p>
            )}

            {/* FIELD: BOARD NAME */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                &gt; Board Stream Identity Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Modify board name data..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none transition-colors font-mono"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            {/* FIELD: DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                &gt; System Logging Payload (Description)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Modify system parameters log..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none transition-colors font-mono h-24 resize-none leading-relaxed"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-slate-950/60 px-4 py-3 border-t border-slate-800/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-40"
            >
              [ Abort ]
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="text-[10px] uppercase tracking-wider bg-emerald-950/40 hover:bg-emerald-900/30 text-emerald-400 font-bold px-3 py-1.5 rounded border border-emerald-900/40 cursor-pointer transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? '[ Overwriting... ]' : '[ Inject Patch ]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
