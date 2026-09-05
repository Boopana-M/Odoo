import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable FormError Component with Tailwind CSS
 */
export function FormError({ message, id, className = '' }) {
  if (!message) return null;

  return (
    <div id={id} className={`inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1 ${className}`.trim()} role="alert">
      <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default FormError;
