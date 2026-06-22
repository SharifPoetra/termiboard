import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'w-full py-2 px-4 font-mono text-xs font-bold uppercase tracking-widest rounded transition-all duration-200 shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/5',
    danger: 'bg-transparent border border-red-500 hover:bg-red-500/10 text-red-400',
    ghost: 'bg-transparent border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200',
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          [ LOADING... ]
        </span>
      ) : (
        children
      )}
    </button>
  );
};
