import React from 'react';
import { useBoardStore } from '../../store/boardStore';
import { X, Shield, User, UserPlus, Loader2 } from 'lucide-react';

interface BoardMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export const BoardMembersModal: React.FC<BoardMembersModalProps> = ({ isOpen, onClose, boardId }) => {
  const { boardMembers, currentUserRole } = useBoardStore();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      useBoardStore
        .getState()
        .fetchBoardMembers(boardId)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-400" size={16} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Board Members ({boardMembers.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="text-emerald-400 animate-spin" size={18} />
            </div>
          ) : (
            boardMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded p-2.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <User size={12} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-semibold truncate">{member.username}</p>
                    <p className="text-[10px] text-slate-500 truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {member.status === 'pending' ? (
                    <span className="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                      <UserPlus size={10} /> {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
