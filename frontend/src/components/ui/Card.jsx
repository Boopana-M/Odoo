import React from 'react';

/**
 * Reusable Card Component with Tailwind CSS
 * Supports: title, description, actions, children, footer, hoverable
 */
export function Card({
  title,
  description,
  action,
  footer,
  children,
  hoverable = false,
  className = '',
  ...props
}) {
  const hasHeader = title || description || action;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col overflow-hidden transition-all duration-150 ${
        hoverable ? 'hover:border-slate-300 hover:shadow-sm' : ''
      } ${className}`.trim()}
      {...props}
    >
      {hasHeader && (
        <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            {title && <h3 className="text-base font-semibold text-slate-900 leading-tight">{title}</h3>}
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5 flex-1">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
