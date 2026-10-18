import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Critique.module.css';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/*
  CritiqueTools — the scorecard, the AI-draft/refinement comparison slider and
  the convergence/divergence morph. All three animate transform, opacity or
  clip-path only, and every one has an instant path under reduced-motion.
*/

/* -------------------------------------------------------------------------
   Scorecard — 0–10 bars for one example. Bars animate with scaleX (a
   transform), and the number counts up. The row is exposed to assistive tech
   as a `meter`, so the moving number is decoration only.
   ------------------------------------------------------------------------- */
export function Scorecard({ example, dimensions }) {
  const rootRef = useRef(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const rows = gsap.utils.toArray('[data-score-row]', root);
      rows.forEach((row, index) => {
        const fill = row.querySelector('[data-score-fill]');
        const value = row.querySelector('[data-score-value]');
        const target = Math.max(0, Math.min(1, Number(row.dataset.value) / 10));

        if (reduced) {
          gsap.set(fill, { scaleX: target });
          if (value) value.textContent = row.dataset.value;
          return;
        }

        gsap.set(fill, { scaleX: 0 });
        if (value) value.textContent = '0';

        const delay = index * 0.07;
        gsap.to(fill, {
          scaleX: target,
          duration: 0.7,
          ease: 'power3.out',
          delay,
        });

        const counter = { n: 0 };
        gsap.to(counter, {
          n: Number(row.dataset.value),
          duration: 0.7,
          ease: 'power3.out',
          delay,
          onUpdate: () => {
            if (value) value.textContent = String(Math.round(counter.n));
          },
        });
      });
    },
    { scope: rootRef, dependencies: [example.id, reduced], revertOnUpdate: true }
  );

  return (
    <div className={styles.scorecard} ref={rootRef}>
      <div className={styles.scorecardHead}>
        <p className={styles.scorecardTitle}>Scorecard</p>
        <p className={styles.scorecardCaption}>My judgment of this example</p>
      </div>

      <div className={styles.scoreRows}>
        {dimensions.map((dim) => {
          const value = example.scores[dim.key];
          return (
            <div
              key={dim.key}
              className={styles.scoreRow}
              data-score-row
              data-value={value}
              role="meter"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`${dim.label}: ${value} out of 10. My judgment of this example.`}
            >
              <span className={styles.scoreLabel} aria-hidden="true">
                {dim.label}
              </span>
              <span className={styles.scoreTrack} aria-hidden="true">
                <span className={styles.scoreFill} data-score-fill />
              </span>
              <span className={styles.scoreValue} aria-hidden="true" data-score-value>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Comparison slider — the same invented hero brief, twice. A transparent
   native <input type="range"> covers the stage so the control works with a
   mouse, a finger and the arrow keys. The handle and the clip edge are drawn
   from the same value, so they always agree.
   ------------------------------------------------------------------------- */

function DraftHero() {
  return (
    <div className={`${styles.cpHero} ${styles.cpDraft}`}>
      <span className={styles.cpPill}>✦ AI-powered</span>
      <p className={styles.cpHeadline}>Freshly Baked Happiness</p>
      <p className={styles.cpSub}>
        Experience the best in artisanal quality with a modern twist your customers will love.
      </p>
      <div className={styles.cpCtas}>
        <span className={`${styles.cpBtn} ${styles.cpBtnSolid}`}>Order Now</span>
        <span className={styles.cpBtn}>Learn More</span>
      </div>
      <div className={styles.cpTiles} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function RefinedHero() {
  return (
    <div className={`${styles.cpHero} ${styles.cpRefined}`}>
      <div className={styles.cpRefinedCopy}>
        <p className={styles.cpEyebrow}>Marlow &amp; Rye · bakery</p>
        <p className={styles.cpRefinedHeadline}>Out of the oven at 7am.</p>
        <p className={styles.cpRefinedSub}>
          Sourdough, rye and pastry, baked this morning — reserve yours for pickup.
        </p>
        <div className={styles.cpCtas}>
          <span className={`${styles.cpBtn} ${styles.cpBtnInk}`}>Reserve for pickup</span>
        </div>
        <p className={styles.cpNote}>Order before 5pm for tomorrow.</p>
      </div>
      <div className={styles.cpRefinedImage} aria-hidden="true" />
    </div>
  );
}

export function CompareSlider() {
  const [pos, setPos] = useState(52);
  const t = pos / 100;

  return (
    <div className={styles.cmp}>
      <div className={styles.cmpStage} style={{ '--t': t }} data-mockup="compare">
        <div className={styles.cmpLayer}>
          <RefinedHero />
        </div>
        <div className={`${styles.cmpLayer} ${styles.cmpLayerDraft}`}>
          <DraftHero />
        </div>
        <div className={styles.cmpHandle} aria-hidden="true">
          <span className={styles.cmpGrip}>‹ ›</span>
        </div>
        <input
          className={styles.cmpRange}
          type="range"
          min="0"
          max="100"
          step="1"
          value={pos}
          onChange={(event) => setPos(Number(event.target.value))}
          aria-label="Compare AI draft and refined version"
          aria-valuetext={`${pos}% AI draft shown`}
        />
      </div>

      <div className={styles.cmpLegend}>
        <span className={styles.cmpLegendItem}>
          <span className={styles.cmpSwatch} data-swatch="draft" aria-hidden="true" /> AI draft
        </span>
        <span className={styles.cmpLegendItem}>
          My refinement <span className={styles.cmpSwatch} data-swatch="refined" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Convergence / divergence — one small mockup morphing between a safe default
   and a distinctive direction. The two states are layered and cross-faded with
   opacity, so nothing but opacity (and one transform) changes. A single GSAP
   float represents "motion intensity" and scales its speed with the slider.
   ------------------------------------------------------------------------- */

function ConvergentMock() {
  return (
    <div className={`${styles.kmock} ${styles.kmockSafe}`}>
      <div className={styles.kmNav}>
        <span className={styles.kmLogo}>Northwind</span>
        <span className={styles.kmNavBtn}>Get started</span>
      </div>
      <p className={styles.kmHeadline}>Simple tools for busy teams</p>
      <p className={styles.kmBody}>
        Everything you need to plan, share and ship — all in one calm, familiar place.
      </p>
      <span className={styles.kmBtn}>Start free</span>
    </div>
  );
}

function DivergentMock() {
  return (
    <div className={`${styles.kmock} ${styles.kmockBold}`}>
      <div className={styles.kmNav}>
        <span className={styles.kmLogo}>Northwind</span>
        <span className={styles.kmNavBtn}>Get started →</span>
      </div>
      <p className={styles.kmHeadline}>Plan less. Ship louder.</p>
      <p className={styles.kmBody}>
        A working method for people who would rather make the thing than meet about it.
      </p>
      <span className={styles.kmBtn}>Start free</span>
      <span className={styles.kmSticker} data-conv-motion aria-hidden="true">
        new
      </span>
    </div>
  );
}

export function ConvergenceSlider({ states }) {
  const [pos, setPos] = useState(0);
  const t = pos / 100;
  const reduced = useReducedMotion();
  const stageRef = useRef(null);
  const tweenRef = useRef(null);

  useGSAP(
    () => {
      if (reduced) return;
      const el = stageRef.current?.querySelector('[data-conv-motion]');
      if (!el) return;
      tweenRef.current = gsap.to(el, {
        y: -9,
        rotate: 3,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      return () => {
        tweenRef.current?.kill();
        tweenRef.current = null;
      };
    },
    { scope: stageRef, dependencies: [reduced] }
  );

  useEffect(() => {
    if (tweenRef.current) tweenRef.current.timeScale(t);
  }, [t]);

  const stateIndex = t < 0.25 ? 0 : t < 0.75 ? 1 : 2;
  const state = states[stateIndex];

  return (
    <div className={styles.conv}>
      <div className={styles.convStageWrap} style={{ '--t': t }}>
        <div className={styles.convStage} ref={stageRef} data-mockup="convergence">
          <div className={styles.convLayer}>
            <ConvergentMock />
          </div>
          <div className={`${styles.convLayer} ${styles.convLayerBold}`}>
            <DivergentMock />
          </div>
        </div>
      </div>

      <div className={styles.convControl}>
        <input
          className={styles.convRange}
          type="range"
          min="0"
          max="100"
          step="1"
          value={pos}
          onChange={(event) => setPos(Number(event.target.value))}
          aria-label="Convergent to divergent design direction"
        />
        <div className={styles.convScale} aria-hidden="true">
          <span>Convergent</span>
          <span>Divergent</span>
        </div>
      </div>

      <p className={styles.convCaption} aria-live="polite">
        <span className={styles.convCaptionLabel}>{state.label}</span> — {state.caption}
      </p>
    </div>
  );
}
