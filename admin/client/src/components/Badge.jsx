import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  className = ''
}) {
  const variantStyles = {
    neutral: 'bg-surface-2 text-label-2 border border-separator/40',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    admin: 'bg-accent/15 text-accent border border-accent/30',
    creator: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    presentor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    teacher: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    principal: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    moderator: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    user: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    student: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    green: 'bg-green/15 text-green border border-green/30',
    active: 'bg-green/15 text-green border border-green/30',
    red: 'bg-red/15 text-red border border-red/30',
    disabled: 'bg-red/15 text-red border border-red/30',
    blue: 'bg-blue/15 text-blue border border-blue/30',
    yellow: 'bg-yellow/15 text-yellow border border-yellow/30'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-footnote font-medium select-none ${
        variantStyles[variant] || variantStyles.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
