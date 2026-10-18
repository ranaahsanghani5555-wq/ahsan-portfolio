import { useEffect, useState } from 'react';

/**
 * useMediaQuery — tracks a single media query.
 *
 * Used by the Critique section to choose between the desktop annotation rail
 * (a disclosure list beside the mockup) and the stacked list shown under the
 * mockup on narrow screens. Reading it in JS keeps the markup honest: on a
 * phone the annotations are real, always-visible list items rather than
 * content hidden from assistive tech by CSS.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
