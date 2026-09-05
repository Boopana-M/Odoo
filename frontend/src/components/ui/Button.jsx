import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 * Supports: primary, secondary, outline, destructive, ghost variants
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
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const loadingClass = loading ? 'btn--loading' : '';
  const disabledState = disabled || loading;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabledState}
      aria-busy={loading}
      aria-disabled={disabledState}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="btn-icon btn-icon--left">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="btn-icon btn-icon--right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

export default Button;
