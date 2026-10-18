import { useEffect, useState } from 'react';

/**
 * useDeferredMount — mount decorative, non-critical UI only after first paint
 * and a free main thread (requestIdleCallback, with a hard timeout fallback).
 *
 * The initial paint of the page no longer has to run the custom cursor or the
 * hero paint loop; both start a moment later and remain invisible under the
 * preloader curtain anyway.
 *
 * @param {number} [deadline]  upper bound (ms) before mounting regardless
 * @returns {boolean} whether the caller may render
 */
export function useDeferredMount(deadline = 600) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let cancelled = false;
    const done = () => {
      if (!cancelled) setReady(true);
    };

    const hasRIC = typeof window.requestIdleCallback === 'function';
    const id = hasRIC
      ? window.requestIdleCallback(() => done(), { timeout: deadline })
      : window.setTimeout(done, 50);
    const fallback = window.setTimeout(done, deadline); // safety net

    return () => {
      cancelled = true;
      if (hasRIC && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
      window.clearTimeout(fallback);
    };
  }, [deadline]);

  return ready;
}