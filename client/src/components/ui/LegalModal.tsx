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
                <span className="text-emerald-400">PRIVACY_POLICY_PROTOCOL.LOG</span>
              </>
            ) : (
              <>
                <FileText size={14} className="text-cyan-400" />
                <span className="text-cyan-400">TERMS_OF_USE_DECLARATION.MD</span>
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
              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 01. Data Collection Matrices</h3>
              <p>
                TermiBoard operates as a secure tunnel grid. We cache minimal authentication credentials (username,
                secure hashed passwords, and communication emails) solely to provision database workspaces and sustain
                user sessions.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 02. Connection Logging</h3>
              <p>
                When interacting with our WebSocket real-time pipelines, active node status updates are synchronized
                securely across authorized users on the same board lane. Your transactional metrics are isolated and not
                harvested for third-party commercial index arrays.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 03. Cookies & Security Tokens</h3>
              <p>
                Local state management utilizes encrypted cookies and localStorage authentication payloads strictly
                required to uphold session persistency. Purging your session kills the validation key permanently.
              </p>
            </>
          ) : (
            /* TERMS OF USE CONTENT */
            <>
              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 01. Acceptance of Core Protocols</h3>
              <p>
                By establishing an access token on TermiBoard, you explicitly bind your network footprint to these
                operations. Authorization is personal, revocable, and non-transferable.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 02. Misuse & Node Flooding</h3>
              <p>
                Users are strictly forbidden from abusing real-time WebSocket infrastructures, executing API injection
                attacks, or flooding board stream pipelines with non-compliant automated payloads.
              </p>

              <h3 className="text-slate-200 font-bold uppercase text-xs">&gt; 03. Liability & Data Architecture</h3>
              <p>
                TermiBoard is provided "as-is" under an agile architecture framework. While security measures are
                deployed, developers accept no administrative liability for network dropouts, upstream host failures, or
                tunnel desynchronization.
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
