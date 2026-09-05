import React from 'react';
import './Table.css';

/**
 * Reusable TableRow Component
 * Supports: normal, hover, selected states, onClick
 */
export function TableRow({
  children,
  selected = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <tr
      className={`table-row ${selected ? 'table-row--selected' : ''} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export default TableRow;
