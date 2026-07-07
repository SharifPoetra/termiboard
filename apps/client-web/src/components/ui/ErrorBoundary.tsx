import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Terminal, ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR_BOUNDARY] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="text-red-400 shrink-0" size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">
                SYSTEM CRASH // CRITICAL_EXCEPTION
              </h2>
            </div>

            <div className="bg-slate-950 p-3 border border-slate-800 rounded text-[11px] text-slate-400 leading-relaxed space-y-1">
              <p>&gt; An unexpected fatal error occurred in the application.</p>
              <p className="text-red-400 font-bold break-all">&gt; {this.state.error?.message || 'Unknown error'}</p>
              <p className="text-slate-500 text-[10px]">
                &gt; The error has been logged. Try refreshing the page or return to the dashboard.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw size={10} /> [ Refresh ]
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <Terminal size={10} /> [ Try Again ]
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
