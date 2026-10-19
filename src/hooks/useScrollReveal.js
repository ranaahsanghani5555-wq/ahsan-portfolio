import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

/*
  useScrollReveal — one light, shared "cards rise into view" reveal.

  Returns a ref to attach to the section (or any element) that CONTAINS the
  targets. Every element matching `selector` inside it fades in and lifts ~22px
  the first time it enters the viewport, staggered when several arrive together.

  Per the two-gate contract in src/lib/motion.js a short fade + small rise is
  LIGHT, so this runs for everyone — reduced motion included. It is one-shot
  (unobserved after it plays), traceable to scroll position, and animates only
  opacity + transform, so it never causes layout shift.

  @param {string} selector   CSS selector for the cards to reveal, within scope.
  @param {any[]}  [deps]     re-arm when these change (e.g. a filtered list).
  @param {object} [options]  { y, duration, stagger, threshold, rootMargin }
*/

const DEFAULT_OPTIONS = {
  y: 22,
  duration: 0.6,
  stagger: 0.06,
  threshold: 0.15,
  rootMargin: '0px 0px -6% 0px',
};

export function useScrollReveal(selector, deps = [], options = {}) {
  const scope = useRef(null);
  const { y, duration, stagger, threshold, rootMargin } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const items = gsap.utils.toArray(selector, root);
      if (!items.length) return undefined;

      /* No observer → leave the cards exactly as authored (never hidden). */
      if (!('IntersectionObserver' in window)) return undefined;

      /* Hide before paint so a late observer can never flash the finished card. */
      gsap.set(items, { autoAlpha: 0, y });

      let batch = 0;
      const observer = new IntersectionObserver(
        (entries) => {
          const entering = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => entry.target);
          if (!entering.length) return;

          entering.forEach((el) => observer.unobserve(el));
          gsap.to(entering, {
            autoAlpha: 1,
            y: 0,
            duration,
            ease: 'power2.out',
            stagger,
            overwrite: true,
            /* Every fresh group of cards starts a beat later, so a section that
               reveals in waves reads as one motion rather than several. */
            delay: (batch++ % 2) * 0.04,
          });
        },
        { threshold, rootMargin }
      );

      items.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    },
    { scope, dependencies: deps }
  );

  return scope;
}
