import { createContext, useContext, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from './useReducedMotion';

/* The live Lenis instance (or null when reduced motion / not yet ready) is
   shared through context so overlays like the mobile menu can pause and
   resume smooth scrolling without owning the instance themselves. */
export const LenisContext = createContext(null);

export function useLenisControl() {
  return useContext(LenisContext);
}

/**
 * useLenis — one smooth-scroll instance for the whole document.
 *
 * Lenis owns the scroll position; every Lenis scroll event re-syncs
 * ScrollTrigger, and GSAP's single ticker drives Lenis' rAF loop. That gives
 * us exactly one requestAnimationFrame loop on the page, so scroll-driven
 * timelines never drift a frame behind the scrollbar.
 *
 * Both Lenis and ScrollTrigger are imported on demand (after the first paint)
 * so their weight never sits on the critical path. Call it once, in <App>, and
 * publish the returned instance through <LenisContext.Provider>. It is a no-op
 * when the visitor prefers reduced motion, in which case native scrolling is
 * used untouched.
 *
 * @returns {Lenis | null} the live instance, or null when disabled
 */
export function useLenis({ enabled = true, duration = 1.05 } = {}) {
  const reduced = useReducedMotion();
  const [instance, setInstance] = useState(null);

  useEffect(() => {
    if (!enabled || reduced) return undefined;

    let cancelled = false;
    let lenis = null;
    let raf = null;
    let update = null;
    let onLoad = null;

    (async () => {
      const [{ default: Lenis }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({
        duration,
        // quart-out, same family as --ease-in-out-quart: settles without bounce
        easing: (t) => 1 - Math.pow(1 - t, 4),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        gestureOrientation: 'vertical',
      });
      setInstance(lenis);

      // Keep ScrollTrigger in lock-step with Lenis' virtual scroll.
      update = () => ScrollTrigger.update();
      lenis.on('scroll', update);

      // Drive Lenis from GSAP's single rAF loop (no competing rAF).
      raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.refresh();
      // Late-loading fonts/images change layout; refresh once everything settles.
      onLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', onLoad);
    })();

    return () => {
      cancelled = true;
      if (onLoad) window.removeEventListener('load', onLoad);
      if (raf) gsap.ticker.remove(raf);
      if (lenis) {
        if (update) lenis.off('scroll', update);
        lenis.destroy();
        setInstance(null);
      }
      gsap.ticker.lagSmoothing(500, 33); // restore GSAP defaults on cleanup
    };
  }, [enabled, reduced, duration]);

  return instance;
}
