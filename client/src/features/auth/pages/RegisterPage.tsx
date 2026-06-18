import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Terminal, ShieldAlert } from 'lucide-react';
import { LegalModal } from '../../../components/ui/LegalModal';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onNavigateToHome }) => {
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms'>('privacy');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const openLegalModal = (type: 'privacy' | 'terms') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email address';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Min password length is 6 characters';

    if (!agreedToTerms) {
      errors.terms = 'You must accept the legal protocols to proceed';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;

    try {
      await register(formData);
      alert('Registration successful! Please login.');
      onNavigateToLogin();
    } catch (err) {
      // Global errors are handled by the zustand store
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-md w-full max-w-md shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-400 tracking-wider">CREATE_NEW_ACCOUNT.EXE</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-bold text-emerald-400 mb-2 tracking-wide">INITIALIZE USER</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Fill out the system parameters below to register a collaborative profile on TermiBoard.
          </p>

          {/* Error Message from Server */}
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 rounded p-3 mb-5 flex gap-2.5 items-start">
              <ShieldAlert className="text-red-400 shrink-0" size={18} />
              <div className="text-xs text-red-300 font-mono leading-tight">
                <span className="font-bold uppercase">[System Error]:</span> {error}
              </div>
            </div>
          )}

          <Input
            label="Username"
            name="username"
            placeholder="e.g., sharifpoetra"
            value={formData.username}
            onChange={handleChange}
            error={fieldErrors.username}
            disabled={isLoading}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="user@termiboard.com"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            disabled={isLoading}
          />

          <Input
            label="Security Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            disabled={isLoading}
          />

          {/* LEGAL CHECKBOX SECTION */}
          <div className="mb-5 mt-4">
            <label className="flex items-start gap-3 text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (fieldErrors.terms) setFieldErrors({ ...fieldErrors, terms: '' });
                }}
                disabled={isLoading}
                className="mt-0.5 accent-emerald-500 cursor-pointer w-3.5 h-3.5 border-slate-800 bg-slate-950 rounded"
              />
              <span className="text-[11px] leading-tight text-slate-400">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => openLegalModal('terms')}
                  className="text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer inline font-mono"
                >
                  Terms of Use
                </button>{' '}
                and activate the{' '}
                <button
                  type="button"
                  onClick={() => openLegalModal('privacy')}
                  className="text-emerald-400 hover:underline bg-transparent border-none p-0 cursor-pointer inline font-mono"
                >
                  Privacy Policy
                </button>
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="text-[10px] text-red-400 mt-1.5 font-bold uppercase">&gt;_ {fieldErrors.terms}</p>
            )}
          </div>

          {/* Disable button if checkbox not checked (optional defense layer) */}
          <Button type="submit" isLoading={isLoading} disabled={!agreedToTerms || isLoading} className="mt-2">
            Execute Register
          </Button>

          <p className="text-xs text-center text-slate-500 mt-6">
            Already have an active token?{' '}
            <button
              type="button"
              onClick={() => {
                clearError();
                onNavigateToLogin();
              }}
              className="text-emerald-400 hover:underline bg-transparent border-none p-0 cursor-pointer font-mono"
            >
              Access Account Here
            </button>
          </p>

          {/* ESCAPE TRIGGER BUTTON TO BACK HOME */}
          <div className="border-t border-slate-800/60 pt-4 mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                clearError();
                onNavigateToHome();
              }}
              className="text-[10px] text-slate-600 hover:text-slate-400 tracking-widest uppercase transition-colors bg-transparent border-none cursor-pointer font-mono"
            >
              &lt; [ ESCAPE_TO_MAINFRAME ]
            </button>
          </div>
        </form>
      </div>
      {/* LEGAL MODAL INJECTION */}
      <LegalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} />
    </div>
  );
};
