import { useEffect, useRef, useState } from 'react';

/**
 * useInView — returns a ref plus whether the observed node has come within
 * `rootMargin` of the viewport, once. Used to defer expensive, below-the-fold
 * subtrees (the six drawn preview mocks) until they are nearly on screen, which
 * keeps their container-query layout out of the first paint.
 *
 * Falls back to "visible" where IntersectionObserver is unavailable.
 *
 * @param {{rootMargin?: string, threshold?: number}} [options]
 * @returns {[import('react').RefObject<HTMLElement>, boolean]}
 */
export function useInView({ rootMargin = '400px 0px', threshold = 0 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return [ref, inView];
}
