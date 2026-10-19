import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './CaseStudyPanel.module.css';
import { projectHref } from '../data/projects';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { motionOK } from '../lib/motion.js';

/**
 * CaseStudyPanel — a right-hand slide-in dialog with the full concept note:
 * brief, audience, three design decisions, and the verifiable facts.
 *
 * Rendered into a portal so it is never trapped by a transformed ancestor.
 * Focus is trapped while the panel owns the keyboard; when a Quick preview
 * modal opens on top, `previewActive` suspends this trap so the two dialogs
 * never fight over Tab or Escape.
 */
export default function CaseStudyPanel({ project, onClose, onPreview, restoreRef, previewActive }) {
  const panelRef = useRef(null);
  const scrimRef = useRef(null);
  const closingRef = useRef(false);

  const { name, tag, year, role, brief, audience, decisions, facts, slug, conceptLabel } = project;
  const headingId = `cs-${slug}-title`;
  const audienceId = `cs-${slug}-audience`;

  const reduced = !motionOK();

  const close = useCallback(() => {
    const node = panelRef.current;
    if (closingRef.current || reduced || !node) {
      onClose();
      return;
    }
    closingRef.current = true;
    gsap.to(scrimRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(node, {
      xPercent: 100,
      duration: 0.42,
      ease: 'power3.in',
      onComplete: onClose,
    });
  }, [onClose, reduced]);

  useFocusTrap(panelRef, {
    active: !previewActive,
    onClose: close,
    restoreTo: restoreRef,
  });

  /* --- slide in ----------------------------------------------------------- */
  useGSAP(() => {
    const node = panelRef.current;
    if (!node) return undefined;
    /* Opening is LIGHT. Under reduced motion it is a plain fade (no slide). */
    const timeline = gsap
      .timeline()
      .fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
      .fromTo(
        node,
        reduced ? { autoAlpha: 0 } : { xPercent: 100 },
        reduced
          ? { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }
          : { xPercent: 0, duration: 0.5, ease: 'power3.out' },
        0
      );

    return () => timeline.kill();
  }, { scope: panelRef });

  return createPortal(
    <>
      <div ref={scrimRef} className={styles.scrim} onClick={close} aria-hidden="true" />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
      >
        <button type="button" className={styles.close} onClick={close} aria-label="Close case study">
          <span aria-hidden="true">×</span>
        </button>

        <div className={styles.scroll} data-lenis-prevent>
          <header className={styles.head}>
            <p className={styles.eyebrow}>
              {tag} · {year}
            </p>
            <h2 id={headingId} className={styles.title}>
              {name}
            </h2>
            <p className={styles.role}>{role}</p>
            <p className={styles.concept}>{conceptLabel}</p>
          </header>

          <p className={styles.brief}>{brief}</p>

          <section className={styles.block} aria-labelledby={audienceId}>
            <h3 id={audienceId} className={styles.blockTitle}>
              Audience
            </h3>
            <p className={styles.audience}>{audience}</p>
          </section>

          <section className={styles.block}>
            <h3 className={styles.blockTitle}>Design decisions</h3>
            <ol className={styles.decisions}>
              {decisions.map((item, index) => (
                <li key={item.decision} className={styles.decision}>
                  <p className={styles.decisionTitle}>
                    <span className={styles.decisionNumber} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {item.decision}
                  </p>
                  <p className={styles.decisionWhy}>{item.why}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.block}>
            <h3 className={styles.blockTitle}>Verifiable facts</h3>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>Breakpoints tested</dt>
                <dd>{facts.breakpoints.join(' / ')} px</dd>
              </div>
              <div className={styles.fact}>
                <dt>Sections</dt>
                <dd>{facts.sections}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Hours</dt>
                <dd>{facts.hours}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Lighthouse</dt>
                <dd>{facts.lighthouse}</dd>
              </div>
            </dl>
            <p className={styles.disclaimer}>
              Self-initiated concept. No clients, no testimonials, no invented results.
            </p>
          </section>
        </div>

        <footer className={styles.actions}>
          <a
            className={styles.primary}
            href={projectHref(slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open live site <span aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            className={styles.secondary}
            onClick={(event) => onPreview?.(project, event.currentTarget)}
          >
            Quick preview
          </button>
        </footer>
      </div>
    </>,
    document.body
  );
}
