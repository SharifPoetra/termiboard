import React, { useState } from 'react';
import axiosInstance from '../../lib/axios';
import { X, UserPlus, Terminal } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, boardId }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInviteSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Target system email identity cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // POST /api/boards/invite
      await axiosInstance.post('/boards/invite', { boardId, email });

      setSuccessMessage(`> Collaboration invitation successfully sent for: ${email}`);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch invitation matrix');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setError(null);
    setSuccessMessage(null);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 font-mono backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/50">
          <div className="flex items-center gap-2 text-slate-200">
            <UserPlus className="text-emerald-400" size={16} />
            <span className="text-xs font-bold tracking-widest uppercase">INVITE COLLABORATOR //</span>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* FORM INJECTOR */}
        <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
              User Email Address
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-slate-600 text-xs select-none">&gt;</span>
              <input
                type="email"
                placeholder="someone@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* RESPONSE LOGGING */}
          {error && (
            <div className="bg-red-950/30 border border-red-500/20 rounded p-2.5 text-[11px] text-red-400 leading-relaxed">
              <Terminal size={12} className="inline mr-1.5 -mt-0.5 text-red-500" />
              <span>[ERROR]: {error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded p-2.5 text-[11px] text-emerald-400 leading-relaxed">
              <Terminal size={12} className="inline mr-1.5 -mt-0.5 text-emerald-500 animate-pulse" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* BUTTON ACTIONS */}
          <div className="flex items-center justify-end gap-3 text-[11px] pt-2 border-t border-slate-800/40">
            <button
              type="button"
              onClick={handleCloseModal}
              className="text-slate-500 hover:text-slate-400 bg-transparent border-none cursor-pointer px-2 py-1 uppercase"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded cursor-pointer transition-colors uppercase disabled:opacity-50"
            >
              {isLoading ? 'Dispatching...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
