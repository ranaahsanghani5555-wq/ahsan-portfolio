import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './ProjectCard.module.css';
import ProjectPreview from './ProjectPreview';
import { useInView } from '../hooks/useInView';
import { motionOK } from '../lib/motion.js';

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', 'Iowan Old Style', serif";
const MONO = "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', Menlo, monospace";

const stack = (name, kind) => `'${name}', ${kind === 'serif' ? SERIF : SANS}`;

/**
 * ProjectCard — an editorial card: a palette-driven animated preview on top of
 * a hairline-ruled meta block. There is no fake screenshot: the preview is
 * drawn from the demo's own palette and type feel.
 *
 * The whole card is operable. A single <button> (the project name, inside an
 * <h3>) is stretched over the card with a pseudo-element, so the name stays a
 * real heading for screen readers while the entire surface stays clickable and
 * keyboard-focusable.
 *
 * Pointer movement inside the preview parallaxes its `[data-depth]` layers;
 * keyboard focus nudges them the same way, so the two input modes read alike.
 */
export default function ProjectCard({ project, index, onOpen }) {
  const { slug, name, tag, year, role, brief, palette, fonts, fontKind } = project;
  const number = String(index + 1).padStart(2, '0');

  const cardRef = useRef(null);
  // The drawn preview is the heaviest part of the card (a size container full
  // of mock UI). Mount it only once the card nears the viewport so the first
  // paint never pays for six of them.
  const [artRef, previewInView] = useInView({ rootMargin: '600px 0px' });

  const mono = fonts.find((f) => /mono/i.test(f));
  const previewVars = {
    '--pv-surface': palette.surface,
    '--pv-ink': palette.ink,
    '--pv-accent': palette.accent,
    '--pv-accent-2': palette.accent2 || palette.accent,
    '--pv-line': `color-mix(in srgb, ${palette.ink} 22%, transparent)`,
    '--pv-display': stack(fonts[0], fontKind),
    '--pv-body': stack(fonts[1] ?? fonts[0], fontKind === 'serif' ? 'sans' : 'serif'),
    '--pv-mono': mono ? stack(mono, 'sans') : MONO,
  };

  /* --- preview parallax (pointer + keyboard focus) ------------------------ */
  useGSAP(
    () => {
      const card = cardRef.current;
      const art = artRef.current;
      if (!card || !art) return undefined;
      if (!motionOK()) return undefined;

      const layers = gsap.utils.toArray('[data-depth]', art);
      if (!layers.length) return undefined;

      const amount = 16;
      const move = (nx, ny, strength) => {
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth) || 0;
          gsap.to(layer, {
            x: nx * amount * depth * strength,
            y: ny * amount * depth * strength,
            duration: 0.55,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        });
      };
      const rest = () =>
        gsap.to(layers, { x: 0, y: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });

      const onMove = (event) => {
        const rect = art.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        move(((event.clientX - rect.left) / rect.width - 0.5) * 2, ((event.clientY - rect.top) / rect.height - 0.5) * 2, 1);
      };
      const onFocus = () => move(-0.7, -0.7, 0.7);

      card.addEventListener('pointermove', onMove, { passive: true });
      card.addEventListener('pointerleave', rest);
      card.addEventListener('focusin', onFocus);
      card.addEventListener('focusout', rest);

      return () => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', rest);
        card.removeEventListener('focusin', onFocus);
        card.removeEventListener('focusout', rest);
      };
    },
    { scope: cardRef, dependencies: [previewInView], revertOnUpdate: true }
  );

  return (
    <article ref={cardRef} className={styles.card}>
      <div ref={artRef} className={styles.art} style={previewVars} aria-hidden="true">
        <span className={styles.badge}>{project.conceptLabel}</span>
        <span className={styles.number}>{number}</span>
        {previewInView && <ProjectPreview project={project} />}
        <span className={styles.cue}>
          View case study <span aria-hidden="true">→</span>
        </span>
      </div>

      <div className={styles.meta}>
        <p className={styles.kicker}>
          <span className={styles.tag}>{tag}</span>
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          <span className={styles.year}>{year}</span>
        </p>

        <h3 className={styles.name}>
          <button
            type="button"
            className={styles.trigger}
            data-cursor="view"
            onClick={(event) => onOpen?.(project, event.currentTarget)}
          >
            {/* The hover nudge lives on this leaf span, never on the <h3> or
                any ancestor of the button: a transformed ancestor would become
                the containing block of the stretched .trigger::after and
                collapse the full-card click surface to the title row. */}
            <span className={styles.nameText}>{name}</span>
          </button>
        </h3>

        <p className={styles.role}>{role}</p>
        <p className={styles.brief}>{brief}</p>

        <span className={styles.open}>
          View case study <span aria-hidden="true">→</span>
        </span>
      </div>

      {/* Hidden from view but part of the card's accessible description. */}
      <span className="visually-hidden">Concept project, {slug}.</span>
    </article>
  );
}
