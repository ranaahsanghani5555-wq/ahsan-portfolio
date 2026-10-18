import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Process.module.css';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/*
  Process — how the work is made.

  Desktop (>= 901px, motion allowed): a horizontally-pinned scroll. The pin
  lasts about 2.5 viewport heights, releases cleanly, and the page scrolls
  normally afterwards. Everything is driven with gsap.matchMedia() so the pin
  exists only where it is safe; everywhere else (narrow screens, reduced
  motion) the section is a normal vertical stack.

  Each step carries a small stroke icon that draws itself (stroke-dashoffset
  on the SVG paths) the moment the step comes into view.
*/

const STEPS = [
  {
    n: '01',
    title: 'Research and goals',
    body: 'Start with the one thing this page must do and the single action that proves it. Then gather the real facts — audience, context, constraints — before anything is drawn.',
  },
  {
    n: '02',
    title: 'Structure and wireframe',
    body: 'Draft the page in blocks and type only: hierarchy, reading order and line measure before any colour. The grid is asymmetric on purpose, so one idea leads each screen.',
  },
  {
    n: '03',
    title: 'Visual direction',
    body: 'Pick one confident voice — a type pairing, a palette, a spacing rhythm — that fits the brand, and save the single accent for the primary action.',
  },
  {
    n: '04',
    title: 'Motion and interaction',
    body: 'Motion is added last and has to earn its place. It clarifies the hierarchy and every interactive state stays legible, focusable and quiet under reduced-motion.',
  },
  {
    n: '05',
    title: 'Test and iterate',
    body: 'Run the page from 360 to 1440, check contrast and the keyboard path, then cut anything that does not earn its place — reviewed as if someone else had made it.',
  },
];

/* Thin-stroke line icons, drawn by animating stroke-dashoffset (transform +
   opacity only, plus SVG stroke). Each path is normalized with pathLength="1"
   so one unit of dash covers the whole path. */
const ICONS = [
  {
    paths: [
      'M12 3a9 9 0 1 0 0.001 0Z',
      'M12 7.2a4.8 4.8 0 1 0 0.001 0Z',
      'M10.9 13.1 12 11.7l1.2 1.6',
    ],
  },
  {
    paths: [
      'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z',
      'M4 10h16',
      'M10 4v16',
    ],
  },
  {
    paths: [
      'M12 3.5v17',
      'M3.5 12h17',
      'M6 6l12 12',
      'M18 6 6 18',
    ],
  },
  {
    paths: [
      'M8.4 7.1a1 1 0 0 1 1.4-.1l6.6 4.5a1 1 0 0 1 0 1.9L9.8 17.9a1 1 0 0 1-1.4-.1V7.1Z',
      'M5 9.5v5',
      'M3.5 11v2',
    ],
  },
  {
    paths: [
      'M20 12a8 8 0 1 1-2.3-5.7',
      'M20 3.5V7h-3.5',
      'M4 20.5V17h3.5',
    ],
  },
];

function Step({ step, index }) {
  const ref = useRef(null);
  const pathsRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const paths = pathsRef.current ? Array.from(pathsRef.current.querySelectorAll('[data-draw]')) : [];
    if (!paths.length) return undefined;

    /* Reduced motion: icons are simply drawn, no animation. */
    if (reduced) {
      gsap.set(paths, { strokeDashoffset: 0 });
      return undefined;
    }

    const card = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          gsap.fromTo(
            paths,
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: 0.16, overwrite: true }
          );
          observer.disconnect();
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <li ref={ref} className={styles.card} style={{ '--step-index': index }} data-index={index}>
      <div className={styles.cardHead}>
        <svg
          ref={pathsRef}
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          {ICONS[index].paths.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength="1"
              data-draw
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        <span className={styles.number}>{step.n}</span>
      </div>
      <h3 className={styles.title}>{step.title}</h3>
      <p className={styles.body}>{step.body}</p>
    </li>
  );
}

export default function Process() {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      /* Desktop only, and never when motion is off (the resolved mode from
         src/lib/motion.js — the OS setting by default, or the visitor's
         ?motion= / Motion-toggle override). The width is the only media
         condition: a forced-ON visitor on an OS "reduce" setting must still
         get the pin, which a prefers-reduced-motion media query could never
         express. */
      mm.add('(min-width: 901px)', () => {
        if (reduced) return undefined;
        const pin = pinRef.current;
        const track = trackRef.current;
        const fill = fillRef.current;
        if (!pin || !track) return undefined;

        const travel = () => Math.max(0, track.scrollWidth - pin.clientWidth);

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: '+=250%', // about 2.5 viewport heights of pinned travel
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (fill) gsap.set(fill, { scaleX: self.progress });
            },
          },
        });

        timeline.to(track, { x: () => -travel(), duration: 1 });

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] }
  );

  /* Re-measure so late fonts/images cannot leave the pin (or the Work section
     counter) misaligned. Several triggers can fire in the same window (timeouts,
     window load, fonts ready), so coalesce them into one rAF-debounced
     ScrollTrigger.refresh() per frame instead of one sync pass per trigger. */
  useEffect(() => {
    let raf = 0;

    const scheduleRefresh = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        ScrollTrigger.refresh();
      });
    };

    const timers = [
      window.setTimeout(scheduleRefresh, 1400),
      window.setTimeout(scheduleRefresh, 3000),
    ];
    window.addEventListener('load', scheduleRefresh);
    document.fonts?.ready?.then(scheduleRefresh).catch(() => {});
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('load', scheduleRefresh);
    };
  }, []);

  return (
    <section id="process" className="section" ref={rootRef}>
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow">Process</p>
          <h2 className={styles.heading}>How the work gets made.</h2>
          <p className={styles.intro}>
            Five steps, in order. On a wide screen the steps scroll past you; on a phone they
            simply stack.
          </p>
        </header>
      </div>

      <div className={styles.stage} ref={pinRef} data-process-stage>
        <ol className={styles.track} ref={trackRef} data-process-track>
          {STEPS.map((step, index) => (
            <Step key={step.n} step={step} index={index} />
          ))}
        </ol>
        <div className={styles.rail} aria-hidden="true">
          <span className={styles.railFill} ref={fillRef} />
        </div>
      </div>
    </section>
  );
}