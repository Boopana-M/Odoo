import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal / Dialog Component with Tailwind CSS
 * Supports: title, description, size, actions/footer, ESC close, accessible dialog
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[520px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[900px]',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-h-[90vh] flex flex-col relative z-50 ${currentSize} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-slate-900 leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-desc" className="text-xs text-slate-500 mt-1">
                {description}
              </p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded transition-colors"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
