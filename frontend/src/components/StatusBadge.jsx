import React from 'react';

export function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toString().toLowerCase();

  let variant = 'badge-neutral';

  if (['active', 'approved', 'paid', 'computed', 'validated', 'present'].includes(normalized)) {
    variant = 'badge-success';
  } else if (['draft', 'pending', 'late', 'half day', 'flexible', 'standard'].includes(normalized)) {
    variant = 'badge-warning';
  } else if (['cancelled', 'refused', 'terminated', 'absent', 'missing check-out', 'closed'].includes(normalized)) {
    variant = 'badge-danger';
  } else if (['on leave', 'manual edits', 'overtime', 'part-time', 'full-time', 'intern'].includes(normalized)) {
    variant = 'badge-info';
  }

  return <span className={`badge ${variant}`}>{status}</span>;
}

export default StatusBadge;
