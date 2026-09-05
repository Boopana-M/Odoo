import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Reusable EmptyState Component with Tailwind CSS
 * Communicates: No records / No results / No data
 */
export function EmptyState({
  icon = <Inbox size={24} />,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  action = null,
  subtle = false,
  className = '',
}) {
  const containerClasses = subtle
    ? 'bg-transparent border-transparent p-6 my-2'
    : 'bg-white border border-dashed border-slate-200 rounded-lg p-8 md:p-10 my-4';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${containerClasses} ${className}`.trim()}
      role="status"
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      {title && <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>}
      {description && <p className="text-sm text-slate-500 max-w-sm mb-5 leading-normal">{description}</p>}
      {action && <div className="flex gap-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
