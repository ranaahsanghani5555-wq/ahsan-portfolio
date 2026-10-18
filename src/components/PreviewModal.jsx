import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './PreviewModal.module.css';
import { projectHref } from '../data/projects';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { motionOK } from '../lib/motion.js';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: null },
  { id: 'tablet', label: 'Tablet 768', width: '768px' },
  { id: 'mobile', label: 'Mobile 390', width: '390px' },
];

/**
 * PreviewModal — fullscreen live preview of a concept demo in an iframe.
 *
 * The demo is served from the same origin, so it can be sandboxed with
 * allow-scripts + allow-same-origin. A device toggle narrows the iframe to
 * 768px / 390px so a reviewer can test the demo's responsive behaviour without
 * leaving the portfolio.
 */
export default function PreviewModal({ project, onClose, restoreRef }) {
  const modalRef = useRef(null);
  const scrimRef = useRef(null);
  const closingRef = useRef(false);

  const [device, setDevice] = useState('desktop');
  const [loaded, setLoaded] = useState(false);

  const { name, slug } = project;
  const headingId = `pv-${slug}-title`;
  const href = projectHref(slug);

  const reduced = !motionOK();

  const close = useCallback(() => {
    const node = modalRef.current;
    if (closingRef.current || reduced || !node) {
      onClose();
      return;
    }
    closingRef.current = true;
    gsap.to([scrimRef.current, node], {
      autoAlpha: 0,
      duration: 0.26,
      ease: 'power2.in',
      onComplete: onClose,
    });
  }, [onClose, reduced]);

  useFocusTrap(modalRef, { onClose: close, restoreTo: restoreRef });

  useGSAP(() => {
    if (reduced) return undefined;
    const timeline = gsap
      .timeline()
      .fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' })
      .fromTo(
        modalRef.current,
        { autoAlpha: 0, yPercent: 3, scale: 0.985 },
        { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.42, ease: 'power3.out' },
        0
      );
    return () => timeline.kill();
  }, { scope: modalRef });

  return createPortal(
    <>
      <div ref={scrimRef} className={styles.scrim} onClick={close} aria-hidden="true" />

      <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={headingId} tabIndex={-1}>
        <header className={styles.bar}>
          <p id={headingId} className={styles.title}>
            <span className={styles.titleName}>{name}</span>
            <span className={styles.titleMeta}>live preview · concept</span>
          </p>

          <div className={styles.devices} role="group" aria-label="Preview width">
            {DEVICES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.device}
                aria-pressed={device === item.id}
                onClick={() => setDevice(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <a className={styles.newTab} href={href} target="_blank" rel="noopener noreferrer">
            Open in new tab <span aria-hidden="true">↗</span>
          </a>

          <button type="button" className={styles.close} onClick={close} aria-label="Close preview">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className={styles.stage} data-device={device}>
          <div className={styles.frame} style={{ '--frame-w': DEVICES.find((d) => d.id === device)?.width ?? '100%' }}>
            {!loaded && (
              <div className={styles.loading} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                Loading preview…
              </div>
            )}

            <iframe
              className={styles.iframe}
              src={href}
              title={`${name} concept demo preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setLoaded(true)}
            />
          </div>

          {device !== 'desktop' && (
            <p className={styles.widthNote}>
              Simulating {device === 'tablet' ? '768' : '390'}px viewport width
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
