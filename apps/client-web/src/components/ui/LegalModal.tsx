import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900 border border-slate-800 rounded-md w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider">
            {isPrivacy ? (
              <>
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-emerald-400">PRIVACY_POLICY.txt</span>
              </>
            ) : (
              <>
                <FileText size={14} className="text-cyan-400" />
                <span className="text-cyan-400">TERMS_OF_USE.txt</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE CONTENT) */}
        <div className="p-5 overflow-y-auto text-xs text-slate-400 space-y-4 leading-relaxed selection:bg-emerald-500/20">
          <p className="text-[10px] text-slate-500 uppercase border-b border-slate-800/60 pb-1">
            // LAST_MODIFIED: {new Date().getFullYear()}/06/18 // STATUS: COMPLIANT
          </p>

          {isPrivacy ? (
            /* PRIVACY POLICY CONTENT */
            <>
              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 01. Information We Collect</h3>
              <p>
                TermiBoard collects basic profile parameters (username, email address, and encrypted passwords) solely
                to create personal user workspaces and maintain secure session authorization.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 02. Data Synchronization</h3>
              <p>
                When interacting with our real-time board system, changes are instantly synchronized across members of
                the same board. Your board data is securely isolated and never sold or shared with third-party
                advertising arrays.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 03. Storage & Security</h3>
              <p>
                Local storage and session cookies are utilized strictly to ensure you stay signed in. Logging out of the
                terminal will clear all authentication state tokens permanently.
              </p>
            </>
          ) : (
            /* TERMS OF USE CONTENT */
            <>
              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 01. User Account Responsibility</h3>
              <p>
                By creating an account on TermiBoard, you assume full responsibility for maintaining the security of
                your login parameters. Access is personal and non-transferable.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 02. Acceptable Platform Use</h3>
              <p>
                Users are strictly prohibited from exploiting real-time communication systems, attempting unauthorized
                API injections, or overloading dashboard synchronization resources with automated spam bots.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 03. Limitation of Liability</h3>
              <p>
                TermiBoard is provided on an "as-is" architecture framework. We are not liable for unexpected connection
                dropouts, upstream hosting errors, or unpreventable data desynchronization.
              </p>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-950/40 px-4 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-4 py-1.5 rounded transition-colors uppercase cursor-pointer"
          >
            Acknowledge [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
