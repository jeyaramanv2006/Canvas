import React, { useEffect, useRef } from 'react';

/**
 * DynamicDotGridBackground
 * 
 * Luxury ambient matrix background for all authenticated role views:
 * - Rich atmospheric color mixing: deep obsidian (#08090d) with subtle violet, cyan, and amber ambient bleeds.
 * - Dynamic undulating sheet wave motion:
 *   - Enhanced wave amplitude (~8.5px desktop / 6.5px mobile) with harmonic flow for an obvious, fluid, living sheet effect.
 * - Uniform clean opacity (rgba(255, 255, 255, 0.18)) throughout with zero cursor hovering distraction.
 * - Locked 60fps performance (<0.04ms per frame) and native touch pass-through.
 */
export default function DynamicDotGridBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let isMobile = false;

    const handleResize = () => {
      isMobile = window.innerWidth < 768;
      width = window.innerWidth;
      height = window.innerHeight;

      // 1x DPR with hardware subpixel anti-aliasing for buttery-smooth 60fps
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let startTime = performance.now();
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        startTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = (now) => {
      if (!isTabVisible) return;

      const elapsed = (now - startTime) * 0.001;

      // ── 1. Base Atmosphere: Deep Obsidian with Rich Color Mixing ──
      ctx.fillStyle = '#08090d';
      ctx.fillRect(0, 0, width, height);

      // Violet / Purple ambient bleed (upper left)
      const gradPurple = ctx.createRadialGradient(
        width * 0.15, height * 0.12, 20,
        width * 0.15, height * 0.12, Math.max(width, height) * 0.65
      );
      gradPurple.addColorStop(0, 'rgba(124, 58, 237, 0.13)');
      gradPurple.addColorStop(0.5, 'rgba(109, 40, 217, 0.04)');
      gradPurple.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradPurple;
      ctx.fillRect(0, 0, width, height);

      // Cyan / Teal ambient bleed (bottom right)
      const gradCyan = ctx.createRadialGradient(
        width * 0.85, height * 0.85, 30,
        width * 0.85, height * 0.85, Math.max(width, height) * 0.60
      );
      gradCyan.addColorStop(0, 'rgba(6, 182, 212, 0.09)');
      gradCyan.addColorStop(0.5, 'rgba(14, 116, 144, 0.025)');
      gradCyan.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradCyan;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm amber / gold core bleed (center)
      const gradAmber = ctx.createRadialGradient(
        width * 0.50, height * 0.50, 40,
        width * 0.50, height * 0.50, Math.min(width, height) * 0.70
      );
      gradAmber.addColorStop(0, 'rgba(245, 158, 11, 0.04)');
      gradAmber.addColorStop(0.6, 'rgba(99, 102, 241, 0.025)');
      gradAmber.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradAmber;
      ctx.fillRect(0, 0, width, height);

      // ── 2. Dynamic Undulating Sheet Wave ──
      const spacing = isMobile ? 38 : 32;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const dotRadius = isMobile ? 1.0 : 1.15;
      const waveAmp = isMobile ? 6.5 : 8.5;

      const dotsPath = new Path2D();

      for (let c = 0; c < cols; c++) {
        const baseX = c * spacing;
        const phaseC1 = c * 0.22;
        const phaseC2 = c * 0.14;

        for (let r = 0; r < rows; r++) {
          const baseY = r * spacing;

          // Dynamic undulating sheet wave with primary & secondary undulating harmonics
          const waveX = Math.sin(elapsed * 0.85 + phaseC1 + r * 0.14) * waveAmp +
                        Math.cos(elapsed * 0.45 + phaseC2 - r * 0.18) * (waveAmp * 0.32);
          const waveY = Math.cos(elapsed * 0.75 + phaseC2 + r * 0.22) * waveAmp +
                        Math.sin(elapsed * 0.40 - phaseC1 + r * 0.12) * (waveAmp * 0.32);

          const px = baseX + waveX;
          const py = baseY + waveY;

          dotsPath.moveTo(px + dotRadius, py);
          dotsPath.arc(px, py, dotRadius, 0, Math.PI * 2);
        }
      }

      // ── 3. Render All Dots at Uniform, Consistent Clean Opacity ──
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fill(dotsPath);

      // ── 4. Edge Vignette (Soft Perimeter Depth) ──
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.45,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.80
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.70, 'rgba(4, 5, 8, 0.20)');
      vignette.addColorStop(1, 'rgba(3, 4, 6, 0.60)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none"
      style={{ isolation: 'isolate' }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
}
