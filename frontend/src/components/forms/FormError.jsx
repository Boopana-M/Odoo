import React from 'react';
import { AlertCircle } from 'lucide-react';
import './Form.css';

/**
 * Reusable FormError Component
 */
export function FormError({ message, id, className = '' }) {
  if (!message) return null;

  return (
    <div id={id} className={`form-error-text ${className}`.trim()} role="alert">
      <AlertCircle size={13} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default FormError;
