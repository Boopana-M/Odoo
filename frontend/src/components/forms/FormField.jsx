import React from 'react';
import { FormLabel } from './FormLabel';
import { FormError } from './FormError';
import './Form.css';

/**
 * Reusable FormField wrapper component
 * Connects label, input, helper text, and error messages with proper accessibility attributes
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  optional = false,
  error,
  helperText,
  children,
  className = '',
}) {
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const helperId = htmlFor && helperText ? `${htmlFor}-helper` : undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <FormLabel htmlFor={htmlFor} required={required} optional={optional}>
          {label}
        </FormLabel>
      )}

      {children}

      {helperText && !error && (
        <p id={helperId} className="form-helper-text">
          {helperText}
        </p>
      )}

      {error && <FormError id={errorId} message={error} />}
    </div>
  );
}

export default FormField;
