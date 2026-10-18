/* ==========================================================================
   motion.js — shared motion override for the six concept demos (no build).
   Loaded synchronously from each demo's <head>, BEFORE the reveal gate
   script, so the decision exists before first paint.

   Two gates:
       window.__motionOK()      -> true for HEAVY features (parallax, pin,
                                   large movements, per-letter mouse tracking,
                                   cursor trail, fast loops)
       window.__motionLight()   -> ALWAYS true for light features (hero
                                   entrance, opacity fades, short translates
                                   <=24px, hover/focus, color transitions,
                                   slow marquees, ambient loops)

   Mode resolution, first match wins:
     1. ?motion=full / ?motion=reduced in the URL — dev override.
     2. OS prefers-reduced-motion — only disables heavy features.

   The mode is mirrored to <html data-motion="full|reduced"> for CSS.
   ========================================================================== */
(function () {
  'use strict';

  function osReduced() {
    return !!(
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function readParam() {
    try {
      var p = new URLSearchParams(window.location.search).get('motion');
      return p === 'full' || p === 'reduced' ? p : null;
    } catch (e) {
      return null;
    }
  }

  var mode = readParam() || (osReduced() ? 'reduced' : 'full');

  try {
    document.documentElement.setAttribute('data-motion', mode);
  } catch (e) {}

  window.__motionMode = function () {
    return mode;
  };
  window.__motionOK = function () {
    return mode !== 'reduced';
  };
  window.__motionLight = function () {
    return true; // Light features always run
  };
})();
