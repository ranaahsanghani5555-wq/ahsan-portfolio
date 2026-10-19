import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * useMagnetic — attaches a subtle magnetic pull to a single element.
 * Returns a ref to spread onto the element. A subtle pull is a LIGHT hover
 * effect, so it runs for everyone, and always springs back to rest on
 * pointer-leave.
 *
 * Pass `enabled: false` while the target is not in the DOM (e.g. a ref inside
 * a conditionally-rendered overlay) so the listeners attach once it mounts.
 */
export function useMagnetic({ strength = 0.32, max = 22, enabled = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;

    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      const x = clamp(event.clientX - (rect.left + rect.width / 2), -max, max);
      const y = clamp(event.clientY - (rect.top + rect.height / 2), -max, max);
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.45,
        ease: 'power3.out',
      });
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength, max, enabled]);

  return ref;
}
