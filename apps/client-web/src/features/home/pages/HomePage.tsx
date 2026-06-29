import React, { useState, useEffect } from 'react';
import { Terminal, Kanban, ArrowRight, Activity, Shield, Cpu, Users, Menu, X } from 'lucide-react';

interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-emerald-500/30 overflow-x-hidden relative">
      {/* BACKGROUND GRID MATRIX GRAPHICS EFFECT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0" />

      {/* MINI HERO HEADER NAVBAR */}
      <header className="border-b border-slate-900/80 bg-slate-950/50 backdrop-blur-md relative z-50 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="text-emerald-400 animate-pulse" size={18} />
          <span className="text-xs font-bold tracking-widest uppercase text-slate-200">
            TermiBoard // Workspace Gate
          </span>
        </div>

        {/* DESKTOP NAVIGATION (Hidden on Mobile) */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={onNavigateToLogin}
            className="text-[11px] text-slate-400 hover:text-emerald-400 font-bold transition-colors uppercase bg-transparent border-none cursor-pointer"
          >
            [ Sign In ]
          </button>
          <button
            onClick={onNavigateToRegister}
            className="text-[11px] bg-emerald-950/40 hover:bg-emerald-900/20 text-emerald-400 px-2.5 py-1 rounded border border-emerald-900/30 transition-all font-bold uppercase cursor-pointer"
          >
            [ Sign Up ]
          </button>
        </div>

        {/* MOBILE HAMBURGER BUTTON (Visible only on Mobile) */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 p-1.5 rounded cursor-pointer transition-colors"
        >
          {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      {/* MOBILE MENU DRAWER */}
      {isMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-[49px] bg-slate-950 border-b border-slate-800 z-40 shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top duration-200 font-mono">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest border-b border-slate-900 pb-1">
            // Account Navigation
          </div>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onNavigateToLogin();
            }}
            className="w-full text-left text-xs font-bold text-slate-300 hover:text-emerald-400 bg-slate-900/50 border border-slate-900 px-3 py-2.5 rounded uppercase"
          >
            &gt; [ Sign In ]
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onNavigateToRegister();
            }}
            className="w-full text-left text-xs font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-3 py-2.5 rounded uppercase"
          >
            &gt; [ Create Account ]
          </button>
        </div>
      )}

      {/* CORE HERO WRAPPER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-12 md:py-20 flex flex-col items-center justify-center relative z-10 text-center space-y-8">
        {/* LOGO RADAR LAYER */}
        <div className="w-16 h-16 rounded-full border border-emerald-500/20 bg-slate-900/60 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/20 relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping duration-1000" />
          <Kanban size={28} />
        </div>

        {/* HERO TYPOGRAPHY HEADER */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-100 uppercase">
            Minimalist Real-Time Kanban Board
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto font-mono">
            &gt;_ Manage your projects with speed. Organize tasks into visual columns, collaborate with your team in
            real time, and track progress through a clean, distraction-free terminal interface.
          </p>
        </div>

        {/* CTAS INTERACT TRIGGER ZONE */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <button
            onClick={onNavigateToRegister}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-5 py-3 text-xs rounded uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-950/30"
          >
            Get Started Free <ArrowRight size={14} />
          </button>
          <button
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 text-slate-300 font-bold px-5 py-3 text-xs rounded uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            Open Dashboard
          </button>
        </div>

        {/* FEATURES GRID INFO */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-12 border-t border-slate-900/80">
          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded text-left space-y-2 group hover:border-emerald-500/20 transition-all">
            <div className="text-emerald-400 p-1.5 bg-slate-950 border border-slate-800 w-fit rounded">
              <Activity size={14} />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">01 // Real-Time Sync</h3>
            <p className="text-[11px] text-slate-500 group-hover:text-slate-400 leading-relaxed transition-colors">
              Instant updates across team devices. Any card moved or column updated syncs flawlessly without page
              reloads.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded text-left space-y-2 group hover:border-emerald-500/20 transition-all">
            <div className="text-emerald-400 p-1.5 bg-slate-950 border border-slate-800 w-fit rounded">
              <Shield size={14} />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">02 // Secure Workspace</h3>
            <p className="text-[11px] text-slate-500 group-hover:text-slate-400 leading-relaxed transition-colors">
              Your data is fully protected. Only invited team members can access, view, or modify private project
              boards.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded text-left space-y-2 group hover:border-emerald-500/20 transition-all">
            <div className="text-emerald-400 p-1.5 bg-slate-950 border border-slate-800 w-fit rounded">
              <Cpu size={14} />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">03 // Fast Interface</h3>
            <p className="text-[11px] text-slate-500 group-hover:text-slate-400 leading-relaxed transition-colors">
              Built without heavy assets. Enjoy an ultra-fast, snappy workspace designed to boost your daily
              productivity.
            </p>
          </div>
        </section>
      </main>

      {/* SYSTEM METRICS FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 px-4 text-center text-[10px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <div>[SYS_STATUS: OPTIMAL] // LOCAL_CLOCK: {new Date().toLocaleDateString()}</div>
        <div className="flex items-center gap-1">
          <Users size={10} /> <span>CORE_DEV_VERSION_1.0.0_STABLE</span>
        </div>
      </footer>
    </div>
  );
};
