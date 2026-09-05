import React from 'react';

/**
 * Reusable Button Component with Tailwind CSS
 * Variants: primary, secondary, outline, destructive, ghost
 * Sizes: sm, md, lg
 * States: default, hover, active, disabled, loading
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md border transition-colors select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:bg-blue-800',
    secondary:
      'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 active:bg-slate-300',
    outline:
      'bg-transparent text-slate-800 border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    destructive:
      'bg-red-600 text-white border-red-600 hover:bg-red-700 active:bg-red-800',
    ghost:
      'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-[38px] px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-base gap-2.5',
  };

  const disabledState = disabled || loading;
  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      className={`${baseClasses} ${currentVariant} ${currentSize} ${
        loading ? 'cursor-wait' : ''
      } ${className}`.trim()}
      disabled={disabledState}
      aria-busy={loading}
      aria-disabled={disabledState}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent shrink-0"
            aria-hidden="true"
          />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center justify-center shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex items-center justify-center shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

export default Button;
