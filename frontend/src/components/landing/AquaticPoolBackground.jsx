import React, { useEffect, useRef } from 'react';

/**
 * AquaticPoolBackground:
 * A high-performance canvas-based dynamic water caustics & ripple simulation.
 * It produces realistic swimming pool caustics with sunlight refractions,
 * interactive wave disturbances, depth falloffs, and responsive resolution management.
 */
export const AquaticPoolBackground = ({ scrolling = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let time = 0;
    let lastFrame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPowerViewport = window.innerWidth < 768;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // Downscale slightly for rendering performance, then stretch smoothly
      const dpr = Math.min(window.devicePixelRatio || 1, lowPowerViewport ? 1 : 1.25);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Wave parameters
    const render = (timestamp = 0) => {
      if (document.hidden) return;
      if (timestamp - lastFrame < 40) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastFrame = timestamp;
      time += 0.012;

      // Base gradient deep pool water
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#041726');
      grad.addColorStop(0.35, '#06263e');
      grad.addColorStop(0.7, '#083c5d');
      grad.addColorStop(1, '#051e33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Swimming pool tiled lane subtle lines
      ctx.save();
      ctx.strokeStyle = 'rgba(22, 184, 176, 0.04)';
      ctx.lineWidth = 1.5;
      const laneStep = 90;
      for (let x = -height; x < width + height; x += laneStep) {
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(time + x * 0.01) * 12, 0);
        ctx.lineTo(x + height * 0.7 + Math.sin(time * 0.8 + x * 0.01) * 12, height);
        ctx.stroke();
      }
      ctx.restore();

      // Fluid Caustic Voronoi / Perlin approximation with harmonic sine wave ribbons
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const numRays = 8;
      for (let i = 0; i < numRays; i++) {
        const offset = (i / numRays) * Math.PI * 2;
        const waveX = Math.sin(time * 0.7 + offset) * 120 + (width * i) / numRays;
        const waveY = Math.cos(time * 0.5 + offset * 1.5) * 80 + height * 0.35;
        const radius = 220 + Math.sin(time + i) * 60;

        const radial = ctx.createRadialGradient(waveX, waveY, 10, waveX, waveY, radius);
        radial.addColorStop(0, 'rgba(94, 234, 212, 0.14)');
        radial.addColorStop(0.4, 'rgba(8, 126, 164, 0.08)');
        radial.addColorStop(1, 'rgba(8, 59, 92, 0)');

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(waveX, waveY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic surface light webs (Pool caustics net)
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.08)';
      ctx.lineWidth = 2.2;
      const cols = 7;
      const rows = 5;
      const cellW = width / cols;
      const cellH = height / rows;

      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
          const px = c * cellW + Math.sin(time * 1.5 + r * 1.2 + c * 0.7) * 24;
          const py = r * cellH + Math.cos(time * 1.2 + c * 1.1 + r * 0.6) * 18;
          if (r === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const px = c * cellW + Math.sin(time * 1.5 + r * 1.2 + c * 0.7) * 24;
          const py = r * cellH + Math.cos(time * 1.2 + c * 1.1 + r * 0.6) * 18;
          if (c === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.restore();

      if (!reducedMotion) animationFrameId = requestAnimationFrame(render);
    };

    render();
    const handleVisibilityChange = () => {
      if (!document.hidden && !reducedMotion) animationFrameId = requestAnimationFrame(render);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className={`landing-water ${scrolling ? 'landing-water--scrolling' : 'landing-water--fixed'} pointer-events-none z-0 overflow-hidden`}
      aria-hidden="true"
      style={{
        backgroundImage: 'linear-gradient(180deg, rgba(224, 246, 244, .16), rgba(167, 222, 222, .22)), url("/images/olympic-pool-aerial.webp")',
      }}
    >
      <canvas
        ref={canvasRef}
        className="landing-water__caustics w-full h-full object-cover transition-opacity duration-1000 opacity-25"
      />
      <div className="landing-water__light absolute inset-0 pointer-events-none" />
    </div>
  );
};
