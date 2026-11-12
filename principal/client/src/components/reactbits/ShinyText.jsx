import React from 'react';

/**
 * React Bits - ShinyText
 * Holographic continuous light-sweep effect across typography.
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = ''
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block text-transparent bg-clip-text select-none ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.4) 100%)',
        backgroundSize: '200% 100%',
        animation: disabled ? 'none' : `shine ${animationDuration} linear infinite`
      }}
    >
      {text}
    </span>
  );
}
