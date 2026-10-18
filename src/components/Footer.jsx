import { useEffect, useMemo, useState } from 'react';
import styles from './Footer.module.css';
import { profile, socialLinks } from '../data/profile';
import { useLenisControl } from '../hooks/useLenis';
import { useReducedMotion } from '../hooks/useReducedMotion';

const LINKS = [
  { href: '#work', label: 'Work' },
  { href: '#process', label: 'Process' },
  { href: '#critique', label: 'Critique' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

/*
  useLocalTime — the current time in profile.timezone, updated once per minute.

  The timeout is re-armed to land just after each minute boundary so the clock
  never drifts, and it fires once a minute only. It is rendered inside a <time>
  element with no aria-live: a clock should not announce itself to a screen
  reader every minute, it should simply be there to read.
*/
function useLocalTime(timeZone) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const schedule = () => {
      const ms = 60000 - (Date.now() % 60000);
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, ms + 50);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hh = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const mm = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'long' }).format(now);

  return { label: `${hh}:${mm}`, weekday };
}

export default function Footer() {
  const year = new Date().getFullYear();
  const lenis = useLenisControl();
  const reduced = useReducedMotion();
  const { label, weekday } = useLocalTime(profile.timezone);

  const zoneLabel = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: profile.timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+5';
  }, []);

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { immediate: reduced });
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            AG
          </span>
          <div>
            <p className={styles.name}>{profile.brand}</p>
            <p className={styles.place}>Web designer · {profile.location}</p>
          </div>
        </div>

        <nav aria-label="Footer">
          <ul className={styles.list}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <a className={styles.link} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.note}>
          <p className={styles.clock}>
            <span className={styles.clockLabel}>My local time</span>
            <time className={styles.clockTime} dateTime={label}>
              {label}
            </time>
            <span className={styles.clockZone}>
              {zoneLabel} · {weekday}
            </span>
          </p>

          {socialLinks.length > 0 && (
            <ul className={styles.social}>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    className={styles.link}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p>Concept projects only — no client work, no fabricated metrics.</p>
          <p>Designed and built by {profile.brand}.</p>
          <p>
            © {year} {profile.brand}. Art-directed with AI-assisted coding tools.
          </p>
          <button type="button" className={styles.top} onClick={toTop}>
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
