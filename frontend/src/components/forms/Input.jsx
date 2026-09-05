import React from 'react';

/**
 * Reusable Input Component with Tailwind CSS
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

  const baseInputClasses =
    'w-full h-[38px] px-3 py-2 text-sm text-slate-900 bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200';

  const stateClasses = isError
    ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20';

  const paddingClasses = `${hasLeftIcon ? 'pl-9' : ''} ${hasRightIcon ? 'pr-9' : ''}`;

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
      className={`${baseInputClasses} ${stateClasses} ${paddingClasses} ${className}`.trim()}
      {...props}
    />
  );

  if (hasLeftIcon || hasRightIcon) {
    return (
      <div className="relative flex items-center w-full">
        {hasLeftIcon && (
          <div className="absolute left-3 flex items-center justify-center text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        {inputElement}
        {hasRightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-slate-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }

  return inputElement;
}

export default Input;
