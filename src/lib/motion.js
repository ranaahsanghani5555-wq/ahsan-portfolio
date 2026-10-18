/*
  motion.js — the site-wide motion override (mirrors public/work/motion.js,
  which serves the six demos without a build).

  Two gates:
      motionOK()      -> true for HEAVY features (parallax, pin, large
                         movements, per-letter mouse tracking, cursor trail,
                         fast loops)
      motionLight()   -> ALWAYS true for light features (hero entrance,
                         opacity fades, short translates <=24px, hover/focus,
                         color transitions, slow marquees, ambient loops)

  Mode resolution, first match wins:
    1. ?motion=full / ?motion=reduced in the URL — dev override.
    2. OS prefers-reduced-motion — only disables heavy features.

  initMotion() runs once from main.jsx before React renders. The mode is
  mirrored to <html data-motion="full|reduced"> for CSS blocks.
*/

function osReduced() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function readParam() {
  try {
    const p = new URLSearchParams(window.location.search).get('motion');
    return p === 'full' || p === 'reduced' ? p : null;
  } catch {
    return null;
  }
}

function resolve() {
  return readParam() || (osReduced() ? 'reduced' : 'full');
}

let mode = 'full';

export function initMotion() {
  mode = resolve();
  document.documentElement.setAttribute('data-motion', mode);

  window.__motionMode = () => mode;
  window.__motionOK = () => mode !== 'reduced';
  window.__motionLight = () => true; // Light features always run

  return mode;
}

export function motionMode() {
  if (window.__motionMode) return window.__motionMode();
  return resolve();
}

export function motionOK() {
  if (window.__motionOK) return window.__motionOK();
  return !osReduced();
}

export function motionLight() {
  if (window.__motionLight) return window.__motionLight();
  return true; // Always true
}
