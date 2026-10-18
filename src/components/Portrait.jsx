import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Portrait.module.css';
import { profile } from '../data/profile';
import { motionOK } from '../lib/motion.js';

/*
  Portrait — the single, easy-to-swap portrait. It reads its path, sizes and
  alt text from profile.js, so changing the photo means editing one file.

  - Fixed 4/5 aspect ratio (no layout shift), object-fit: cover with the face
    held near the top-centre.
  - loading="lazy" / decoding="async": the portrait is below the fold.
  - If the image fails to load, a stylised CSS/SVG frame takes its place, so
    the layout never breaks.
  - A gentle tilt on hover — transform only, and disabled on touch and under
    reduced motion.
*/

export default function Portrait() {
  const [failed, setFailed] = useState(false);
  const tiltRef = useRef(null);

  useGSAP(
    () => {
      const el = tiltRef.current;
      if (!el || failed) return undefined;

      const canTilt =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        motionOK();
      if (!canTilt) return undefined;

      const enter = () =>
        gsap.to(el, { rotate: 1.8, y: -6, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      const leave = () =>
        gsap.to(el, { rotate: 0, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });

      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
      return () => {
        el.removeEventListener('pointerenter', enter);
        el.removeEventListener('pointerleave', leave);
      };
    },
    { dependencies: [failed], scope: tiltRef }
  );

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.tilt} ref={tiltRef}>
          {failed ? (
            <div className={styles.fallback} role="img" aria-label={profile.portraitAlt}>
              <svg className={styles.fallbackArt} viewBox="0 0 120 150" aria-hidden="true" focusable="false">
                <rect x="6" y="6" width="108" height="138" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="60" cy="56" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M28 122c6-22 18-32 32-32s26 10 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className={styles.fallbackMark}>{profile.brand}</span>
            </div>
          ) : (
            <img
              className={styles.img}
              data-portrait-img
              src={profile.portraitSrc}
              srcSet={`${profile.portraitSrc400} 400w, ${profile.portraitSrc} 800w`}
              sizes="(min-width: 60rem) 320px, min(20rem, 78vw)"
              width={profile.portraitWidth}
              height={profile.portraitHeight}
              alt={profile.portraitAlt}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <span className={styles.accent} aria-hidden="true" />
      </div>
      <figcaption className={styles.caption}>
        {profile.brand}, {profile.location.split(',')[0]}
      </figcaption>
    </figure>
  );
}