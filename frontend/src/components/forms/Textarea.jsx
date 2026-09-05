import React from 'react';
import './Form.css';

/**
 * Reusable Textarea Component
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
  const textareaClasses = [
    'form-textarea',
    isError ? 'form-textarea--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
      className={textareaClasses}
      {...props}
    />
  );
}

export default Textarea;
