import React from 'react';

/**
 * Reusable TableRow Component with Tailwind CSS
 * Supports: normal, hover, selected states, onClick
 */
export function TableRow({
  children,
  selected = false,
  onClick,
  className = '',
  ...props
}) {
  const rowClasses = selected
    ? 'bg-blue-50/60 hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors'
    : 'border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 transition-colors';

  return (
    <tr
      className={`${rowClasses} ${onClick ? 'cursor-pointer' : ''} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export default TableRow;
