import styles from './ProjectPreview.module.css';

/*
  ProjectPreview — the large, non-photographic preview inside a project card.

  Each variant is a small, made-up interface drawn from that demo's own palette
  and type feel; nothing here is a real screenshot. Elements marked with
  `data-depth` are picked up by ProjectCard's pointer parallax (higher depth =
  moves more). Any motion is CSS-only and gated on reduced-motion.

  Values are rendered as bars, never as currency figures: a concept preview
  should not put invented revenue on screen.
*/

function Bar({ width, className = '' }) {
  return <span className={`${styles.bar} ${className}`} style={{ '--w': `${width}%` }} />;
}

function Inkflow() {
  return (
    <span className={`${styles.pv} ${styles.inkflow}`}>
      <span className={styles.editor} data-depth="0.35">
        <span className={styles.editorBar}>
          <i />
          <i />
          <i />
          <span className={styles.editorTitle}>untitled.md</span>
        </span>
        <span className={styles.editorBody}>
          <Bar width={86} />
          <Bar width={64} />
          <span className={`${styles.line} ${styles.lineAccent}`} style={{ '--w': '78%' }}>
            <span className={`${styles.caret} motion-light`} />
          </span>
          <Bar width={52} />
          <Bar width={72} />
        </span>
        <span className={styles.suggestion}>Rewrite for clarity →</span>
      </span>
    </span>
  );
}

function Hisaab() {
  return (
    <span className={`${styles.pv} ${styles.hisaab}`}>
      <span className={styles.invoice} data-depth="0.4">
        <span className={styles.invoiceTop}>
          <span className={styles.pillLabel}>Invoice total</span>
          <span className={styles.paid}>Paid</span>
        </span>
        <span className={styles.amount}>
          <span className={styles.currency}>$</span>
          <Bar width={58} className={styles.amountBar} />
        </span>
        <span className={styles.txns}>
          <span className={styles.txn}>
            <span className={styles.txnLabel}>Platform fee</span>
            <Bar width={22} />
          </span>
          <span className={styles.txn}>
            <span className={styles.txnLabel}>Network fee</span>
            <Bar width={16} />
          </span>
          <span className={`${styles.txn} ${styles.txnNet}`}>
            <span className={styles.txnLabel}>Net payout · PKR</span>
            <Bar width={66} />
          </span>
        </span>
      </span>
      <span className={styles.hisaabBars} aria-hidden="true">
        <i data-depth="0.7" />
        <i data-depth="1" />
        <i data-depth="1.35" />
      </span>
    </span>
  );
}

function Cadenza() {
  return (
    <span className={`${styles.pv} ${styles.cadenza}`}>
      <span className={styles.panel} data-depth="0.35">
        <span className={styles.panelTop}>
          <span className={styles.panelDot} />
          <span className={styles.pillLabel}>Pipeline</span>
        </span>
        <svg className={styles.chart} viewBox="0 0 220 88" role="presentation" aria-hidden="true">
          <polyline
            className={`${styles.chartLine} motion-light`}
            points="0,70 26,58 52,64 78,40 104,46 130,22 156,30 182,14 208,20"
            fill="none"
          />
        </svg>
        <span className={styles.panelRows}>
          <Bar width={78} />
          <Bar width={56} />
        </span>
      </span>
      <span className={styles.panelChip} data-depth="0.95">
        Book a walkthrough <span aria-hidden="true">→</span>
      </span>
    </span>
  );
}

function AtelierNoor() {
  return (
    <span className={`${styles.pv} ${styles.noor}`}>
      <span className={styles.noorWord} data-depth="0.55">
        NOOR
      </span>
      <span className={styles.noorRule} data-depth="0.25" />
      <span className={styles.noorSquare} data-depth="1.1" />
      <span className={styles.noorCaption} data-depth="0.15">
        Selected work — 01 / 04
      </span>
    </span>
  );
}

function Kora() {
  return (
    <span className={`${styles.pv} ${styles.kora}`}>
      <span className={`${styles.steam} motion-light`} aria-hidden="true">
        <i />
        <i />
      </span>
      <span className={styles.vessel} data-depth="0.6">
        <span className={styles.vesselRim} />
        <span className={styles.vesselBody} />
      </span>
      <span className={styles.koraBase} data-depth="0.3" />
      <span className={`${styles.koraDots} motion-light`} aria-hidden="true">
        <i data-depth="0.9" />
        <i data-depth="1.2" />
        <i data-depth="1.5" />
      </span>
    </span>
  );
}

function RepClub() {
  return (
    <span className={`${styles.pv} ${styles.rep}`}>
      <span className={styles.repWord} data-depth="0.8">
        REP
      </span>
      <span className={styles.ring} data-depth="0.4">
        <svg viewBox="0 0 64 64" role="presentation" aria-hidden="true">
          <circle className={styles.ringTrack} cx="32" cy="32" r="26" />
          <circle className={`${styles.ringFill} motion-light`} cx="32" cy="32" r="26" />
        </svg>
        <span className={styles.ringLabel}>3×</span>
      </span>
      <span className={styles.repChip} data-depth="1.05">
        Three sessions a week
      </span>
    </span>
  );
}

const VARIANTS = {
  inkflow: Inkflow,
  hisaab: Hisaab,
  cadenza: Cadenza,
  'atelier-noor': AtelierNoor,
  kora: Kora,
  'rep-club': RepClub,
};

export default function ProjectPreview({ project }) {
  const Variant = VARIANTS[project.slug];
  return Variant ? <Variant project={project} /> : null;
}
