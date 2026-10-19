import { useCallback, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import styles from './Preloader.module.css';
import { profile } from '../data/profile';
import { motionOK } from '../lib/motion.js';

gsap.registerPlugin(CustomEase);

/* Exact curtain curve requested: cubic-bezier(0.16, 1, 0.3, 1) —
   the same shape as --ease-out-expo, expressed as a GSAP CustomEase. */
CustomEase.create('curtain', 'M0,0 C0.16,1 0.3,1 1,1');

const STORAGE_KEY = 'ag:preloaded';

/**
 * Preloader — a fast name reveal plus a clip-path curtain wipe.
 *
 * Budget: it always finishes well under 1.2s and can be skipped with a click
 * or Esc. It plays once per session (sessionStorage). The full-screen curtain
 * is heavy, so under reduced motion it plays a light version (name + counter,
 * then a short fade — no wipe). Decorative, hidden from assistive tech.
 *
 * @param {object} props
 * @param {() => void} props.onDone  called when the curtain has cleared
 */
export default function Preloader({ onDone }) {
  const rootRef = useRef(null);
  const counterRef = useRef(null);
  const timelineRef = useRef(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* private mode — just play it again next visit */
    }
    onDone();
  }, [onDone]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      /* The full-screen curtain wipe is heavy. Under reduced motion the
         preloader still plays — name + counter — but finishes on a short fade
         instead of a wipe. A revisit in the same session skips it entirely. */
      const heavy = motionOK();
      let seen = false;
      try {
        seen = sessionStorage.getItem(STORAGE_KEY) === '1';
      } catch {
        seen = false;
      }

      if (seen) {
        finish();
        return undefined;
      }

      const counter = { value: 0 };
      const timeline = gsap.timeline({ onComplete: finish });
      timelineRef.current = timeline;

      timeline
        .to(
          counter,
          {
            value: 100,
            duration: 0.5,
            ease: 'power1.inOut',
            onUpdate: () => {
              if (counterRef.current) {
                counterRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0');
              }
            },
          },
          0
        )
        .from(
          '[data-preloader-word]',
          { yPercent: 115, duration: 0.55, ease: 'expo.out', stagger: 0.06 },
          0
        )
        .to('[data-preloader-inner]', { opacity: 0, duration: 0.2 }, 0.55);

      if (heavy) {
        // Full curtain wipe — heavy motion.
        timeline.to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.5, ease: 'curtain' }, 0.66);
      } else {
        // LIGHT variant: no wipe, a short fade to reveal the page.
        timeline.to(root, { autoAlpha: 0, duration: 0.34, ease: 'power2.out' }, 0.6);
      }

      return () => timeline.kill();
    },
    { scope: rootRef }
  );

  // Click anywhere, or press Esc, to jump straight to the end.
  useEffect(() => {
    const onSkip = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      timelineRef.current?.progress(1);
      finish();
    };
    document.addEventListener('click', onSkip);
    document.addEventListener('keydown', onSkip);
    return () => {
      document.removeEventListener('click', onSkip);
      document.removeEventListener('keydown', onSkip);
    };
  }, [finish]);

  return (
    <div ref={rootRef} className={styles.preloader} aria-hidden="true">
      <div className={styles.inner} data-preloader-inner>
        <p className={styles.name}>
          {profile.brand.split(' ').map((word) => (
            <span key={word} className={styles.mask}>
              <span className={styles.word} data-preloader-word>
                {word}
              </span>
            </span>
          ))}
        </p>

        <p className={styles.meta}>
          <span ref={counterRef} className={styles.counter}>
            000
          </span>
          <span className={styles.unit}>%</span>
        </p>
      </div>

      <p className={styles.skip}>Click or press Esc to skip</p>
    </div>
  );
}
