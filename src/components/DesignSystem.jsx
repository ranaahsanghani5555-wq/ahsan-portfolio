import { useEffect, useState } from 'react';
import styles from './DesignSystem.module.css';
import { profile } from '../data/profile';

/* ---------------------------------------------------------------------------
   TOKEN MANIFEST
   Every custom property in tokens.css, grouped the way it is authored.
   Values are read from :root at mount so this page can never drift from the
   stylesheet, and the visual samples bind directly to the CSS variables.
   --------------------------------------------------------------------------- */
const COLOR_GROUPS = [
  {
    label: 'Surfaces',
    tokens: ['--paper', '--paper-2', '--paper-3'],
  },
  {
    label: 'Ink / text',
    tokens: ['--ink', '--ink-soft', '--ink-muted', '--ink-faint'],
  },
  {
    label: 'Pine — the inverted surface',
    tokens: ['--pine', '--pine-deep', '--on-pine', '--on-pine-soft', '--on-pine-muted', '--on-pine-line'],
  },
  {
    label: 'Accent — vermilion (kept scarce)',
    tokens: ['--vermilion', '--vermilion-ink', '--vermilion-bright', '--on-vermilion'],
  },
  {
    label: 'Lines, borders, focus',
    tokens: ['--hairline', '--border-strong', '--focus-ring', '--focus-ring-inverse'],
  },
  {
    label: 'Semantic status',
    tokens: [
      '--success',
      '--warning',
      '--danger',
      '--info',
      '--success-bg',
      '--warning-bg',
      '--danger-bg',
      '--info-bg',
      '--on-status',
    ],
  },
  {
    label: 'Semantic aliases',
    tokens: ['--bg', '--text', '--text-strong', '--text-muted', '--line', '--accent', '--accent-text'],
  },
];

const TYPE_GROUPS = [
  { label: 'Families', tokens: ['--font-display', '--font-body', '--font-mono'] },
  {
    label: 'Weights',
    tokens: ['--weight-light', '--weight-regular', '--weight-medium', '--weight-semibold', '--weight-bold'],
  },
  {
    label: 'Fluid scale',
    tokens: ['--step--2', '--step--1', '--step-0', '--step-1', '--step-2', '--step-3', '--step-4', '--step-5', '--step-6', '--step-7'],
  },
  {
    label: 'Semantic roles',
    tokens: ['--type-display', '--type-h1', '--type-h2', '--type-h3', '--type-h4', '--type-body', '--type-small', '--type-label'],
  },
  {
    label: 'Line height',
    tokens: ['--leading-tight', '--leading-snug', '--leading-normal', '--leading-copy'],
  },
  {
    label: 'Tracking',
    tokens: ['--tracking-tight', '--tracking-snug', '--tracking-normal', '--tracking-wide', '--tracking-caps'],
  },
  { label: 'Measure', tokens: ['--measure', '--measure-narrow'] },
  {
    label: 'Fraunces axes',
    tokens: ['--fraunces-opsz-display', '--fraunces-opsz-text', '--fraunces-wonk-on', '--fraunces-wonk-off'],
  },
];

const SPACE_TOKENS = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7', '--space-8', '--space-9', '--space-10', '--space-11'];

const LAYOUT_TOKENS = ['--section-y', '--gutter', '--container', '--container-wide', '--grid-cols'];

const RADIUS_TOKENS = ['--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-pill'];

const SHADOW_TOKENS = ['--shadow-sm', '--shadow-md', '--shadow-lg'];

const MOTION_EASES = ['--ease-out-expo', '--ease-in-out-quart', '--ease-out-soft', '--ease-spring'];

const DURATION_TOKENS = ['--dur-1', '--dur-2', '--dur-3', '--dur-4', '--dur-5', '--dur-fast', '--dur-med', '--dur-slow'];

const Z_TOKENS = ['--z-base', '--z-sticky', '--z-nav', '--z-modal', '--z-preloader', '--z-cursor'];

const MISC_TOKENS = ['--ring-width', '--ring-offset', '--grain-url'];

/* Contrast pairs checked live on this page. `min` is the WCAG 2.1 AA
   threshold that applies to the role: 4.5:1 for body/small text, 3:1 for
   large text and for non-text UI boundaries (borders, focus rings). */
const CONTRAST_PAIRS = [
  { label: 'Display ink on paper', fg: '--ink', bg: '--paper', min: 4.5 },
  { label: 'Body ink on paper', fg: '--ink-soft', bg: '--paper', min: 4.5 },
  { label: 'Muted meta on paper', fg: '--ink-muted', bg: '--paper', min: 4.5 },
  { label: 'Large-text faint on paper', fg: '--ink-faint', bg: '--paper', min: 3 },
  { label: 'Accent text (AA) on paper', fg: '--vermilion-ink', bg: '--paper', min: 4.5 },
  { label: 'Accent fill on paper (large)', fg: '--vermilion', bg: '--paper', min: 3 },
  { label: 'Ink on vermilion button', fg: '--on-vermilion', bg: '--vermilion', min: 4.5 },
  { label: 'Body on pine panel', fg: '--on-pine', bg: '--pine', min: 4.5 },
  { label: 'Meta on pine panel', fg: '--on-pine-muted', bg: '--pine', min: 4.5 },
  { label: 'Input border against paper', fg: '--border-strong', bg: '--paper', min: 3 },
  { label: 'Focus ring against paper', fg: '--focus-ring', bg: '--paper', min: 3 },
  { label: 'Success text on paper', fg: '--success', bg: '--paper', min: 4.5 },
  { label: 'Warning text on paper', fg: '--warning', bg: '--paper', min: 4.5 },
  { label: 'Danger text on paper', fg: '--danger', bg: '--paper', min: 4.5 },
];

const ALL_TOKENS = [
  ...COLOR_GROUPS.flatMap((g) => g.tokens),
  ...TYPE_GROUPS.flatMap((g) => g.tokens),
  ...SPACE_TOKENS,
  ...LAYOUT_TOKENS,
  ...RADIUS_TOKENS,
  ...SHADOW_TOKENS,
  ...MOTION_EASES,
  ...DURATION_TOKENS,
  ...Z_TOKENS,
  ...MISC_TOKENS,
];

const TYPE_SAMPLES = [
  { token: '--step-7', text: 'Signature' },
  { token: '--step-6', text: 'Display' },
  { token: '--step-5', text: 'Heading one' },
  { token: '--step-4', text: 'Heading two' },
  { token: '--step-3', text: 'Heading three' },
  { token: '--step-2', text: 'Heading four' },
  { token: '--step-1', text: 'Lead paragraph in Hanken Grotesk' },
  { token: '--step-0', text: 'Body copy in Hanken Grotesk at the default size' },
  { token: '--step--1', text: 'Small print for meta and labels' },
  { token: '--step--2', text: 'Monospace label · 01 / 12' },
];

function useTokenValues(names) {
  const [values, setValues] = useState({});

  useEffect(() => {
    const computed = getComputedStyle(document.documentElement);
    const next = {};
    names.forEach((name) => {
      next[name] = computed.getPropertyValue(name).trim();
    });
    setValues(next);
  }, [names]);

  return values;
}

/* --- WCAG 2.1 contrast, computed from the resolved token colours ---------- */
function parseColor(value) {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = '1'] = match[1].split(/[,\s/]+/).filter(Boolean);
  return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) };
}

function luminance({ r, g, b }) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const high = Math.max(la, lb);
  const low = Math.min(la, lb);
  return (high + 0.05) / (low + 0.05);
}

function Section({ id, kicker, title, children }) {
  return (
    <section id={id} className={styles.section}>
      <header className={styles.sectionHead}>
        <p className={styles.kicker}>{kicker}</p>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function MotionRow({ name, values }) {
  const [on, setOn] = useState(false);
  const ease = values[name] || 'linear';

  return (
    <div className={styles.motionRow}>
      <code className={styles.token}>{name}</code>
      <code className={styles.value}>{ease}</code>
      <span className={styles.track} aria-hidden="true">
        <span
          className={styles.ball}
          style={{ transform: on ? 'translateX(200px)' : 'translateX(0)', transition: `transform 900ms ${ease}` }}
        />
      </span>
      <button type="button" className={styles.play} onClick={() => setOn((value) => !value)}>
        {on ? 'Reset' : 'Play'}
      </button>
    </div>
  );
}

export default function DesignSystem() {
  const values = useTokenValues(ALL_TOKENS);
  const read = (name) => values[name] || '—';

  const [contrastRows, setContrastRows] = useState([]);

  // Resolve each token through the browser, then run the WCAG maths on it.
  useEffect(() => {
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;';
    document.body.appendChild(probe);

    const resolve = (name) => {
      probe.style.color = '#000';
      probe.style.color = `var(${name})`;
      return parseColor(getComputedStyle(probe).color);
    };

    const rows = CONTRAST_PAIRS.map((pair) => {
      const fg = resolve(pair.fg);
      const bg = resolve(pair.bg);
      const ratio = fg && bg ? contrastRatio(fg, bg) : null;
      return { ...pair, ratio, pass: ratio !== null && ratio >= pair.min };
    });

    document.body.removeChild(probe);
    setContrastRows(rows);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <p className={styles.kicker}>Hidden view · noindex-style reference</p>
        <h1 className={styles.mastTitle}>{profile.brand} — design system</h1>
        <p className={styles.mastLead}>
          Every token in <code>src/styles/tokens.css</code>, plus the components built on
          them. Reachable at <code>#design-system</code>. Not linked from the site.
        </p>
        <p>
          <a className={styles.back} href="#top">
            ← Back to the portfolio
          </a>
        </p>
      </header>

      <Section id="ds-color" kicker="01 · Colour" title="Palette">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            <h3 className={styles.groupLabel}>{group.label}</h3>
            <ul className={styles.swatchGrid}>
              {group.tokens.map((token) => (
                <li key={token} className={styles.swatch}>
                  <span className={styles.chip} style={{ backgroundColor: `var(${token})` }} />
                  <code className={styles.token}>{token}</code>
                  <code className={styles.value}>{read(token)}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section id="ds-type" kicker="02 · Typography" title="Type scale & roles">
        <ul className={styles.specimen}>
          {TYPE_SAMPLES.map((sample) => (
            <li key={sample.token} className={styles.specimenRow}>
              <code className={styles.token}>{sample.token}</code>
              <code className={styles.value}>{read(sample.token)}</code>
              <span
                className={styles.specimenText}
                style={{
                  fontSize: `var(${sample.token})`,
                  fontFamily: sample.token === '--step--2' ? 'var(--font-mono)' : undefined,
                }}
              >
                {sample.text}
              </span>
            </li>
          ))}
        </ul>

        {TYPE_GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            <h3 className={styles.groupLabel}>{group.label}</h3>
            <ul className={styles.tokenList}>
              {group.tokens.map((token) => (
                <li key={token} className={styles.tokenRow}>
                  <code className={styles.token}>{token}</code>
                  <code className={styles.value}>{read(token)}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section id="ds-space" kicker="03 · Space" title="Spacing scale">
        <ul className={styles.barList}>
          {SPACE_TOKENS.map((token) => (
            <li key={token} className={styles.barRow}>
              <code className={styles.token}>{token}</code>
              <span className={styles.bar} style={{ inlineSize: `var(${token})` }} />
              <code className={styles.value}>{read(token)}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-layout" kicker="04 · Layout" title="Container & 12-column grid">
        <ul className={styles.tokenList}>
          {LAYOUT_TOKENS.map((token) => (
            <li key={token} className={styles.tokenRow}>
              <code className={styles.token}>{token}</code>
              <code className={styles.value}>{read(token)}</code>
            </li>
          ))}
        </ul>
        <div className={`grid-12 ${styles.gridDemo}`}>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`col-span-1 ${styles.gridCell}`}>
              {i + 1}
            </span>
          ))}
        </div>
      </Section>

      <Section id="ds-radius" kicker="05 · Shape" title="Radii">
        <ul className={styles.boxGrid}>
          {RADIUS_TOKENS.map((token) => (
            <li key={token} className={styles.box}>
              <span className={styles.boxShape} style={{ borderRadius: `var(${token})` }} />
              <code className={styles.token}>{token}</code>
              <code className={styles.value}>{read(token)}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-shadow" kicker="06 · Depth" title="Shadows">
        <ul className={styles.boxGrid}>
          {SHADOW_TOKENS.map((token) => (
            <li key={token} className={styles.box}>
              <span className={styles.shadowShape} style={{ boxShadow: `var(${token})` }} />
              <code className={styles.token}>{token}</code>
              <code className={styles.value}>{read(token)}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-motion" kicker="07 · Motion" title="Easing & duration">
        <div className={styles.motionList}>
          {MOTION_EASES.map((token) => (
            <MotionRow key={token} name={token} values={values} />
          ))}
        </div>

        <h3 className={styles.groupLabel}>Durations</h3>
        <ul className={styles.tokenList}>
          {DURATION_TOKENS.map((token) => (
            <li key={token} className={styles.tokenRow}>
              <code className={styles.token}>{token}</code>
              <code className={styles.value}>{read(token)}</code>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Under <code>prefers-reduced-motion: reduce</code> every duration collapses to
          near-zero and Lenis is not initialised, so the site scrolls natively.
        </p>
      </Section>

      <Section id="ds-z" kicker="08 · Stacking" title="Z-index ladder">
        <ul className={styles.tokenList}>
          {Z_TOKENS.map((token) => (
            <li key={token} className={styles.tokenRow}>
              <code className={styles.token}>{token}</code>
              <code className={styles.value}>{read(token)}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-buttons" kicker="09 · Components" title="Buttons & links">
        <div className={styles.row}>
          <button type="button" className={styles.btnPrimary}>
            Primary action
          </button>
          <button type="button" className={styles.btnSecondary}>
            Secondary
          </button>
          <button type="button" className={styles.btnGhost}>
            Ghost
          </button>
          <button type="button" className={styles.btnPrimary} disabled>
            Disabled
          </button>
        </div>
        <div className={styles.row}>
          <p className={styles.line}>
            This is a <a href="#ds-buttons">default body link</a> using the AA accent tone,
            and this is a <a className={styles.mutedLink} href="#ds-buttons">quieter link</a>.
          </p>
        </div>

        <div className={`${styles.inverse} on-pine`}>
          <p className={styles.inverseLabel}>On the pine surface</p>
          <div className={styles.row}>
            <button type="button" className={styles.btnPaper}>
              Paper button
            </button>
            <a className={styles.inverseLink} href="#ds-buttons">
              Link on pine
            </a>
          </div>
        </div>
      </Section>

      <Section id="ds-cards" kicker="10 · Components" title="Cards & form controls">
        <div className={styles.cardRow}>
          <article className={styles.ruleCard}>
            <p className={styles.cardKicker}>Hairline card</p>
            <h3 className={styles.cardTitle}>Ruled, not boxed</h3>
            <p className={styles.cardBody}>
              The default container is a top rule and space — no chrome, no drop shadow.
            </p>
          </article>

          <article className={styles.fillCard}>
            <p className={styles.cardKicker}>Raised card</p>
            <h3 className={styles.cardTitle}>Reserved for real depth</h3>
            <p className={styles.cardBody}>
              Used sparingly, for a panel that genuinely sits above the page.
            </p>
          </article>
        </div>

        <div className={styles.formDemo}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ds-input">
              Input
            </label>
            <input id="ds-input" className={styles.input} type="text" defaultValue="Text field" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ds-select">
              Select
            </label>
            <select id="ds-select" className={styles.input} defaultValue="Option one">
              <option>Option one</option>
              <option>Option two</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ds-textarea">
              Textarea
            </label>
            <textarea id="ds-textarea" className={styles.input} rows={3} defaultValue="Longer text." />
          </div>
          <label className={styles.checkbox}>
            <input type="checkbox" defaultChecked />
            <span>Checkbox with a visible focus ring</span>
          </label>
        </div>

        <ul className={styles.statusList}>
          <li className={`${styles.status} ${styles.statusSuccess}`}>Success — message sent.</li>
          <li className={`${styles.status} ${styles.statusWarning}`}>Warning — check the details.</li>
          <li className={`${styles.status} ${styles.statusDanger}`}>Danger — that field is invalid.</li>
          <li className={`${styles.status} ${styles.statusInfo}`}>Info — neutral guidance.</li>
        </ul>
      </Section>

      <Section id="ds-contrast" kicker="12 · Accessibility" title="Measured contrast">
        <p className={styles.note}>
          Computed live from the tokens above with the WCAG 2.1 relative-luminance
          formula — never hand-written. AA needs 4.5:1 for body and small text,
          and 3:1 for large text and non-text UI boundaries such as input borders
          and focus rings.
        </p>
        <ul className={styles.contrastList}>
          {contrastRows.map((row) => (
            <li key={row.label} className={styles.contrastRow}>
              <span className={styles.contrastColors}>
                <span className={styles.chipSmall} style={{ backgroundColor: `var(${row.fg})` }} />
                <code className={styles.token}>{row.fg}</code>
                <span className={styles.contrastOn}>on</span>
                <span className={styles.chipSmall} style={{ backgroundColor: `var(${row.bg})` }} />
                <code className={styles.token}>{row.bg}</code>
              </span>
              <span className={styles.contrastLabel}>{row.label}</span>
              <code className={styles.contrastRatio}>
                {row.ratio ? `${row.ratio.toFixed(2)}:1` : '—'}
              </code>
              <span
                className={`${styles.contrastBadge} ${row.pass ? styles.pass : styles.fail}`}
              >
                {row.pass ? `Pass · AA ${row.min}:1` : `Fail · needs ${row.min}:1`}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-misc" kicker="11 · Primitives" title="Focus, grain & range">
        <ul className={styles.tokenList}>
          {MISC_TOKENS.map((token) => (
            <li key={token} className={styles.tokenRow}>
              <code className={styles.token}>{token}</code>
              <code className={`${styles.value} ${styles.valueWrap}`}>{read(token)}</code>
            </li>
          ))}
        </ul>
        <p className={styles.line}>
          Focus ring demonstration:{' '}
          <button type="button" className={styles.btnGhost}>
            Tab to me
          </button>
        </p>
      </Section>
    </div>
  );
}
