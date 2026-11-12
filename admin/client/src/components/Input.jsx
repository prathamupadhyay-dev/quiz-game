import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  icon: Icon,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-subheadline text-label-2 font-medium">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3.5 text-label-3 pointer-events-none flex items-center">
            <Icon size={18} strokeWidth={1.75} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`h-11 w-full bg-surface-2 text-label placeholder:text-label-3 rounded-field border border-separator/50 px-3.5 text-body-ios transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-accent focus:border-transparent ${Icon ? 'pl-10' : ''} ${error ? 'border-red focus:ring-red' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-footnote text-red">{error}</span>}
      {!error && helperText && <span className="text-footnote text-label-3">{helperText}</span>}
    </div>
  );
}
