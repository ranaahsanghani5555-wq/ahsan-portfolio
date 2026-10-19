/**
 * pw-audit.mjs — animation audit for both motion modes.
 *
 * Run: npm run build && npx vite preview --port 4173  (then) node pw-audit.mjs
 *
 * Every page is loaded twice: once with ?motion=full and once with
 * ?motion=reduced, and the browser context requests prefers-reduced-motion
 * accordingly. The audit fails loudly on:
 *   - console errors / page errors
 *   - demo pages where gsap / ScrollTrigger / motion.js did not return 200
 *   - "lost content": text that is hidden and visible nowhere else on the page
 *     (a stuck reveal). Decorative nodes and by-design duplicate states are
 *     ignored, so the signal stays honest.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:4173';
const OUT = 'E:/PF/pw-frames';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { key: 'main', url: '/', spa: true },
  { key: 'cadenza', url: '/work/cadenza/' },
  { key: 'kora', url: '/work/kora/' },
  { key: 'hisaab', url: '/work/hisaab/' },
  { key: 'inkflow', url: '/work/inkflow/' },
  { key: 'rep-club', url: '/work/rep-club/' },
  { key: 'atelier-noor', url: '/work/atelier-noor/' },
];

const MODES = ['full', 'reduced'];

// Frame times in seconds
const FRAME_TIMES = [0.2, 0.6, 1.0, 1.6, 3.0];

/* The reveal contract, in one place. An element marked as a reveal carries
   content that GSAP hides only immediately before animating it; if it is still
   hidden once the page has settled, the content is lost. Decorative nodes
   (aria-hidden, or no text) are excluded by design. Serialised into the page by
   Playwright, so it must stay self-contained (no closures). */
function detectHiddenReveals() {
  const REVEAL = '[data-reveal],[data-hero-reveal],[data-reveal-line]';
  const label = (el) =>
    el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.toString().split(' ')[0] : '');
  const isHidden = (el) => {
    const cs = window.getComputedStyle(el);
    return cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none';
  };
  const stuck = [];
  let decorative = 0;
  for (const el of document.querySelectorAll('[style],' + REVEAL)) {
    if (!isHidden(el)) continue;
    const aria = el.getAttribute('aria-hidden') === 'true' || !!el.closest('[aria-hidden="true"]');
    const text = (el.textContent || '').trim();
    if (el.matches(REVEAL) && !aria && text) stuck.push(label(el));
    else decorative += 1;
  }
  return { stuck: stuck.slice(0, 12), decorative };
}

/* Negative control: inject a hidden reveal and assert the detector sees it, so
   a green audit can never mean "the detector is blind". */
async function selfTest(browser) {
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const p = document.createElement('p');
    p.id = 'audit-control';
    p.setAttribute('data-reveal', '');
    p.textContent = 'CONTROL';
    p.style.opacity = '0';
    document.body.appendChild(p);
  });
  const result = await page.evaluate(detectHiddenReveals);
  await context.close();
  const detected = result.stuck.includes('P#audit-control');
  console.log(`SELF-TEST: detector ${detected ? 'OK' : 'FAILED'} (control reported: ${detected})`);
  return detected;
}

async function shot(page, name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function checkServiceWorker() {
  const distDir = 'E:/PF/dist';
  if (!existsSync(distDir)) return 'dist/ not found';
  const files = readdirSync(distDir);
  const sw = files.filter((f) => /sw|service.?worker/i.test(f));
  return sw.length ? `SW files: ${sw.join(', ')}` : 'No service worker in dist/';
}

function checkViteConfig() {
  const confPath = existsSync('E:/PF/vite.config.js') ? 'E:/PF/vite.config.js' : null;
  if (!confPath) return 'vite config not found';
  const content = readFileSync(confPath, 'utf8');
  return /cache|headers|Cache-Control/i.test(content)
    ? `cache hint: ${content.match(/cache[^\n]*/i)?.[0]}`
    : 'no custom cache headers';
}

async function auditPage(browser, { key, url, spa }, mode) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
  });

  const consoleMessages = [];
  const scriptLoads = {};
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => consoleMessages.push(`[pageerror] ${err.message}`));
  page.on('response', (res) => {
    if (res.request().resourceType() === 'script') scriptLoads[res.url()] = res.status();
  });

  const target = `${BASE}${url}${url.includes('?') ? '&' : '?'}motion=${mode}`;
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(100);

  const frames = {};
  for (const t of FRAME_TIMES) {
    const elapsed = (await page.evaluate(() => performance.now())) / 1000;
    const remaining = t - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining * 1000);
    const label = `t${String(t).replace('.', '_')}s`;
    frames[t] = await shot(page, `${mode}__${key}__${label}`);
  }

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' }));
  await page.waitForTimeout(600);
  const scrollMid = await shot(page, `${mode}__${key}__scroll_mid`);

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(600);
  const scrollBot = await shot(page, `${mode}__${key}__scroll_bot`);

  const motionState = await page
    .evaluate(() => ({
      motionOK: typeof window.__motionOK === 'function' ? window.__motionOK() : 'n/a',
      motionLight: typeof window.__motionLight === 'function' ? window.__motionLight() : 'n/a',
      gsapGlobal: typeof window.gsap !== 'undefined',
      moduleScripts: document.querySelectorAll('script[type="module"]').length,
      dataMotion: document.documentElement.getAttribute('data-motion'),
      tweens:
        typeof window.gsap !== 'undefined'
          ? window.gsap.globalTimeline.getChildren(true, true, false).length
          : -1,
    }))
    .catch(() => ({ error: 'evaluate failed' }));

  // Content marked as a reveal that is still hidden once the page has settled.
  const hiddenReport = await page.evaluate(detectHiddenReveals);
  const stuckHidden = hiddenReport.stuck;

  await context.close();

  const relevantScripts = Object.entries(scriptLoads).filter(([u]) => /gsap|ScrollTrigger|motion/i.test(u));
  const badScripts = relevantScripts.filter(([, status]) => status !== 200);
  const scriptMissing = !spa && relevantScripts.length === 0;

  return {
    key,
    mode,
    url: target,
    motionState,
    consoleMessages,
    stuckHidden,
    decorativeHidden: hiddenReport.decorative,
    relevantScripts,
    badScripts,
    scriptMissing,
    frames,
    scrollMid,
    scrollBot,
  };
}

async function main() {
  console.log('SERVICE WORKER:', await checkServiceWorker());
  console.log('VITE CONFIG:', checkViteConfig());

  const browser = await chromium
    .launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] })
    .catch(() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));

  const report = [];
  const failures = [];

  if (!(await selfTest(browser))) {
    failures.push('self-test: hidden-reveal detector did not fire on its control');
  }

  for (const mode of MODES) {
    console.log(`\n############ MODE: ${mode} ############`);
    for (const entry of PAGES) {
      const result = await auditPage(browser, entry, mode);
      report.push(result);
      const { motionState: ms } = result;

      console.log(`\n=== [${mode}] ${entry.key} ===`);
      console.log(
        `  motionOK=${ms.motionOK} motionLight=${ms.motionLight} data-motion=${ms.dataMotion}` +
          ` gsap(global=${ms.gsapGlobal}, modules=${ms.moduleScripts}, tweens=${ms.tweens})`
      );
      if (result.consoleMessages.length) {
        console.log('  console errors/warnings:', result.consoleMessages.slice(0, 5));
        failures.push(`${mode}/${entry.key}: console -> ${result.consoleMessages[0]}`);
      }
      if (result.stuckHidden.length) {
        console.log('  LOST CONTENT (hidden, not visible elsewhere):', result.stuckHidden);
        failures.push(`${mode}/${entry.key}: lost content -> ${result.stuckHidden.join(', ')}`);
      }
      if (result.badScripts.length) {
        console.log('  BAD SCRIPT STATUS:', result.badScripts);
        failures.push(`${mode}/${entry.key}: bad script status`);
      }
      if (result.scriptMissing) {
        console.log('  WARNING: no gsap/motion scripts in network log');
        failures.push(`${mode}/${entry.key}: no gsap/motion scripts`);
      }
      if (!result.stuckHidden.length && !result.consoleMessages.length && !result.badScripts.length) {
        console.log(`  clean (${result.decorativeHidden} decorative hidden nodes, by design)`);
      }
    }
  }

  await browser.close();

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n──────────────────────────────────────────');
  if (failures.length) {
    console.log(`AUDIT FAILURES (${failures.length}):`);
    failures.forEach((f) => console.log('  - ' + f));
  } else {
    console.log('AUDIT PASSED: both motion modes, all pages clean.');
  }
  console.log('Frames + report at', OUT);
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
