import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Cursor.module.css';
import { useDeferredMount } from '../hooks/useDeferredMount';
import { motionOK } from '../lib/motion.js';

/**
 * Cursor — a small dot with a trailing ring.
 *
 * Enhanced only: on touch, coarse pointers and under reduced motion it does
 * nothing at all and the native cursor is left alone. Over project cards it
 * reads "View"; over text fields it yields to the native text cursor.
 */
export default function Cursor() {
  const ready = useDeferredMount();
  // Non-critical decoration: mount after first paint + a free main thread so
  // the custom cursor never delays the first contentful paint.
  return ready ? <CursorLayer /> : null;
}

function CursorLayer() {
  const layerRef = useRef(null);
  const ringRef = useRef(null);
  const borderRef = useRef(null);
  const labelRef = useRef(null);
  const dotRef = useRef(null);

  useGSAP(
    () => {
      if (typeof window === 'undefined') return undefined;

      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const reduced = !motionOK();
      if (!fine || reduced) return undefined;

      const ring = ringRef.current;
      const border = borderRef.current;
      const label = labelRef.current;
      const dot = dotRef.current;
      if (!ring || !border || !label || !dot) return undefined;

      const root = document.documentElement;
      root.classList.add('cursor-custom');

      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

      const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

      let shown = false;
      let mode = 'default';

      const setMode = (next) => {
        if (next === mode) return;
        mode = next;

        if (next === 'text') {
          gsap.to([dot, ring], { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
          return;
        }

        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.15, overwrite: 'auto' });

        const scale = next === 'view' ? 2.5 : next === 'interactive' ? 1.7 : 1;
        gsap.to(border, { scale, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(dot, {
          scale: next === 'default' ? 1 : 0.4,
          duration: 0.3,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(label, { autoAlpha: next === 'view' ? 1 : 0, duration: 0.2, overwrite: 'auto' });
      };

      const onMove = (event) => {
        const { clientX, clientY, target } = event;

        if (!shown) {
          shown = true;
          gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2, overwrite: 'auto' });
        }

        dotX(clientX);
        dotY(clientY);
        ringX(clientX);
        ringY(clientY);

        if (!(target instanceof Element)) return;

        let next = 'default';
        if (target.closest('input, textarea, select, [contenteditable="true"]')) next = 'text';
        else if (target.closest('[data-cursor="view"]')) next = 'view';
        else if (target.closest('a, button, [data-cursor], [role="button"]')) next = 'interactive';
        setMode(next);
      };

      const onLeave = () => {
        shown = false;
        gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2, overwrite: 'auto' });
      };

      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);

      return () => {
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseleave', onLeave);
        root.classList.remove('cursor-custom');
        gsap.killTweensOf([dot, ring, border, label]);
      };
    },
    { scope: layerRef }
  );

  return (
    <div ref={layerRef} className={styles.layer} data-cursor-layer aria-hidden="true">
      <span ref={ringRef} className={styles.ring} data-cursor-ring>
        <span ref={borderRef} className={styles.border} />
        <span ref={labelRef} className={styles.label}>
          View
        </span>
      </span>
      <span ref={dotRef} className={styles.dot} data-cursor-dot />
    </div>
  );
}
