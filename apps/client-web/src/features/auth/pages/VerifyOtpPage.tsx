import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/ui/Button';
import { KeyRound, ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore();

  // Email passed from registration via location state
  const email = (location.state as any)?.email;
  if (!email) {
    // Fallback: no email in state, redirect to register
    return <Navigate to="/register" replace />;
  }

  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cooldown starts at 60s since OTP was sent during registration
  const [cooldown, setCooldown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerifySubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);
    setResendSuccess(false);

    if (otp.trim().length !== 6) {
      setValidationError('OTP protocol requires exactly 6 characters');
      return;
    }

    try {
      await verifyOtp(email, otp.trim());
      navigate('/welcome'); // Verification success → go to welcome page
    } catch (err) {
      // Error handled globally by the auth store
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || isLoading) return;
    clearError();
    setValidationError(null);

    try {
      await resendOtp(email);
      setResendSuccess(true);
      setCooldown(60); // Restart cooldown
      setOtp(''); // Clear input for new code
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <KeyRound className="text-amber-400 shrink-0" size={18} />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">SECURITY IDENTITY VERIFICATION</h2>
        </div>

        <div className="bg-slate-950 p-3 border border-slate-800 rounded text-[11px] text-slate-400 leading-relaxed space-y-1">
          <p>&gt; Secure token OTP has been successfully sent to:</p>
          <p className="text-emerald-400 font-bold break-all">&gt; {email}</p>
          <p className="text-slate-500 text-[10px]">
            &gt; Input the 6-digit dynamic key below to unlock your account space.
          </p>
        </div>

        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="space-y-1.5">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.5em] text-2xl font-bold text-emerald-400 bg-slate-950 border border-slate-800 rounded py-3 focus:outline-none focus:border-emerald-500/50 placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-700 transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Error display */}
          {(error || validationError) && (
            <div className="bg-red-950/30 border border-red-500/20 rounded p-2.5 text-[11px] text-red-400">
              <ShieldAlert size={12} className="inline mr-1.5 -mt-0.5 text-red-500" />
              <span>[ACCESS_DENIED]: {validationError || error}</span>
            </div>
          )}

          {/* Resend success message */}
          {resendSuccess && !error && (
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-2.5 text-[11px] text-emerald-400">
              <span>[SYSTEM]: New dynamic OTP packet sent successfully.</span>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full text-xs py-2.5 font-bold uppercase tracking-wider flex items-center justify-center"
            >
              Verify OTP
            </Button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                disabled={isLoading}
                className="flex-1 bg-transparent border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-400 py-2 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={10} /> [ Abort ]
              </button>

              <button
                type="button"
                onClick={handleResendClick}
                disabled={cooldown > 0 || isLoading}
                className={`flex-1 bg-transparent border py-2 rounded text-[10px] uppercase font-bold transition-colors flex items-center justify-center gap-1 ${
                  cooldown > 0
                    ? 'border-slate-900 text-slate-600 cursor-not-allowed'
                    : 'border-slate-800 hover:border-slate-700 text-amber-500/80 hover:text-amber-400 cursor-pointer'
                }`}
              >
                <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
                {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend OTP'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
