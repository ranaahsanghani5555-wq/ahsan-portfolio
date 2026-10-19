import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './SkillsMarquee.module.css';

const SKILLS = [
  'Landing Pages',
  'Marketing Sites',
  'Design Systems',
  'Motion',
  'Conversion Design',
  'Design Critique',
];

/**
 * SkillsMarquee — the running band of disciplines under the hero.
 *
 * The track holds two identical lists and slides by exactly half its width,
 * so the loop is seamless. Hover/focus pauses it. A slow marquee is a LIGHT
 * feature (see src/lib/motion.js), so it runs for everyone.
 */
export default function SkillsMarquee() {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      const track = root.querySelector('[data-marquee-track]');
      if (!track) return undefined;

      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 28,
        ease: 'none',
        repeat: -1,
      });

      const pause = () => tween.pause();
      const resume = () => tween.play();

      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', resume);
      root.addEventListener('focusin', pause);
      root.addEventListener('focusout', resume);

      return () => {
        root.removeEventListener('mouseenter', pause);
        root.removeEventListener('mouseleave', resume);
        root.removeEventListener('focusin', pause);
        root.removeEventListener('focusout', resume);
        tween.kill();
      };
    },
    { scope: rootRef }
  );

  const renderList = (hidden) => (
    <ul className={styles.list} aria-hidden={hidden || undefined}>
      {SKILLS.map((skill) => (
        <li key={skill} className={styles.item}>
          <span className={styles.dot} aria-hidden="true">
            ◆
          </span>
          {skill}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={rootRef} className={styles.marquee}>
      <h2 className="visually-hidden">Skills and services</h2>
      <div className={styles.track} data-marquee-track>
        {renderList(false)}
        {renderList(true)}
      </div>
    </div>
  );
}
