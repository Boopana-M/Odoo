import React from 'react';
import { TableCell } from './TableCell';
import './Table.css';

/**
 * Reusable ActionCell Component for tables (aligns right)
 */
export function ActionCell({ children, className = '' }) {
  return (
    <TableCell align="right" className={className}>
      <div className="action-cell">{children}</div>
    </TableCell>
  );
}

export default ActionCell;
