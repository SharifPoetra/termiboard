import { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { HomePage } from './features/home/pages/HomePage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { BoardDetailPage } from './features/kanban/pages/BoardDetailPage';
import { ProfilePage } from './features/auth/pages/ProfilePage';
import { VerifyOtpPage } from './features/auth/pages/VerifyOtpPage';
import { ShieldCheck, LogOut, LayoutDashboard, User } from 'lucide-react';
import { Button } from './components/ui/Button';

export default function App() {
  const { isAuthenticated, user, isLoading, initializeAuth, logout } = useAuthStore();

  // Adjusted navigation state scheme to include the cyberpunk home page landing arena
  const [view, setView] = useState<'home' | 'login' | 'register'>('home');

  // STATE TRAP: Stores email temporarily while the user is in the OTP verification process
  const [otpEmailTrap, setOtpEmailTrap] = useState<string | null>(null);

  // State to track whether the user is opening the Dashboard Grid or viewing a specific Board
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  // Check the token when the web is first opened
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs tracking-widest animate-pulse">[ Loading TermiBoard... ]</p>
      </div>
    );
  }

  if (otpEmailTrap) {
    return (
      <VerifyOtpPage
        email={otpEmailTrap}
        onCancel={() => setOtpEmailTrap(null)}
        onSuccess={() => setOtpEmailTrap(null)}
      />
    );
  }

  // IF LOGGED IN, DISPLAY THE MAIN DASHBOARD & SESSION CONTROLS
  if (isAuthenticated) {
    // PROFILE NAVIGATION INTERCEPTOR: if the user click on username
    if (activeBoardId === 'PROFILE_PAGE_SIGNAL') {
      return <ProfilePage onBack={() => setActiveBoardId(null)} />;
    }
    // IF THE USER CLICKS A SPECIFIC BOARD (TUNNELING WORKSPACE)
    if (activeBoardId) {
      return <BoardDetailPage boardId={activeBoardId} onBackToDashboard={() => setActiveBoardId(null)} />;
    }

    // IF THE USER HAS CLICKED "GO TO BOARDS AREA"
    if (showDashboard) {
      return <DashboardPage onSelectBoard={(boardId) => setActiveBoardId(boardId)} />;
    }

    // DEFAULT VIEW MATCHING YOUR INITIAL FILE (SESSION CARD)
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
              onClick={() => setShowDashboard(true)}
              className="flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={14} /> Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveBoardId('PROFILE_PAGE_SIGNAL')}
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
  }

  // IF NOT LOGGED IN, MULTI-ROUTE ROUTER ROUTING LOGIC BLOCK
  if (view === 'home') {
    return <HomePage onNavigateToLogin={() => setView('login')} onNavigateToRegister={() => setView('register')} />;
  }

  return view === 'login' ? (
    <LoginPage
      onNavigateToRegister={() => setView('register')}
      onNavigateToHome={() => setView('home')}
      onLoginSuccess={() => console.log('Successfully connected!')}
    />
  ) : (
    <RegisterPage
      onNavigateToLogin={() => setView('login')}
      onNavigateToHome={() => setView('home')}
      onRegisterSuccess={(email) => {
        setOtpEmailTrap(email);
      }}
    />
  );
}
