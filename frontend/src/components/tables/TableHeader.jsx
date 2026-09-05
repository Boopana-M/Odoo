import React from 'react';

/**
 * Reusable TableHeader Component with Tailwind CSS
 */
export function TableHeader({ columns = [], children, className = '' }) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 ${className}`.trim()}>
      <tr>
        {columns.length > 0
          ? columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className || ''}`.trim()}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))
          : children}
      </tr>
    </thead>
  );
}

export default TableHeader;
