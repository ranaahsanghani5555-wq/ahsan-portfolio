/* ==========================================================================
   Cadenza — script.js
   Plain JS. GSAP + ScrollTrigger load from a CDN; if they are blocked (offline
   or a sandboxed preview), the page still works: the board shows its final,
   readable state and every control (menu, tabs, billing, FAQ) works without
   animation. All motion is transform/opacity only and is disabled under
   prefers-reduced-motion.

   The signature pipeline board pins on desktop (min-width: 901px) with motion
   allowed, and scrubs four sample deals through Lead → Qualified → Proposal →
   Won while the open/won totals and the column counts move with them. Under
   900px, or for reduced-motion visitors, it never pins — the CSS shows the
   final state and a one-line caption per column.
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

  /* ------------------------------------------------------------ formatting */
  function group(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function money(n) {
    return '$' + group(n);
  }

  /* ------------------------------------------------------------------ nav */
  var nav = document.querySelector('[data-nav]');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
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
      if (window.innerWidth > 1000) setMenu(false);
    });
  }

  /* ----------------------------------------------------------------- tabs */
  var tabsRoot = document.querySelector('[data-tabs]');
  if (tabsRoot) {
    var tablist = tabsRoot.querySelector('[data-tablist]');
    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[data-tab]'));

    function panelFor(tab) {
      var id = tab.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    }

    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = panelFor(t);
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectTab(tab, false);
      });
    });

    if (tablist) {
      tablist.addEventListener('keydown', function (event) {
        var current = tabs.indexOf(document.activeElement);
        if (current < 0) return;
        var next = null;
        if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        if (next !== null) {
          event.preventDefault();
          selectTab(tabs[next], true);
        }
      });
    }
  }

  /* ------------------------------------------------------------- pricing */
  var billing = document.querySelector('[data-billing]');
  var priceEls = document.querySelectorAll('[data-price]');
  var perEls = document.querySelectorAll('[data-per]');

  function setPriceText(el, text) {
    if (!animate) {
      el.textContent = text;
      return;
    }
    window.gsap.to(el, {
      autoAlpha: 0,
      y: -8,
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
      if (value !== null) setPriceText(el, '$' + value);
    });
    Array.prototype.forEach.call(perEls, function (el) {
      el.textContent = period === 'yearly' ? '/ seat / month, billed yearly' : '/ seat / month';
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

  /* -------------------------------------------------- signature pipeline */
  var pipeline = document.querySelector('[data-pipeline]');
  var pin = pipeline ? pipeline.querySelector('[data-pin]') : null;
  var board = pipeline ? pipeline.querySelector('[data-board]') : null;

  var STAGES = ['lead', 'qualified', 'proposal', 'won'];
  var DEALS = ['a', 'b', 'c', 'd'];
  var AMOUNTS = { a: 48000, b: 120000, c: 36500, d: 210000 };

  /* Each beat is a full pipeline state: which stage each deal sits in.
     Beat 3 is the resting state the CSS also shows without JS. */
  var BEATS = [
    { a: 0, b: 0, c: 0, d: 0 },
    { a: 1, b: 1, c: 1, d: 1 },
    { a: 2, b: 2, c: 2, d: 1 },
    { a: 3, b: 3, c: 2, d: 1 },
  ];

  var cardEls = {};
  var emptyEls = {};
  var numEls = {};

  if (board) {
    DEALS.forEach(function (deal) {
      cardEls[deal] = {};
      STAGES.forEach(function (stage) {
        cardEls[deal][stage] = board.querySelector(
          '[data-deal="' + deal + '"][data-stage="' + stage + '"]'
        );
      });
    });

    STAGES.forEach(function (stage) {
      var body = board.querySelector('[data-body="' + stage + '"]');
      emptyEls[stage] = body ? body.querySelector('.board__empty') : null;
    });

    function metric(sel) {
      return board.querySelector(sel);
    }
    numEls = {
      open: { el: metric('[data-metric="open"]'), money: true },
      won: { el: metric('[data-metric="won"]'), money: true },
      total: { el: metric('[data-metric="total"]'), money: true },
      countLead: { el: metric('[data-count="lead"]'), money: false },
      countQualified: { el: metric('[data-count="qualified"]'), money: false },
      countProposal: { el: metric('[data-count="proposal"]'), money: false },
      countWon: { el: metric('[data-count="won"]'), money: false },
      sumLead: { el: metric('[data-colsum="lead"]'), money: true },
      sumQualified: { el: metric('[data-colsum="qualified"]'), money: true },
      sumProposal: { el: metric('[data-colsum="proposal"]'), money: true },
      sumWon: { el: metric('[data-colsum="won"]'), money: true },
    };
  }

  /* Turn a beat into counts, per-column sums and the running totals. */
  function derive(state) {
    var counts = { lead: 0, qualified: 0, proposal: 0, won: 0 };
    var sums = { lead: 0, qualified: 0, proposal: 0, won: 0 };
    DEALS.forEach(function (deal) {
      var stage = STAGES[state[deal]];
      counts[stage] += 1;
      sums[stage] += AMOUNTS[deal];
    });
    var open = sums.lead + sums.qualified + sums.proposal;
    var won = sums.won;
    return { counts: counts, sums: sums, open: open, won: won, total: open + won };
  }

  function applyNumbers(data) {
    Object.keys(numEls).forEach(function (key) {
      var cfg = numEls[key];
      if (!cfg.el) return;
      var value;
      if (key === 'open') value = data.open;
      else if (key === 'won') value = data.won;
      else if (key === 'total') value = data.total;
      else if (key.indexOf('count') === 0) {
        value = data.counts[key.slice(5).toLowerCase()];
      } else {
        value = data.sums[key.slice(3).toLowerCase()];
      }
      cfg.el.textContent = cfg.money ? money(value) : String(value);
    });
  }

  if (animate && pipeline && pin && board && typeof window.gsap.matchMedia === 'function') {
    var gsap = window.gsap;
    var mm = gsap.matchMedia();

    mm.add('(min-width: 901px)', function () {
      pipeline.classList.add('is-animated');

      var beatZero = derive(BEATS[0]);
      var finalBeat = derive(BEATS[BEATS.length - 1]);

      /* The deal that advances on every beat is the one that visibly walks the
         board: it moves sideways (in from the previous column, out toward the
         next) instead of fading up. Every other deal keeps the vertical
         cross-fade. */
      var TRAVELLER = 'a';
      var TRAVEL = 34;

      /* Resting state for the animation: every deal in Lead. */
      DEALS.forEach(function (deal) {
        var isTraveller = deal === TRAVELLER;
        STAGES.forEach(function (stage, index) {
          var el = cardEls[deal][stage];
          if (!el) return;
          var visible = BEATS[0][deal] === index;
          if (isTraveller) {
            gsap.set(el, { autoAlpha: visible ? 1 : 0, x: visible ? 0 : -TRAVEL, y: 0 });
          } else {
            gsap.set(el, { autoAlpha: visible ? 1 : 0, y: visible ? 0 : 14 });
          }
        });
      });

      /* Empties take part in the scrub, so give them a box and fade them. */
      STAGES.forEach(function (stage) {
        var empty = emptyEls[stage];
        if (!empty) return;
        empty.style.display = 'block';
        gsap.set(empty, { autoAlpha: beatZero.counts[stage] === 0 ? 1 : 0 });
      });

      applyNumbers(beatZero);

      /* The trail — a faint accent line drawn across the board as the deal
         walks. Created here (desktop + motion only) so reduced-motion and
         no-JS visitors never see it. Transform only. */
      var grid = board.querySelector('.board__grid');
      var trail = document.createElement('span');
      trail.className = 'board__trail';
      trail.setAttribute('aria-hidden', 'true');
      var placeTrail;
      if (grid) {
        grid.appendChild(trail);
        placeTrail = function () {
          var anchor = cardEls[TRAVELLER][STAGES[0]];
          if (!anchor) return;
          var gr = grid.getBoundingClientRect();
          var ar = anchor.getBoundingClientRect();
          trail.style.top = Math.round(ar.top - gr.top + ar.height / 2) + 'px';
        };
        placeTrail();
        window.ScrollTrigger.addEventListener('refresh', placeTrail);
      }

      var tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: '+=' + Math.round(window.innerHeight * 2.2),
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /* One unit of timeline per beat. Deals cross-fade in and out; the
         totals and per-column figures count across the same beat. */
      for (var k = 1; k < BEATS.length; k += 1) {
        (function (from, to, at) {
          var dur = 1;
          DEALS.forEach(function (deal) {
            if (from[deal] === to[deal]) return;
            var isTraveller = deal === TRAVELLER;
            var outEl = cardEls[deal][STAGES[from[deal]]];
            var inEl = cardEls[deal][STAGES[to[deal]]];
            if (isTraveller) {
              if (outEl) tl.to(outEl, { autoAlpha: 0, x: TRAVEL, duration: dur * 0.5 }, at);
              if (inEl) {
                tl.fromTo(
                  inEl,
                  { autoAlpha: 0, x: -TRAVEL },
                  { autoAlpha: 1, x: 0, duration: dur * 0.5 },
                  at + dur * 0.4
                );
              }
            } else {
              if (outEl) tl.to(outEl, { autoAlpha: 0, y: -12, duration: dur * 0.5 }, at);
              if (inEl) {
                tl.fromTo(
                  inEl,
                  { autoAlpha: 0, y: 14 },
                  { autoAlpha: 1, y: 0, duration: dur * 0.5 },
                  at + dur * 0.4
                );
              }
            }
          });

          var dFrom = derive(from);
          var dTo = derive(to);

          var numbers = [
            ['open', dFrom.open, dTo.open],
            ['won', dFrom.won, dTo.won],
            ['total', dFrom.total, dTo.total],
            ['countLead', dFrom.counts.lead, dTo.counts.lead],
            ['countQualified', dFrom.counts.qualified, dTo.counts.qualified],
            ['countProposal', dFrom.counts.proposal, dTo.counts.proposal],
            ['countWon', dFrom.counts.won, dTo.counts.won],
            ['sumLead', dFrom.sums.lead, dTo.sums.lead],
            ['sumQualified', dFrom.sums.qualified, dTo.sums.qualified],
            ['sumProposal', dFrom.sums.proposal, dTo.sums.proposal],
            ['sumWon', dFrom.sums.won, dTo.sums.won],
          ];

          numbers.forEach(function (row) {
            if (row[1] === row[2]) return;
            var cfg = numEls[row[0]];
            if (!cfg || !cfg.el) return;
            var proxy = { v: row[1] };
            tl.to(
              proxy,
              {
                v: row[2],
                duration: dur,
                onUpdate: function () {
                  cfg.el.textContent = cfg.money ? money(proxy.v) : String(Math.round(proxy.v));
                },
              },
              at
            );
          });

          /* Show or hide a column's empty message as its count crosses zero. */
          STAGES.forEach(function (stage) {
            var empty = emptyEls[stage];
            if (!empty) return;
            var wasEmpty = dFrom.counts[stage] === 0;
            var isEmpty = dTo.counts[stage] === 0;
            if (wasEmpty === isEmpty) return;
            tl.to(empty, { autoAlpha: isEmpty ? 1 : 0, duration: dur * 0.4 }, at + dur * 0.5);
          });
        })(BEATS[k - 1], BEATS[k], k - 1);
      }

      if (trail) {
        tl.to(trail, { scaleX: 1, duration: BEATS.length - 1, ease: 'none' }, 0);
      }

      /* Cleanup when we drop below 901px: hand the board back to CSS and the
         final numbers, with no inline styles left behind. */
      return function () {
        pipeline.classList.remove('is-animated');
        if (placeTrail) window.ScrollTrigger.removeEventListener('refresh', placeTrail);
        if (trail && trail.parentNode) trail.parentNode.removeChild(trail);
        DEALS.forEach(function (deal) {
          STAGES.forEach(function (stage) {
            var el = cardEls[deal][stage];
            if (!el) return;
            el.style.visibility = '';
            el.style.opacity = '';
            el.style.transform = '';
          });
        });
        STAGES.forEach(function (stage) {
          if (emptyEls[stage]) emptyEls[stage].style.display = '';
        });
        applyNumbers(finalBeat);
      };
    });
  }

  /* -------------------------------------------------------- GSAP motion */
  if (animate) {
    var g = window.gsap;
    var ST = window.ScrollTrigger;

    /* Scroll reveals */
    g.utils.toArray('[data-reveal]').forEach(function (el) {
      g.fromTo(
        el,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: ST ? { trigger: el, start: 'top 88%', once: true } : undefined,
          onComplete: function () {
            g.set(el, { clearProps: 'transform,opacity,visibility' });
          },
        }
      );
    });

    /* GSAP now owns the hidden start state as inline styles, so the CSS gate
       class can be dropped. Content was only ever hidden by that gate — never
       by plain CSS — and the gate has a 1.5s failsafe in the <head>. */
    document.documentElement.classList.add('reveal-armed');
    document.documentElement.classList.remove('js');

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (ST) ST.refresh();
      });
    }
    window.addEventListener('load', function () {
      if (ST) ST.refresh();
    });
  } else {
    /* No animation: make sure every revealed element is at its final state. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-reveal]'), function (el) {
      el.style.opacity = '';
      el.style.transform = '';
    });
    /* No motion: nothing may stay hidden. */
    document.documentElement.classList.remove('js');
  }
})();
