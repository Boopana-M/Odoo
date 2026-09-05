import React from 'react';
import './Form.css';

/**
 * Reusable Input Component
 * Supports: text, email, password, number, search, tel, url, etc.
 * Features: leftIcon, rightIcon, error state, disabled state
 */
export function Input({
  id,
  name,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  required = false,
  error = false,
  leftIcon = null,
  rightIcon = null,
  onChange,
  onBlur,
  onFocus,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  const isError = Boolean(error);
  const hasLeftIcon = Boolean(leftIcon);
  const hasRightIcon = Boolean(rightIcon);

  const inputClasses = [
    'form-input',
    isError ? 'form-input--error' : '',
    hasLeftIcon ? 'form-input--has-left-icon' : '',
    hasRightIcon ? 'form-input--has-right-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputElement = (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      aria-invalid={isError}
      aria-describedby={ariaDescribedBy}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      className={inputClasses}
      {...props}
    />
  );

  if (hasLeftIcon || hasRightIcon) {
    return (
      <div className="form-input-wrapper">
        {hasLeftIcon && <div className="form-input-icon form-input-icon--left">{leftIcon}</div>}
        {inputElement}
        {hasRightIcon && <div className="form-input-icon form-input-icon--right">{rightIcon}</div>}
      </div>
    );
  }

  return inputElement;
}

export default Input;
