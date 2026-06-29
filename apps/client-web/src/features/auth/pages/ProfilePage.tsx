import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, User, Terminal, ShieldAlert } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, updateProfile, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUpdateSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);
    setSuccessMessage(null);

    if (!username.trim() || !email.trim()) {
      setValidationError('Identity parameters (Username/Email) cannot be left blank');
      return;
    }

    try {
      await updateProfile({
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      setPassword(''); // Clear security memory field buffer
      setSuccessMessage('> Profile parameters reconfigured and committed to database successfully.');
    } catch (err) {
      // Handled globally by store context execution
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30">
      {/* TOP CONTROL NAVIGATION NAVBAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="text-emerald-400 animate-pulse shrink-0" size={18} />
            <span className="text-xs md:text-sm font-bold text-slate-200 truncate tracking-wide">
              SYSTEM // USER_PROFILE_CONFIG
            </span>
          </div>
        </div>
      </header>

      {/* CENTER PROFILE EDIT BOX CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4">
        <section className="bg-slate-900 border border-slate-800 w-full max-w-md rounded p-5 md:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="text-emerald-400 shrink-0" size={16} />
            <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-300">
              MODIFY SYSTEM IDENTITY
            </h2>
          </div>

          <form onSubmit={handleUpdateSubmit} className="space-y-3">
            <Input
              label="System Username"
              placeholder="e.g., sharif_matrix"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Registered Email Address"
              type="email"
              placeholder="sharif@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <div className="pt-2 border-t border-slate-800/40">
              <Input
                label="New Password (Leave blank to keep unchanged)"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* ERROR FEEDBACK MESSAGES LOG */}
            {(error || validationError) && (
              <div className="bg-red-950/30 border border-red-500/20 rounded p-2.5 text-[11px] text-red-400 leading-relaxed">
                <ShieldAlert size={12} className="inline mr-1.5 -mt-0.5 text-red-500" />
                <span>[FAILURE]: {validationError || error}</span>
              </div>
            )}

            {/* SUCCESS FEEDBACK MESSAGE LOG */}
            {successMessage && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded p-2.5 text-[11px] text-emerald-400 leading-relaxed">
                <Terminal size={12} className="inline mr-1.5 -mt-0.5 text-emerald-500 animate-pulse" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="pt-3">
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full text-xs py-2.5 font-bold uppercase tracking-wider"
              >
                Commit Identity Changes
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};
