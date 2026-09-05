import React from 'react';

/**
 * Reusable Textarea Component with Tailwind CSS
 */
export function Textarea({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  rows = 3,
  disabled = false,
  required = false,
  error = false,
  onChange,
  onBlur,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  const isError = Boolean(error);

  const baseClasses =
    'w-full min-h-[80px] px-3 py-2 text-sm text-slate-900 bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-y disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200';

  const stateClasses = isError
    ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20';

  return (
    <textarea
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      aria-invalid={isError}
      aria-describedby={ariaDescribedBy}
      onChange={onChange}
      onBlur={onBlur}
      className={`${baseClasses} ${stateClasses} ${className}`.trim()}
      {...props}
    />
  );
}

export default Textarea;
