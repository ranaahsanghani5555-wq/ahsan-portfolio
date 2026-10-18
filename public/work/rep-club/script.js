/* ==========================================================================
   Rep Club — script.js
   Plain JS. Handles: toast (app buttons), mobile menu, the live-rendered
   phone mockup (pauses off-screen, static under reduceMotiond motion), the
   "Build my week" generator (+ aria-live announcement + focus management),
   the price toggle, and GSAP reveal animation (only when it can run).
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = !(window.__motionLight ? window.__motionLight() : true); // Light animations always run
  var heavyMotion = window.__motionOK ? window.__motionOK() : true; // Heavy features gate

  /* ---------------------------------------------------------------- toast */
  var toast = document.querySelector('[data-toast]');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  document.querySelectorAll('[data-app]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast('Concept page: app not available');
    });
  });

  /* --------------------------------------------------------- mobile menu */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('click', function () {
        setMenu(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ----------------------------------------------------- phone mockup
     One rAF loop derives every element of the screen from a single
     "elapsed play-time" accumulator. Hidden (scrolled off) or tab-hidden
     browsers simply stop advancing the accumulator, so the loop resumes
     exactly where it left off. Reduced motion renders one static state. */
  var phone = document.querySelector('[data-phone]');
  var SET_MS = 3600; // one "round": reps (1.8s) + ring (0.5s) + card (1.3s)
  var REP_MS = 150;
  var CARD_AT = 2300;
  var STATIC_T = 2 * SET_MS + 2600; // round 3, card showing

  function phoneEls() {
    return {
      rep: document.querySelector('[data-ph-rep]'),
      set: document.querySelector('[data-ph-set]'),
      ring: document.querySelector('[data-ph-ring]'),
      timer: document.querySelector('[data-ph-timer]'),
      card: document.querySelector('[data-ph-card]'),
      cardsub: document.querySelector('[data-ph-cardsub]'),
      dots: document.querySelector('[data-ph-dots]'),
      pulse: document.querySelector('[data-ph-pulse]'),
    };
  }

  /* One expanding ring each time a set completes. Re-triggered by class
     toggle + reflow; the element is absolutely positioned so it costs no
     layout (CLS 0). Reduced motion never reaches here (loop is static). */
  var pulseTimer = null;
  function firePulse(el) {
    if (!el) return;
    el.classList.remove('is-pulsing');
    void el.offsetWidth;
    el.classList.add('is-pulsing');
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(function () {
      el.classList.remove('is-pulsing');
    }, 950);
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function padRep(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function renderPhone(t, els) {
    var round = Math.floor(t / SET_MS) % 5;
    var set = round + 1; // 1..5
    var local = t % SET_MS;
    var rep = Math.min(Math.floor(local / REP_MS) + 1, 12);
    var ring = Math.min(((rep - 1) / 11) * 100, 100);

    if (els.set) els.set.textContent = 'SET ' + set + ' OF 5';
    if (els.rep) els.rep.textContent = padRep(rep);
    if (els.ring) els.ring.style.strokeDashoffset = 100 - ring;

    var fakeSecs = 22 * 60 + Math.floor(t / 350); // a wall clock that races
    var mm = Math.floor(fakeSecs / 60);
    var ss = fakeSecs % 60;
    if (els.timer) els.timer.textContent = mm + ':' + pad2(ss);

    var cardOn = local >= CARD_AT;
    if (els.card) els.card.classList.toggle('is-on', cardOn);
    if (cardOn && els.cardsub) {
      els.cardsub.textContent =
        set === 5 ? 'Full session done. Nice.' : 'Take a breath, then round ' + (set + 1) + '.';
    }

    if (els.dots) {
      var dots = els.dots.querySelectorAll('i');
      dots.forEach(function (d, i) {
        d.classList.toggle('is-on', i === round);
      });
    }
  }

  if (phone) {
    var els = phoneEls();
    if (reduceMotion) {
      renderPhone(STATIC_T, els);
    } else {
      var running = false;
      var acc = 900;
      var last = null;
      var raf = null;
      var prevRep = -1;
      var prevRound = null;

      function step(ts) {
        if (!running || document.hidden) {
          last = null;
          return;
        }
        if (last === null) last = ts;
        acc += ts - last;
        last = ts;

        var round = Math.floor(acc / SET_MS) % 5;
        if (prevRound === null) {
          prevRound = round;
        } else if (round !== prevRound) {
          prevRound = round;
          firePulse(els.pulse);
        }

        var rep = Math.min(Math.floor((acc % SET_MS) / REP_MS) + 1, 12);
        if (rep !== prevRep) {
          prevRep = rep;
          if (els.rep) {
            els.rep.classList.remove('is-pop');
            // force reflow so the class re-triggers the transform
            void els.rep.offsetWidth;
            els.rep.classList.add('is-pop');
            setTimeout(function () {
              if (els.rep) els.rep.classList.remove('is-pop');
            }, 130);
          }
        }
        renderPhone(acc, els);
        raf = requestAnimationFrame(step);
      }

      function start() {
        if (!running) {
          running = true;
          raf = requestAnimationFrame(step);
        }
      }

      function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        last = null;
      }

      renderPhone(acc, els);

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) start();
              else stop();
            });
          },
          { threshold: 0.05 }
        );
        io.observe(phone);
      } else {
        start();
      }
    }
  }

  /* ------------------------------------------------------ plan generator */
  var quizForm = document.querySelector('[data-quiz]');
  var quizResult = document.querySelector('[data-quiz-result]');
  var quizEmpty = document.querySelector('[data-quiz-empty]');
  var quizLive = document.querySelector('[data-quiz-live]');
  var quizErr = document.querySelector('[data-quiz-err]');

  var DAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
  var PATTERNS = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 4, 5],
  };
  var POOLS = {
    habit: [
      'Mobility & stretch',
      'Walk or easy cardio',
      'Core circuit',
      'Mobility & stretch',
      'Full-body strength',
    ],
    stronger: [
      'Full-body strength',
      'Core circuit',
      'Full-body strength',
      'Mobility & stretch',
      'Walk or easy cardio',
    ],
    consistent: [
      'Walk or easy cardio',
      'Full-body strength',
      'Mobility & stretch',
      'Walk or easy cardio',
      'Core circuit',
    ],
  };
  var WHERE_NAMES = {
    home: {
      'Full-body strength': 'Bodyweight strength',
      'Walk or easy cardio': 'Walk or easy cardio',
      'Mobility & stretch': 'Mobility & stretch',
      'Core circuit': 'Core circuit',
    },
    gym: {
      'Full-body strength': 'Lift: full-body strength',
      'Walk or easy cardio': 'Rower or treadmill',
      'Mobility & stretch': 'Stretch & mobility',
      'Core circuit': 'Core circuit (gym)',
    },
    outdoors: {
      'Full-body strength': 'Strength (bodyweight)',
      'Walk or easy cardio': 'Run, ride or brisk walk',
      'Mobility & stretch': 'Sunrise stretch',
      'Core circuit': 'Core circuit (open air)',
    },
  };
  var WHERE_LABEL = { home: 'training at home', gym: 'training at the gym', outdoors: 'training outdoors' };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function buildWeek(goal, days, length, where) {
    var pattern = PATTERNS[days] || PATTERNS[3];
    var pool = POOLS[goal] || POOLS.consistent;
    var workCount = 0;
    var cards = DAYS.map(function (dayName, i) {
      var workIdx = pattern.indexOf(i);
      if (workIdx === -1) {
        return {
          name: dayName,
          work: false,
          pill: 'Rest',
          session: 'Recovery & rest',
          meta: 'Off day',
        };
      }
      workCount++;
      var base = pool[workIdx % pool.length];
      var whereNames = WHERE_NAMES[where] || WHERE_NAMES.home;
      return {
        name: dayName,
        work: true,
        pill: 'Workout',
        session: whereNames[base],
        meta: length + ' min',
      };
    });
    return { cards: cards, workCount: workCount };
  }

  function generatePlan() {
    if (!quizForm || !quizResult) return;
    var read = function (name) {
      var checked = quizForm.querySelector('input[name="' + name + '"]:checked');
      return checked ? checked.value : null;
    };
    var goal = read('goal');
    var days = read('days');
    var length = read('length');
    var where = read('where');

    var missing = [];
    if (!goal) missing.push('goal');
    if (!days) missing.push('days');
    if (!length) missing.push('length');
    if (!where) missing.push('where');

    if (missing.length) {
      if (quizErr) {
        quizErr.hidden = false;
        quizErr.textContent = 'Answer all four questions to build your week.';
      }
      if (quizLive) {
        quizLive.textContent = 'Answer all four questions to build your week.';
      }
      var firstMissing = quizForm.querySelector('input[name="' + missing[0] + '"]');
      if (firstMissing) firstMissing.focus();
      return;
    }
    if (quizErr) quizErr.hidden = true;

    var plan = buildWeek(goal, days, length, where);

    quizResult.textContent = '';

    var head = el('h3', '', 'Your week — ' + plan.workCount + ' workout days');
    head.tabIndex = -1;
    quizResult.appendChild(head);

    quizResult.appendChild(
      el(
        'p',
        'quiz__result-meta',
        length +
          '-minute sessions · ' +
          (WHERE_LABEL[where] || 'training at home')
      )
    );

    var week = el('ul', 'week');
    plan.cards.forEach(function (card, i) {
      var li = el('li', 'day' + (card.work ? '' : ' is-rest'));
      li.style.setProperty('--i', i);
      li.appendChild(el('span', 'day__name', card.name));
      li.appendChild(el('span', 'day__pill' + (card.work ? ' is-work' : ' is-rest'), card.pill));
      li.appendChild(el('p', 'day__session', card.session));
      li.appendChild(el('span', 'day__meta', card.meta));
      week.appendChild(li);
    });
    quizResult.appendChild(week);

    var note = el('p', 'quiz__result-note');
    note.appendChild(el('strong', '', 'Sample plan for the concept.'));
    note.appendChild(document.createTextNode(' Not medical advice.'));
    quizResult.appendChild(note);

    if (!reduceMotion) {
      week.classList.add('is-entering');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          week.classList.add('is-shown');
        });
      });
    }

    if (quizLive) {
      quizLive.textContent =
        'Your week is ready: ' +
        plan.workCount +
        ' workout days, ' +
        length +
        '-minute sessions, ' +
        (WHERE_LABEL[where] || 'training at home') +
        '. Sample plan for the concept. Not medical advice.';
    }

    head.focus();
  }

  function resetPlan() {
    if (!quizForm || !quizResult) return;
    quizForm.reset();
    quizResult.textContent = '';
    if (quizEmpty) quizResult.appendChild(quizEmpty);
    if (quizErr) quizErr.hidden = true;
    if (quizLive) quizLive.textContent = 'Plan cleared and answers reset.';
    var first = quizForm.querySelector('input[name="goal"]');
    if (first) first.focus();
  }

  if (quizForm) {
    quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      generatePlan();
    });
    var resetBtn = document.querySelector('[data-quiz-reset]');
    if (resetBtn) resetBtn.addEventListener('click', resetPlan);
  }

  /* ------------------------------------------------------- pricing toggle */
  var priceAmount = document.querySelector('[data-price-amount]');
  var pricePeriod = document.querySelector('[data-price-period]');
  var priceMath = document.querySelector('[data-price-math]');
  var billingRadios = document.querySelectorAll('input[name="billing"]');

  var PRICES = {
    monthly: {
      amount: '$9',
      period: '/mo',
      math: '$9 a month — sample price.',
    },
    yearly: {
      amount: '$72',
      period: '/yr',
      math: 'Works out to $6 a month — sample price.',
    },
  };

  function setBilling(value) {
    var p = PRICES[value] || PRICES.monthly;
    if (priceAmount) priceAmount.textContent = p.amount;
    if (pricePeriod) pricePeriod.textContent = p.period;
    if (priceMath) priceMath.textContent = p.math;
    var amountBox = priceAmount ? priceAmount.parentElement : null;
    if (amountBox && !reduceMotion && amountBox.classList) {
      amountBox.classList.remove('is-swapped');
      void amountBox.offsetWidth;
      amountBox.classList.add('is-swapped');
      setTimeout(function () {
        amountBox.classList.remove('is-swapped');
      }, 260);
    }
  }

  billingRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      setBilling(radio.value);
    });
  });

  /* ------------------------------------------------------- GSAP reveals */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    });

    /* GSAP now owns the hidden start state as inline styles, so the CSS gate
       class can be dropped. Content was only ever hidden by that gate — never
       by plain CSS — and the gate has a 1.5s failsafe in the <head>. */
    document.documentElement.classList.add('reveal-armed');
    document.documentElement.classList.remove('js');
  } else {
    /* No motion: nothing may stay hidden. */
    document.documentElement.classList.remove('js');
  }
})();