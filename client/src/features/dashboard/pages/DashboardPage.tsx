import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { useAuthStore } from '../../../store/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { AlertModal } from '../../../components/ui/AlertModal';
import { FolderPlus, Terminal, Layout, LogOut, TerminalSquare, Trash2, Edit2 } from 'lucide-react';
import { EditBoardModal } from '../../../components/ui/EditBoardModal';

interface DashboardPageProps {
  onSelectBoard: (boardId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectBoard }) => {
  const { user, logout } = useAuthStore();
  const { boards, fetchBoards, createBoard, updateBoard, deleteBoard, isLoading, error } = useBoardStore();

  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [isEvacuated, setIsEvacuated] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; description: string } | null>(null);

  useEffect(() => {
    fetchBoards();
    if (sessionStorage.getItem('TERMINAL_EVAC_SIGNAL') === 'true') {
      setIsEvacuated(true);
      sessionStorage.removeItem('TERMINAL_EVAC_SIGNAL');
    }
  }, [fetchBoards]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleFocusInput = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCreateBoard = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newBoardName.trim()) {
      setFormError('Board identity name cannot be empty');
      return;
    }

    try {
      await createBoard({ name: newBoardName, description: newBoardDesc });
      setNewBoardName('');
      setNewBoardDesc('');
    } catch (err) {
      // Global errors are handled by the store
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBoardData, setSelectedBoardData] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteOpenConfirm = (e: React.MouseEvent, boardId: string, boardName: string) => {
    e.stopPropagation(); // CRITICAL: Prevents triggering onSelectBoard when clicking the trash icon
    setSelectedBoardData({ id: boardId, name: boardName });
    setDeleteModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, board: any) => {
    e.stopPropagation(); // CRITICAL: Prevents triggering onSelectBoard when clicking the pencil icon
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30">
      {/* TOP CONTROL NAVIGATION NAVBAR - Ultra Dynamic Flex */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex flex-row items-center justify-between shadow-md gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Terminal className="text-emerald-400 animate-pulse shrink-0" size={18} />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs md:text-sm font-bold tracking-widest text-slate-200 shrink-0">Dashboard //</span>
            <span className="text-[10px] md:text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[120px] sm:max-w-xs md:max-w-none">
              User: {user?.username}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors shrink-0"
        >
          <LogOut size={13} /> <span className="hidden xs:inline">[ LOGOUT ]</span>
          <span className="xs:hidden">[ EXIT ]</span>
        </button>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* LEFT PANEL: CREATE BOARD */}
        <section className="bg-slate-900 border border-slate-800 rounded p-4 md:p-5 h-fit shadow-lg sm:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <FolderPlus className="text-emerald-400 shrink-0" size={16} />
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-300">
              CREATE NEW BOARD
            </h2>
          </div>

          <form onSubmit={handleCreateBoard} className="space-y-1">
            <Input
              ref={inputRef}
              label="Board Name"
              placeholder="e.g., Marketing Campaign"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              error={formError || (error ? 'Deployment failed' : undefined)}
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

        {/* RIGHT PANEL: LIST BOARDS */}
        <section className="sm:col-span-2 lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layout className="text-emerald-400 shrink-0" size={16} />
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-300">
              MY BOARDS ({boards.length})
            </h2>
          </div>

          {boards.length === 0 ? (
            <div
              onClick={handleFocusInput}
              className="border border-dashed border-slate-800 hover:border-emerald-500/30 rounded-lg p-8 md:p-12 text-center bg-slate-900/40 cursor-pointer group transition-colors"
            >
              <TerminalSquare
                className="mx-auto text-slate-700 group-hover:text-emerald-500 transition-colors mb-3"
                size={32}
              />
              <p className="text-[11px] text-slate-500 group-hover:text-slate-300 tracking-wide uppercase px-2 font-mono transition-colors">
                &gt; No project boards found. <br></br>
                <span className="text-emerald-400 underline">[ Create your first board now ]</span>
              </p>
            </div>
          ) : (
            /* Inside Grid Card: Handles single column layout on mobile, dual columns onward */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => onSelectBoard(board.id)}
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

                    {/* ACTION ZONE */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                      {/* EDIT BUTTON */}
                      <button
                        onClick={(e) => handleOpenEdit(e, board)}
                        className="text-slate-500 hover:text-cyan-400 p-1 rounded hover:bg-slate-950 border border-transparent hover:border-slate-800/60 cursor-pointer transition-all duration-150"
                        title="Edit Board"
                      >
                        <Edit2 size={12} />
                      </button>
                      {/* DELETE BUTTON */}
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
        message="This project board has been deleted by the administrator. You are being redirected to the dashboard."
        onClose={() => setIsEvacuated(false)}
      />
    </div>
  );
};
