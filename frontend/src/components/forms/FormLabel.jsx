import React from 'react';

/**
 * Reusable FormLabel Component with Tailwind CSS
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
    <label htmlFor={htmlFor} className={`inline-flex items-center text-sm font-medium text-slate-900 mb-1 ${className}`.trim()}>
      {children}
      {required && <span className="text-red-600 ml-1 font-bold" aria-hidden="true">*</span>}
      {optional && <span className="text-slate-400 text-xs font-normal ml-1">(Optional)</span>}
    </label>
  );
}

export default FormLabel;
