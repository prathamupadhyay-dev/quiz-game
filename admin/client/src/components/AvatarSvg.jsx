import React from 'react';

export default function AvatarSvg({
  shape = 'circle',
  color = '#5E5CE6',
  accentColor = '#0A84FF',
  size = 40,
  className = ''
}) {
  const half = size / 2;
  const strokeWidth = 2;

  const renderShape = () => {
    switch (shape) {
      case 'square':
        return (
          <rect
            x={size * 0.15}
            y={size * 0.15}
            width={size * 0.7}
            height={size * 0.7}
            rx={size * 0.15}
            fill={color}
            stroke={accentColor}
            strokeWidth={strokeWidth}
          />
        );

      case 'triangle': {
        const top = `${half},${size * 0.15}`;
        const right = `${size * 0.85},${size * 0.82}`;
        const left = `${size * 0.15},${size * 0.82}`;
        return (
          <polygon
            points={`${top} ${right} ${left}`}
            fill={color}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      }

      case 'diamond': {
        const top = `${half},${size * 0.12}`;
        const right = `${size * 0.88},${half}`;
        const bottom = `${half},${size * 0.88}`;
        const left = `${size * 0.12},${half}`;
        return (
          <polygon
            points={`${top} ${right} ${bottom} ${left}`}
            fill={color}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      }

      case 'hexagon': {
        const p1 = `${half},${size * 0.12}`;
        const p2 = `${size * 0.85},${size * 0.3}`;
        const p3 = `${size * 0.85},${size * 0.7}`;
        const p4 = `${half},${size * 0.88}`;
        const p5 = `${size * 0.15},${size * 0.7}`;
        const p6 = `${size * 0.15},${size * 0.3}`;
        return (
          <polygon
            points={`${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`}
            fill={color}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      }

      case 'star': {
        // 5-pointed star points calculated for 0..1 ratio
        const cx = half;
        const cy = half;
        const outerR = size * 0.38;
        const innerR = size * 0.18;
        const points = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill={color}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      }

      case 'circle':
      default:
        return (
          <circle
            cx={half}
            cy={half}
            r={size * 0.35}
            fill={color}
            stroke={accentColor}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`inline-block shrink-0 ${className}`}
      aria-label={`${shape} avatar`}
    >
      {renderShape()}
    </svg>
  );
}
