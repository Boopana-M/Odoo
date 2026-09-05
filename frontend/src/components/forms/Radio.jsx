import React from 'react';

/**
 * Reusable Radio Component with Tailwind CSS
 */
export function Radio({
  id,
  name,
  value,
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
      className={`inline-flex items-start gap-2.5 cursor-pointer select-none text-sm text-slate-900 ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`.trim()}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 mt-0.5 rounded-full border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600/30 focus:ring-offset-0 shrink-0 cursor-pointer disabled:cursor-not-allowed"
        {...props}
      />
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="font-medium text-slate-800">{label}</span>}
          {description && <span className="text-xs text-slate-500 mt-0.5">{description}</span>}
        </span>
      )}
    </label>
  );
}

export default Radio;
