import React from 'react';
import './Table.css';

/**
 * Reusable TableHeader Component
 */
export function TableHeader({ columns = [], children, className = '' }) {
  return (
    <thead className={`table-head ${className}`.trim()}>
      <tr>
        {columns.length > 0
          ? columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`table-th ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`.trim()}
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
