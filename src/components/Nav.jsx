import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Nav.module.css';
import { profile } from '../data/profile';
import { useMagnetic } from '../hooks/useMagnetic';
import { useLenisControl } from '../hooks/useLenis';
import { motionOK } from '../lib/motion.js';

const LINKS = [
  { id: 'work', href: '#work', label: 'Work' },
  { id: 'process', href: '#process', label: 'Process' },
  { id: 'critique', href: '#critique', label: 'Critique' },
  { id: 'about', href: '#about', label: 'About' },
];

/* Sections that can own the active indicator. The hero maps to null so the
   indicator is simply absent until the visitor reaches the first section. */
const SECTION_IDS = ['top', 'work', 'process', 'critique', 'about'];

/**
 * Nav — the sticky site header.
 *
 * Desktop: hides on scroll-down, returns on scroll-up, and carries a sliding
 * indicator that follows the section in view. Small screens replace the links
 * with a full-screen overlay menu (staggered reveal, focus trap, Esc to close,
 * body scroll locked, Lenis paused while it is open).
 */
export default function Nav() {
  const headerRef = useRef(null);
  const listRef = useRef(null);
  const indicatorRef = useRef(null);
  const overlayRef = useRef(null);
  const toggleRef = useRef(null);
  const firstRun = useRef(true);
  const menuOpenRef = useRef(false);
  const restoreFocusRef = useRef(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('work');

  const lenis = useLenisControl();
  const ctaRef = useMagnetic({ strength: 0.22, max: 10 });
  const overlayCtaRef = useMagnetic({ strength: 0.2, max: 14, enabled: menuOpen });

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  /* --- sliding indicator follows the section in view ---------------------- */
  useGSAP(
    () => {
      const list = listRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return undefined;

      const links = Array.from(list.querySelectorAll('[data-nav-link]'));
      const place = (animate) => {
        const el = links.find((link) => link.dataset.navLink === active);
        if (!el) {
          gsap.set(indicator, { autoAlpha: 0 });
          return;
        }
        gsap.set(indicator, { autoAlpha: 1 });
        gsap.to(indicator, {
          x: el.offsetLeft,
          width: el.offsetWidth,
          duration: animate ? 0.45 : 0,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      };

      place(!firstRun.current);
      firstRun.current = false;

      const onResize = () => place(false);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    },
    { dependencies: [active], scope: headerRef, revertOnUpdate: true }
  );

  /* --- active section + hide-on-scroll, driven by one rAF-throttled native
         scroll listener so ScrollTrigger stays off the critical path. The
         section elements are looked up live because the sections below the
         fold are code-split and mount after the nav. ------------------------- */
  useEffect(() => {
    const header = headerRef.current;
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const y = window.scrollY;

      // Active section: the one whose box crosses the 45%-viewport line.
      const line = window.innerHeight * 0.45;
      let found = null;
      for (const id of SECTION_IDS) {
        const section = document.getElementById(id);
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) {
          found = id;
          break;
        }
      }
      setActive(found === 'top' ? null : found);

      // Hide while scrolling down past 160px, reveal on any scroll up.
      if (!menuOpenRef.current && header) {
        const shouldHide = y > lastY && y > 160;
        if (shouldHide !== hidden) {
          hidden = shouldHide;
          gsap.to(header, {
            yPercent: hidden ? -130 : 0,
            duration: 0.45,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        }
      }
      lastY = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* --- keep the header visible while the menu is open --------------------- */
  useEffect(() => {
    if (menuOpen && headerRef.current) {
      gsap.to(headerRef.current, { yPercent: 0, duration: 0.3, overwrite: 'auto' });
    }
  }, [menuOpen]);

  /* --- overlay open/close + focus trap + scroll lock ---------------------- */
  const openMenu = useCallback(() => {
    restoreFocusRef.current = true;
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback((restoreFocus = true) => {
    restoreFocusRef.current = restoreFocus;
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const root = document.documentElement;
    const overlay = overlayRef.current;
    if (!overlay) return undefined;

    const previouslyFocused = document.activeElement;
    const toggle = toggleRef.current;
    lenis?.stop();
    root.classList.add('is-locked');
    const focusables = () => Array.from(overlay.querySelectorAll('a[href], button'));

    focusables()[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      lenis?.start();
      root.classList.remove('is-locked');
      if (restoreFocusRef.current) {
        const target = toggle ?? previouslyFocused;
        if (target instanceof HTMLElement) target.focus();
      }
    };
  }, [menuOpen, lenis, closeMenu]);

  /* --- overlay link stagger ----------------------------------------------- */
  useGSAP(
    () => {
      if (!menuOpen || !overlayRef.current) return undefined;

      /* The stagger travels >100px, so it is heavy: skipped under reduced
         motion. The overlay itself still opens with all links visible. */
      if (!motionOK()) return undefined;

      const items = gsap.utils.toArray('[data-menu-item]', overlayRef.current);
      const timeline = gsap.timeline();
      // opacity (not autoAlpha) so the links stay focusable during the reveal
      timeline
        .from(overlayRef.current, { opacity: 0, duration: 0.2 })
        .from(
          items,
          { yPercent: 120, opacity: 0, duration: 0.55, ease: 'expo.out', stagger: 0.06 },
          0.02
        );

      return () => timeline.kill();
    },
    { dependencies: [menuOpen], scope: overlayRef, revertOnUpdate: true }
  );

  /* --- close the menu if the viewport grows past the overlay breakpoint --- */
  useEffect(() => {
    if (!menuOpen || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(min-width: 48rem)');
    const onChange = (event) => {
      if (event.matches) closeMenu(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header ref={headerRef} className={styles.header}>
        <div className={`container ${styles.bar}`}>
          <a className={styles.brand} href="#top" aria-label={`${profile.brand}, back to top`}>
            {profile.brand}
          </a>

          <nav className={styles.nav} aria-label="Primary">
            <ul ref={listRef} className={styles.list}>
              <li className={styles.indicator} ref={indicatorRef} aria-hidden="true" />
              {LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    className={styles.link}
                    href={link.href}
                    data-nav-link={link.id}
                    aria-current={active === link.id ? 'true' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a ref={ctaRef} className={styles.cta} href="#contact">
            Let&apos;s talk
          </a>

          <button
            type="button"
            ref={toggleRef}
            className={styles.toggle}
            aria-expanded={menuOpen}
            aria-controls="nav-overlay"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => (menuOpen ? closeMenu(true) : openMenu())}
          >
            <span className={styles.bars} aria-hidden="true" data-open={menuOpen || undefined}>
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          id="nav-overlay"
          ref={overlayRef}
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className={styles.overlayInner}>
            <ul className={styles.overlayList}>
              {LINKS.map((link, index) => (
                <li key={link.id} className={styles.overlayItem}>
                  <a
                    className={styles.overlayLink}
                    href={link.href}
                    data-menu-item
                    onClick={() => closeMenu(false)}
                  >
                    <span className={styles.overlayNumber} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              ref={overlayCtaRef}
              className={styles.overlayCta}
              href="#contact"
              data-menu-item
              onClick={() => closeMenu(false)}
            >
              Let&apos;s talk
            </a>
          </div>
        </div>
      )}
    </>
  );
}
