import React, { useRef, useEffect } from 'react';

/**
 * React Bits - Squares
 * Cyberpunk interactive grid background with hover glow and diagonal drift.
 */
export default function Squares({
  direction = 'diagonal', // 'diagonal' | 'up' | 'down' | 'left' | 'right'
  speed = 0.5,
  borderColor = 'rgba(255, 255, 255, 0.05)',
  squareSize = 40,
  hoverFillColor = 'rgba(94, 92, 230, 0.22)',
  className = ''
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let animId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Drift offset
      if (direction === 'diagonal') {
        offsetRef.current.x = (offsetRef.current.x + speed) % squareSize;
        offsetRef.current.y = (offsetRef.current.y + speed) % squareSize;
      }

      const startX = -squareSize + (offsetRef.current.x % squareSize);
      const startY = -squareSize + (offsetRef.current.y % squareSize);

      for (let x = startX; x < width + squareSize; x += squareSize) {
        for (let y = startY; y < height + squareSize; y += squareSize) {
          // Check hover proximity
          const dx = mouseRef.current.x - (x + squareSize / 2);
          const dy = mouseRef.current.y - (y + squareSize / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < squareSize * 1.8) {
            const intensity = 1 - dist / (squareSize * 1.8);
            ctx.fillStyle = hoverFillColor;
            ctx.globalAlpha = intensity * 0.8;
            ctx.fillRect(x, y, squareSize, squareSize);
            ctx.globalAlpha = 1;
          }

          // Grid wireframe
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, squareSize, squareSize);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [direction, speed, borderColor, squareSize, hoverFillColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto z-0 ${className}`}
    />
  );
}
