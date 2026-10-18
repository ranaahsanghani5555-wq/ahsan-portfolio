/* ==========================================================================
   Hisaab — script.js
   Plain JS. GSAP + ScrollTrigger load from a CDN; if they are blocked the page
   still works: content is visible and every control (menu, FAQ, pricing,
   calculator, flip card) works without animation. All motion is transform/
   opacity only and is disabled under prefers-reduced-motion.
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
  function pkr(n) {
    return 'Rs ' + group(n);
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

  /* ------------------------------------------------------------- pricing */
  var billing = document.querySelector('[data-billing]');
  var priceEls = document.querySelectorAll('[data-price]');
  var perEls = document.querySelectorAll('[data-per]');

  function setText(el, text) {
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
      if (value !== null) setText(el, pkr(Number(value)));
    });
    Array.prototype.forEach.call(perEls, function (el) {
      el.textContent = period === 'yearly' ? '/ month, billed yearly' : '/ month';
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

  /* -------------------------------------------------- flip card (tap/key) */
  Array.prototype.forEach.call(document.querySelectorAll('[data-flip]'), function (card) {
    function toggle() {
      var flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    }
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        toggle();
      }
    });
  });

  /* ----------------------------------------------------------- calculator */
  var earnings = document.getElementById('calc-earnings');
  var rate = document.getElementById('calc-rate');
  var earningsOut = document.getElementById('calc-earnings-out');
  var deductionOut = document.getElementById('calc-deduction');
  var takehomeOut = document.getElementById('calc-takehome');
  var assumption = document.getElementById('calc-assumption');

  function clampRate(raw) {
    var n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    if (!isFinite(n) || n < 0) n = 0;
    if (n > 30) n = 30;
    return n;
  }

  function updateCalc() {
    if (!earnings) return;
    var earn = Number(earnings.value) || 0;
    var pct = rate ? clampRate(rate.value) : 0;
    var deduction = Math.round((earn * pct) / 100);
    var takeHome = earn - deduction;

    if (earningsOut) earningsOut.textContent = pkr(earn);
    if (deductionOut) deductionOut.textContent = pkr(deduction);
    if (takehomeOut) takehomeOut.textContent = pkr(takeHome);
    if (assumption) {
      assumption.innerHTML =
        'Assumes a flat <b>' + (pct % 1 === 0 ? pct : pct.toFixed(1)) + '%</b> illustrative rate on <b>' +
        pkr(earn) + '</b>. Estimate, not tax advice.';
    }
    earnings.setAttribute('aria-valuetext', pkr(earn));
  }

  if (earnings) {
    earnings.addEventListener('input', updateCalc);
    if (rate) {
      rate.addEventListener('input', updateCalc);
      rate.addEventListener('change', function () {
        var v = clampRate(rate.value);
        rate.value = String(v);
        updateCalc();
      });
      rate.addEventListener('blur', function () {
        var v = clampRate(rate.value);
        rate.value = String(v);
        updateCalc();
      });
    }
    updateCalc();
  }

  /* ------------------------------------------- "the ledger settles" motion
     When a value is committed, the deduction lifts off its figure and travels
     down to the net figure, then settles into it. Transform + opacity only;
     the token is absolutely positioned (CLS 0) and only ever runs with motion
     allowed and GSAP present. */
  var token = document.querySelector('[data-calc-token]');
  var tokenPanel = token ? token.closest('.calc__panel') : null;
  var netCard = document.querySelector('.calc__result--net');
  var settleTl = null;
  var receivedTimer = null;

  function settleDeduction() {
    if (!animate || !window.gsap || !token || !tokenPanel || !deductionOut || !takehomeOut) return;
    var pr = tokenPanel.getBoundingClientRect();
    var from = deductionOut.getBoundingClientRect();
    var to = takehomeOut.getBoundingClientRect();
    var fx = from.left + from.width / 2 - pr.left;
    var fy = from.top + from.height / 2 - pr.top;
    var tx = to.left + to.width / 2 - pr.left;
    var ty = to.top + to.height / 2 - pr.top;

    token.textContent = '\u2212 ' + deductionOut.textContent;

    if (settleTl) settleTl.kill();
    settleTl = window.gsap.timeline({
      onComplete: function () {
        window.gsap.set(token, { clearProps: 'transform' });
      },
    });
    settleTl
      .set(token, { xPercent: -50, yPercent: -50, x: fx, y: fy, opacity: 0 })
      .to(token, { opacity: 1, duration: 0.16, ease: 'power2.out' })
      .to(token, { x: tx, y: ty, duration: 0.5, ease: 'power2.inOut' }, '+=0.04')
      .to(token, { opacity: 0, duration: 0.24 }, '-=0.12');

    if (netCard) {
      netCard.classList.add('is-received');
      clearTimeout(receivedTimer);
      receivedTimer = setTimeout(function () {
        netCard.classList.remove('is-received');
      }, 620);
    }
  }

  if (animate && tokenPanel) {
    if (earnings) earnings.addEventListener('change', settleDeduction);
    if (rate) rate.addEventListener('change', settleDeduction);

    /* Show the moment once when the calculator first scrolls into view. */
    if ('IntersectionObserver' in window) {
      var settleObserver = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            settleObserver.disconnect();
            window.setTimeout(settleDeduction, 320);
          }
        },
        { threshold: 0.35 }
      );
      settleObserver.observe(tokenPanel);
    }
  }

  /* ------------------------------------------------------------ count-up */
  var counters = document.querySelectorAll('[data-count]');

  function formatCount(el) {
    var value = Number(el.getAttribute('data-count')) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var mode = el.getAttribute('data-format');
    var body = mode === 'pkr' ? group(value) : group(value);
    return prefix + body + suffix;
  }

  function runCount(el) {
    var target = Number(el.getAttribute('data-count')) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';

    if (!animate) {
      el.textContent = formatCount(el);
      return;
    }

    var obj = { v: 0 };
    window.gsap.to(obj, {
      v: target,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: function () {
        el.textContent = prefix + group(obj.v) + suffix;
      },
      onComplete: function () {
        el.textContent = prefix + group(target) + suffix;
      },
    });
  }

  /* -------------------------------------------------------- GSAP motion */
  if (animate) {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;

    /* Scroll reveals */
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 24 },
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

    /* Hero entrance: the hero sits above the fold, so it plays on load —
       only the small proof line below the CTA was wired to reveal, which
       left the first viewport looking static. Same vocabulary as the
       reveals: autoAlpha 0->1, y 24->0, 0.8s power3.out, gentle stagger. */
    var heroIntro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroIntro
      .fromTo(
        '.pill',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8 }
      )
      .fromTo(
        '.hero__title',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8 },
        '-=0.55'
      )
      .fromTo(
        '.hero__lead, .hero__cta',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 },
        '-=0.55'
      );

    /* GSAP now owns the hidden start state as inline styles, so the CSS gate
       class can be dropped. Content was only ever hidden by that gate — never
       by plain CSS — and the gate has a 1.5s failsafe in the <head>. */
    document.documentElement.classList.add('reveal-armed');
    document.documentElement.classList.remove('js');

    /* Count-up stats when the band scrolls into view */
    if (ST) {
      ST.create({
        trigger: '[data-stats]',
        start: 'top 88%',
        once: true,
        onEnter: function () {
          Array.prototype.forEach.call(counters, runCount);
        },
      });
    } else {
      Array.prototype.forEach.call(counters, runCount);
    }

    /* Subtle tilt on the hero card stack */
    var tilt = document.querySelector('[data-tilt]');
    var tiltWrap = tilt ? tilt.closest('.hero__visual') : null;
    if (tilt && tiltWrap && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.6, ease: 'power3' });
      var ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.6, ease: 'power3' });
      gsap.set(tilt, { transformPerspective: 1100, transformOrigin: 'center' });
      tiltWrap.addEventListener('pointermove', function (event) {
        var rect = tiltWrap.getBoundingClientRect();
        if (!rect.width) return;
        var nx = (event.clientX - rect.left) / rect.width - 0.5;
        var ny = (event.clientY - rect.top) / rect.height - 0.5;
        ry(nx * 7);
        rx(ny * -6);
      });
      tiltWrap.addEventListener('pointerleave', function () {
        rx(0);
        ry(0);
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (ST) ST.refresh();
      });
    }
    window.addEventListener('load', function () {
      if (ST) ST.refresh();
    });
  } else {
    /* No animation: make sure every revealed element and counter is final. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-reveal]'), function (el) {
      el.style.opacity = '';
      el.style.transform = '';
    });
    Array.prototype.forEach.call(counters, function (el) {
      el.textContent = formatCount(el);
    });
    /* No motion: nothing may stay hidden. */
    document.documentElement.classList.remove('js');
  }
})();
