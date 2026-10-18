import { useEffect, useState } from 'react';
import { motionOK } from '../lib/motion.js';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * useReducedMotion — true when animation should NOT run.
 *
 * The default follows the OS (prefers-reduced-motion); the hidden URL
 * override (?motion=full / ?motion=reduced, src/lib/motion.js) wins when
 * present. Stays reactive so an OS change mid-session re-evaluates.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => !motionOK());

  useEffect(() => {
    const recompute = () => setReduced(!motionOK());
    const mq = window.matchMedia(QUERY);
    mq.addEventListener('change', recompute);
    return () => mq.removeEventListener('change', recompute);
  }, []);

  return reduced;
}
