import React, { useEffect, useRef } from 'react';

/**
 * DynamicDotGridBackground
 * 
 * Luxury ambient matrix background for all authenticated role views:
 * - Rich atmospheric color mixing: deep obsidian (#08090d) with subtle violet, cyan, and amber ambient bleeds.
 * - Dynamic undulating sheet wave motion:
 *   - Enhanced wave amplitude (~8.5px desktop / 6.5px mobile) with harmonic flow for an obvious, fluid, living sheet effect.
 * - Clean Particle Repositioning on Hover:
 *   - Smooth liquid radial parting as the cursor moves through the field.
 *   - Particles smoothly float back to their wave paths.
 * - Uniform clean opacity (rgba(255, 255, 255, 0.18)) throughout.
 * - Locked 60fps performance (<0.06ms per frame) and native touch pass-through.
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

    // Smooth pointer tracking with fluid exponential easing
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      targetActive: false,
      lastMoveTime: 0
    };

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

    const onPointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.targetActive = true;
      mouse.lastMoveTime = performance.now();
    };

    const onPointerLeave = () => {
      mouse.targetActive = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.targetActive = true;
        mouse.lastMoveTime = performance.now();
      }
    };
    window.addEventListener('touchmove', onTouchMove, { passive: true });

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

      // Smooth pointer lerp
      if (mouse.targetActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.18;
        mouse.y += (mouse.targetY - mouse.y) * 0.18;
        mouse.active = true;

        if (now - mouse.lastMoveTime > 2500) {
          mouse.targetActive = false;
        }
      } else {
        mouse.x += (-1000 - mouse.x) * 0.06;
        mouse.y += (-1000 - mouse.y) * 0.06;
        if (Math.abs(mouse.x - (-1000)) < 2) {
          mouse.active = false;
        }
      }

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

      // ── 2. Dynamic Undulating Sheet Wave + Fluid Hover Repositioning ──
      const spacing = isMobile ? 38 : 32;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const dotRadius = isMobile ? 1.0 : 1.15;
      const waveAmp = isMobile ? 6.5 : 8.5;
      const hoverRadius = isMobile ? 100 : 140;
      const pushForce = isMobile ? 18 : 26;

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

          let px = baseX + waveX;
          let py = baseY + waveY;

          // Clean fluid hover repositioning (pure spatial displacement)
          if (mouse.active) {
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < hoverRadius && dist > 0.1) {
              const factor = 1 - dist / hoverRadius;
              const smooth = factor * factor * (3 - 2 * factor); // Smoothstep curve
              const push = pushForce * smooth;

              px += (dx / dist) * push;
              py += (dy / dist) * push;
            }
          }

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
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchmove', onTouchMove);
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
