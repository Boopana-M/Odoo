import React from 'react';
import './Form.css';

/**
 * Reusable Checkbox Component
 */
export function Checkbox({
  id,
  name,
  checked,
  defaultChecked,
  disabled = false,
  label,
  description,
  onChange,
  className = '',
  ...props
}) {
  return (
    <label
      htmlFor={id}
      className={`form-check ${disabled ? 'form-check--disabled' : ''} ${className}`.trim()}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
        className="form-check-input form-check-input--checkbox"
        {...props}
      />
      {(label || description) && (
        <span className="form-check__label-content">
          {label && <span className="form-check__label">{label}</span>}
          {description && <span className="form-check__description">{description}</span>}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
