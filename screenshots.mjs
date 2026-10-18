/*
  screenshots.mjs — Phase 9A screenshot capture.

  Captures, into ./screenshots:
    - for each of the six demos: a full-page desktop shot (1440 wide), a full-page
      mobile shot (390 wide), and an above-the-fold desktop crop (1440x900)
    - for the main portfolio: full-page desktop + mobile, plus the Work, Critique
      and About sections, and the hero crop

  Every page is rendered with prefers-reduced-motion: reduce so that the
  preloader is skipped, Lenis is off, the Process section is not pinned, and
  scroll-reveal content is shown at rest. The page is additionally scrolled
  through once (to trigger any IntersectionObserver reveals) and given a final
  stylesheet that disables animation/transition and hides decorative chrome
  (custom cursor) so nothing is captured mid-flight.

  Each shot is written twice: a .png and an 85%-quality .jpg (for upload limits).

  Usage:
    npm run preview          # in one terminal (serves dist/ on :4173)
    npm run shots            # in another   (BASE defaults to http://localhost:4173)

  Env overrides: BASE (default http://localhost:4173), OUT (default screenshots)
*/

import { chromium } from 'playwright';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = path.resolve(process.env.OUT || 'screenshots');
const JPG_QUALITY = 85;

const DEMOS = ['inkflow', 'hisaab', 'cadenza', 'atelier-noor', 'kora', 'rep-club'];
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const SETTLE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  html { scrollbar-width: none !important; }
  ::-webkit-scrollbar { display: none !important; }
  /* decorative chrome that must never appear in a screenshot */
  [class*="preloader"], [class*="Preloader"] { display: none !important; }
  [class*="cursor"], [class*="Cursor"] { display: none !important; }
  [role="dialog"], [aria-modal="true"] { display: none !important; }
`;

async function settle(page) {
  await page.waitForLoadState('load');
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  // scroll through once so any scroll/observer-triggered reveals run, then back to top
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y <= height; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
  await page.addStyleTag({ content: SETTLE_CSS });
  await page.waitForTimeout(300);
}

async function shot(target, name, opts = {}) {
  const png = path.join(OUT, `${name}.png`);
  const jpg = path.join(OUT, `${name}.jpg`);
  await target.screenshot({ path: png, animations: 'disabled', ...opts });
  await target.screenshot({ path: jpg, type: 'jpeg', quality: JPG_QUALITY, animations: 'disabled', ...opts });
  process.stdout.write(`  ${name}.png / .jpg\n`);
}

async function launchBrowser() {
  const attempts = [
    ['bundled chromium', {}],
    ['system Edge', { channel: 'msedge' }],
    ['system Chrome', { channel: 'chrome' }],
  ];
  for (const [label, opts] of attempts) {
    try {
      const browser = await chromium.launch(opts);
      process.stdout.write(`browser: ${label}\n`);
      return browser;
    } catch {
      // try the next option
    }
  }
  throw new Error('No browser available. Run: npx playwright install chromium');
}

async function withPage(browser, viewport, url, fn) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    isMobile: viewport.width <= 480,
    hasTouch: viewport.width <= 480,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await settle(page);
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // Fail loudly (and early) if the preview server is not up.
  try {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.error(`\nCannot reach ${BASE} (${e.message}).`);
    console.error(`Start the production preview first:  npm run preview`);
    process.exit(1);
  }

  const browser = await launchBrowser();

  try {
    // ---- six demos ----
    for (const slug of DEMOS) {
      const url = `${BASE}/work/${slug}/index.html`;
      console.log(`\n${slug}`);

      // desktop: hero crop (above the fold) then full page
      await withPage(browser, DESKTOP, url, async (page) => {
        await shot(page, `${slug}-hero`, { clip: { x: 0, y: 0, ...DESKTOP } });
        await shot(page, `${slug}-desktop-full`, { fullPage: true });
      });

      // mobile: full page
      await withPage(browser, MOBILE, url, async (page) => {
        await shot(page, `${slug}-mobile-full`, { fullPage: true });
      });
    }

    // ---- main portfolio ----
    console.log('\nmain');
    const mainUrl = `${BASE}/`;
    await withPage(browser, DESKTOP, mainUrl, async (page) => {
      await shot(page, 'main-hero', { clip: { x: 0, y: 0, ...DESKTOP } });
      await shot(page, 'main-desktop-full', { fullPage: true });
      for (const [id, name] of [['#work', 'main-work'], ['#critique', 'main-critique'], ['#about', 'main-about']]) {
        const section = page.locator(id);
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        await shot(section, name);
      }
    });
    await withPage(browser, MOBILE, mainUrl, async (page) => {
      await shot(page, 'main-mobile-full', { fullPage: true });
    });
  } finally {
    await browser.close();
  }

  // ---- report ----
  const files = (await readdir(OUT)).filter((f) => /\.(png|jpg)$/.test(f)).sort();
  console.log(`\n${files.length} files in ${OUT}:`);
  let total = 0;
  for (const f of files) {
    const s = await stat(path.join(OUT, f));
    total += s.size;
    const mb = s.size / 1024 / 1024;
    console.log(`  ${(mb).toFixed(2).padStart(6)} MB  ${f}${s.size > 2 * 1024 * 1024 ? '  <-- over 2 MB' : ''}`);
  }
  console.log(`  total ${(total / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
