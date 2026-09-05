import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableCell } from './TableCell';
import { EmptyState } from '../ui/EmptyState';
import { SectionError } from '../ui/ErrorState';
import { Skeleton } from '../ui/LoadingState';
import './Table.css';

/**
 * Reusable Table Component
 * Supports: columns, data, loading state, empty state, error state, pagination footer
 */
export function Table({
  columns = [],
  children,
  loading = false,
  loadingRows = 5,
  error = null,
  onRetry = null,
  emptyState = null,
  footer = null,
  className = '',
  wrapperClassName = '',
}) {
  const colCount = columns.length || 5;

  return (
    <div className={`table-container ${wrapperClassName}`.trim()}>
      <div className="table-wrapper">
        <table className={`table ${className}`.trim()}>
          {columns.length > 0 && <TableHeader columns={columns} />}
          <tbody className="table-tbody">
            {error ? (
              <TableRow>
                <TableCell colSpan={colCount} className="table-state-cell">
                  <SectionError
                    title="Failed to load table data"
                    message={typeof error === 'string' ? error : error.message}
                    onRetry={onRetry}
                  />
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array.from({ length: loadingRows }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {Array.from({ length: colCount }).map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="skeleton--text" style={{ width: `${60 + ((cIdx * 15) % 35)}%` }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : children ? (
              children
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="table-state-cell">
                  {emptyState || (
                    <EmptyState
                      title="No records found"
                      description="There are no items to display in this table."
                      subtle
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </table>
      </div>
      {footer && <div className="table-footer">{footer}</div>}
    </div>
  );
}

export default Table;
