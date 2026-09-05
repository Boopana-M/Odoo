import React from 'react';
import { TableCell } from './TableCell';

/**
 * Reusable ActionCell Component for tables with Tailwind CSS
 */
export function ActionCell({ children, className = '' }) {
  return (
    <TableCell align="right" className={className}>
      <div className="flex items-center justify-end gap-1">{children}</div>
    </TableCell>
  );
}

export default ActionCell;
