import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../../../store/boardStore';
import { useAuthStore } from '../../../store/authStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { AlertModal } from '../../../components/ui/AlertModal';
import { EditBoardModal } from '../../../components/ui/EditBoardModal';
import { useSocket } from '../../../hooks/useSocket';
import { FolderPlus, Terminal, Layout, LogOut, TerminalSquare, Trash2, Edit2, Bell, Loader2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { boards, fetchBoards, createBoard, updateBoard, deleteBoard, isLoading, error, clearError } = useBoardStore();
  const { invitations, addInvitation, acceptInvitation, rejectInvitation, fetchPendingInvitations } =
    useNotificationStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [isEvacuated, setIsEvacuated] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; description: string } | null>(null);

  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const notiDropdownRef = useRef<HTMLDivElement>(null);

  const socket = useSocket({ subscribeNotifications: true });

  // Real-time invitation listener
  useEffect(() => {
    if (!socket) return;
    socket.on('invitation_received', (payload) => {
      console.log('[WS_STREAM] Live invitation package arrived:', payload);
      addInvitation(payload.data);
    });
    return () => {
      socket.off('invitation_received');
    };
  }, [socket, addInvitation]);

  // Initial fetch & evacuation signal
  useEffect(() => {
    fetchBoards();
    fetchPendingInvitations();
    if (sessionStorage.getItem('TERMINAL_EVAC_SIGNAL') === 'true') {
      setIsEvacuated(true);
      sessionStorage.removeItem('TERMINAL_EVAC_SIGNAL');
    }
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notiDropdownRef.current && !notiDropdownRef.current.contains(event.target as Node)) {
        setNotiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleFocusInput = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCreateBoard = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!newBoardName.trim()) {
      setFormError('Board identity name cannot be empty');
      return;
    }

    try {
      await createBoard({ name: newBoardName, description: newBoardDesc });
      setNewBoardName('');
      setNewBoardDesc('');
    } catch (err) {
      // Error handled globally by the store
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBoardData, setSelectedBoardData] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteOpenConfirm = (e: React.MouseEvent, boardId: string, boardName: string) => {
    e.stopPropagation(); // Prevent navigation to board on delete click
    setSelectedBoardData({ id: boardId, name: boardName });
    setDeleteModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, board: any) => {
    e.stopPropagation(); // Prevent navigation to board on edit click
    setEditingBoard({ id: board.id, name: board.name, description: board.description || '' });
    setEditModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!selectedBoardData) return;
    try {
      await deleteBoard(selectedBoardData.id);
    } catch (err) {
      console.error('Board destruction sequence aborted', err);
    } finally {
      setDeleteModalOpen(false);
      setSelectedBoardData(null);
    }
  };

  const handleAccept = async (boardId: string) => {
    setActionLoading(true);
    try {
      await acceptInvitation(boardId);
      await fetchBoards();
    } catch (err) {
      console.error('Failed to accept board sequence:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (boardId: string) => {
    setActionLoading(true);
    try {
      await rejectInvitation(boardId);
    } catch (err) {
      console.error('Failed to reject board sequence:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Logout then redirect to home
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30">
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex flex-row items-center justify-between shadow-md gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Terminal className="text-emerald-400 animate-pulse shrink-0" size={18} />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs md:text-sm font-bold tracking-widest text-slate-200 shrink-0">Dashboard //</span>
            <button
              onClick={() => navigate('/profile')}
              className="text-[10px] md:text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors font-mono cursor-pointer truncate"
              title="Open Profile Settings"
            >
              User: {user?.username}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Notification bell */}
          <div className="relative" ref={notiDropdownRef}>
            <button
              onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
              className="relative p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors cursor-pointer"
              title="System Notifications"
            >
              <Bell size={14} className={invitations.length > 0 ? 'animate-bounce' : ''} />
              {invitations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-[9px] h-4 w-4 rounded-full flex items-center justify-center border border-slate-900 animate-in zoom-in-50">
                  {invitations.length}
                </span>
              )}
            </button>

            {notiDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 xs:w-80 bg-slate-900 border border-amber-500/30 rounded p-4 shadow-xl z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                  <Bell className="text-amber-400 shrink-0" size={14} />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                    SYSTEM NOTIFICATIONS ({invitations.length})
                  </h2>
                </div>

                {invitations.length === 0 ? (
                  <p className="text-[10px] text-slate-500 py-2 text-center">&gt; No pending notifications.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded text-[11px]">
                        <p className="text-slate-300 mb-2 leading-relaxed">
                          &gt; You have been invited to collaborate on board:{' '}
                          <span className="text-emerald-400 font-bold">#{inv.boardId.substring(0, 8)}</span>
                        </p>
                        <div className="flex items-center gap-2 justify-end font-bold pt-1.5 border-t border-slate-900">
                          <button
                            onClick={() => handleReject(inv.boardId)}
                            disabled={actionLoading}
                            className="text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer px-2 py-0.5 uppercase text-[10px]"
                          >
                            [ REJECT ]
                          </button>
                          <button
                            onClick={() => handleAccept(inv.boardId)}
                            disabled={actionLoading}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded cursor-pointer transition-colors uppercase text-[10px]"
                          >
                            [ ACCEPT ]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors"
          >
            <LogOut size={13} /> <span className="hidden xs:inline">[ LOGOUT ]</span>
            <span className="xs:hidden">[ EXIT ]</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Create board panel */}
        <div className="sm:col-span-1 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded p-4 md:p-5 h-fit shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <FolderPlus className="text-emerald-400 shrink-0" size={16} />
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-300">
                CREATE NEW BOARD
              </h2>
            </div>

            {error && !formError && (
              <div className="bg-red-950/30 border border-red-500/20 rounded p-2.5 text-[11px] text-red-400 mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBoard} className="space-y-1">
              <Input
                ref={inputRef}
                label="Board Name"
                placeholder="e.g., Marketing Campaign"
                value={newBoardName}
                onChange={(e) => {
                  setNewBoardName(e.target.value);
                  if (formError) setFormError('');
                }}
                error={formError}
                disabled={isLoading}
              />
              <Input
                label="Description (Optional)"
                placeholder="Brief summary of this project..."
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" isLoading={isLoading} className="mt-2 w-full text-xs py-2.5">
                Create Project Board
              </Button>
            </form>
          </section>
        </div>

        {/* Board list */}
        <section className="sm:col-span-2 lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layout className="text-emerald-400 shrink-0" size={16} />
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-300">
              MY BOARDS ({boards.length})
            </h2>
          </div>

          {isLoading && boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="text-emerald-400 animate-spin" size={24} />
              <p className="text-xs text-slate-500 uppercase tracking-wider">Fetching boards...</p>
            </div>
          ) : boards.length === 0 ? (
            <div
              onClick={handleFocusInput}
              className="border border-dashed border-slate-800 hover:border-emerald-500/30 rounded-lg p-8 md:p-12 text-center bg-slate-900/40 cursor-pointer group transition-colors"
            >
              <TerminalSquare
                className="mx-auto text-slate-700 group-hover:text-emerald-500 transition-colors mb-3"
                size={32}
              />
              <p className="text-[11px] text-slate-500 group-hover:text-slate-300 tracking-wide uppercase px-2 font-mono transition-colors">
                &gt; No project boards found. <br />
                <span className="text-emerald-400 underline">[ Create your first board now ]</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded p-4 flex flex-col justify-between shadow transition-all duration-200 cursor-pointer group hover:shadow-emerald-950/5 break-words min-w-0"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-bold text-slate-200 group-hover:text-emerald-400 font-mono tracking-wide mb-1.5 transition-colors truncate">
                      / {board.name}
                    </h3>
                    <p className="text-[11px] md:text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {board.description || 'No system logging data description attached.'}
                    </p>
                  </div>
                  <div className="border-t border-slate-950/60 pt-2.5 mt-auto flex items-center justify-between text-[10px] text-slate-600 font-mono gap-2 min-w-0">
                    <span className="truncate flex-1">ID: {board.id.substring(0, 8)}...</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => handleOpenEdit(e, board)}
                        className="text-slate-500 hover:text-cyan-400 p-1 rounded hover:bg-slate-950 border border-transparent hover:border-slate-800/60 cursor-pointer transition-all duration-150"
                        title="Edit Board"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteOpenConfirm(e, board.id, board.name)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-950 border border-transparent hover:border-slate-800/60 cursor-pointer transition-all duration-150"
                        title="Delete Board"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <EditBoardModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingBoard(null);
        }}
        initialData={editingBoard}
        onConfirm={async (name, description) => {
          if (editingBoard) await updateBoard(editingBoard.id, { name, description });
        }}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Project Board"
        message={`Are you sure you want to delete "${selectedBoardData?.name}"? This action will permanently delete all columns and cards inside this board.`}
        onConfirm={handleExecuteDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedBoardData(null);
        }}
      />

      <AlertModal
        isOpen={isEvacuated}
        title="Board Deleted"
        message="This project board has been deleted by the administrator. You are redirected to the dashboard."
        onClose={() => setIsEvacuated(false)}
      />
    </div>
  );
};
