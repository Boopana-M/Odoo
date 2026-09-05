import React from 'react';
import { Calendar } from 'lucide-react';
import { Input } from './Input';

/**
 * Reusable DateInput Component with Tailwind CSS
 */
export function DateInput({
  id,
  name,
  value,
  defaultValue,
  disabled = false,
  required = false,
  error = false,
  onChange,
  className = '',
  ...props
}) {
  return (
    <Input
      id={id}
      name={name}
      type="date"
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      error={error}
      rightIcon={<Calendar size={16} />}
      onChange={onChange}
      className={className}
      {...props}
    />
  );
}

export default DateInput;
