import React, { useState, useEffect } from 'react';
import { Terminal, Cpu } from 'lucide-react';

interface EditCardModalProps {
  isOpen: boolean;
  initialTitle: string;
  initialContent: string;
  onSave: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  initialTitle,
  initialContent,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent);
      setError('');
    }
  }, [isOpen, initialTitle, initialContent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onSave(title.trim(), content.trim());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task card data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none">
      {/* BACKDROP OVERLAY */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* MODAL CONTAINER */}
      <div className="bg-slate-900 border border-emerald-900/60 rounded max-w-md w-full shadow-2xl shadow-emerald-950/20 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER BLOCK */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cpu size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">
              CARD_MODIFIER // EDIT_CARD_PROPERTIES
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 text-[9px]">
            <Terminal size={10} />
            <span>CORE_SYS</span>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 md:p-5 space-y-4">
            {error && (
              <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider bg-red-950/20 border border-red-900/30 px-3 py-2 rounded">
                &gt;_ ERROR: {error}
              </p>
            )}

            {/* FIELD: TITLE */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                &gt; Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none transition-colors font-mono"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            {/* FIELD: CONTENT */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                &gt; Task Description
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter task description or content..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none transition-colors font-mono h-28 resize-none leading-relaxed"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-slate-950/60 px-4 py-3 border-t border-slate-800/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-40"
            >
              [ Cancel ]
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="text-[10px] uppercase tracking-wider bg-emerald-950/40 hover:bg-emerald-900/30 text-emerald-400 font-bold px-3 py-1.5 rounded border border-emerald-900/40 cursor-pointer transition-colors shadow-sm disabled:opacity-40"
            >
              {isLoading ? '[ Saving... ]' : '[ Save Changes ]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
