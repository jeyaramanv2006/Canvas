import React, { useEffect, useRef } from 'react';

/**
 * TopographicBackground
 * 
 * Luxury topographic command-center background:
 * - Complete 360° screen coverage including bottom-right, all corners, and connective ridges.
 * - Subdued, non-intrusive atmospheric contrast: looks unmistakably like a deep recessed background,
 *   never interfering with foreground text, numbers, or interactive cards.
 * - Buttery-smooth 60fps performance: eliminates expensive CPU shadowBlur in favor of
 *   two-pass hardware-accelerated neon layering; batched draw calls; 1x/1.25x DPR clamp.
 * - Tactile hover interaction with smoothed spring-damped elevation warping and flashlight illumination.
 * - Fully non-blocking (pointer-events-none) for 100% native mobile touch and desktop click handling.
 */
export default function TopographicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isMobile = false;

    // Smooth lerp pointer tracking
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
      // Cap DPR to 1 on desktop and mobile for zero-lag 60fps locked rendering
      // Canvas subpixel anti-aliasing keeps lines razor-sharp at 1x with 4x less fillrate
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
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

    // Features definition covering all screen quadrants (including bottom-right)
    const getFeatures = (w, h, isMob) => {
      if (isMob) {
        return [
          {
            // Center-left primary mountain
            cx: w * 0.45,
            cy: h * 0.40,
            scaleX: 1.0,
            scaleY: 0.85,
            rotation: 0.35,
            rings: 11,
            maxRadius: Math.min(w, h) * 0.58,
            harmonics: [
              { freq: 2, amp: 0.18, speed: 0.28, phase: 0 },
              { freq: 3, amp: 0.11, speed: -0.38, phase: 1.2 }
            ],
            amberRings: [3, 7],
            beacons: [
              { ringIndex: 3, angle: 1.3, color: 'mint' },
              { ringIndex: 5, angle: 3.2, color: 'amber' }
            ]
          },
          {
            // Top Right Peak
            cx: w * 0.82,
            cy: h * 0.18,
            scaleX: 0.9,
            scaleY: 0.8,
            rotation: -0.4,
            rings: 6,
            maxRadius: Math.min(w, h) * 0.34,
            harmonics: [
              { freq: 2, amp: 0.2, speed: -0.25, phase: 0.8 }
            ],
            amberRings: [2],
            beacons: [{ ringIndex: 2, angle: 2.8, color: 'amber' }]
          },
          {
            // Bottom Right System (Guarantees complete coverage on mobile)
            cx: w * 0.80,
            cy: h * 0.78,
            scaleX: 1.05,
            scaleY: 0.8,
            rotation: 0.3,
            rings: 7,
            maxRadius: Math.min(w, h) * 0.40,
            harmonics: [
              { freq: 2, amp: 0.18, speed: 0.3, phase: 1.4 },
              { freq: 3, amp: 0.08, speed: -0.4, phase: 2.1 }
            ],
            amberRings: [3],
            beacons: [{ ringIndex: 3, angle: 4.2, color: 'mint' }]
          },
          {
            // Bottom Left Shelf
            cx: w * 0.15,
            cy: h * 0.82,
            scaleX: 1.1,
            scaleY: 0.75,
            rotation: 0.5,
            rings: 6,
            maxRadius: Math.min(w, h) * 0.36,
            harmonics: [
              { freq: 2, amp: 0.16, speed: 0.22, phase: 1.5 }
            ],
            amberRings: [4],
            beacons: []
          }
        ];
      }

      // Desktop Configuration (Full 360° Balanced Canvas Coverage)
      return [
        {
          // 1. Primary Central Mountain (Signature formation)
          cx: w * 0.44,
          cy: h * 0.48,
          scaleX: 1.06,
          scaleY: 0.84,
          rotation: 0.36,
          rings: 14,
          maxRadius: Math.min(w, h) * 0.52,
          harmonics: [
            { freq: 2, amp: 0.20, speed: 0.24, phase: 0 },
            { freq: 3, amp: 0.12, speed: -0.32, phase: 1.4 },
            { freq: 5, amp: 0.05, speed: 0.45, phase: 2.8 }
          ],
          amberRings: [4, 8, 12],
          beacons: [
            { ringIndex: 2, angle: 1.4, color: 'mint' },
            { ringIndex: 4, angle: 2.9, color: 'amber' },
            { ringIndex: 6, angle: 4.2, color: 'mint' },
            { ringIndex: 8, angle: 5.6, color: 'amber' },
            { ringIndex: 10, angle: 0.9, color: 'white' }
          ]
        },
        {
          // 2. Top-Right Island
          cx: w * 0.78,
          cy: h * 0.26,
          scaleX: 0.92,
          scaleY: 0.86,
          rotation: -0.32,
          rings: 9,
          maxRadius: Math.min(w, h) * 0.32,
          harmonics: [
            { freq: 2, amp: 0.20, speed: -0.26, phase: 0.6 },
            { freq: 3, amp: 0.10, speed: 0.36, phase: 2.2 }
          ],
          amberRings: [3, 7],
          beacons: [
            { ringIndex: 3, angle: 2.2, color: 'amber' },
            { ringIndex: 6, angle: 4.8, color: 'mint' }
          ]
        },
        {
          // 3. Bottom-Right Formation (Full coverage for bottom-right quadrant)
          cx: w * 0.82,
          cy: h * 0.78,
          scaleX: 1.10,
          scaleY: 0.82,
          rotation: 0.42,
          rings: 10,
          maxRadius: Math.min(w, h) * 0.42,
          harmonics: [
            { freq: 2, amp: 0.22, speed: 0.25, phase: 1.8 },
            { freq: 3, amp: 0.11, speed: -0.35, phase: 0.4 },
            { freq: 4, amp: 0.05, speed: 0.5, phase: 2.9 }
          ],
          amberRings: [3, 7],
          beacons: [
            { ringIndex: 3, angle: 3.4, color: 'amber' },
            { ringIndex: 5, angle: 1.1, color: 'mint' },
            { ringIndex: 7, angle: 5.2, color: 'amber' }
          ]
        },
        {
          // 4. Upper-Left Ridge Outpost
          cx: w * 0.15,
          cy: h * 0.20,
          scaleX: 1.12,
          scaleY: 0.78,
          rotation: 0.52,
          rings: 8,
          maxRadius: Math.min(w, h) * 0.30,
          harmonics: [
            { freq: 2, amp: 0.22, speed: 0.22, phase: 1.9 },
            { freq: 3, amp: 0.09, speed: -0.32, phase: 0.5 }
          ],
          amberRings: [4],
          beacons: [
            { ringIndex: 4, angle: 3.7, color: 'amber' }
          ]
        },
        {
          // 5. Bottom-Left Valley Basin
          cx: w * 0.12,
          cy: h * 0.82,
          scaleX: 1.25,
          scaleY: 0.72,
          rotation: 0.22,
          rings: 8,
          maxRadius: Math.min(w, h) * 0.36,
          harmonics: [
            { freq: 2, amp: 0.18, speed: 0.18, phase: 2.1 },
            { freq: 4, amp: 0.07, speed: -0.28, phase: 1.3 }
          ],
          amberRings: [4],
          beacons: [
            { ringIndex: 4, angle: 0.9, color: 'mint' }
          ]
        }
      ];
    };

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

      // Pointer spring lerp
      if (mouse.targetActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.09;
        mouse.y += (mouse.targetY - mouse.y) * 0.09;
        mouse.active = true;

        if (now - mouse.lastMoveTime > 3500) {
          mouse.targetActive = false;
        }
      } else {
        mouse.x += (-1000 - mouse.x) * 0.04;
        mouse.y += (-1000 - mouse.y) * 0.04;
        if (Math.abs(mouse.x - (-1000)) < 2) {
          mouse.active = false;
        }
      }

      // ── 1. Deep Atmospheric Dark Base ──
      ctx.fillStyle = '#050a08';
      ctx.fillRect(0, 0, width, height);

      // Radial ambient lighting: kept soft and deep so it remains comfortably in the background
      const gradBg = ctx.createRadialGradient(
        width * 0.46, height * 0.48, 50,
        width * 0.50, height * 0.50, Math.max(width, height) * 0.8
      );
      gradBg.addColorStop(0, 'rgba(6, 40, 30, 0.28)');
      gradBg.addColorStop(0.40, 'rgba(4, 22, 17, 0.16)');
      gradBg.addColorStop(0.75, 'rgba(3, 12, 10, 0.06)');
      gradBg.addColorStop(1, 'rgba(2, 6, 5, 0.0)');
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm amber ambient bloom behind center & bottom-right
      const amberBloom = ctx.createRadialGradient(
        width * 0.44, height * 0.48, 20,
        width * 0.46, height * 0.50, Math.min(width, height) * 0.45
      );
      amberBloom.addColorStop(0, 'rgba(245, 158, 11, 0.06)');
      amberBloom.addColorStop(0.6, 'rgba(217, 119, 6, 0.015)');
      amberBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = amberBloom;
      ctx.fillRect(0, 0, width, height);

      // ── 2. Subtle Faint Tactical Matrix Grid ──
      const gridSize = isMobile ? 64 : 52;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.025)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // ── 3. High-Performance Batched Topographic Rendering ──
      // Separate emerald lines and amber lines into single batch paths
      // This eliminates dozens of canvas state changes for 60fps locked rendering
      const features = getFeatures(width, height, isMobile);
      const pointsPerLoop = isMobile ? 42 : 56; // Perfectly smooth curves with half the trig overhead

      const emeraldPath = new Path2D();
      const amberGlowPath = new Path2D();
      const amberCorePath = new Path2D();
      const beaconList = [];

      features.forEach((feat) => {
        const { cx, cy, scaleX, scaleY, rotation, rings, maxRadius, harmonics, amberRings, beacons } = feat;
        const stepR = maxRadius / rings;
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);

        for (let rIdx = 1; rIdx <= rings; rIdx++) {
          const baseRadius = rIdx * stepR;
          const isAmber = amberRings.includes(rIdx);
          const targetPath = isAmber ? amberCorePath : emeraldPath;

          let firstX = 0;
          let firstY = 0;

          for (let p = 0; p <= pointsPerLoop; p++) {
            const theta = (p / pointsPerLoop) * Math.PI * 2;

            let deformation = 0;
            for (let hIdx = 0; hIdx < harmonics.length; hIdx++) {
              const h = harmonics[hIdx];
              deformation += h.amp * Math.sin(h.freq * theta + h.phase + elapsed * h.speed);
            }
            deformation += 0.03 * Math.cos(theta * 3 - elapsed * 0.18);

            const r = baseRadius * (1 + deformation);
            const ex = r * Math.cos(theta) * scaleX;
            const ey = r * Math.sin(theta) * scaleY;

            let px = cx + (ex * cosRot - ey * sinRot);
            let py = cy + (ex * sinRot + ey * cosRot);

            // Responsive cursor interaction: localized smooth wave ripple
            if (mouse.active) {
              const dx = px - mouse.x;
              const dy = py - mouse.y;
              const dist = Math.hypot(dx, dy);
              const maxDist = isMobile ? 150 : 220;

              if (dist < maxDist && dist > 1) {
                const force = Math.pow(1 - dist / maxDist, 2.0);
                const pushAmp = 18 * force;
                px += (dx / dist) * pushAmp;
                py += (dy / dist) * pushAmp;
              }
            }

            if (p === 0) {
              firstX = px;
              firstY = py;
              targetPath.moveTo(px, py);
              if (isAmber) amberGlowPath.moveTo(px, py);
            } else if (p === pointsPerLoop) {
              targetPath.lineTo(firstX, firstY);
              if (isAmber) amberGlowPath.lineTo(firstX, firstY);
            } else {
              targetPath.lineTo(px, py);
              if (isAmber) amberGlowPath.lineTo(px, py);
            }
          }
        }

        // Store beacon positions
        if (beacons && beacons.length > 0) {
          for (let bIdx = 0; bIdx < beacons.length; bIdx++) {
            const b = beacons[bIdx];
            const bRadius = b.ringIndex * stepR;
            let deformation = 0;
            for (let hIdx = 0; hIdx < harmonics.length; hIdx++) {
              const h = harmonics[hIdx];
              deformation += h.amp * Math.sin(h.freq * b.angle + h.phase + elapsed * h.speed);
            }
            const r = bRadius * (1 + deformation);
            const ex = r * Math.cos(b.angle) * scaleX;
            const ey = r * Math.sin(b.angle) * scaleY;
            let bx = cx + (ex * cosRot - ey * sinRot);
            let by = cy + (ex * sinRot + ey * cosRot);

            if (mouse.active) {
              const dx = bx - mouse.x;
              const dy = by - mouse.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 180 && dist > 1) {
                const force = Math.pow(1 - dist / 180, 2);
                bx += (dx / dist) * 14 * force;
                by += (dy / dist) * 14 * force;
              }
            }
            beaconList.push({ x: bx, y: by, color: b.color, idx: bIdx });
          }
        }
      });

      // ── Stroke Emerald Contours (Crisp & Luminous for Login) ──
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.36)';
      ctx.stroke(emeraldPath);

      // ── Stroke Amber Ridge Highlights (Hardware-Accelerated Glow without CPU shadowBlur) ──
      // Pass 1: Wider translucent amber glow line
      ctx.lineWidth = isMobile ? 3.4 : 4.5;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.24)';
      ctx.stroke(amberGlowPath);

      // Pass 2: Sharp luminous amber core line
      ctx.lineWidth = isMobile ? 1.6 : 2.0;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.78)';
      ctx.stroke(amberCorePath);

      // ── Render Glowing Beacon Nodes ──
      beaconList.forEach((b) => {
        const pulse = 0.85 + 0.22 * Math.sin(elapsed * 2.8 + b.idx);
        const isAmber = b.color === 'amber';
        const haloColor = isAmber ? 'rgba(245, 158, 11, 0.32)' : 'rgba(52, 211, 153, 0.30)';
        const coreColor = isAmber ? '#fbbf24' : '#6ee7b7';

        // Outer halo
        ctx.beginPath();
        ctx.arc(b.x, b.y, (isMobile ? 4.5 : 6) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = haloColor;
        ctx.fill();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(b.x, b.y, isMobile ? 1.6 : 2.0, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();
      });

      // ── 4. Interactive Cursor Illumination Spotlight ──
      if (mouse.active) {
        const spotGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 8,
          mouse.x, mouse.y, isMobile ? 140 : 200
        );
        spotGrad.addColorStop(0, 'rgba(52, 211, 153, 0.10)');
        spotGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.05)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);

        // Minimalist tactical crosshair
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const ch = 5;
        ctx.moveTo(mouse.x - ch, mouse.y);
        ctx.lineTo(mouse.x + ch, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - ch);
        ctx.lineTo(mouse.x, mouse.y + ch);
        ctx.stroke();
      }

      // ── 5. Recessed Depth Overlay (Subtle scrim for Login) ──
      ctx.fillStyle = 'rgba(5, 10, 8, 0.12)';
      ctx.fillRect(0, 0, width, height);

      // Soft vignette for edge blend
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.45,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.7, 'rgba(3, 7, 5, 0.25)');
      vignette.addColorStop(1, 'rgba(2, 5, 4, 0.70)');
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
