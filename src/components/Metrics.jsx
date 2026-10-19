import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Metrics.module.css';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { profile } from '../data/profile';
import { projects, projectCount } from '../data/projects';
import { lighthouse } from '../data/lighthouse';

/*
  Metrics — a verifiable strip. Every number has a real source:

  - Concept projects      → projectCount (the six demos in /public/work)
  - Breakpoints tested    → the union of each demo's tested widths
  - Sections built        → the real section count summed across the six demos
  - Hours spent           → profile.hoursSpent (defaults to the sum of the six
                            demos' recorded hours; EDIT: replace with your total)
  - Average Lighthouse    → the real measured average (see data/lighthouse.js),
                            reported as a median of three mobile runs; until it
                            is measured it politely says so

  No invented client or revenue metrics, ever. The visible figure is decoration
  for assistive tech; a visually-hidden line carries the full label + value.
*/

const breakpointsTested = new Set(projects.flatMap((project) => project.facts.breakpoints)).size;
const sectionsBuilt = projects.reduce((sum, project) => sum + project.facts.sections, 0);

function Metric({ label, value, note, placeholder }) {
  const valueRef = useRef(null);
  const valueText = placeholder ?? String(value);

  useGSAP(
    () => {
      const node = valueRef.current;
      if (!node) return undefined;

      if (placeholder != null) {
        node.textContent = placeholder;
        return undefined;
      }

      /* A counter is LIGHT, so it runs for everyone — but it starts when the
         strip actually scrolls into view, not at mount (the section is lazy
         and sits below the fold, so a mount-time run would be over unseen). */
      node.textContent = '0';
      const counter = { n: 0 };
      let tween;

      const start = () => {
        tween = gsap.to(counter, {
          n: value,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: () => {
            node.textContent = String(Math.round(counter.n));
          },
        });
      };

      if (!('IntersectionObserver' in window)) {
        start();
        return () => tween?.kill();
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          start();
        },
        { threshold: 0.4 }
      );
      observer.observe(node);

      return () => {
        observer.disconnect();
        tween?.kill();
      };
    },
    { dependencies: [value, placeholder], revertOnUpdate: true }
  );

  return (
    <li className={styles.metric} data-reveal-item>
      <p
        className={`${styles.value} ${placeholder != null ? styles.valueText : ''}`}
        ref={valueRef}
        data-metric-value
        aria-hidden="true"
      >
        {valueText}
      </p>
      <p className="visually-hidden">
        {label}: {valueText}. {note}
      </p>
      <p className={styles.label}>{label}</p>
      <p className={styles.note}>{note}</p>
    </li>
  );
}

export default function Metrics() {
  const scope = useScrollReveal('[data-reveal-item]', []);

  const metrics = [
    {
      label: 'Concept projects shipped',
      value: projectCount,
      note: 'six self-initiated landing pages',
    },
    {
      label: 'Breakpoints tested',
      value: breakpointsTested,
      note: 'the union of widths used across all six demos',
    },
    {
      label: 'Sections built',
      value: sectionsBuilt,
      note: 'across the six demos, counted from the code',
    },
    {
      label: 'Hours building',
      value: profile.hoursSpent,
      note: 'the six concept demos, built end to end',
    },
    {
      label: 'Average Lighthouse score',
      value: lighthouse.measured ? Math.round(lighthouse.average) : 0,
      note: lighthouse.measured
        ? `${lighthouse.label} — ${lighthouse.method}`
        : 'across the main site + 6 demos',
      placeholder: lighthouse.measured ? undefined : 'Not yet measured',
    },
  ];

  return (
    <section
      id="metrics"
      className={`section section--tight ${styles.section}`}
      aria-label="Metrics"
      ref={scope}
    >
      <div className={`container ${styles.inner}`}>
        <p className="eyebrow">By the numbers</p>
        <ul className={styles.grid}>
          {metrics.map((metric) => (
            <Metric key={metric.label} {...metric} />
          ))}
        </ul>
        <p className={styles.caption}>
          Counts are real: projects, breakpoints and sections come from the demo code in this
          project; hours come from profile.js; the Lighthouse figure is a median of three mobile
          runs, measured, never guessed.
        </p>
      </div>
    </section>
  );
}