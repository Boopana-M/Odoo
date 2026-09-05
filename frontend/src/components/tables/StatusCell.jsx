import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { TableCell } from './TableCell';

/**
 * Reusable StatusCell Component for tables with Tailwind CSS
 */
export function StatusCell({ status, label, className = '' }) {
  return (
    <TableCell className={className}>
      <div className="inline-flex">
        <StatusBadge status={status} label={label} />
      </div>
    </TableCell>
  );
}

export default StatusCell;
