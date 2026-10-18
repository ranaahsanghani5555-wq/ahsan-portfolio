import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { splitLines } from '../lib/splitLines';
import { motionOK } from '../lib/motion.js';

/**
 * SplitText — our own line-by-line mask reveal (no paid SplitText plugin).
 *
 * The original string stays the source of truth for assistive tech via
 * `aria-label`; the generated visual lines are wrapped and marked
 * `aria-hidden`. Under reduced motion nothing is split or hidden, so the
 * plain text is simply read and shown.
 *
 * @param {object} props
 * @param {string} [props.as]       element tag, defaults to "h1"
 * @param {Array<{text: string, emphasis?: boolean}>} props.parts
 * @param {string} [props.className]
 * @param {boolean} [props.play]    when false the reveal waits for the intro
 * @param {boolean} [props.onScroll] play on ScrollTrigger enter instead
 */
export default function SplitText({
  as: Tag = 'h1',
  parts,
  className,
  play = true,
  onScroll = false,
  delay = 0,
  stagger = 0.085,
  duration = 0.95,
  start = 'top 88%',
}) {
  const ref = useRef(null);
  const timelineRef = useRef(null);
  const plain = parts.map((part) => part.text).join('');

  /* Read the motion preference once, at first render. Under reduced motion the
     component renders the parts as styled spans (so the emphasis word keeps its
     italic + accent) instead of dropping to un-styled plain text. Read once, not
     subscribed, so a mid-session preference change can never re-render over the
     line-split DOM that GSAP owns. */
  const reducedRef = useRef(!motionOK());
  const reduced = reducedRef.current;

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return undefined;

      if (reduced) return undefined; // plain, readable, un-animated

      const { lines, restore } = splitLines(element, parts);
      if (!lines.length) return undefined;

      gsap.set(lines, { yPercent: 110, opacity: 0 });

      const timeline = gsap.timeline({ paused: true, delay });
      timeline.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration,
        ease: 'expo.out',
        stagger,
      });
      timelineRef.current = timeline;

      let trigger;
      let cancelled = false;
      if (onScroll) {
        // ScrollTrigger is only needed by the sections that reveal on scroll,
        // so it is fetched on demand and stays out of the first-paint bundle.
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
          if (cancelled) return;
          gsap.registerPlugin(ScrollTrigger);
          trigger = ScrollTrigger.create({
            trigger: element,
            start,
            once: true,
            onEnter: () => timeline.play(),
          });
        });
      }

      // gsap.context runs this on unmount (and on strict-mode remount).
      return () => {
        cancelled = true;
        timeline.kill();
        trigger?.kill();
        timelineRef.current = null;
        restore();
      };
    },
    { scope: ref }
  );

  useEffect(() => {
    const timeline = timelineRef.current;
    if (onScroll || !timeline) return;
    if (play) timeline.play();
    else timeline.pause(0);
  }, [play, onScroll]);

  return (
    <Tag ref={ref} className={className} aria-label={plain}>
      {reduced
        ? parts.map((part, index) =>
            part.emphasis ? (
              <span key={index} className="split-word is-emphasis">
                {part.text}
              </span>
            ) : (
              <span key={index}>{part.text}</span>
            )
          )
        : plain}
    </Tag>
  );
}
