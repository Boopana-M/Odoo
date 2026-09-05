import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableCell } from './TableCell';
import { EmptyState } from '../ui/EmptyState';
import { SectionError } from '../ui/ErrorState';
import { Skeleton } from '../ui/LoadingState';

/**
 * Reusable Table Component with Tailwind CSS
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
    <div className={`w-full bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden ${wrapperClassName}`.trim()}>
      <div className="w-full overflow-x-auto">
        <table className={`w-full border-collapse text-left text-sm text-slate-900 ${className}`.trim()}>
          {columns.length > 0 && <TableHeader columns={columns} />}
          <tbody className="bg-white divide-y divide-slate-100">
            {error ? (
              <TableRow>
                <TableCell colSpan={colCount} className="p-8 text-center">
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
                      <Skeleton className="h-4" style={{ width: `${60 + ((cIdx * 15) % 35)}%` }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : children ? (
              children
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="p-8 text-center">
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
      {footer && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Table;
