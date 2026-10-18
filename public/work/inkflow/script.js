/* ==========================================================================
   Inkflow — script.js
   Plain JS. GSAP + ScrollTrigger are loaded from ../vendor; if they are
   blocked (offline, or the portfolio iframe sandbox), the page still works:
   content is visible by default and every interactive control (menu, FAQ,
   pricing) works without animation. All motion is transform / opacity /
   clip-path / stroke-dashoffset only and is disabled under
   prefers-reduced-motion (window.__motionOK(), see ../motion.js).
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = !(window.__motionLight ? window.__motionLight() : true); // Light animations always run
  var heavyMotion = window.__motionOK ? window.__motionOK() : true; // Heavy features gate
  var hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && typeof window.ScrollTrigger !== 'undefined') {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
  var animate = hasGsap && reduceMotion === false; // GSAP runs with light or full

  /* ------------------------------------------------------------------ nav */
  var nav = document.querySelector('[data-nav]');
  var onScroll = function () {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ----------------------------------------------------------- mobile menu */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');

  function setMenu(open) {
    if (!menu || !menuToggle) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuToggle.setAttribute('aria-expanded', String(open));
  }

  if (menuToggle && menu) {
    setMenu(false);
    menuToggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    Array.prototype.forEach.call(menu.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ------------------------------------------------------------ typewriter */
  function typeText(el, text, opts) {
    if (!el) return;
    opts = opts || {};
    var speed = opts.speed || 26;
    var delay = opts.startDelay || 0;
    var onDone = opts.onDone;

    if (!animate) {
      el.textContent = text;
      if (onDone) onDone();
      return;
    }

    el.textContent = '';
    var i = 0;
    var start = null;
    function step(now) {
      if (start === null) start = now;
      if (now - start < delay) {
        requestAnimationFrame(step);
        return;
      }
      var elapsed = now - start - delay;
      var target = Math.min(text.length, Math.floor(elapsed / speed) + 1);
      if (target > i) {
        i = target;
        el.textContent = text.slice(0, i);
      }
      if (i < text.length) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  /* Wrap a phrase in the typed text with the product's selection highlight.
     Plain inline span (never inline-block): a wrapping phrase must not be
     forced onto one line, or the card could reflow after load (CLS). */
  function wrapSelection(el, phrase) {
    var text = el.textContent;
    var idx = text.indexOf(phrase);
    if (idx < 0) return null;
    var before = text.slice(0, idx);
    var after = text.slice(idx + phrase.length);
    el.textContent = '';
    el.appendChild(document.createTextNode(before));
    var sel = document.createElement('span');
    sel.className = 'app__sel';
    sel.textContent = phrase;
    el.appendChild(sel);
    el.appendChild(document.createTextNode(after));
    return sel;
  }

  /* Decorative pointer glides from the caret to the Accept chip, which gives
     one small pulse. Transform-only; hidden unless this runs. */
  function glideToAccept() {
    var cursor = document.querySelector('[data-cursor]');
    var wrap = document.querySelector('.hero__demo');
    var accept = document.querySelector('[data-accept]');
    var caret = document.querySelector('.caret__bar');
    if (!cursor || !wrap || !accept || !caret) return;
    var wr = wrap.getBoundingClientRect();
    var ar = accept.getBoundingClientRect();
    var cr = caret.getBoundingClientRect();
    if (!wr.width || !ar.width) return;
    var startX = cr.left - wr.left;
    var startY = cr.top - wr.top;
    var endX = ar.left - wr.left + ar.width * 0.62;
    var endY = ar.top - wr.top + ar.height * 0.55;
    var tl = window.gsap.timeline();
    tl.set(cursor, { x: startX, y: startY, scale: 1 })
      .to(cursor, { autoAlpha: 1, duration: 0.22, ease: 'power1.out' })
      .to(cursor, { x: endX, y: endY, duration: 0.75, ease: 'power2.inOut' }, '+=0.18')
      .to(
        accept,
        {
          scale: 1.09,
          duration: 0.16,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
          transformOrigin: '50% 50%',
        },
        '-=0.06'
      );
  }

  var typed = document.querySelector('[data-typed]');
  var suggest = document.querySelector('[data-suggest]');
  if (typed) {
    typeText(
      typed,
      'The launch post is still a draft. Here\u2019s the honest version, in your voice \u2014 tighter, warmer and ready to send.',
      {
        speed: 18,
        startDelay: 500,
        onDone: function () {
          var sel = wrapSelection(typed, 'honest version');
          if (sel && animate) {
            window.gsap.fromTo(sel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 });
          }
          window.setTimeout(function () {
            if (animate) glideToAccept();
            typeText(suggest, 'Strong start. Try leading with the promise: \u201cHere\u2019s the honest version.\u201d', {
              speed: 22,
            });
          }, 500);
        },
      }
    );
  }

  /* ------------------------------------------- demo: strike + rewrite mock
     When the clarity-pass panel scrolls into view, one strike line is drawn
     through each visual line of the messy draft (measured with Range rects,
     rebuilt after fonts settle and on resize), then the rewrite types in.
     Without JS / under reduced motion the stylesheet's static line-through
     is the design — nothing here may leave the draft half-struck. */
  var genLine = document.querySelector('[data-generate-line]');
  var genText = genLine ? genLine.textContent.trim() : '';
  if (genLine && !animate) genLine.textContent = genText;

  var draftPanel = document.querySelector('.demo__draft');
  var draftText = document.querySelector('.demo__draft-text');
  var strikeFired = false;

  function measureLines(el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return [];
    var range = document.createRange();
    var lines = [];
    var re = /\S+/g;
    var m;
    while ((m = re.exec(node.nodeValue))) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      var r = range.getBoundingClientRect();
      if (!lines.length || Math.abs(r.top - lines[lines.length - 1].top) > 2) {
        lines.push({ top: r.top, left: r.left, right: r.right, height: r.height });
      } else if (r.right > lines[lines.length - 1].right) {
        lines[lines.length - 1].right = r.right;
      }
    }
    return lines;
  }

  function buildStrikeLines() {
    if (!draftPanel || !draftText) return [];
    Array.prototype.forEach.call(draftPanel.querySelectorAll('.strike-line'), function (n) {
      n.parentNode.removeChild(n);
    });
    var pr = draftPanel.getBoundingClientRect();
    return measureLines(draftText).map(function (ln) {
      var s = document.createElement('span');
      s.className = 'strike-line';
      s.style.left = ln.left - pr.left + 'px';
      s.style.top = ln.top - pr.top + ln.height / 2 - 1 + 'px';
      s.style.width = ln.right - ln.left + 'px';
      draftPanel.appendChild(s);
      return s;
    });
  }

  /* ------------------------------------------------------------- pricing */
  var billing = document.querySelector('[data-billing]');
  var priceEls = document.querySelectorAll('[data-price]');
  var perEls = document.querySelectorAll('[data-per]');

  function animatePrice(el, text) {
    if (!animate) {
      el.textContent = text;
      return;
    }
    window.gsap.to(el, {
      autoAlpha: 0,
      y: -10,
      duration: 0.16,
      ease: 'power2.in',
      overwrite: true,
      onComplete: function () {
        el.textContent = text;
        window.gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out' });
      },
    });
  }

  function setPeriod(period) {
    if (billing) {
      Array.prototype.forEach.call(billing.querySelectorAll('.billing__option'), function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-period') === period));
      });
    }
    Array.prototype.forEach.call(priceEls, function (el) {
      var value = el.getAttribute('data-' + period);
      if (value !== null) animatePrice(el, '$' + value);
    });
    Array.prototype.forEach.call(perEls, function (el) {
      el.textContent = period === 'yearly' ? '/ mo, billed yearly' : '/ month';
    });
  }

  if (billing) {
    Array.prototype.forEach.call(billing.querySelectorAll('.billing__option'), function (btn) {
      btn.addEventListener('click', function () {
        setPeriod(btn.getAttribute('data-period'));
      });
    });
  }

  /* ----------------------------------------------------------------- FAQ */
  Array.prototype.forEach.call(document.querySelectorAll('.faq__button'), function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (item) item.classList.toggle('is-open', !open);
    });
  });

  /* -------------------------------------------------------- GSAP motion */
  if (animate) {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;

    /* ---------------------------------------------------- hero entrance
       One staged 0–1.4s sequence: nav fades down, the pill settles, the two
       headline lines lift out of their own masks, the marker highlight wipes
       across "yourself.", the buttons and lead follow, and the editor card
       arrives tilted — set down, not popped in. Each element is armed with
       its hidden start state inline before the first paint of the sequence —
       the pre-head 'js' gate in index.html covers the window before this
       script runs. */
    var heroNav = document.querySelector('[data-hero="nav"]');
    var heroPill = document.querySelector('[data-hero="pill"]');
    var heroLines = gsap.utils.toArray('[data-hero="line"]');
    var heroSweep = document.querySelector('.hero__sweep');
    var heroLead = document.querySelector('[data-hero="lead"]');
    var heroCta = document.querySelector('[data-hero="cta"]');
    var heroDemo = document.querySelector('[data-hero="demo"]');

    if (heroLines.length || heroDemo) {
      var hero = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (heroNav) {
        gsap.set(heroNav, { autoAlpha: 0, y: -14 });
        hero.to(heroNav, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0);
      }

      if (heroPill) {
        gsap.set(heroPill, { autoAlpha: 0, y: 16 });
        hero.to(heroPill, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.08);
      }

      /* Line-by-line mask reveal. The lift distance is measured per line, so
         a line never travels further than its own mask height. */
      heroLines.forEach(function (line, i) {
        gsap.set(line, { yPercent: 118 });
        hero.to(
          line,
          { yPercent: 0, duration: 0.95, ease: 'expo.out' },
          0.24 + i * 0.14
        );
      });

      if (heroSweep) {
        gsap.set(heroSweep, { clipPath: 'inset(0% 100% 0% 0%)' });
        hero.to(
          heroSweep,
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power2.inOut' },
          0.88
        );
      }

      if (heroLead) {
        gsap.set(heroLead, { autoAlpha: 0, y: 22 });
        hero.to(heroLead, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.58);
      }

      if (heroCta) {
        gsap.set(heroCta, { autoAlpha: 0, y: 22 });
        hero.to(heroCta, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.68);
      }

      /* The card arrives with depth: tilted away, slightly askew and further
         off, then settling flat — the perspective on .hero__demo does the
         projection, so this is transform-only. */
      if (heroDemo) {
        gsap.set(heroDemo, {
          autoAlpha: 0,
          y: 44,
          scale: 0.985,
          rotationX: 10,
          rotationZ: -1.1,
          transformOrigin: '50% 85%',
        });
        hero.to(
          heroDemo,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            rotationZ: 0,
            duration: 1.15,
            ease: 'power3.out',
          },
          0.3
        );
      }

      /* Nothing below the fold waits on this timeline: reveals keep their
         own scroll triggers, and the type-on starts on its own delay. */
      hero.eventCallback('onComplete', function () {
        gsap.set([heroNav, heroPill, heroLead, heroCta, heroDemo].concat(heroLines), {
          clearProps: 'transform,opacity,visibility',
        });
        if (heroSweep) gsap.set(heroSweep, { clearProps: 'clipPath' });
      });
    }

    /* ------------------------------------------------- atmosphere drift
       The three fields drift slowly on transform only, each at its own pace.
       The tweens pause when the layer is off-screen (IntersectionObserver —
       a fixed layer is normally always on-screen, but the contract holds if
       that ever changes) and whenever the tab is hidden. */
    var drifts = [];
    gsap.utils.toArray('.atmos__field').forEach(function (field, i) {
      var moves = [
        { x: '5%', y: '6.5%', scale: 1.08 },
        { x: '-5.5%', y: '4%', scale: 0.95 },
        { x: '4%', y: '-5%', scale: 1.06 },
      ];
      var durations = [26, 32, 38];
      drifts.push(
        gsap.to(field, {
          x: moves[i].x,
          y: moves[i].y,
          scale: moves[i].scale,
          duration: durations[i],
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      );
    });
    var atmosEl = document.querySelector('.atmos');
    var atmosInView = true;
    var syncDrift = function () {
      var play = atmosInView && !document.hidden;
      drifts.forEach(function (t) {
        if (play) t.play();
        else t.pause();
      });
    };
    if (atmosEl && 'IntersectionObserver' in window) {
      new window.IntersectionObserver(function (entries) {
        atmosInView = entries[0].isIntersecting;
        syncDrift();
      }).observe(atmosEl);
    }
    document.addEventListener('visibilitychange', syncDrift);

    /* --------------------------------------------------- floating chips
       Every [data-float] chip drifts on its own slow, out-of-phase loop
       (period comes from the attribute), paused while the hero is off-screen. */
    var floats = [];
    gsap.utils.toArray('[data-float]').forEach(function (chip) {
      var period = parseFloat(chip.getAttribute('data-float')) || 4.5;
      floats.push(
        gsap.to(chip, {
          y: -5,
          duration: period,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 1.2,
        })
      );
    });
    if (ST) {
      ST.create({
        trigger: '.hero',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: function (self) {
          floats.forEach(function (t) {
            if (self.isActive) t.play();
            else t.pause();
          });
        },
      });
    }

    /* --------------------------------------------------- parallax layers
       The lime glow behind the mockup drifts against the scroll, and the
       suggestion card counter-moves slightly — two layers, two rates. */
    if (ST) {
      gsap.to('.hero__glow', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      gsap.fromTo(
        '.app__suggest',
        { y: -7 },
        {
          y: 9,
          ease: 'none',
          scrollTrigger: { trigger: '.hero__demo', start: 'top bottom', end: 'bottom top', scrub: 0.9 },
        }
      );
    }

    /* ------------------------------------------- bento cards build in
       The grid enters as one gesture — cells lift in with a stagger that
       follows document order, so the mosaic assembles instead of popping.
       (The bento cells carry no data-reveal: this stagger is their only
       entrance, so nothing animates twice.) */
    var bentoCells = gsap.utils.toArray('.bento__cell');
    if (bentoCells.length && ST) {
      gsap.set(bentoCells, { autoAlpha: 0, y: 34, scale: 0.975 });
      gsap.to(bentoCells, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.09,
        scrollTrigger: { trigger: '.bento', start: 'top 82%', once: true },
        onComplete: function () {
          gsap.set(bentoCells, { clearProps: 'transform,opacity,visibility' });
        },
      });
    }

    /* ---------------------------------------------- connector wire draw
       The lime thread between two bento cards draws itself (stroke-dashoffset)
       as the grid scrolls through the viewport, scrubbed to scroll position. */
    var wire = document.querySelector('[data-wire]');
    if (wire && ST && typeof wire.getTotalLength === 'function') {
      var wireLen = wire.getTotalLength();
      gsap.set(wire, { strokeDasharray: wireLen, strokeDashoffset: wireLen });
      gsap.to(wire, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.bento', start: 'top 78%', end: 'center 48%', scrub: 0.7 },
      });
    }

    /* --------------------------------------------- strike + rewrite run
       Strikes land first, staggered per line; the rewrite types in right
       after. Triggered once, when the panel enters the viewport. */
    if (genLine && draftPanel && draftText && ST) {
      ST.create({
        trigger: '.demo__panel',
        start: 'top 75%',
        once: true,
        onEnter: function () {
          strikeFired = true;
          var strikes = buildStrikeLines();
          if (!strikes.length) {
            typeText(genLine, genText, { speed: 20 });
            return;
          }
          gsap.set(strikes, { transformOrigin: 'left center', scaleX: 0 });
          gsap.to(strikes, {
            scaleX: 1,
            duration: 0.45,
            stagger: 0.16,
            ease: 'power2.inOut',
            onComplete: function () {
              typeText(genLine, genText, { speed: 20 });
            },
          });
        },
      });
    }

    /* ------------------------------------------------------ stat counters
       Digits count up once, in place (tabular figures keep the row still).
       The HTML already shows the final numbers, so no-JS and reduced motion
       just keep them. */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (!ST || !isFinite(target)) return;
      var obj = { v: 0 };
      el.textContent = '0';
      ST.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = Math.round(obj.v).toLocaleString('en-US');
            },
            onComplete: function () {
              el.textContent = Math.round(target).toLocaleString('en-US');
            },
          });
        },
      });
    });

    /* ---------------------------------------------- pricing cards rise in
       The three plans rise with a stagger and a hint of perspective — the
       featured card lands last, so the eye ends on the offer. */
    var plans = gsap.utils.toArray('.plan');
    if (plans.length && ST) {
      gsap.set(plans, {
        autoAlpha: 0,
        y: 44,
        rotationX: 5,
        transformOrigin: '50% 100%',
        transformPerspective: 900,
      });
      gsap.to(plans, {
        autoAlpha: 1,
        y: 0,
        rotationX: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.plans', start: 'top 84%', once: true },
        onComplete: function () {
          gsap.set(plans, { clearProps: 'transform,opacity,visibility' });
        },
      });
    }

    /* Scroll reveals */
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: ST ? { trigger: el, start: 'top 88%', once: true } : undefined,
          onComplete: function () {
            gsap.set(el, { clearProps: 'transform,opacity,visibility' });
          },
        }
      );
    });

    /* GSAP now owns the hidden start state as inline styles, so the CSS gate
       class can be dropped. Content was only ever hidden by that gate — never
       by plain CSS — and the gate has a 1.5s failsafe in the <head>. */
    document.documentElement.classList.add('reveal-armed');
    document.documentElement.classList.remove('js');

    /* Subtle pointer tilt on the hero mockup */
    var tilt = document.querySelector('[data-tilt]');
    var demoWrap = tilt ? tilt.closest('.hero__demo') : null;
    if (tilt && demoWrap && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.5, ease: 'power3' });
      gsap.set(tilt, { transformPerspective: 1000, transformOrigin: 'center' });
      demoWrap.addEventListener('pointermove', function (event) {
        var rect = demoWrap.getBoundingClientRect();
        if (!rect.width) return;
        var nx = (event.clientX - rect.left) / rect.width - 0.5;
        var ny = (event.clientY - rect.top) / rect.height - 0.5;
        ry(nx * 8);
        rx(ny * -8);
      });
      demoWrap.addEventListener('pointerleave', function () {
        rx(0);
        ry(0);
      });
    }

    /* Magnetic pull on the primary CTAs: the button leans toward the pointer
       and springs back on leave. Fine-pointer devices only. */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      gsap.utils.toArray('[data-magnetic]').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3' });
        btn.addEventListener('pointermove', function (event) {
          var r = btn.getBoundingClientRect();
          xTo((event.clientX - (r.left + r.width / 2)) * 0.28);
          yTo((event.clientY - (r.top + r.height / 2)) * 0.42);
        });
        btn.addEventListener('pointerleave', function () {
          xTo(0);
          yTo(0);
        });
      });
    }

    /* Re-measure once webfonts have settled (no layout shift from swap), and
       re-anchor the strike lines if the panel already fired. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (ST) ST.refresh();
        if (strikeFired) {
          var rebuilt = buildStrikeLines();
          gsap.set(rebuilt, { transformOrigin: 'left center', scaleX: 1 });
        }
      });
    }
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (strikeFired) {
          var rebuilt = buildStrikeLines();
          gsap.set(rebuilt, { transformOrigin: 'left center', scaleX: 1 });
        }
      }, 150);
    });
    window.addEventListener('load', function () {
      if (ST) ST.refresh();
    });
  } else {
    /* No motion: nothing may stay hidden. */
    document.documentElement.classList.remove('js');
  }
})();
