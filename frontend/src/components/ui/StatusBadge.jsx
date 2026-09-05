import React from 'react';

/**
 * Reusable StatusBadge Component with Tailwind CSS
 * Supported statuses: Active, Inactive, Pending, Approved, Refused, Draft, Paid
 */
export function StatusBadge({ status, label, className = '' }) {
  if (!status && !label) return null;

  const normalizedStatus = (status || label || '').toLowerCase().trim();
  const displayLabel = label || status;

  let variantStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotStyles = 'bg-slate-500';

  if (['active', 'approved', 'paid'].includes(normalizedStatus)) {
    variantStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotStyles = 'bg-emerald-600';
  } else if (['pending', 'draft'].includes(normalizedStatus)) {
    variantStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotStyles = 'bg-amber-600';
  } else if (['refused', 'rejected'].includes(normalizedStatus)) {
    variantStyles = 'bg-red-50 text-red-800 border-red-200';
    dotStyles = 'bg-red-600';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap select-none ${variantStyles} ${className}`.trim()}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles}`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
