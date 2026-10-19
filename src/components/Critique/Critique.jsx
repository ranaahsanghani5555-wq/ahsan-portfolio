import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Critique.module.css';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import {
  critiqueExamples,
  scoreDimensions,
  heroBrief,
  convergenceEssay,
  convergenceStates,
  checklist,
} from '../../data/critique';
import { mockupScreens } from './CritiqueMockups';
import { Scorecard, CompareSlider, ConvergenceSlider } from './CritiqueTools';

/*
  Critique — the single full-bleed pine (inverted) section on the page.

  It is one editorial composition, not a set of widgets: a title block, then
  four blocks separated by hairline rules — a teardown, a before/after
  comparison, a short position piece with one interactive morph, and a
  checklist.

  Honesty: the three teardown screens are invented, simplified HTML/CSS
  mockups (never screenshots, never a real brand's page) and each carries the
  label “Illustrative example, not a real company’s site”. The scores are a
  personal judgement, captioned as such.

  The teardown's hotspots are positioned by measuring the real elements they
  point at (`data-target` in each mockup), so a marker always sits on the thing
  it describes at any width. For assistive tech the annotations are also a
  plain list, and on narrow screens that list is fully expanded beneath the
  mockup — hotspots are never the only way to read the critique.
*/

const PANEL_ID = 'critique-teardown-panel';
const RAIL_QUERY = '(min-width: 60rem)';

export default function Critique() {
  const scope = useScrollReveal('[data-reveal-item]', []);

  const [activeId, setActiveId] = useState(critiqueExamples[0].id);
  const [openHotspot, setOpenHotspot] = useState(null);
  const [positions, setPositions] = useState({});

  const isRail = useMediaQuery(RAIL_QUERY);
  const reduced = useReducedMotion();

  const example = critiqueExamples.find((item) => item.id === activeId) ?? critiqueExamples[0];

  const panelRef = useRef(null);
  const screenRef = useRef(null);
  const tabRefs = useRef([]);
  const hotspotRefs = useRef({});
  const bodyRefs = useRef({});
  const openerRef = useRef(null);

  /* --- hotspot placement: measure the targeted elements ------------------ */
  const measure = useCallback(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const sRect = screen.getBoundingClientRect();
    if (!sRect.width || !sRect.height) return;

    const clamp = (value) => Math.max(3, Math.min(97, value));
    const next = {};

    example.hotspots.forEach((spot) => {
      const target = screen.querySelector(`[data-target="${spot.target}"]`);
      if (!target) return;
      const r = target.getBoundingClientRect();
      const cx = ((r.left + r.width / 2 - sRect.left) / sRect.width) * 100 + (spot.dx ?? 0);
      const cy = ((r.top + r.height / 2 - sRect.top) / sRect.height) * 100 + (spot.dy ?? 0);
      next[spot.id] = { left: clamp(cx), top: clamp(cy) };
    });

    setPositions(next);
  }, [example]);

  useEffect(() => {
    measure();
    const screen = screenRef.current;
    if (!screen) return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  /* --- focus moves into an opened annotation, and back on close ---------- */
  useEffect(() => {
    if (!openHotspot) return;
    const body = bodyRefs.current[openHotspot];
    if (body) body.focus({ preventScroll: false });
  }, [openHotspot]);

  const openAnnotation = (id, opener) => {
    openerRef.current = opener ?? null;
    setOpenHotspot(id);
  };

  const closeAnnotation = useCallback(() => {
    setOpenHotspot(null);
    const opener = openerRef.current;
    if (opener && document.contains(opener)) opener.focus();
  }, []);

  const toggleAnnotation = (id, opener) => {
    if (openHotspot === id) {
      closeAnnotation();
      return;
    }
    openAnnotation(id, opener);
  };

  const onBodyKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeAnnotation();
    }
  };

  /* --- tabs: roving tabindex + arrow-key navigation ---------------------- */
  const selectTab = (id) => {
    setActiveId(id);
    setOpenHotspot(null);
    setPositions({});
  };

  const onTabKeyDown = (event, index) => {
    const last = critiqueExamples.length - 1;
    let next = null;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    selectTab(critiqueExamples[next].id);
    tabRefs.current[next]?.focus();
  };

  /* --- panel transition between examples (transform + opacity only) ------ */
  useGSAP(
    () => {
      const root = panelRef.current;
      if (!root || reduced) return;
      gsap.fromTo(
        root.querySelectorAll('[data-panel-anim]'),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.06,
          overwrite: true,
        }
      );
    },
    { scope: panelRef, dependencies: [activeId, reduced] }
  );

  const Screen = mockupScreens[example.screen];
  const activeTabId = `critique-tab-${example.id}`;

  return (
    <section id="critique" className="band band--pine section on-pine" ref={scope}>
      <div className="container">
        {/* ---- title block ------------------------------------------------ */}
        <header className={styles.head} data-reveal-item>
          <p className="eyebrow">Critique practice</p>
          <h2 className={styles.heading}>How I judge landing pages.</h2>
          <p className={styles.intro}>
            A close read of three invented example screens — one weak, one safe, one strong — then a
            before/after, a short position on where taste matters, and the checklist I run before
            anything ships. Every screen here is an illustrative example, not a real company’s site,
            and every score is my own judgement.
          </p>
        </header>

        {/* ---- teardown --------------------------------------------------- */}
        <div className={styles.block} data-reveal-item>
          <div className={styles.blockHead}>
            <p className="eyebrow">Teardown</p>
            <h3 className={styles.blockTitle}>Three screens, annotated.</h3>
          </div>

          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Choose an example to critique"
          >
            {critiqueExamples.map((item, index) => {
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  id={`critique-tab-${item.id}`}
                  className={`${styles.tab} ${selected ? styles.tabActive : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={PANEL_ID}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(item.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  <span className={styles.tabName}>{item.tab}</span>
                  <span className={styles.tabNote}>{item.tabNote}</span>
                </button>
              );
            })}
          </div>

          <div
            className={styles.panel}
            ref={panelRef}
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={activeTabId}
            tabIndex={0}
          >
            <div className={styles.stageGrid}>
              <div className={styles.stageCol} data-panel-anim>
                <div className={styles.frame}>
                  <div className={styles.chrome} aria-hidden="true">
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.url}>{example.brand.toLowerCase().replace(/\s+/g, '')}.example</span>
                  </div>

                  <div className={styles.screen} ref={screenRef} data-mockup="teardown">
                    <Screen />
                    <div className={styles.hotspots}>
                      {example.hotspots.map((spot) => {
                        const pos = positions[spot.id];
                        const open = openHotspot === spot.id;
                        const bodyId = `critique-ann-${spot.id}`;
                        return (
                          <button
                            key={spot.id}
                            ref={(el) => {
                              hotspotRefs.current[spot.id] = el;
                            }}
                            type="button"
                            className={`${styles.hotspot} ${open ? styles.hotspotOpen : ''}`}
                            data-hotspot-target={spot.target}
                            style={{
                              left: pos ? `${pos.left}%` : '50%',
                              top: pos ? `${pos.top}%` : '50%',
                              opacity: pos ? 1 : 0,
                            }}
                            aria-label={`Annotation ${spot.n}: ${spot.title}`}
                            aria-expanded={open}
                            aria-controls={bodyId}
                            onClick={(event) => toggleAnnotation(spot.id, event.currentTarget)}
                          >
                            {spot.n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.stageMeta}>
                  <p className={styles.stageBrand}>
                    {example.brand} <span className={styles.stageKind}>· {example.kind}</span>
                  </p>
                  <p className={styles.honesty}>{example.honesty}</p>
                </div>
              </div>

              <div className={styles.rail} data-panel-anim>
                <p className={styles.railHint}>
                  {isRail
                    ? 'Select a marker on the screen — or a row here — to read the note.'
                    : 'Notes for this screen.'}
                </p>

                <ol className={styles.notes}>
                  {example.hotspots.map((spot) => {
                    const open = openHotspot === spot.id;
                    const bodyId = `critique-ann-${spot.id}`;
                    const headerInner = (
                      <>
                        <span className={styles.noteNum}>{spot.n}</span>
                        <span className={styles.noteMeta}>
                          <span className={styles.noteTag}>{spot.tag}</span>
                          <span className={styles.noteTitle}>{spot.title}</span>
                        </span>
                      </>
                    );

                    return (
                      <li
                        key={spot.id}
                        className={`${styles.note} ${open ? styles.noteOpen : ''}`}
                      >
                        {isRail ? (
                          <button
                            type="button"
                            className={styles.noteHeader}
                            aria-expanded={open}
                            aria-controls={bodyId}
                            onClick={(event) => toggleAnnotation(spot.id, event.currentTarget)}
                          >
                            {headerInner}
                          </button>
                        ) : (
                          <div className={styles.noteHeader}>{headerInner}</div>
                        )}

                        <div
                          className={styles.noteBody}
                          id={bodyId}
                          ref={(el) => {
                            bodyRefs.current[spot.id] = el;
                          }}
                          tabIndex={-1}
                          onKeyDown={onBodyKeyDown}
                        >
                          <dl className={styles.noteList}>
                            <div className={styles.noteRow}>
                              <dt>Observation</dt>
                              <dd>{spot.observation}</dd>
                            </div>
                            <div className={styles.noteRow}>
                              <dt>Why it matters</dt>
                              <dd>
                                <span className={styles.noteTagInline}>{spot.tag}</span>
                                {spot.why}
                              </dd>
                            </div>
                            <div className={styles.noteRow}>
                              <dt>Fix</dt>
                              <dd>{spot.fix}</dd>
                            </div>
                          </dl>
                          {isRail && (
                            <button
                              type="button"
                              className={styles.noteClose}
                              onClick={closeAnnotation}
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            <div className={styles.scoreWrap} data-panel-anim>
              <Scorecard example={example} dimensions={scoreDimensions} />
            </div>
          </div>
        </div>

        {/* ---- AI draft vs my refinement ---------------------------------- */}
        <div className={styles.block} data-reveal-item>
          <div className={styles.blockHead}>
            <p className="eyebrow">Revision</p>
            <h3 className={styles.blockTitle}>AI draft vs my refinement.</h3>
            <p className={styles.blockIntro}>
              The same invented hero brief, twice. Drag the handle — or use the arrow keys — to
              compare. <span className={styles.inlineHonesty}>{heroBrief.honesty}</span>
            </p>
          </div>

          <CompareSlider />

          <ul className={styles.revisionNotes}>
            {heroBrief.notes.map((note) => (
              <li key={note.key} className={styles.revisionNote} data-reveal-item>
                <p className={styles.revisionKey}>{note.key}</p>
                <p className={styles.revisionBody}>{note.body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- convergence vs divergence ---------------------------------- */}
        <div className={styles.block} data-reveal-item>
          <div className={styles.blockHead}>
            <p className="eyebrow">Position</p>
            <h3 className={styles.blockTitle}>Convergence vs divergence.</h3>
          </div>

          <div className={styles.essayGrid}>
            <div className={styles.essay}>
              {/* EDIT: make this sound like me */}
              {convergenceEssay.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            <ConvergenceSlider states={convergenceStates} />
          </div>
        </div>

        {/* ---- checklist -------------------------------------------------- */}
        <div className={styles.block} data-reveal-item>
          <div className={styles.blockHead}>
            <p className="eyebrow">Before it ships</p>
            <h3 className={styles.blockTitle}>My evaluation checklist.</h3>
          </div>

          <ul className={styles.checklist}>
            {checklist.map((item, index) => (
              <li key={item} className={styles.checkitem} data-reveal-item>
                <span className={styles.checkNum} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.checkText}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
