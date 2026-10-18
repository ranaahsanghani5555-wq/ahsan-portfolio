/*
  critique.js — the Design Critique section's content.

  HONESTY CONTRACT (applies to everything in this file and the section that
  renders it):
  - Every screen shown is an INVENTED, simplified, illustrative example. None of
    them is a real company's site, and none imitates a specific real brand. Each
    example carries the visible label "Illustrative example, not a real
    company's site".
  - Every score is a personal judgement, shown under the caption
    "My judgment of this example". Scores are opinion, not measurements.
  - The three "example screens" are drawn as HTML/CSS mockup components (see
    `src/components/Critique/CritiqueMockups.jsx`), never screenshots. The
    `screen` key below names which mockup component renders each example.

  Hotspots are positioned over real elements inside each mockup: a hotspot's
  `target` matches a `data-target="…"` attribute in the mockup, and the
  component measures that element so the marker always sits on the thing it
  describes (at any viewport width).
*/

export const scoreDimensions = [
  { key: 'hierarchy', label: 'Visual hierarchy' },
  { key: 'layout', label: 'Layout composition' },
  { key: 'typography', label: 'Typography' },
  { key: 'responsive', label: 'Responsive behavior' },
  { key: 'conversion', label: 'Conversion clarity' },
];

export const critiqueExamples = [
  {
    id: 'weak',
    tab: 'Weak',
    tabNote: 'generic generated',
    screen: 'weak',
    brand: 'Vortexa',
    kind: 'AI analytics SaaS · invented',
    honesty: 'Illustrative example, not a real company’s site',
    scores: { hierarchy: 3, layout: 3, typography: 3, responsive: 3, conversion: 2 },
    hotspots: [
      {
        id: 'weak-headline',
        n: 1,
        target: 'headline',
        tag: 'hierarchy',
        title: 'Headline and sub-head read as equals',
        observation:
          'The headline is 40px and the sub-head 30px — a 1.33× step, so the two lines compete for the same rank.',
        why: 'With no clear first read the eye has no entry point, and the only sentence that explains the product is lost among the decoration.',
        fix: 'Open the step to at least 2.5× — a 56px display line over a 20px sub-head — so the headline clearly owns the page.',
      },
      {
        id: 'weak-ctas',
        n: 2,
        target: 'ctas',
        tag: 'conversion',
        title: 'Two buttons with identical weight',
        observation:
          '“Get Started” and “Learn More” are the same size, weight and colour, sitting side by side with equal spacing.',
        why: 'Two equal-weight actions split attention, so neither reads as the one thing to do. This is the most common conversion leak in generated layouts.',
        fix: 'Keep one filled primary button and demote the other to a quiet underlined text link.',
      },
      {
        id: 'weak-contrast',
        n: 3,
        target: 'subhead',
        tag: 'typography',
        title: 'Body text fails contrast',
        observation:
          'The sub-head and body are #9AA3B2 on white — about 2.6:1, well under the 4.5:1 AA floor for small text.',
        why: 'Pale grey body copy is the clearest generated-layout tell. It reads as unfinished, and at a glance much of it is simply not legible.',
        fix: 'Darken body text past 4.5:1 (e.g. #4B5563) and keep the very light grey for large decorative type only.',
      },
      {
        id: 'weak-axis',
        n: 4,
        target: 'illustration',
        tag: 'layout',
        title: 'Everything shares one centred axis',
        observation:
          'The headline, sub-head, buttons and illustration are all centre-aligned on the same axis, each with even space above and below.',
        why: 'One centred axis removes the asymmetry that would let a single idea lead. The hero reads as a stack of parts of equal importance.',
        fix: 'Pick one focal point, set the hero on an asymmetric grid, and let one element dominate the first screen.',
      },
      {
        id: 'weak-cards',
        n: 5,
        target: 'cards',
        dx: -16,
        tag: 'layout',
        title: 'Three identical cards flatten a real difference',
        observation:
          '“Powerful”, “Scalable” and “Secure” are equal-width cards with matching rounded icons and two lines of copy each.',
        why: 'Equal cards assert equal importance. When the three features are not equally valuable, the grid turns a decision into filler.',
        fix: 'Weight the columns by importance and let the strongest feature lead with more width and a real example.',
      },
      {
        id: 'weak-responsive',
        n: 6,
        target: 'cards',
        dx: 16,
        tag: 'responsiveness',
        title: 'A fixed three-across row that will not stack',
        observation:
          'The feature row is a fixed three-across flexbox with no wrapping, and the hero illustration is set to a fixed pixel width.',
        why: 'At 390px the row would either overflow or crush each card to roughly 100px, and the fixed hero image cannot shrink — so the layout only works at desktop width.',
        fix: 'Let the cards stack on small screens and make the hero image fluid, not a fixed px width.',
      },
    ],
  },
  {
    id: 'decent',
    tab: 'Decent',
    tabNote: 'clean but safe',
    screen: 'decent',
    brand: 'Helio',
    kind: 'project-management SaaS · invented',
    honesty: 'Illustrative example, not a real company’s site',
    scores: { hierarchy: 6, layout: 6, typography: 6, responsive: 7, conversion: 6 },
    hotspots: [
      {
        id: 'decent-headline',
        n: 1,
        target: 'headline',
        dx: -16,
        tag: 'ux',
        title: 'Category copy, not an outcome',
        observation:
          'The headline names the category — “projects”, “teammates”, “same page” — but never a concrete outcome or timeframe.',
        why: 'Category-level copy is safe and forgettable. The reader cannot tell what actually changes for them, so the claim does no work.',
        fix: 'Name the outcome: e.g. “Ship projects on time without the weekly status meeting.”',
      },
      {
        id: 'decent-type',
        n: 2,
        target: 'headline',
        dx: 16,
        tag: 'typography',
        title: 'The middle of the scale is too tight',
        observation:
          'Display is a healthy 2.4× body, but the sub-head and body are only about 1.1× apart.',
        why: 'When two supporting ranks sit almost on top of each other, the three-level hierarchy collapses into two, and the sub-head loses its job.',
        fix: 'Give the sub-head its own clear step (≈1.4× body) so display, sub-head and body stay distinct.',
      },
      {
        id: 'decent-ctas',
        n: 3,
        target: 'ctas',
        tag: 'conversion',
        title: 'Secondary action sits first',
        observation:
          '“Book a demo” (ghost) is placed before “Start free trial” (filled), at nearly equal weight.',
        why: 'The eye meets the secondary action first, which slightly dilutes the primary path the page is built around.',
        fix: 'Lead with the primary button and place the secondary after it, a step quieter.',
      },
      {
        id: 'decent-measure',
        n: 4,
        target: 'subhead',
        tag: 'typography',
        title: 'The sub-head runs past a comfortable measure',
        observation: 'On desktop the sub-head sets at roughly 95 characters per line.',
        why: 'Lines beyond about 75 characters slow reading and tire the eye, especially at lead size where each line is long.',
        fix: 'Cap the measure near 60–66ch and let the line wrap to two.',
      },
      {
        id: 'decent-cards',
        n: 5,
        target: 'cards',
        tag: 'layout',
        title: 'Even cards still signal a template',
        observation:
          '“Boards”, “Timeline” and “Reports” are even, with equal icons and copy of equal length.',
        why: 'Even when the features differ in value, identical cards read as a template choice rather than a decision about what matters.',
        fix: 'Let one feature lead — more width, a short annotated example — or replace the row with a labelled list.',
      },
    ],
  },
  {
    id: 'strong',
    tab: 'Strong',
    tabNote: 'a clear point of view',
    screen: 'strong',
    brand: 'Cinder & Sage',
    kind: 'neighbourhood bakery · invented',
    honesty: 'Illustrative example, not a real company’s site',
    scores: { hierarchy: 9, layout: 8, typography: 9, responsive: 8, conversion: 9 },
    hotspots: [
      {
        id: 'strong-cta',
        n: 1,
        target: 'ctas',
        tag: 'conversion',
        title: 'One action, no rival',
        observation:
          'There is a single filled call to action — “Order for pickup”. Every other action on the screen is a quiet text link.',
        why: 'One unambiguous primary action removes the guesswork that competing buttons create; the next step is never in doubt.',
        fix: 'Keep it. As the page grows, protect the single primary action instead of adding a second.',
      },
      {
        id: 'strong-scale',
        n: 2,
        target: 'headline',
        dx: -16,
        tag: 'typography',
        title: 'A display step that carries the brand',
        observation:
          'The headline sets at roughly 3.4× body in a high-contrast serif, with generous space above and below.',
        why: 'Large display-to-body contrast gives an unmistakable reading order and leaves room for personality — the type is doing brand work, not just labelling.',
        fix: 'Hold the ratio. Do not introduce mid-size elements that would sit between the display and the body.',
      },
      {
        id: 'strong-copy',
        n: 3,
        target: 'subhead',
        tag: 'ux',
        title: 'Specific, verifiable copy',
        observation:
          'The sub-head states the promise exactly: baked before sunrise, ready for pickup today, order by 5pm.',
        why: 'Specific, checkable detail builds trust faster than adjectives, and it tells the visitor precisely what happens next.',
        fix: 'Keep the specificity in every supporting line, and resist the pull toward something more poetic.',
      },
      {
        id: 'strong-focus',
        n: 4,
        target: 'hero',
        dx: 30,
        tag: 'hierarchy',
        title: 'A first screen that resolves around one idea',
        observation:
          'One hero, one headline, one action, one supporting line — a single focal point with clear air around it.',
        why: 'A single focal point lets the eye settle immediately, so the rest of the page can unfold in a predictable order.',
        fix: 'Preserve the single-focus hero as sections are added; let each new section have its own one clear job.',
      },
    ],
  },
];

export const critiqueCount = critiqueExamples.length;

/* -------------------------------------------------------------------------
   AI draft vs my refinement — the same invented hero brief, twice.
   Left is the generic generated hero; right is the refined version.
   ------------------------------------------------------------------------- */
export const heroBrief = {
  brand: 'Marlow & Rye',
  kind: 'neighbourhood bakery · invented',
  honesty: 'Illustrative example, not a real company’s site',
  notes: [
    {
      key: 'Hierarchy',
      body: 'Cut the first screen from four competing elements to two — one headline and one action — so the eye lands in one place.',
    },
    {
      key: 'Copy',
      body: 'Replaced “Freshly Baked Happiness” with a concrete promise: what it is, when it is ready, and how to get it.',
    },
    {
      key: 'CTA',
      body: 'Removed the second button. The single “Reserve for pickup” now has no rival on the screen.',
    },
    {
      key: 'Contrast & space',
      body: 'Traded the purple gradient for warm paper with near-black text (≈15:1) and gave the headline real breathing room.',
    },
  ],
};

/* -------------------------------------------------------------------------
   Convergence vs divergence — a short, first-person position piece.
   ------------------------------------------------------------------------- */
export const convergenceEssay = [
  'I think good landing pages converge on a few things: a clear primary action, text that clears contrast minimums, a scan order the eye can follow without effort, and a line length that stays readable. These are not opinions — they are the floor, and every page should clear them.',
  'Where taste matters is above that floor. Two pages can both work and still feel nothing alike: one whispers with restraint and space, the other shouts with a heavy display face and an edge. Neither is wrong. The real risk is stopping at the safe default — the centred hero and the three equal cards — because it is easy to defend and impossible to remember. My approach is to pass the objective checks first, then make one deliberate, distinctive decision that the rest of the page supports.',
];

export const convergenceStates = [
  {
    id: 'converge',
    label: 'Convergent',
    caption: 'Safe defaults: modest type steps, a quiet palette, a centred layout, no motion.',
  },
  {
    id: 'balance',
    label: 'Balanced',
    caption: 'One step off the default: a wider type step, one warm accent, a slight offset.',
  },
  {
    id: 'diverge',
    label: 'Divergent',
    caption: 'A point of view: dramatic display type, a bold palette, an asymmetric grid, purposeful motion.',
  },
];

/* -------------------------------------------------------------------------
   The evaluation checklist — what I look for before a page ships.
   ------------------------------------------------------------------------- */
export const checklist = [
  'A one-sentence value proposition sits above the fold.',
  'Exactly one primary call to action per screen.',
  'A type scale with obvious, deliberate steps between ranks.',
  'Body and UI text clears a 4.5:1 contrast ratio.',
  'The layout stacks cleanly from 360px upward.',
  'A scan order the eye can follow without effort.',
  'Specific copy, not category-level claims.',
  'Motion that clarifies the hierarchy, never motion for its own sake.',
];
