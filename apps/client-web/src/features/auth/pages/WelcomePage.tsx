import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, LogOut, LayoutDashboard, User } from 'lucide-react';

export const WelcomePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-8 flex flex-col items-center justify-center">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <ShieldCheck className="text-emerald-400" size={28} />
          <div>
            <h1 className="text-base font-bold text-slate-200">Welcome Back</h1>
            <p className="text-[10px] text-slate-500">ID: {user?.id}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-400 mb-6 bg-slate-950 p-4 border border-slate-800 rounded">
          <p>
            &gt; <span className="text-slate-500">Account:</span> {user?.username}
          </p>
          <p>
            &gt; <span className="text-slate-500">Email:</span> {user?.email}
          </p>
          <p>
            &gt; <span className="text-slate-500">Status:</span> Connected
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={14} /> Go to Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center gap-2 border border-slate-700 bg-slate-850 text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <User size={14} /> Account Settings
          </Button>
          <Button variant="danger" onClick={logout} className="flex items-center justify-center gap-2">
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
};
