import React from 'react';
import { Plus, LayoutGrid } from 'lucide-react';

interface AddColumnFormProps {
  isAdding: boolean;
  columnName: string;
  onColumnNameChange: (value: string) => void;
  onStartAdding: () => void;
  onCancel: () => void;
  onSubmit: (e: React.SyntheticEvent) => void;
}

export const AddColumnForm: React.FC<AddColumnFormProps> = ({
  isAdding,
  columnName,
  onColumnNameChange,
  onStartAdding,
  onCancel,
  onSubmit,
}) => {
  if (!isAdding) {
    return (
      <button
        onClick={onStartAdding}
        className="w-full py-4 rounded border border-dashed border-slate-800 hover:border-emerald-500/20 bg-slate-900/20 hover:bg-slate-900/60 text-xs text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 uppercase tracking-wider"
      >
        <LayoutGrid size={14} /> [ Add Column ]
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-slate-900 border border-emerald-500/20 p-4 rounded space-y-3 shadow-lg">
      <div>
        <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Column Name</label>
        <input
          type="text"
          placeholder="e.g., In Progress"
          value={columnName}
          onChange={(e) => onColumnNameChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2 justify-end text-[11px]">
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer px-2 py-1 uppercase"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded cursor-pointer transition-colors uppercase flex items-center gap-1"
          disabled={!columnName.trim()}
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </form>
  );
};
