# Ahsan Ghani — portfolio

A personal portfolio for **Muhammad Ahsan Ghani**, a web designer in Arifwala,
Pakistan. It is one React app (the portfolio shell) plus six **standalone
concept-project demos** that live as plain HTML/CSS/JS under `public/work/`.

Everything the site claims is either real or clearly labelled as a concept /
sample. There are no invented clients, testimonials, conversion numbers or
Lighthouse scores — see [Honesty rules](#honesty-rules).

---

## Requirements

- **Node.js 18+** (built and tested on Node 24)
- npm

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # production build into dist/
npm run preview    # serve the production build (http://localhost:4173)
npm run lint       # eslint over the whole project
npm run audit      # motion audit in both modes (needs `npm run preview` running)
```

`npm run build` + `npm run preview` is the honest way to check performance —
the dev server is not representative.

`npm run audit` drives a headless browser over the site and the six demos in
**both** motion modes (`?motion=full` and `?motion=reduced`), then fails if any
page logs an error, a demo script misses, or content marked for reveal is left
hidden. Frames land in `pw-frames/` (git-ignored) next to `report.json`.

## Deployment

The build is a static site; `dist/` can be dropped on any static host
(Netlify, Vercel, GitHub Pages, S3, a plain nginx box…).

- `vite.config.js` sets **`base: './'`**, so every asset path is relative and
  the site works from a domain root *or* a sub-path (e.g. `/portfolio/`).
- Webfonts are emitted to `dist/fonts/` with stable names and preloaded at
  runtime by a small script in `index.html`, so they resolve under any base.
- **Before going live**, edit the `TODO(deploy)` block in `index.html`:
  replace the canonical URL and the absolute `og:image` / `og:url` values with
  your real domain (they currently point at `https://ahsanghani.dev/`).
- The social card image is `public/og-image.png` (1200×630), rebuilt from the
  hero typography — see [Rebuilding the OG image](#rebuilding-the-og-image).

## Project structure

```
public/
  work/<slug>/          the six concept demos (standalone HTML/CSS/JS)
  images/               portrait (webp, 2 sizes)
  og-image.png          social card
  favicon.svg
src/
  App.jsx               the marketing shell (no router; #design-system is a hidden view)
  components/           Nav, Hero, Work, Process, Metrics, Critique, About, Contact…
  data/                 profile.js · projects.js · critique.js · lighthouse.js
  hooks/                useLenis, useDeferredMount, useInView, useMagnetic…
  styles/               tokens.css (colour/type/space) · fonts.css (@font-face)
  assets/fonts/         Fraunces (normal + italic) and Hanken Grotesk, woff2
```

## Where to edit content

Everything textual lives in `src/data/` — components read from these files, so
you never edit markup to change a name, a project or a score.

| File | What it controls |
| --- | --- |
| `src/data/profile.js` | Name, brand, location, timezone, email, social links, `hoursSpent`, the portrait paths + alt, and the `tools` list. Fields left `''` simply do not render (no dead links). |
| `src/data/projects.js` | The six concept projects: name, tag, year, brief, audience, the design decisions (each with a *why*), palette, fonts and the `facts` block. |
| `src/data/critique.js` | The written-critique practice shown in the **Critique** section. |
| `src/data/lighthouse.js` | The measured Lighthouse scores printed in the metrics strip. |

### Replacing the portrait

The About section uses two WebP files:

- `public/images/ahsan-ghani.webp` — ~800×1066
- `public/images/ahsan-ghani-400.webp` — ~400×534

Replace both (keep the filenames), then update `portraitWidth` /
`portraitHeight` in `src/data/profile.js` if the aspect ratio changed. The alt
text is `portraitAlt` in the same file; keep it a plain description of the
photo. The paths are relative (`./images/…`) so they survive a sub-path deploy.

### Rebuilding the OG image

`public/og-image.png` (1200×630) is a designed card set in the site's own type
and palette — **not** a screenshot and not the portrait. If the headline or
palette changes, regenerate it from a 1200×630 HTML template using the fonts in
`src/assets/fonts/`. It is referenced only from the `og:image` / `twitter:image`
tags in `index.html`.

## Honesty rules

- The six demos are **concept projects**. They are labelled *“Concept project”*
  on the page and use invented brand names, invented sample figures and a
  “Sample content” tag wherever fake logos or numbers appear. No client,
  testimonial or revenue claim is made anywhere.
- The only numbers stated about a project are the ones in `facts`: how many
  breakpoints were tested, how many sections the demo has, and an editable
  hours figure. No performance number is published until it is actually run.
- `hoursSpent` in `profile.js` is marked `// EDIT` — its default is the honest
  sum of the six demos' recorded hours.
- The Lighthouse scores in `lighthouse.js` are copied from real runs against
  the production build — update them after re-measuring.

## Fonts, colour and motion

- **Fraunces** (variable, normal + italic) for display type and **Hanken
  Grotesk** (variable) for body/UI, self-hosted. Only the Latin subsets are
  shipped, and only the axes the design uses.
- Colour, type scale and spacing live in `src/styles/tokens.css`. Contrast
  pairs are commented with their measured ratios; the palette is designed to
  pass WCAG AA.
- **Motion is enhancement, not decoration, and it is split into two gates**
  (`src/lib/motion.js`): a **light** layer — opacity fades, short (≤24px)
  translates, hovers, ambient loops, slow marquees and the Process horizontal
  run — always plays; a **heavy** layer — large parallax, the cursor trail,
  fast loops — is skipped under `prefers-reduced-motion: reduce` or
  `?motion=reduced`. Motion is transform/opacity only, GSAP contexts are
  cleaned up on unmount, and the preloader can be skipped with a click or
  **Esc** (it plays once per session).

## Performance notes

The site is a client-rendered React app, so the hero headline can only paint
once the main bundle has parsed and evaluated. To keep that bundle small the
build code-splits every section below the fold (`React.lazy`), and both
**Lenis** and **ScrollTrigger** are imported on demand after first paint rather
than sitting on the critical path. Below-the-fold card artwork mounts only when
it scrolls near the viewport.

If you re-measure, use: production preview + Lighthouse's default **mobile**
throttling (simulated Slow-4G, 4x CPU). The scores in `src/data/lighthouse.js`
are the **median of three runs** at a 390x844 @ dsf 2 viewport, taken on a quiet
machine — a single run on a busy box can swing ten points. CLS is checked
against the same runs; every page lands under 0.01 (worst single shift 0.0031).

The six demos keep the same discipline in their own way: each self-hosts its
Google Fonts as a single latin woff2 subset (with a metric-matched `@font-face`
fallback), vendors GSAP + ScrollTrigger from `public/work/vendor/` instead of a
CDN, and loads all three scripts with `defer`. That removed the late font swaps
and the CDN round-trips that used to push cadenza and kora over the CLS line.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Fallbacks are in
place for `backdrop-filter`, `clip-path`, viewport units (`dvh` with `vh`
fallbacks) and variable-font axis rendering; `env()` safe-area insets are used
where relevant.
