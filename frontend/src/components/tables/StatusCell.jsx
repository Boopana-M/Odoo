import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { TableCell } from './TableCell';
import './Table.css';

/**
 * Reusable StatusCell Component for tables
 */
export function StatusCell({ status, label, className = '' }) {
  return (
    <TableCell className={className}>
      <div className="status-cell">
        <StatusBadge status={status} label={label} />
      </div>
    </TableCell>
  );
}

export default StatusCell;
