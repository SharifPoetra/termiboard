import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, Edit2, Trash2, UserPlus, Users, LogOut, MoreVertical } from 'lucide-react';

interface BoardHeaderProps {
  boardName: string;
  boardId: string;
  onEdit: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onInvite: () => void;
  onMembers: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardName,
  boardId,
  onEdit,
  onDelete,
  onLeave,
  onInvite,
  onMembers,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="text-emerald-400 animate-pulse shrink-0" size={18} />
          <span className="text-xs md:text-sm font-bold text-slate-200 truncate tracking-wide flex items-center gap-2">
            BOARD // {boardName || `${boardId.substring(0, 8)}...`}
          </span>

          {/* Desktop-only action icons */}
          <button
            onClick={onEdit}
            className="hidden md:inline-block text-slate-500 hover:text-cyan-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
            title="Edit Board"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={onDelete}
            className="hidden md:inline-block text-slate-500 hover:text-red-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
            title="Delete Board"
          >
            <Trash2 size={11} />
          </button>
          <button
            onClick={onLeave}
            className="hidden md:inline-block text-slate-500 hover:text-amber-400 bg-transparent border-none p-0.5 cursor-pointer transition-colors"
            title="Leave Board"
          >
            <LogOut size={11} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Desktop action buttons */}
        <button
          onClick={onInvite}
          className="hidden md:flex bg-slate-950 border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 px-2.5 py-1 rounded text-xs items-center gap-1.5 transition-all duration-150 cursor-pointer uppercase font-bold"
        >
          <UserPlus size={12} />
          <span>Invite</span>
        </button>
        <button
          onClick={onMembers}
          className="hidden md:flex bg-slate-950 border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 px-2.5 py-1 rounded text-xs items-center gap-1.5 transition-all duration-150 cursor-pointer uppercase font-bold"
        >
          <Users size={12} />
          <span>Members</span>
        </button>

        {/* Live sync indicator */}
        <div className="text-[10px] text-emerald-400 bg-slate-950 border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>LIVE SYNC</span>
        </div>

        {/* Mobile dropdown */}
        <div className="relative md:hidden" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <MoreVertical size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded shadow-xl z-50 overflow-hidden text-[11px]">
              <button
                onClick={() => {
                  onInvite();
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-slate-300 hover:text-emerald-400 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors"
              >
                <UserPlus size={12} />
                <span>Invite User</span>
              </button>
              <button
                onClick={() => {
                  onMembers();
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-slate-300 hover:text-cyan-400 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-800"
              >
                <Users size={12} />
                <span>View Members</span>
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-slate-300 hover:text-cyan-400 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-800"
              >
                <Edit2 size={11} />
                <span>Edit Board</span>
              </button>
              <button
                onClick={() => {
                  onLeave();
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-amber-400 hover:text-amber-300 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-800"
              >
                <LogOut size={11} />
                <span>Leave Board</span>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-slate-950 border-none bg-transparent cursor-pointer flex items-center gap-2 uppercase font-bold transition-colors border-t border-slate-800"
              >
                <Trash2 size={11} />
                <span>Delete Board</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
