import { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './components/ui/Button';

export default function App() {
  const { isAuthenticated, user, isLoading, initializeAuth, logout } = useAuthStore();
  const [view, setView] = useState<'login' | 'register'>('login');

  // Check the token when the web is first opened
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs tracking-widest animate-pulse">[ INITIALIZING TERMINAL... ]</p>
      </div>
    );
  }

  // IF LOGGED IN, DISPLAY THE MAIN DASHBOARD PLACEHOLDER
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-8 flex flex-col items-center justify-center">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
            <ShieldCheck className="text-emerald-400" size={28} />
            <div>
              <h1 className="text-base font-bold text-slate-200">SESSION OPENED</h1>
              <p className="text-[10px] text-slate-500">ID: {user?.id}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-400 mb-6 bg-slate-950 p-4 border border-slate-800 rounded">
            <p>
              &gt; <span className="text-slate-500">USER:</span> {user?.username}
            </p>
            <p>
              &gt; <span className="text-slate-500">EMAIL:</span> {user?.email}
            </p>
            <p>
              &gt; <span className="text-slate-500">STATUS:</span> Authenticated
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="primary" className="flex items-center justify-center gap-2">
              <LayoutDashboard size={14} /> Go To Boards Area
            </Button>
            <Button variant="danger" onClick={logout} className="flex items-center justify-center gap-2">
              <LogOut size={14} /> Kill Session (Logout)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // IF NOT LOGGED IN, SET THE FORM NAVIGATION MENU
  return view === 'login' ? (
    <LoginPage
      onNavigateToRegister={() => setView('register')}
      onLoginSuccess={() => console.log('Successfully connected!')}
    />
  ) : (
    <RegisterPage onNavigateToLogin={() => setView('login')} />
  );
}
