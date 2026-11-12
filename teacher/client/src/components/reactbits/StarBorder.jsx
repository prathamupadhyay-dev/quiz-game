import React from 'react';

/**
 * React Bits - StarBorder
 * An animated cosmic glowing border that loops around the element.
 */
export default function StarBorder({
  as: Component = 'button',
  className = '',
  innerClassName = '',
  color = '#5E5CE6',
  speed = '4s',
  children,
  ...props
}) {
  return (
    <Component
      className={`relative inline-block py-[1px] overflow-hidden rounded-full ${className}`}
      {...props}
    >
      {/* Outer spinning light beam */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-reverse pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />

      {/* Inner surface */}
      <div className={`relative z-1 bg-[#141416]/90 hover:bg-[#1C1C1E]/95 text-white border border-white/10 rounded-full transition-all ${innerClassName}`}>
        {children}
      </div>
    </Component>
  );
}
