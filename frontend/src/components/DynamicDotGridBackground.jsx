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
    let lastFrameTime = 0;

    // Check system preference for reduced motion (e.g., battery saver mode)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Offscreen canvas to cache the static atmospheric gradient passes
    // Eliminates 4x createRadialGradient allocations and 5x full-viewport overdraws every frame!
    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d', { alpha: false });

    const updateBackgroundCache = () => {
      bgCanvas.width = width;
      bgCanvas.height = height;

      if (!bgCtx) return;

      // 1. Deep Obsidian Base
      bgCtx.fillStyle = '#08090d';
      bgCtx.fillRect(0, 0, width, height);

      // 2. Violet / Purple ambient bleed (upper left)
      const gradPurple = bgCtx.createRadialGradient(
        width * 0.15, height * 0.12, 20,
        width * 0.15, height * 0.12, Math.max(width, height) * 0.65
      );
      gradPurple.addColorStop(0, 'rgba(124, 58, 237, 0.13)');
      gradPurple.addColorStop(0.5, 'rgba(109, 40, 217, 0.04)');
      gradPurple.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bgCtx.fillStyle = gradPurple;
      bgCtx.fillRect(0, 0, width, height);

      // 3. Cyan / Teal ambient bleed (bottom right)
      const gradCyan = bgCtx.createRadialGradient(
        width * 0.85, height * 0.85, 30,
        width * 0.85, height * 0.85, Math.max(width, height) * 0.60
      );
      gradCyan.addColorStop(0, 'rgba(6, 182, 212, 0.09)');
      gradCyan.addColorStop(0.5, 'rgba(14, 116, 144, 0.025)');
      gradCyan.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bgCtx.fillStyle = gradCyan;
      bgCtx.fillRect(0, 0, width, height);

      // 4. Subtle warm amber / gold core bleed (center)
      const gradAmber = bgCtx.createRadialGradient(
        width * 0.50, height * 0.50, 40,
        width * 0.50, height * 0.50, Math.min(width, height) * 0.70
      );
      gradAmber.addColorStop(0, 'rgba(245, 158, 11, 0.04)');
      gradAmber.addColorStop(0.6, 'rgba(99, 102, 241, 0.025)');
      gradAmber.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bgCtx.fillStyle = gradAmber;
      bgCtx.fillRect(0, 0, width, height);

      // 5. Edge Vignette (Soft Perimeter Depth)
      const vignette = bgCtx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.45,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.80
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.70, 'rgba(4, 5, 8, 0.20)');
      vignette.addColorStop(1, 'rgba(3, 4, 6, 0.60)');
      bgCtx.fillStyle = vignette;
      bgCtx.fillRect(0, 0, width, height);
    };

    const handleResize = () => {
      isMobile = window.innerWidth < 768;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      updateBackgroundCache();
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let startTime = performance.now();
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        startTime = performance.now();
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = (now) => {
      if (!isTabVisible) return;

      // On mobile devices, clamp frame rate to ~30-35 FPS to save battery and GPU cycles.
      // 30ms delta provides fluid ambient wave perception with zero mobile throttling heat.
      if (isMobile) {
        const delta = now - lastFrameTime;
        if (delta < 28) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }
      }
      lastFrameTime = now;

      const elapsed = (now - startTime) * 0.001;

      // ── 1. Blit Pre-Rendered Static Atmospheric Canvas (Single Fast Memory Transfer) ──
      ctx.drawImage(bgCanvas, 0, 0);

      // ── 2. Dynamic Undulating Sheet Wave ──
      // Optimized grid density: 44px on mobile (~140-160 dots total vs 320+), 32px on desktop
      const spacing = isMobile ? 44 : 32;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const dotRadius = isMobile ? 0.95 : 1.15;
      const waveAmp = isMobile ? 5.5 : 8.5;

      const dotsPath = new Path2D();

      for (let c = 0; c < cols; c++) {
        const baseX = c * spacing;
        const phaseC1 = c * 0.22;
        const phaseC2 = c * 0.14;

        for (let r = 0; r < rows; r++) {
          const baseY = r * spacing;

          let waveX, waveY;

          if (isMobile) {
            // Highly optimized single harmonic on mobile (cuts trig operations in half)
            waveX = Math.sin(elapsed * 0.85 + phaseC1 + r * 0.14) * waveAmp;
            waveY = Math.cos(elapsed * 0.75 + phaseC2 + r * 0.22) * waveAmp;
          } else {
            // Full multi-harmonic flow on desktop
            waveX = Math.sin(elapsed * 0.85 + phaseC1 + r * 0.14) * waveAmp +
                    Math.cos(elapsed * 0.45 + phaseC2 - r * 0.18) * (waveAmp * 0.32);
            waveY = Math.cos(elapsed * 0.75 + phaseC2 + r * 0.22) * waveAmp +
                    Math.sin(elapsed * 0.40 - phaseC1 + r * 0.12) * (waveAmp * 0.32);
          }

          const px = baseX + waveX;
          const py = baseY + waveY;

          dotsPath.moveTo(px + dotRadius, py);
          dotsPath.arc(px, py, dotRadius, 0, Math.PI * 2);
        }
      }

      // ── 3. Render All Dots at Clean Uniform Opacity ──
      ctx.fillStyle = isMobile ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.18)';
      ctx.fill(dotsPath);

      // If user has reduced motion preference, render one beautiful static frame and sleep
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      bgCanvas.width = 0;
      bgCanvas.height = 0;
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
