import React from 'react';
import './Form.css';

/**
 * Reusable Select Component
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
  const selectClasses = [
    'form-select',
    isError ? 'form-select--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
      className={selectClasses}
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
