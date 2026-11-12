import React from 'react';

export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  id
}) {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-1 min-h-[44px]">
      {(label || description) && (
        <div className="flex flex-col cursor-pointer select-none" onClick={handleToggle}>
          {label && <span className="text-body-ios text-label font-medium">{label}</span>}
          {description && <span className="text-footnote text-label-2">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex h-[28px] w-[48px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-ios focus:outline-none focus:ring-[3px] focus:ring-accent disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'bg-green' : 'bg-surface-2 border border-separator/40'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-ios ${
            checked ? 'translate-x-[20px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
