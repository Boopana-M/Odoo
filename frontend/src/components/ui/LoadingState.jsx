import React from 'react';
import './LoadingState.css';

/**
 * Reusable Spinner Component
 */
export function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`spinner spinner--${size} ${className}`.trim()}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Reusable Skeleton Box
 */
export function Skeleton({ width, height, circle = false, className = '', style = {} }) {
  const customStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`skeleton ${circle ? 'skeleton--circle' : ''} ${className}`.trim()}
      style={customStyle}
      aria-hidden="true"
    />
  );
}

/**
 * Page-Level Loading Indicator
 */
export function PageLoading({ message = 'Loading PeoplePay360...', className = '' }) {
  return (
    <div className={`page-loading ${className}`.trim()} role="status" aria-live="polite">
      <Spinner size="lg" />
      <p className="page-loading__text">{message}</p>
    </div>
  );
}

/**
 * Card Loading Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="card-skeleton" aria-hidden="true">
      <Skeleton className="skeleton--title" />
      <Skeleton className="skeleton--text" />
      <Skeleton className="skeleton--text" style={{ width: '85%' }} />
      <Skeleton className="skeleton--text" style={{ width: '40%' }} />
    </div>
  );
}

/**
 * Table Loading Skeleton (rows)
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="table-skeleton-row">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} className="table-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default {
  Spinner,
  Skeleton,
  PageLoading,
  CardSkeleton,
  TableSkeleton,
};
