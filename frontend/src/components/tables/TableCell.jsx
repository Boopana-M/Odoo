import React from 'react';
import './Table.css';

/**
 * Reusable TableCell Component
 */
export function TableCell({
  children,
  align = 'left',
  truncate = false,
  className = '',
  colSpan,
  ...props
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '';
  const truncateClass = truncate ? 'table-td--truncate' : '';

  return (
    <td
      className={`table-td ${alignClass} ${truncateClass} ${className}`.trim()}
      colSpan={colSpan}
      {...props}
    >
      {children}
    </td>
  );
}

export default TableCell;
