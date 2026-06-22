import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5 mb-4">
      {label && <label className="text-xs font-mono uppercase tracking-widest text-slate-400">{label}</label>}
      <input
        ref={ref}
        className={`w-full bg-slate-900 border text-slate-100 px-3 py-2 font-mono text-sm rounded transition-all duration-200 outline-none
            ${
              error
                ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.15)] focus:border-red-400'
                : 'border-slate-800 focus:border-emerald-500 focus:shadow-[0_0_8px_rgba(16,185,129,0.15)]'
            }
            placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-mono text-red-400 mt-0.5 animate-pulse">{`> ERROR: ${error}`}</span>}
    </div>
  );
});

Input.displayName = 'Input';
