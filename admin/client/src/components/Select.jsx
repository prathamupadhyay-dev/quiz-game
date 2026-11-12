import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  error,
  options = [],
  value,
  onChange,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-subheadline text-label-2 font-medium">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={`h-11 w-full bg-surface-2 text-label rounded-field border border-separator/50 px-3.5 pr-10 text-body-ios transition-all duration-200 appearance-none focus:outline-none focus:ring-[3px] focus:ring-accent focus:border-transparent ${error ? 'border-red focus:ring-red' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-label">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 text-label-3 pointer-events-none flex items-center">
          <ChevronDown size={18} strokeWidth={1.75} />
        </div>
      </div>
      {error && <span className="text-footnote text-red">{error}</span>}
    </div>
  );
}
