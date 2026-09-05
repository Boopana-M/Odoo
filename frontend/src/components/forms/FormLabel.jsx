import React from 'react';
import './Form.css';

/**
 * Reusable FormLabel Component
 */
export function FormLabel({
  children,
  htmlFor,
  required = false,
  optional = false,
  className = '',
}) {
  if (!children) return null;

  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`.trim()}>
      {children}
      {required && <span className="form-label__required" aria-hidden="true">*</span>}
      {optional && <span className="form-label__optional">(Optional)</span>}
    </label>
  );
}

export default FormLabel;
