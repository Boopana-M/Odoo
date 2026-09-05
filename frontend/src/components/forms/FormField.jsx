import React from 'react';
import { FormLabel } from './FormLabel';
import { FormError } from './FormError';

/**
 * Reusable FormField wrapper component with Tailwind CSS
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
    <div className={`flex flex-col gap-0.5 mb-4 w-full ${className}`.trim()}>
      {label && (
        <FormLabel htmlFor={htmlFor} required={required} optional={optional}>
          {label}
        </FormLabel>
      )}

      {children}

      {helperText && !error && (
        <p id={helperId} className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      )}

      {error && <FormError id={errorId} message={error} />}
    </div>
  );
}

export default FormField;
