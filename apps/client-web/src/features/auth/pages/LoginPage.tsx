import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Terminal, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToHome: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToHome, onLoginSuccess }) => {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = 'Email parameters are missing';
    if (!formData.password) errors.password = 'Password verification is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;

    try {
      await login(formData);
      onLoginSuccess();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-md w-full max-w-md shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-400 tracking-wider">USER_LOGIN.SYS</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-bold text-emerald-400 mb-2 tracking-wide">SYSTEM ACCESS</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Please enter your account email and security password to access your dashboard.
          </p>

          {/* Error Message from Server */}
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 rounded p-3 mb-5 flex gap-2.5 items-start">
              <ShieldAlert className="text-red-400 shrink-0" size={18} />
              <div className="text-xs text-red-300 font-mono leading-tight">
                <span className="font-bold uppercase">[Login Failed]:</span> {error}
              </div>
            </div>
          )}

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
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            disabled={isLoading}
          />

          <Button type="submit" isLoading={isLoading} className="mt-2">
            Sign In to Dashboard
          </Button>

          <p className="text-xs text-center text-slate-500 mt-6">
            New user to the terminal?{' '}
            <button
              type="button"
              onClick={() => {
                clearError();
                onNavigateToRegister();
              }}
              className="text-emerald-400 hover:underline bg-transparent border-none p-0 cursor-pointer font-mono"
            >
              Create An Account
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
              &lt; [ BACK TO HOME ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
