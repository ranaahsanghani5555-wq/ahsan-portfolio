import { useEffect, useRef } from 'react';
import styles from './HeroBackdrop.module.css';
import { useDeferredMount } from '../hooks/useDeferredMount';
import { motionOK } from '../lib/motion.js';

/* Three palette inks, at low alpha, soaked into the paper.
   Each wash is drawn as an irregular organic blob (never a circle), bleeds off
   the viewport edge, and is kept faint so dark text above stays AA-legible. */
const WASHES = [
  { x: -0.02, y: 0.1, r: 0.74, rgb: '27, 77, 62', a: 0.062, depth: 0.85, seed: 1.7 }, // pine — top-left
  { x: 0.92, y: 0.2, r: 0.6, rgb: '232, 85, 45', a: 0.054, depth: 0.65, seed: 4.3 }, // coral — right
  { x: 0.4, y: 1.0, r: 0.68, rgb: '58, 53, 47', a: 0.054, depth: 0.5, seed: 8.1 }, // ink — bottom
];

/* The washes are rasterised on a canvas this many times smaller, then scaled
   up with smoothing. Downsampling-then-upscaling is what gives the soft,
   feathered ink edge — no ctx.filter/blur, so it cannot blur page text and it
   costs almost nothing per frame. */
const SCALE = 4;

/**
 * Trace a closed, irregular blob (a sum of sine harmonics around a radius) so
 * the silhouette never reads as a circle. Smoothed with quadratic curves
 * through edge midpoints.
 */
function blobPath(ctx, cx, cy, radius, points, seed, phase) {
  const pts = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const wobble =
      1 +
      Math.sin(angle * 3 + seed + phase) * 0.15 +
      Math.sin(angle * 5 - seed * 0.6 + phase * 0.7) * 0.08 +
      Math.cos(angle * 2 + seed * 1.3 - phase * 0.5) * 0.06;
    const rr = radius * wobble;
    pts.push([cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr]);
  }
  ctx.beginPath();
  const first = pts[0];
  const last = pts[points - 1];
  ctx.moveTo((first[0] + last[0]) / 2, (first[1] + last[1]) / 2);
  for (let i = 0; i < points; i += 1) {
    const cur = pts[i];
    const next = pts[(i + 1) % points];
    ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2);
  }
  ctx.closePath();
}

/**
 * HeroBackdrop — slow ink washes on paper.
 *
 * No WebGL, no libraries. Irregular blobs are rasterised small and scaled up
 * for a soft organic edge. The rAF drift loop is a LIGHT ambient feature, so it
 * always runs while the hero is on screen; the pointer parallax is the only
 * heavy part, so mousemove is attached only when heavy motion is allowed.
 */
export default function HeroBackdrop() {
  // Defer the paint loop until after first paint + a free main thread; the
  // preloader curtain hides the hero while this mounts.
  const ready = useDeferredMount();
  return ready ? <BackdropCanvas /> : null;
}

function BackdropCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    /* The wash drift is an ambient loop (LIGHT), so it always runs. Only the
       pointer parallax is heavy, so mousemove is attached only when allowed. */
    const heavy = motionOK();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let phase = 0;
    let raf = 0;
    let running = false;

    const pointer = { x: 0.5, y: 0.5 };
    const eased = { x: 0.5, y: 0.5 };

    // Small offscreen buffer the washes are drawn into before being scaled up.
    const buffer = document.createElement('canvas');
    const bctx = buffer.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buffer.width = Math.max(1, Math.round(width / SCALE));
      buffer.height = Math.max(1, Math.round(height / SCALE));
    };

    const draw = () => {
      if (!width || !height || !bctx) return;

      // Rasterise the washes at low resolution (CSS-px coordinate space).
      bctx.setTransform(buffer.width / width, 0, 0, buffer.height / height, 0, 0);
      bctx.clearRect(0, 0, width, height);

      const span = Math.max(width, height);
      WASHES.forEach((wash, index) => {
        const drift = Math.sin(phase + index * 1.9) * 0.038;
        const lift = Math.cos(phase * 0.8 + index * 1.3) * 0.032;
        /* Each wash also "breathes" — the radius swells and eases back slowly,
           so the ink reads as alive rather than sliding rigidly. */
        const breathe = 1 + Math.sin(phase * 0.6 + index * 2.4) * 0.07;
        const cx = (wash.x + drift + (eased.x - 0.5) * 0.1 * wash.depth) * width;
        const cy = (wash.y + lift + (eased.y - 0.5) * 0.1 * wash.depth) * height;
        const base = wash.r * span * breathe;

        // A wider, fainter outer pass under a denser core: a graded ink wash.
        bctx.fillStyle = `rgba(${wash.rgb}, ${wash.a * 0.55})`;
        blobPath(bctx, cx, cy, base * 1.12, 9, wash.seed, phase * 0.6);
        bctx.fill();

        bctx.fillStyle = `rgba(${wash.rgb}, ${wash.a})`;
        blobPath(bctx, cx, cy, base * 0.82, 8, wash.seed + 2.4, phase * 0.5);
        bctx.fill();
      });
      bctx.setTransform(1, 0, 0, 1, 0, 0);

      // Scale the low-res buffer up: the interpolation is the soft edge.
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, width, height);
    };

    const tick = () => {
      eased.x += (pointer.x - eased.x) * 0.045;
      eased.y += (pointer.y - eased.y) * 0.045;
      phase += 0.0058;
      draw();
      raf = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(raf);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    };

    resize();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resize();
        if (!running) draw();
      });
      resizeObserver.observe(canvas);
    }

    if (heavy) window.addEventListener('mousemove', onPointerMove, { passive: true });
    // Draw immediately so there is no empty flash before the observer fires.
    draw();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('mousemove', onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.backdrop} aria-hidden="true" />;
}
