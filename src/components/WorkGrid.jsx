import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './WorkGrid.module.css';
import ProjectCard from './ProjectCard';
import { motionOK } from '../lib/motion.js';

gsap.registerPlugin(ScrollTrigger);

/*
  Asymmetric on purpose: columns are weighted 7/5 and pushed off the baseline in
  alternating rows, so the grid never reads as a set of equal cards.
*/
const LAYOUT = [
  { span: 7, push: false },
  { span: 5, push: true },
  { span: 5, push: false },
  { span: 7, push: true },
  { span: 7, push: false },
  { span: 5, push: true },
];

const layoutFor = (index) => LAYOUT[index % LAYOUT.length];

/**
 * WorkGrid — the project list.
 *
 * `visible` is already filtered by Work. Cards are keyed by slug so React keeps
 * the same DOM nodes for projects that survive a filter change, which lets GSAP
 * Flip animate the survivors into their new positions while new cards scale in.
 *
 * The parent owns `gridRef` (so it can capture Flip state before a filter
 * change) and `counterRef` (the "01 / 06" sticky counter this grid drives).
 */
export default function WorkGrid({ visible, onOpen, gridRef, flipState, counterRef }) {
  const computeRef = useRef(() => {});
  const flipRef = useRef(null);

  /* --- scroll reveal, once, on first mount -------------------------------- */
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return undefined;
      if (!motionOK()) return undefined;

      const cards = gsap.utils.toArray('[data-card]', grid);
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { clipPath: 'inset(0% 0% 100% 0%)', y: 46, opacity: 0 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
            onComplete: () => gsap.set(card, { clearProps: 'clipPath,transform,opacity' }),
          }
        );
      });
    },
    { scope: gridRef }
  );

  /* --- Flip layout transition when the filter changes --------------------- */
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return undefined;

      // Flip runs in "absolute" mode, which parks elements with inline
      // transform/position styles. Interrupting a flip skips Flip's own tidy-up,
      // so those styles are cleared by hand or a card is stranded off the grid.
      const cleanUp = () =>
        gsap.set(gsap.utils.toArray('[data-card]', grid), {
          clearProps: 'transform,position,top,left,width,height,opacity',
        });

      if (!flipState) return undefined;
      if (!motionOK()) return undefined;

      // Cancel anything still in flight and normalise before measuring again.
      flipRef.current?.kill();
      cleanUp();

      let cancelled = false;
      const runFlip = async () => {
        // GSAP's Flip plugin is loaded on first use, not on page load.
        const { Flip } = await import('gsap/Flip');
        gsap.registerPlugin(Flip);
        if (cancelled || !gridRef.current) return;
        const cards = gsap.utils.toArray('[data-card]', grid);
        const flip = Flip.from(flipState, {
          targets: cards,
          duration: 0.6,
          ease: 'power3.inOut',
          absolute: true,
          stagger: 0.03,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: true }
            ),
          onComplete: cleanUp,
        });
        flipRef.current = flip;
      };
      runFlip();

      return () => {
        cancelled = true;
        flipRef.current?.kill();
        flipRef.current = null;
        cleanUp();
      };
    },
    { dependencies: [flipState], scope: gridRef }
  );

  /* --- "01 / 06" counter updates as cards pass ---------------------------- */
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return undefined;

      const compute = () => {
        const cards = gsap.utils.toArray('[data-card]', grid);
        if (!cards.length || !counterRef?.current) return;
        const line = window.innerHeight * 0.55;
        let current = 1;
        cards.forEach((card, i) => {
          if (card.getBoundingClientRect().top <= line) current = i + 1;
        });
        counterRef.current.textContent = String(current).padStart(2, '0');
      };

      computeRef.current = compute;
      const trigger = ScrollTrigger.create({
        trigger: grid,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: compute,
        onRefresh: compute,
      });

      return () => {
        trigger.kill();
        computeRef.current = () => {};
      };
    },
    { scope: gridRef }
  );

  /* --- after a filter change, re-measure and reset the counter ------------ */
  useEffect(() => {
    if (counterRef?.current) counterRef.current.textContent = '01';
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      computeRef.current?.();
    });
    return () => cancelAnimationFrame(id);
  }, [visible, counterRef]);

  return (
    <ul ref={gridRef} className={`grid-12 ${styles.grid}`}>
      {visible.map((project, index) => {
        const cell = layoutFor(index);
        const classes = [
          cell.span === 7 ? styles.wide : styles.narrow,
          cell.push ? styles.push : '',
          styles.cell,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li key={project.slug} className={classes} data-card data-tag={project.tag}>
            <ProjectCard project={project} index={index} onOpen={onOpen} />
          </li>
        );
      })}
    </ul>
  );
}
