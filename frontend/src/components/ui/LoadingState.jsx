import React from 'react';

/**
 * Reusable Spinner Component with Tailwind CSS
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-11 h-11 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-slate-200 border-t-blue-600 ${sizes[size] || sizes.md} ${className}`.trim()}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Reusable Skeleton Box with Tailwind CSS
 */
export function Skeleton({ width, height, circle = false, className = '', style = {} }) {
  const customStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`bg-slate-200 animate-pulse ${circle ? 'rounded-full' : 'rounded'} ${className}`.trim()}
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
    <div
      className={`flex flex-col items-center justify-center min-h-[320px] p-8 gap-3 ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}

/**
 * Card Loading Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-5 w-3/5 mb-1" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-2/5" />
    </div>
  );
}

/**
 * Table Loading Skeleton (rows)
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full flex flex-col" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center px-4 py-3 gap-4 border-b border-slate-100">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} className="h-4 flex-1 bg-slate-200 rounded animate-pulse" />
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
