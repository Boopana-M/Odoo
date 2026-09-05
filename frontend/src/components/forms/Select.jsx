import React from 'react';

/**
 * Reusable Select Component with Tailwind CSS
 */
export function Select({
  id,
  name,
  value,
  defaultValue,
  options = [],
  children,
  placeholder,
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
    'w-full h-[38px] px-3 py-2 text-sm text-slate-900 bg-white border rounded-md transition-colors appearance-none pr-9 bg-no-repeat bg-[right_0.75rem_center] cursor-pointer focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200';

  const stateClasses = isError
    ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20';

  return (
    <select
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      aria-invalid={isError}
      aria-describedby={ariaDescribedBy}
      onChange={onChange}
      onBlur={onBlur}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      }}
      className={`${baseClasses} ${stateClasses} ${className}`.trim()}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options && options.length > 0
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
}

export default Select;
