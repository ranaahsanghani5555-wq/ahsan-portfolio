/*
  projects.js — the six self-initiated concept projects.

  Honesty rules applied here:
  - Every project is a CONCEPT PROJECT. There are no clients, no testimonials
    and no fabricated conversion or revenue numbers.
  - `brief` states the design problem the demo set out to solve — not a
    business result. `decisions` record the reasoning, not an outcome.
  - `facts` are the only numbers we are allowed to state: how many breakpoints
    were tested, how many sections the demo has, an editable hours figure, and
    the Lighthouse performance score + CLS from the latest measurement run
    (2026-10-17 — median of three mobile runs, see data/lighthouse.js).
    We publish only scores we have actually run.
  - `palette` and `fonts` are the demo's own system — none of them are shared
    with the main portfolio (per the approved art direction).
  - Demo pages live at /public/work/<slug>/index.html and are standalone
    HTML/CSS/JS, not React. They are placeholders until a later phase.
*/

export const projects = [
  {
    slug: 'inkflow',
    name: 'Inkflow',
    tag: 'AI',
    year: 2026,
    role: 'Design & front-end (concept)',
    brief:
      'Make an AI writing assistant feel calm and trustworthy before a single feature is read.',
    audience:
      'Solo founders and content teams who already write well, and want assistance rather than replacement.',
    conceptLabel: 'Concept project',
    decisions: [
      {
        decision: 'Lead with a real draft, not an abstract claim',
        why: 'The strongest proof for a writing tool is writing. The hero shows an editable paragraph with one visible suggestion, so the value is legible before any feature copy.',
      },
      {
        decision: 'Reserve the accent for the single primary action',
        why: 'On a near-black surface, colour reads as a signal. Keeping the lime only for “Start writing” means the eye always knows the next step.',
      },
      {
        decision: 'Monospace for the interface, a humanist grotesque for the prose',
        why: 'The split echoes the product itself: a precise machine surface wrapped around readable human text.',
      },
    ],
    facts: {
      breakpoints: [360, 390, 768, 1024, 1440],
      sections: 7,
      hours: 14,
      lighthouse: '90 · CLS 0.0000',
    },
    palette: { surface: '#0B0B10', ink: '#F5F5F7', accent: '#C6FF3D', accent2: '#2A2A33' },
    fonts: ['Bricolage Grotesque', 'JetBrains Mono'],
    fontKind: 'sans',
  },
  {
    slug: 'hisaab',
    name: 'Hisaab',
    tag: 'Fintech',
    year: 2026,
    role: 'Design & front-end (concept)',
    brief:
      'A money tool for Pakistani freelancers that feels local, plain-spoken and dependable.',
    audience:
      'Freelancers in Pakistan invoicing overseas clients and living with the friction of getting paid.',
    conceptLabel: 'Concept project',
    decisions: [
      {
        decision: 'Show the arithmetic, not the promise',
        why: 'Finance pages earn trust with numbers. The hero shows an invoice total and its net payout with every fee labelled, so nothing is hidden behind a headline.',
      },
      {
        decision: 'Write in plain Urdu-English, not bank copy',
        why: 'The audience switches language daily. Short, bilingual-feeling labels read as made for them rather than translated at them.',
      },
      {
        decision: 'Use green as a status colour, never as decoration',
        why: 'When green only ever means “paid”, a single green badge communicates state at a glance and stays meaningful.',
      },
    ],
    facts: {
      breakpoints: [360, 390, 768, 1024, 1440],
      sections: 6,
      hours: 12,
      lighthouse: '88 · CLS 0.0000',
    },
    palette: { surface: '#F7FAF9', ink: '#0C1F1A', accent: '#00A86B', accent2: '#FFC53D' },
    fonts: ['Young Serif', 'Figtree'],
    fontKind: 'serif',
  },
  {
    slug: 'cadenza',
    name: 'Cadenza',
    tag: 'SaaS',
    year: 2026,
    role: 'Design & front-end (concept)',
    brief:
      'Turn a wall of B2B CRM features into one clear decision on a single screen.',
    audience:
      'Sales leads at 10–50 person companies comparing three tools on a Friday afternoon.',
    conceptLabel: 'Concept project',
    decisions: [
      {
        decision: 'One screen, one decision',
        why: 'The page argues for a single action — book a walkthrough — and repeats it after every proof point instead of spreading attention across five competing calls to action.',
      },
      {
        decision: 'Keep everything quiet so the product screenshot is the loudest pixel',
        why: 'The interface itself becomes the strongest visual argument when nothing above it competes for attention.',
      },
      {
        decision: 'A neutral grotesque for UI, a monospace for data',
        why: 'Numbers set in a mono line up when scanned, while labels stay unremarkable and get out of the way.',
      },
    ],
    facts: {
      breakpoints: [360, 390, 768, 1024, 1440],
      sections: 8,
      hours: 16,
      lighthouse: '94 · CLS 0.0006',
    },
    palette: { surface: '#EEF0F3', ink: '#12151C', accent: '#FFB000', accent2: '#D7DBE3' },
    fonts: ['Schibsted Grotesk', 'IBM Plex Mono'],
    fontKind: 'sans',
  },
  {
    slug: 'atelier-noor',
    name: 'Atelier Noor',
    tag: 'Creative',
    year: 2026,
    role: 'Design & front-end (concept)',
    brief:
      'An agency site that lets oversized type and empty space do the talking.',
    audience:
      'Brand and marketing leads commissioning a studio for a flagship campaign.',
    conceptLabel: 'Concept project',
    decisions: [
      {
        decision: 'Type at display scale, navigation kept in the margins',
        why: 'The work is the argument. A twelve-column grid keeps large type composed rather than merely loud.',
      },
      {
        decision: 'One electric blue, used like a stamp',
        why: 'A single saturated accent on an otherwise monochrome page reads as deliberate and keeps the studio name memorable.',
      },
      {
        decision: 'Reveal projects by scrolling, never through a thumbnail gallery',
        why: 'Scrolling keeps attention on the current project instead of inviting a quick scan of small images.',
      },
    ],
    facts: {
      breakpoints: [360, 390, 768, 1024, 1440],
      sections: 5,
      hours: 9,
      lighthouse: '86 · CLS 0.0000',
    },
    palette: { surface: '#FFFFFF', ink: '#0A0A0A', accent: '#1F3BFF', accent2: '#E8E8E8' },
    fonts: ['Syne', 'Newsreader'],
    fontKind: 'sans',
  },
  {
    slug: 'kora',
    name: 'Kora',
    tag: 'E-commerce',
    year: 2026,
    role: 'Design & front-end (concept)',
    brief:
      'A product page for a handmade ceramic pour-over set that sells material and craft, not a grid.',
    audience:
      'Home coffee enthusiasts willing to pay for a slow, object-led ritual.',
    conceptLabel: 'Concept project',
    decisions: [
      {
        decision: 'One object, many angles',
        why: 'A single product framed from three angles gives a buyer more information than a grid of ten similar items.',
      },
      {
        decision: 'Warm charcoal ground with one terracotta accent',
        why: 'The palette borrows from the clay body itself, so the page feels fired rather than printed.',
      },
      {
        decision: 'Price and shipping below the fold, after the material',
        why: 'The story earns the price. Leading with it would turn a considered object into a commodity.',
      },
    ],
    facts: {
      breakpoints: [360, 390, 768, 1024, 1440],
      sections: 6,
      hours: 13,
      lighthouse: '87 · CLS 0.0009',
    },
    palette: { surface: '#1C1B1A', ink: '#EFE8DC', accent: '#C46A3C', accent2: '#3A3733' },
    fonts: ['Cormorant Garamond', 'Albert Sans'],
    fontKind: 'serif',
  },
  {
    slug: 'rep-club',
    name: 'Rep Club',
    tag: 'Health',
    year: 2026,
    role: 'Design & front-end (concept)',
    brief:
      'A fitness app sign-up that signals energy without a stock gym photograph.',
    audience:
      'People who train inconsistently and want a routine that survives a bad week.',
    conceptLabel: 'Concept project',
    decisions: [
      {
        decision: 'Colour is the only image',
        why: 'Flat, electric colour states the brand without licensing a photograph of someone else sweating.',
      },
      {
        decision: 'Ask for the smallest honest commitment first',
        why: 'The first call to action asks for three sessions a week, not a transformation, so it matches a real resolve.',
      },
      {
        decision: 'Type that leans, a layout that stays still',
        why: 'One heavy, slanted display face carries the energy while the grid stays calm, so the page feels fast rather than frantic.',
      },
    ],
    facts: {
      breakpoints: [360, 390, 768, 1024, 1440],
      sections: 7,
      hours: 11,
      lighthouse: '90 · CLS 0.0003',
    },
    palette: { surface: '#FFE600', ink: '#0A0A0A', accent: '#FF3D8B', accent2: '#111111' },
    fonts: ['Archivo', 'Familjen Grotesk'],
    fontKind: 'sans',
  },
];

/* Filter chips — "All" plus each project's tag, in the order the brief lists them. */
export const projectTags = ['All', 'SaaS', 'AI', 'Fintech', 'E-commerce', 'Creative', 'Health'];

/* Demo pages live here; kept as a helper so every link is built the same way. */
export const projectHref = (slug) => `./work/${slug}/index.html`;

export const projectCount = projects.length;
