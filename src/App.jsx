import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import styles from './App.module.css';

import { useLenis, LenisContext } from './hooks/useLenis';
import { profile } from './data/profile';

import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Footer from './components/Footer.jsx';

/* Below-the-fold sections are code-split so the first paint does not have to
   parse, evaluate and lay out the whole page. Each chunk loads a moment after
   the hero paints; Vite fetches them in parallel with the main bundle. */
const Work = lazy(() => import('./components/Work.jsx'));
const Process = lazy(() => import('./components/Process.jsx'));
const Metrics = lazy(() => import('./components/Metrics.jsx'));
const Critique = lazy(() => import('./components/Critique/Critique.jsx'));
const About = lazy(() => import('./components/About.jsx'));
const Contact = lazy(() => import('./components/Contact.jsx'));
const DesignSystem = lazy(() => import('./components/DesignSystem.jsx'));

/* How soon the hero may begin its reveal. It no longer waits for the whole
   preloader: the headline starts lifting a few hundred ms in, underneath the
   curtain, so the largest paint lands far earlier while the curtain still
   completes its full signature wipe (~1.16s). */
const HERO_READY_DELAY = 200; // first visit (curtain playing)
const HERO_READY_DELAY_CACHED = 60; // session already preloaded

/* No router: the hidden style guide lives at #design-system and the marketing
   shell is the default view. A hash change is the only "route". */
function useHashView() {
  const [hash, setHash] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.hash
  );

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return hash;
}

export default function App() {
  const lenis = useLenis(); // one smooth-scroll instance, shared via context
  const hash = useHashView();
  const showDesignSystem = hash === '#design-system';

  const [introDone, setIntroDone] = useState(false);
  const handleIntroDone = useCallback(() => setIntroDone(true), []);

  /* `heroReady` releases the headline while the curtain is still up. Kept
     separate from `introDone` (curtain done) on purpose. */
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    let cached = false;
    try {
      cached = sessionStorage.getItem('ag:preloaded') === '1';
    } catch {
      /* storage unavailable — treat as first visit */
    }
    const timer = window.setTimeout(
      () => setHeroReady(true),
      cached ? HERO_READY_DELAY_CACHED : HERO_READY_DELAY
    );
    return () => window.clearTimeout(timer);
  }, []);

  // The failsafe guarantees the headline can never stay hidden if the
  // curtain cannot finish for any reason.
  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  // Lock scrolling behind the preloader, then release it.
  useEffect(() => {
    if (introDone) return undefined;
    const root = document.documentElement;
    root.classList.add('is-locked');
    lenis?.stop();
    return () => {
      root.classList.remove('is-locked');
      lenis?.start();
    };
  }, [introDone, lenis]);

  useEffect(() => {
    document.title = showDesignSystem
      ? `Design system — ${profile.brand}`
      : `${profile.brand} — Web Designer`;
  }, [showDesignSystem]);

  return (
    <LenisContext.Provider value={lenis}>
      <div className={styles.shell}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        {!introDone && <Preloader onDone={handleIntroDone} />}
        <div className="grain" aria-hidden="true" />
        <Cursor />
        <Nav />

        {showDesignSystem ? (
          <main id="main" className={styles.main}>
            <Suspense fallback={null}>
              <DesignSystem />
            </Suspense>
          </main>
        ) : (
          <main id="main" className={styles.main}>
            <Hero play={heroReady} />
            <Suspense fallback={null}>
              <Work />
            </Suspense>
            <Suspense fallback={null}>
              <Process />
            </Suspense>
            <Suspense fallback={null}>
              <Metrics />
            </Suspense>
            <Suspense fallback={null}>
              <Critique />
            </Suspense>
            <Suspense fallback={null}>
              <About />
            </Suspense>
            <Suspense fallback={null}>
              <Contact />
            </Suspense>
          </main>
        )}

        <Footer />
      </div>
    </LenisContext.Provider>
  );
}