import React from 'react';

/**
 * Reusable TableCell Component with Tailwind CSS
 */
export function TableCell({
  children,
  align = 'left',
  truncate = false,
  className = '',
  colSpan,
  ...props
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const truncateClass = truncate ? 'max-w-[200px] truncate' : '';

  return (
    <td
      className={`px-4 py-3 text-sm text-slate-900 align-middle ${alignClass} ${truncateClass} ${className}`.trim()}
      colSpan={colSpan}
      {...props}
    >
      {children}
    </td>
  );
}

export default TableCell;
