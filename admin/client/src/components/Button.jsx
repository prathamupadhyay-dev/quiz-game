import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = 'btn-motion inline-flex items-center justify-center rounded-full font-medium select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'h-8 px-3 text-footnote gap-1.5',
    md: 'h-11 px-5 text-subheadline gap-2',
    lg: 'h-12 px-6 text-headline gap-2.5'
  };

  const variantClasses = {
    primary: 'bg-accent text-label shadow-sm',
    secondary: 'bg-surface-2 text-label border border-separator/40 hover:border-separator',
    danger: 'bg-red/15 text-red border border-red/30 hover:bg-red/25',
    ghost: 'bg-transparent text-label-2 hover:text-label hover:bg-white/5',
    glass: 'glass-panel text-label hover:bg-white/10'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
