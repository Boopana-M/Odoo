import React from 'react';
import './StatusBadge.css';

/**
 * Reusable StatusBadge Component
 * Supported statuses: Active, Inactive, Pending, Approved, Refused, Draft, Paid
 */
export function StatusBadge({ status, label, className = '' }) {
  if (!status && !label) return null;

  const normalizedStatus = (status || label || '').toLowerCase().trim();
  const displayLabel = label || status;

  // Map known statuses
  let variant = 'inactive';
  if (['active', 'approved', 'paid'].includes(normalizedStatus)) {
    variant = normalizedStatus;
  } else if (['pending', 'draft'].includes(normalizedStatus)) {
    variant = normalizedStatus;
  } else if (['refused', 'rejected'].includes(normalizedStatus)) {
    variant = 'refused';
  } else if (['inactive', 'cancelled'].includes(normalizedStatus)) {
    variant = 'inactive';
  }

  return (
    <span className={`status-badge status-badge--${variant} ${className}`.trim()} role="status">
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
