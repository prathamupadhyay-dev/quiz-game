import React, { useEffect, useRef } from 'react';

/**
 * React Bits - Hyperspeed
 * High-performance canvas-based 3D starfield & light-speed tunnel.
 * Transitions from gentle cruising to hyperspace warp on demand.
 */
export default function Hyperspeed({
  isWarping = false,
  starCount = 450,
  speed = 1.2,
  warpSpeed = 28,
  starColor = '#FFFFFF',
  trailColor = '#5E5CE6',
  className = ''
}) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);
  const currentSpeedRef = useRef(speed);
  const starsRef = useRef([]);

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
    window.addEventListener('resize', handleResize);

    // Initialize 3D stars
    const cx = width / 2;
    const cy = height / 2;
    const maxDepth = 1500;

    starsRef.current = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * maxDepth,
      prevZ: maxDepth,
      size: Math.random() * 1.5 + 0.5,
      hue: Math.random() > 0.4 ? '#FFFFFF' : Math.random() > 0.5 ? '#67E8F9' : '#A78BFA'
    }));

    const render = () => {
      // Smoothly interpolate speed towards target
      const targetSpeed = isWarping ? warpSpeed : speed;
      currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.08;
      const curSpeed = currentSpeedRef.current;

      // Dark background with dynamic motion trail
      ctx.fillStyle = isWarping ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      const fov = 350;

      for (let i = 0; i < starsRef.current.length; i++) {
        const star = starsRef.current[i];
        star.prevZ = star.z;
        star.z -= curSpeed;

        // Reset stars that pass the camera
        if (star.z <= 0) {
          star.z = maxDepth;
          star.prevZ = maxDepth;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = fov / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const prevK = fov / star.prevZ;
          const prevPx = star.x * prevK + cx;
          const prevPy = star.y * prevK + cy;

          const alpha = Math.min(1, (1 - star.z / maxDepth) * 1.4);

          // Draw streak trail
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = isWarping ? trailColor : star.hue;
          ctx.lineWidth = isWarping ? star.size * 2 : star.size;
          ctx.globalAlpha = alpha;
          ctx.stroke();

          // Star head dot
          ctx.beginPath();
          ctx.arc(px, py, star.size * (isWarping ? 1.5 : 1), 0, Math.PI * 2);
          ctx.fillStyle = star.hue;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isWarping, starCount, speed, warpSpeed, starColor, trailColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
}
