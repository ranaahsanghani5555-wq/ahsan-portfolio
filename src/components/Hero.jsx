import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Hero.module.css';
import { profile } from '../data/profile';
import { useMagnetic } from '../hooks/useMagnetic';
import SplitText from './SplitText.jsx';
import HeroBackdrop from './HeroBackdrop.jsx';
import SkillsMarquee from './SkillsMarquee.jsx';

/**
 * Hero — one focal point per viewport: the headline and a single primary
 * action. The availability line, lead and skills band support it without
 * competing. The intro (headline mask reveal + supporting fade-up) waits for
 * the preloader to clear, then runs once.
 *
 * @param {object} props
 * @param {boolean} [props.play]  whether the intro choreography may run
 */
export default function Hero({ play = true }) {
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const primaryRef = useMagnetic({ strength: 0.3, max: 30 });
  const secondaryRef = useMagnetic({ strength: 0.18, max: 12 });

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return undefined;

      /* The entrance is light (fades, <=24px reveals, a short stagger), so it
         runs for everyone; only heavy motion (backdrop drift, cursor trail) is
         gated through motionOK(). */
      const reveals = gsap.utils.toArray('[data-hero-reveal]', root);
      gsap.set(reveals, { y: 22, autoAlpha: 0 });

      const timeline = gsap.timeline({ paused: true, delay: 0.15 });
      timeline.to(reveals, {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
      });
      introRef.current = timeline;

      const dot = root.querySelector('[data-hero-pulse]');
      const pulse = dot
        ? gsap.to(dot, {
            scale: 1.7,
            opacity: 0.35,
            duration: 1.4,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })
        : null;

      return () => {
        timeline.kill();
        pulse?.kill();
        introRef.current = null;
      };
    },
    { scope: rootRef }
  );

  useEffect(() => {
    const timeline = introRef.current;
    if (!timeline) return;
    if (play) {
      /* Tells index.html's 1.5s failsafe that the intro really is running, so
         it stands down while this timeline owns the reveal. */
      window.__agIntroStarted = true;
      timeline.play();
    } else {
      timeline.pause(0);
    }
  }, [play]);

  return (
    <section ref={rootRef} id="top" className={styles.hero}>
      <HeroBackdrop />

      <div className={`container ${styles.inner}`}>
        <p className={styles.availability} data-hero-reveal>
          <span className={styles.pulse} aria-hidden="true">
            <span className={`${styles.pulseRing} motion-light`} />
            <span className={styles.pulseDot} data-hero-pulse />
          </span>
          Available for projects · {profile.location}
        </p>

        <SplitText
          as="h1"
          className={styles.title}
          play={play}
          delay={0.05}
          stagger={0.06}
          duration={0.75}
          parts={[
            { text: 'I design landing pages that ' },
            { text: 'convert and feel alive', emphasis: true },
            { text: '.' },
          ]}
        />

        <p className={styles.lead} data-hero-reveal>
          Landing pages and marketing sites built to hold attention — where the
          hierarchy argues the case and the next action is never in doubt.
        </p>

        <div className={styles.actions} data-hero-reveal>
          <a ref={primaryRef} className={styles.primary} href="#work">
            View work
          </a>
          <a ref={secondaryRef} className={styles.secondary} href="#contact">
            Let&apos;s talk
          </a>
        </div>
      </div>

      <SkillsMarquee />

      <div className={`${styles.scrollCue} motion-light`} aria-hidden="true">
        <span className={styles.scrollCueTrack}>
          <span className={styles.scrollCueDot} />
        </span>
        <span className={styles.scrollCueLabel}>Scroll</span>
      </div>
    </section>
  );
}
