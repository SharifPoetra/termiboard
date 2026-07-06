import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useAuthStore } from '../../store/authStore';
import { ConfirmModal } from './ConfirmModal';
import { X, Shield, User, UserPlus, Loader2, XCircle } from 'lucide-react';
import { BoardMemberList } from '@termiboard/core';

interface BoardMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export const BoardMembersModal: React.FC<BoardMembersModalProps> = ({ isOpen, onClose, boardId }) => {
  const { boardMembers, currentUserRole, fetchBoardMembers, kickMember } = useBoardStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);

  // Track member selected for kick confirmation
  const [kickTarget, setKickTarget] = useState<any | null>(null);

  // Fetch members every time the modal opens to keep data fresh
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      useBoardStore
        .getState()
        .fetchBoardMembers(boardId)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, boardId]);

  // Execute kick after user confirms
  const handleConfirmKick = async () => {
    if (!kickTarget) return;
    setKickingId(kickTarget.id);
    try {
      await kickMember(boardId, kickTarget.userId);
      await fetchBoardMembers(boardId); // refresh list after removal
    } catch (err) {
      console.error('Kick failed', err);
    } finally {
      setKickingId(null);
      setKickTarget(null);
    }
  };

  if (!isOpen) return null;

  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';
  const currentUserId = user?.id;

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
          <p className="text-xs text-slate-500">
            role: {currentUserRole} | userId: {currentUserId} | members: {boardMembers.length}
          </p>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="text-emerald-400 animate-spin" size={18} />
            </div>
          ) : (
            boardMembers.map((member: BoardMemberList) => (
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

                  {/* Kick button only visible to admins/owners and not for themselves */}
                  {isAdminOrOwner && member.userId !== currentUserId && (
                    <button
                      onClick={() => setKickTarget(member)}
                      disabled={kickingId === member.id}
                      className="text-slate-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed p-1 bg-transparent border-none cursor-pointer transition-colors"
                      title="Kick member"
                    >
                      {kickingId === member.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kick confirmation dialog */}
      <ConfirmModal
        isOpen={!!kickTarget}
        title="Kick Member"
        message={`Are you sure you want to kick "${kickTarget?.username}" from this board?`}
        onConfirm={handleConfirmKick}
        onCancel={() => setKickTarget(null)}
      />
    </div>
  );
};
