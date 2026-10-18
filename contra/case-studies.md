# Case studies — six concept projects

All six are **self-initiated concept projects**. There are no clients, no real
products and no user data behind them. Every number below comes from this repo
(`src/data/projects.js` and `src/data/lighthouse.js`): section counts, the widths
each page was tested at, the hours recorded while building, and the measured
Lighthouse performance score + CLS (a median of three mobile runs, 390×844,
simulated Slow-4G + 4× CPU).

---

## Inkflow — AI writing assistant
**Self-initiated concept project. No client.**

**Brief.** Make an AI writing assistant feel calm and trustworthy before a single
feature is read. Audience: solo founders and content teams who already write
well and want assistance, not replacement.

**Approach.** One landing page built around a single idea — show writing, don't
claim it — with quiet typography carrying the rest.

**Three decisions.** Lead with a real draft: the hero shows an editable paragraph
and one suggestion, so the value lands before any feature copy. Reserve the lime
accent for the single primary action. Pair monospace for the interface with a
humanist grotesque for the prose — a precise machine surface around readable
text.

**Outcome.** Seven sections, tested at five widths (360–1440 px). Lighthouse
performance 90, CLS 0.0000. A concept, not a shipped product.

---

## Hisaab — invoicing and payments
**Self-initiated concept project. No client.**

**Brief.** A money tool for Pakistani freelancers that feels local, plain-spoken
and dependable — for people invoicing overseas clients and living with the
friction of getting paid.

**Approach.** One page that leads with arithmetic instead of promises, in
everyday language rather than bank copy.

**Three decisions.** Show the arithmetic: the hero shows an invoice total and its
net payout with every fee labelled. Write in plain Urdu-English, because the
audience switches language daily. Use green only as a status colour, so one green
badge means “paid” at a glance.

**Outcome.** Six sections, tested at five widths (360–1440 px). Lighthouse
performance 88, CLS 0.0000. A concept, not a live product.

---

## Cadenza — B2B CRM
**Self-initiated concept project. No client.**

**Brief.** Turn a wall of B2B CRM features into one clear decision on a single
screen. Audience: sales leads at 10–50-person companies comparing three tools on
a Friday afternoon.

**Approach.** Argue for one action — book a walkthrough — and let the product
screenshot be the loudest pixel on the page.

**Three decisions.** One screen, one decision: repeat a single call to action
after every proof point. Keep everything quiet so the product screenshot carries
the argument. A neutral grotesque for UI and a monospace for data, so numbers
scan cleanly.

**Outcome.** Eight sections, tested at five widths (360–1440 px). Lighthouse
performance 94, CLS 0.0006. A concept, not a shipped product.

---

## Atelier Noor — creative studio
**Self-initiated concept project. No client.**

**Brief.** An agency site that lets oversized type and empty space do the talking.
Audience: brand and marketing leads commissioning a studio for a flagship
campaign.

**Approach.** Treat the work as the argument: display-scale type on a strict grid,
navigation pushed into the margins, projects revealed by scrolling.

**Three decisions.** Display-scale type held by a twelve-column grid, so large
type stays composed rather than merely loud. One electric blue, used like a stamp,
on an otherwise monochrome page. Reveal projects by scrolling, never through a
thumbnail gallery.

**Outcome.** Five sections, tested at five widths (360–1440 px). Lighthouse
performance 86, CLS 0.0000. A concept, not a real studio site.

---

## Kora — stoneware pour-over set
**Self-initiated concept project. No client.**

**Brief.** A product page for a handmade ceramic pour-over set that sells material
and craft, not a grid. Audience: home coffee enthusiasts who will pay for a slow,
object-led ritual.

**Approach.** Give one object many angles and borrow the page's palette from the
clay body itself, so the page feels fired rather than printed.

**Three decisions.** One object, many angles: a single product framed from three
angles instead of a grid of ten. A warm charcoal ground with one terracotta
accent, taken from the clay. Price and shipping below the fold, after the
material — the story earns the price.

**Outcome.** Six sections, tested at five widths (360–1440 px). Lighthouse
performance 87, CLS 0.0009. A concept, not a live shop.

---

## Rep Club — fitness habit app
**Self-initiated concept project. No client.**

**Brief.** A fitness app sign-up that signals energy without a stock gym
photograph. Audience: people who train inconsistently and want a routine that
survives a bad week.

**Approach.** Let flat, electric colour stand in for imagery, and ask for a small
honest commitment instead of a transformation.

**Three decisions.** Colour is the only image: flat, electric colour states the
brand without licensing a photo. Ask for the smallest honest commitment first —
three sessions a week, not a transformation. Type that leans, a layout that stays
still, so the page feels fast, not frantic.

**Outcome.** Seven sections, tested at five widths (360–1440 px). Lighthouse
performance 90, CLS 0.0003. A concept, not a live app.

---

### How to reuse these
- Each entry is about 120 words and self-contained — paste one per Contra project.
- The Lighthouse figure is a **median of three mobile runs** taken on the
  production build; if you re-measure, update both here and in
  `src/data/lighthouse.js`.
- Nothing here claims a client, a launch, revenue or a testimonial. Keep it
  that way.
