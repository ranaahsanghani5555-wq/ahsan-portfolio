# DEPLOY.md — putting this portfolio online (beginner, Windows)

This walks you from your PC to a live URL. You only need a browser and the
commands below, typed into **PowerShell**. Nothing here costs money on the free
tiers.

> Do **not** run any deploy command until you have read part 1 and part 2.
> The screenshots/ and docs referenced by Phase 9A are for your Contra profile,
> not for the website itself.

---

## 0. What you are deploying

- One React app (the portfolio) built by Vite.
- Six standalone demo pages under `public/work/` — they are copied into the
  build automatically.
- The production build goes into `dist/`. That folder is what gets hosted.
- `vite.config.js` sets `base: './'`, so the site works from a root domain **or**
  a sub-path. Leave it as it is.

---

## 1. Check `.gitignore` before pushing

A `.gitignore` already exists at the project root. Open it and confirm it contains
these entries (it should):

```
node_modules/
dist/
.env
.env.*
screenshots/
```

What that means:

- `node_modules/` — huge, and rebuilt by `npm install`. Never commit it.
- `dist/` — the built output; the host builds it for you. Never commit it.
- `.env` — secrets. You have none right now, but keep the rule for the future.
- `screenshots/` — you can regenerate these with `npm run shots`; they are for
  uploading to Contra, not for the repo.

**Only what should be public gets committed.** Everything else in the repo
(`src/`, `public/`, `index.html`, `package.json`, `README.md`, the `contra/`
docs and this `DEPLOY.md`) is fine to make public — it is the source of the site.

**The original photo.** If you have the original `ahsan.jpg.jpeg` sitting in the
project root, you can leave it out of the repo — the website only uses the
optimised copies in `public/images/` (`ahsan-ghani.webp`, `ahsan-ghani-400.webp`).
It is already listed near the bottom of `.gitignore` so Git will ignore it
automatically. (That file is not present in the repo right now, so there is
nothing to do — this is just a note for later.)

Quick check before you commit:

```powershell
# See exactly what Git would add (nothing should say node_modules or dist)
git status
```

---

## 2. Create a GitHub account and repo, then push

### 2a. Install Git
If `git --version` does not work, install Git for Windows from
<https://git-scm.com/download/win>, then close and reopen PowerShell.

Check it:

```powershell
git --version
```

### 2b. Create the repository on GitHub
1. Go to <https://github.com> and sign up (or log in).
2. Click **New repository**.
3. Name it e.g. `portfolio`. Leave it **Public** (or Private if you prefer).
4. **Do not** tick "Add a README" — you already have one.
5. Click **Create repository**. Keep that page open; it shows your repo URL.

### 2c. Push your project
Open PowerShell in the project folder and run these commands **one at a time**.
Replace `YOUR-USERNAME` and `portfolio` with your real values.

```powershell
cd E:\PF

git init
git add .
git commit -m "Initial commit"

git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

The first `git push` will open a browser window to sign in to GitHub. Approve it,
and the code is uploaded.

If you ever change files later, update GitHub with:

```powershell
git add .
git commit -m "Describe what changed"
git push
```

---

## 3. Deploy on Vercel (recommended)

1. Go to <https://vercel.com> and **Sign up with GitHub**.
2. Click **Add New… → Project**.
3. Choose the repo you just pushed and click **Import**.
4. Vercel auto-detects Vite. Confirm these settings:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (default)
   - **Environment Variables:** none needed
5. Click **Deploy**. Wait ~1 minute. You'll get a URL like
   `https://portfolio-yourname.vercel.app`.

Every future `git push` to `main` redeploys automatically.

### If the demo pages 404 on Vercel
They should not (they are real files copied into `dist/work/...`). If a specific
page 404s, check that `public/work/<slug>/index.html` exists in your repo and that
the link opens with the trailing `/index.html` exactly as the site writes it.

---

## 4. Deploy on Netlify (backup / alternative)

1. Go to <https://www.netlify.com> and **Sign up with GitHub**.
2. Click **Add new site → Import an existing project**.
3. Pick **GitHub**, choose your repo.
4. Confirm the build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**. You'll get a URL like
   `https://random-name.netlify.app`.

You can rename the site under **Site settings → Change site name**. Netlify also
redeploys on every `git push`.

> You do not need both. Vercel is the main one; Netlify is there if you want a
> second copy or to compare.

---

## 5. What to check after deploy

Open your live URL (try it on your phone too) and walk through this list:

- [ ] The **preloader** plays once and clears; the hero headline appears.
- [ ] Every **project card** in the Work section opens its **case study panel**.
- [ ] The **preview modal** opens, loads the demo in the iframe, and the device
      toggle (Desktop / Tablet 768 / Mobile 390) resizes it.
- [ ] **All six demo pages** open both ways:
      in the modal, and "Open in new tab".
      - [ ] `/work/inkflow/index.html`
      - [ ] `/work/hisaab/index.html`
      - [ ] `/work/cadenza/index.html`
      - [ ] `/work/atelier-noor/index.html`
      - [ ] `/work/kora/index.html`
      - [ ] `/work/rep-club/index.html`
- [ ] The **contact** section opens a `mailto:` to your email (check the address
      in `src/data/profile.js`).
- [ ] **Mobile view** (open on a real phone, or narrow the browser window):
      no sideways scrolling, the menu opens, the pinned Process stacks.
- [ ] No red errors in the browser console (F12 → Console).

---

## 6. Add a custom domain later

1. Buy a domain (Namecheap, Cloudflare, Google Domains, etc.).
2. **Vercel:** Project → **Settings → Domains → Add**, type your domain, and
   follow the DNS instructions. **Netlify:** Site → **Domain management → Add a
   domain**.
3. At your domain registrar, add the records the host shows you (usually an `A`
   record to the host's IP for the root, and a `CNAME` for `www`).
4. Wait for DNS to propagate (minutes to a few hours). The host issues HTTPS for
   you automatically.
5. **Then update the site's own URLs** (see the TODO list below) and redeploy.

---

# AFTER-DEPLOY TODO LIST

Do these **the moment you know your live URL**. They are the loose ends that must
not ship as placeholders.

- [ ] **Set the canonical URL.** In `index.html`, replace
      `https://ahsanghani.dev/` in the `<link rel="canonical">` with your real
      live URL.
- [ ] **Set `og:url`.** Same file, `<meta property="og:url">` → your live URL.
- [ ] **Set an absolute `og:image` URL.** `<meta property="og:image">` and
      `<meta name="twitter:image">` must be the **full** URL, e.g.
      `https://your-domain.com/og-image.png`. Remove the `TODO(deploy)` comment
      block when done.
- [ ] **Re-run Lighthouse on the live URL** (not localhost). Use Chrome DevTools
      → Lighthouse, **Mobile** preset, or `npx lighthouse <live-url> --view`
      with default mobile throttling.
- [ ] **Update `src/data/lighthouse.js`** with the live numbers (median of three
      runs), update the `average`, and update the per-project
      `facts.lighthouse` strings in `src/data/projects.js`. Then
      `git add . && git commit -m "Update Lighthouse numbers (live)" && git push`.
- [ ] **Re-run the screenshots** against the live URL if you want them to match
      production exactly:
      `$env:BASE="https://your-domain.com"; npm run shots`
- [ ] Double-check the favicon and the social card preview (paste your URL into a
      link preview tool) show the right image.

---

## Quick reference

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Run locally (dev) | `npm run dev` |
| Build for production | `npm run build` |
| Preview the real build | `npm run preview` |
| Check code style | `npm run lint` |
| Capture screenshots | `npm run shots` |
| Publish changes | `git add . && git commit -m "…" && git push` |
