import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import styles from './Work.module.css';
import { projects, projectCount, projectTags } from '../data/projects';
import { useLenisControl } from '../hooks/useLenis';
import WorkGrid from './WorkGrid';
import { motionOK } from '../lib/motion.js';

/* The filter animation needs GSAP's Flip plugin; the dialogs are heavy and
   only exist while open. All three load on first use, not on page load. */
const CaseStudyPanel = lazy(() => import('./CaseStudyPanel.jsx'));
const PreviewModal = lazy(() => import('./PreviewModal.jsx'));

/**
 * Work — six self-initiated concept projects behind a filterable grid.
 *
 * Filtering captures the grid's Flip state *before* the visible set changes,
 * so the surviving cards can be tweened into their new positions; the panel and
 * modal are portalled dialogs that pause Lenis while open.
 */
export default function Work() {
  const gridRef = useRef(null);
  const counterRef = useRef(null);
  const panelOpenerRef = useRef(null);
  const previewOpenerRef = useRef(null);

  const [active, setActive] = useState('All');
  const [flipState, setFlipState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);

  const lenis = useLenisControl();

  const visible = active === 'All' ? projects : projects.filter((project) => project.tag === active);

  /* --- filter: capture Flip state, then switch the visible set ------------ */
  const handleFilter = useCallback(
    async (tag) => {
      if (tag === active) return;
      const grid = gridRef.current;
      if (grid) {
        const reduced = !motionOK();
        if (reduced) {
          setFlipState(null);
        } else {
          const { Flip } = await import('gsap/Flip'); // loaded on first filter click
          // Registration is not optional in the module build: Flip's internal
          // helpers (its _toArray) are only initialised by registerPlugin, so
          // calling Flip.getState() first throws "oe is not a function".
          gsap.registerPlugin(Flip);
          setFlipState(Flip.getState(grid.querySelectorAll('[data-card]')));
        }
      }
      if (counterRef.current) counterRef.current.textContent = '01';
      setActive(tag);
    },
    [active]
  );

  /* --- dialogs ------------------------------------------------------------ */
  const openCaseStudy = useCallback((project, trigger) => {
    panelOpenerRef.current = trigger ?? document.activeElement;
    setSelected(project);
  }, []);
  const closeCaseStudy = useCallback(() => setSelected(null), []);

  const openPreview = useCallback((project, trigger) => {
    previewOpenerRef.current = trigger ?? document.activeElement;
    setPreview(project);
  }, []);
  const closePreview = useCallback(() => setPreview(null), []);

  /* Single scroll lock for whichever dialog is on top. */
  const anyDialogOpen = Boolean(selected || preview);
  useEffect(() => {
    if (!anyDialogOpen) return undefined;
    const root = document.documentElement;
    root.classList.add('is-locked');
    lenis?.stop();
    return () => {
      root.classList.remove('is-locked');
      lenis?.start();
    };
  }, [anyDialogOpen, lenis]);

  const counterTotal = String(visible.length).padStart(2, '0');

  return (
    <section id="work" className="section">
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow">Selected concept work</p>
          <h2 className={styles.title}>
            {projectCount} concept projects, {projectCount} different problems.
          </h2>
          <p className={styles.note}>
            Everything here is self-initiated <strong>concept work</strong> — no clients,
            no testimonials and no invented numbers. Each demo uses an invented brand name,
            its own palette and its own type pairing. Placeholder content inside each demo is
            marked “Sample content”.
          </p>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="Filter projects by category">
            {projectTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.chip}
                aria-pressed={active === tag}
                onClick={() => handleFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <p className={styles.counter} aria-hidden="true">
            <span ref={counterRef} className={styles.counterNow}>
              01
            </span>
            <span className={styles.counterSep}>/</span>
            <span className={styles.counterTotal}>{counterTotal}</span>
          </p>
        </div>

        <p className="visually-hidden" aria-live="polite">
          Showing {visible.length} of {projectCount} concept projects
          {active === 'All' ? '.' : ` in ${active}.`}
        </p>

        <WorkGrid
          visible={visible}
          onOpen={openCaseStudy}
          gridRef={gridRef}
          flipState={flipState}
          counterRef={counterRef}
        />
      </div>

      {selected && (
        <Suspense fallback={null}>
          <CaseStudyPanel
            project={selected}
            onClose={closeCaseStudy}
            onPreview={openPreview}
            restoreRef={panelOpenerRef}
            previewActive={Boolean(preview)}
          />
        </Suspense>
      )}

      {preview && (
        <Suspense fallback={null}>
          <PreviewModal project={preview} onClose={closePreview} restoreRef={previewOpenerRef} />
        </Suspense>
      )}
    </section>
  );
}
