import React from 'react';

export default function SegmentedControl({
  segments = [],
  value,
  onChange,
  className = ''
}) {
  return (
    <div className={`inline-flex items-center bg-surface-2 p-1 rounded-full border border-separator/40 ${className}`}>
      {segments.map((seg) => {
        const isActive = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            onClick={() => onChange(seg.value)}
            className={`btn-motion min-h-[36px] px-4 rounded-full text-subheadline font-medium transition-all duration-250 ease-ios select-none ${
              isActive
                ? 'bg-accent text-label shadow-sm'
                : 'text-label-2 hover:text-label hover:bg-white/5'
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
