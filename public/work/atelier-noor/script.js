/* ==========================================================================
   Atelier Noor — script.js
   Plain ES5-friendly JS. Every enhancement degrades safely:
     - reveals only run when GSAP + ScrollTrigger loaded and motion is allowed
     - the horizontal showcase is CSS sticky + a scrubbed x tween (no
       ScrollTrigger pin, no reparenting, no CLS); .has-hscroll only lands
       when GSAP confirms it, so a blocked vendor file can never cause
       sideways scroll
     - the accent-word swap, marquees and panel art loops all pause when
       off-screen / tab hidden; with motion off they are simply static
     - the cursor trail is pure JS, transform/opacity only, cursor-fine only
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = !(window.__motionLight ? window.__motionLight() : true); // Light animations always run
  var heavyMotion = window.__motionOK ? window.__motionOK() : true; // Heavy features gate
  var hasGsap = typeof window.gsap !== "undefined";
  var hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  var animate = hasGsap && reduceMotion === false; // GSAP runs with light or full

  if (hasScrollTrigger) {
    /* No automatic load-time refresh: forcing a full-document reflow in one
       task right at load is what pushes TBT on throttled mobile CPUs. The
       desktop scrub pass re-measures explicitly via scheduleRefresh below;
       on phones the hero/wipe triggers are vh-anchored, so font-swap
       metric drift of a few pixels leaves the scrub honest anyway. */
    window.ScrollTrigger.config({ autoRefreshEvents: "resize" });
  }

  /* One rAF-coalesced re-measure pass. The fonts.ready / load / resize hooks
     below all funnel into this, so the tall document is re-laid-out at most
     once per frame — coalescing the late ScrollTrigger.refresh() calls is
     what keeps the mobile TBT down. Refresh only runs at desktop widths
     (>=901px) where the horizontal showcase needs exact end values. */
  var zoneSizer = null;
  var refreshQueued = false;
  var refreshNeedsSize = false;
  var scheduleRefresh = function (withSize) {
    if (withSize) refreshNeedsSize = true;
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(function () {
      refreshQueued = false;
      var needSize = refreshNeedsSize;
      refreshNeedsSize = false;
      if (needSize && zoneSizer) zoneSizer();
      if (hasScrollTrigger && window.innerWidth >= 901) ScrollTrigger.refresh();
    });
  };

  if (hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------ sticky nav */
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------- mobile menu */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      menu.classList.toggle("is-open", open);
    };
    setMenu(false);
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    // Close after choosing a destination.
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------- front-end-only contact form */
  var form = document.querySelector("[data-form]");
  if (form) {
    var note = document.querySelector("[data-form-note]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]');
      if (email && email.value && !/^\S+@\S+\.\S+$/.test(email.value)) {
        if (note) {
          note.textContent =
            "That email address doesn't look right — this is a concept page, so nothing is sent either way.";
        }
        email.focus();
        return;
      }
      if (note) {
        note.textContent =
          "Thanks — because this is a concept page, nothing was sent. In a real build this would reach the studio.";
      }
      form.reset();
    });
  }

  /* ---------------------------------------------------- shared loop scope
     Plays a {play, pause} pair while el is on screen AND the tab is visible;
     pauses otherwise. Used by the accent-word swap and the marquees. */
  function scopeLoops(el, obj) {
    var visible = true;
    var tabVisible = !document.hidden;
    var sync = function () {
      if (visible && tabVisible) obj.play();
      else obj.pause();
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 });
      io.observe(el);
    } else {
      obj.play();
    }
    document.addEventListener("visibilitychange", function () {
      tabVisible = !document.hidden;
      sync();
    });
  }

  /* ------------------------------------------------------ reveal animations */
  var heroIntro = null;
  if (animate) {
    var revealEls = gsap.utils.toArray("[data-reveal]");
    revealEls.forEach(function (el) {
      /* fromTo, so the hidden start state is applied by JS right before the
         tween runs — content is never hidden by plain CSS. */
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }
      );
    });

    /* Hero entrance: pre-split letters rise in one by one, the sphere pops
       behind them, the lead and buttons follow. yPercent only (percent of
       each letter's own box), autoAlpha 0->1. */
    var hero = document.querySelector("[data-hero]");
    var sphere = document.querySelector("[data-sphere]");
    heroIntro = gsap.timeline({ defaults: { ease: "power4.out" } });
    heroIntro
      .fromTo(
        ".hero__top",
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.4 }
      )
      .fromTo(
        ".hero__line .hc, .hero__line .accent-slot",
        { autoAlpha: 0, yPercent: 75 },
        { autoAlpha: 1, yPercent: 0, duration: 0.75, stagger: 0.03 },
        "-=0.3"
      )
      .fromTo(
        ".hero__lead, .hero__cta",
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06 },
        "-=0.25"
      );
    if (sphere) {
      heroIntro.fromTo(
        sphere,
        { autoAlpha: 0, yPercent: 26 },
        { autoAlpha: 1, yPercent: 0, duration: 0.8 },
        0.08
      );
    }

    /* GSAP owns the hidden start state now, so the CSS gate class can go. */
    doc.classList.add("reveal-armed");
    doc.classList.remove("js");
  } else {
    // Make sure nothing is left hidden when animations are unavailable.
    var hidden = document.querySelectorAll("[data-reveal]");
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.opacity = "";
      hidden[i].style.transform = "";
    }
    doc.classList.remove("js");
  }

  /* ------------------------------------------------- accent word swap (loop)
     Three alternatives stacked in one inline-grid cell, clipped by the slot:
     the outgoing word slides up and out, the incoming one rises from below —
     transform only. Paused while the hero is off screen or the tab hidden. */
  (function accentSwap() {
    var slot = document.querySelector("[data-accent]");
    if (!slot || !animate) return;
    var words = slot.querySelectorAll(".accent-word");
    if (words.length < 2) return;

    /* Park every word first, then flip live — one synchronous task, so the
       first painted live frame already has correct transforms. */
    gsap.set(words, { yPercent: 110 });
    gsap.set(words[0], { yPercent: 0 });
    slot.classList.add("accent-slot--live");

    var swap = gsap.timeline({
      repeat: -1,
      paused: true,
      defaults: { duration: 0.7, ease: "power4.inOut" },
    });
    var n = words.length;
    for (var w = 0; w < n; w++) {
      var cur = words[w];
      var nxt = words[(w + 1) % n];
      swap.to(cur, { yPercent: -110 }, "+=1.6");
      swap.to(nxt, { yPercent: 0 }, "<");
      // Park the exited word back below the mask so the repeat is seamless.
      swap.set(cur, { yPercent: 110 });
    }

    if (hero) scopeLoops(hero, swap);
  })();

  /* --------------------------------------------- hero letters vs. the mouse
     Per-letter horizontal shift away from the cursor — integer pixels only
     (no fractional-pixel text transforms, no jitter: quickTo 0.55s). Enabled
     only after the entrance finishes, disabled once the hero leaves view.
     DISABLED under reduced motion (heavy feature). */
  (function heroParallax() {
    if (!heavyMotion || !animate || !hero) return;
    var targets = hero.querySelectorAll(".hc, .accent-slot");
    if (!targets.length) return;

    var movers = [];
    var centers = [];
    var ready = false;
    var heroVisible = true;
    var k;

    for (k = 0; k < targets.length; k++) {
      movers.push(
        gsap.quickTo(targets[k], "x", { duration: 0.55, ease: "power3" })
      );
    }

    var measure = function () {
      centers = [];
      for (var i = 0; i < targets.length; i++) {
        var r = targets[i].getBoundingClientRect();
        centers.push(r.left + r.width / 2);
      }
    };

    var reset = function () {
      for (var i = 0; i < movers.length; i++) movers[i](0);
    };

    if (heroIntro) {
      heroIntro.eventCallback("onComplete", function () {
        measure();
        ready = true;
      });
    } else {
      measure();
      ready = true;
    }

    hero.addEventListener(
      "pointermove",
      function (e) {
        if (!ready || !heroVisible) return;
        var w = window.innerWidth || 1;
        for (var i = 0; i < movers.length; i++) {
          var d = (e.clientX - centers[i]) / w; // -1 .. 1
          var shift = -d * 26;
          if (shift > 9) shift = 9;
          else if (shift < -9) shift = -9;
          movers[i](Math.round(shift)); // whole pixels only
        }
      },
      { passive: true }
    );

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (!heroVisible) reset();
      }, { threshold: 0 });
      io.observe(hero);
    }
    window.addEventListener("resize", measure);
  })();

  /* --------------------------------------------- blue sphere scroll scrub
     Size/position change across the hero — scale + translate only (the circle
     itself is a fixed size in CSS; it never re-lays-out). Entrance animates
     opacity + yPercent, so the two never fight over one component. */
  (function sphereScrub() {
    if (!animate || !sphere || !hasScrollTrigger || !hero) return;
    gsap.to(sphere, {
      scale: 0.36,
      x: function () {
        return -window.innerWidth * 0.16;
      },
      y: function () {
        return -window.innerHeight * 0.18;
      },
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
  })();

  /* ------------------------------------------------------------- marquees
     Two duplicated word sets; xPercent -50 loops one set width seamlessly.
     GSAP-owned (not CSS), so pause/resume is exact; paused off screen. */
  (function marquees() {
    if (!animate) return;
    var tracks = document.querySelectorAll("[data-marquee]");
    for (var t = 0; t < tracks.length; t++) {
      (function (track) {
        var loop = gsap.to(track, {
          xPercent: -50,
          duration: 34,
          ease: "none",
          repeat: -1,
          paused: true,
        });
        var band = track.closest(".marquee") || track;
        scopeLoops(band, loop);
      })(tracks[t]);
    }
  })();

  /* ---------------------------------------------------- cursor image trail
     Abstract shapes and type fragments along the cursor path over the hero.
     A fixed pool of elements is reused; only transform and opacity change.
     Disabled on touch, reduced motion, and under heavy-motion gate. */
  (function imageTrail() {
    var heroEl = document.querySelector("[data-hero]");
    var layer = document.querySelector("[data-trail]");
    if (!heroEl || !layer || !heavyMotion || !window.__motionOK()) return;

    var cursorFine =
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var coarse =
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var touch =
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      "ontouchstart" in window;
    if (!cursorFine || coarse || touch) return;

    var COUNT = 12;
    var KINDS = [
      "circle",
      "bar",
      "word",
      "ring",
      "tri",
      "dot",
      "word",
      "square",
      "circle",
      "word",
      "bar",
      "ring",
    ];
    var WORDS = ["FORM", "RHYTHM", "NOOR", "TYPE", "\u00d7", "\u2192", "Aa", "SET", "LOUD", "IF"];
    var items = [];
    var pool = document.createElement("div");

    for (var k = 0; k < COUNT; k++) {
      var el = document.createElement("span");
      var kind = KINDS[k];
      el.className = "trail__item trail--" + kind;
      if (kind === "word") el.textContent = WORDS[k % WORDS.length];
      pool.appendChild(el);
      items.push({
        el: el,
        life: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        rotV: 0,
        scale: 1,
        grow: 0,
      });
    }
    layer.appendChild(pool);

    var cursor = 0;
    var visible = true;
    var raf = null;
    var lastTs = 0;
    var lastX = null;
    var lastY = null;

    function clearAll() {
      for (var i = 0; i < items.length; i++) {
        items[i].life = 0;
        items[i].el.style.opacity = "0";
      }
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      lastTs = 0;
    }

    function spawn(x, y) {
      var p = items[cursor % COUNT];
      cursor++;
      p.life = 1;
      p.x = x + (Math.random() * 30 - 15);
      p.y = y + (Math.random() * 30 - 15);
      p.vx = Math.random() * 34 - 17;
      p.vy = Math.random() * 26 - 16;
      p.rot = Math.random() * 46 - 23;
      p.rotV = Math.random() * 30 - 15;
      p.scale = 0.6 + Math.random() * 0.5;
      p.grow = 0.35 + Math.random() * 0.5;
    }

    function frame(ts) {
      var dt = lastTs ? Math.min(48, ts - lastTs) / 1000 : 0.016;
      lastTs = ts;
      var alive = 0;

      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        if (p.life <= 0) {
          if (p.el.style.opacity !== "0") p.el.style.opacity = "0";
          continue;
        }
        p.life -= dt; // ~1.2s lifespan
        if (p.life <= 0) {
          p.life = 0;
          p.el.style.opacity = "0";
          continue;
        }
        alive++;
        var t = 1 - p.life;
        var px = p.x + p.vx * t;
        var py = p.y + p.vy * t;
        var sc = p.scale + p.grow * t * 0.4;
        var rot = p.rot + p.rotV * t;
        p.el.style.transform =
          "translate3d(" +
          px.toFixed(1) +
          "px," +
          py.toFixed(1) +
          "px,0) translate(-50%,-50%) rotate(" +
          rot.toFixed(1) +
          "deg) scale(" +
          sc.toFixed(3) +
          ")";
        p.el.style.opacity = p.life.toFixed(3);
      }

      if (alive > 0 && visible) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
        lastTs = 0;
      }
    }

    function start() {
      if (!raf && visible) {
        lastTs = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    heroEl.addEventListener(
      "pointermove",
      function (e) {
        if (!visible) return;
        // Throttle by distance so a fast cursor lays a trail, not a smear.
        if (lastX !== null) {
          var dx = e.clientX - lastX;
          var dy = e.clientY - lastY;
          if (dx * dx + dy * dy < 18 * 18) return;
        }
        lastX = e.clientX;
        lastY = e.clientY;

        var r = layer.getBoundingClientRect();
        spawn(e.clientX - r.left, e.clientY - r.top);
        start();
      },
      { passive: true }
    );

    heroEl.addEventListener("pointerleave", function () {
      lastX = null;
      lastY = null;
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (!visible) clearAll();
        },
        { threshold: 0 }
      );
      io.observe(heroEl);
    }
  })();

  /* --------------------------------------- horizontal work showcase
     Desktop + motion only (gsap.matchMedia, min-width 901px). The zone's
     inline height is exactly 100vh + one track width of travel; the stage
     is plain CSS sticky and the scrub maps scroll px 1:1 to track px. No
     ScrollTrigger pin — no reparenting, stable scrollHeight, CLS 0.
     DISABLED under reduced motion (heavy feature). */
  (function showcase() {
    var zone = document.querySelector("[data-showcase-zone]");
    var pin = document.querySelector("[data-showcase-pin]");
    var track = document.querySelector("[data-track]");
    var progress = document.querySelector("[data-progress]");
    if (!zone || !pin || !track || !animate || !gsap.matchMedia || !heavyMotion) return;

    var mm = gsap.matchMedia();

    mm.add("(min-width: 901px)", function () {
      doc.classList.add("has-hscroll");
      doc.classList.remove("hscroll-pending");

      var travel = function () {
        return Math.max(1, track.offsetWidth - pin.offsetWidth);
      };
      var size = function () {
        zone.style.height = window.innerHeight + travel() + "px";
      };
      size();
      zoneSizer = size;

      var tween = gsap.to(track, {
        x: function () {
          return -travel();
        },
        ease: "none",
        scrollTrigger: {
          trigger: zone,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (progress) {
              progress.style.transform =
                "scaleX(" + self.progress.toFixed(4) + ")";
            }
          },
        },
      });

      if (progress) progress.style.transform = "scaleX(0)";

      var remeasure = function () {
        scheduleRefresh(true);
      };
      window.addEventListener("resize", remeasure);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          scheduleRefresh(true);
        });
      }

      scheduleRefresh(true);

      return function () {
        window.removeEventListener("resize", remeasure);
        zoneSizer = null;
        doc.classList.remove("has-hscroll");
        zone.style.height = "";
        if (progress) progress.style.transform = "";
        gsap.set(track, { clearProps: "transform" });
        if (tween && tween.scrollTrigger) tween.scrollTrigger.kill();
      };
    });

    /* Panels rise in once, when the zone first arrives. */
    gsap.fromTo(
      "[data-panel]",
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: zone, start: "top 80%", once: true },
      }
    );
  })();

  /* ------------------------------------- panel floods + artwork loop scope
     The blue flood opens from the pointer position (clip-path via --px/--py;
     hover and focus states live in CSS). The art loops only exist under
     .is-inview, added while the art is on screen (motion allowed only). */
  (function panelFx() {
    var panels = document.querySelectorAll("[data-panel]");
    for (var p = 0; p < panels.length; p++) {
      (function (panel) {
        panel.addEventListener(
          "pointermove",
          function (e) {
            var r = panel.getBoundingClientRect();
            if (!r.width || !r.height) return;
            panel.style.setProperty(
              "--px",
              (((e.clientX - r.left) / r.width) * 100).toFixed(2) + "%"
            );
            panel.style.setProperty(
              "--py",
              (((e.clientY - r.top) / r.height) * 100).toFixed(2) + "%"
            );
          },
          { passive: true }
        );
      })(panels[p]);
    }

    if (!animate || !("IntersectionObserver" in window)) return;
    var arts = document.querySelectorAll(".panel__art");
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle(
          "is-inview",
          entries[i].isIntersecting
        );
      }
    }, { threshold: 0.12 });
    for (var a = 0; a < arts.length; a++) io.observe(arts[a]);
  })();

  /* ------------------------------------------------------- blue wipe scrub
     Full-viewport blue panel: wipes in, holds, wipes out — clip-path only,
     CSS sticky underneath. With motion off the static band stays fully
     readable (has-wipe never lands).
     DISABLED under reduced motion (heavy feature). */
  (function wipe() {
    var zone = document.querySelector("[data-wipe]");
    var panel = document.querySelector("[data-wipe-panel]");
    if (!zone || !panel || !animate || !hasScrollTrigger || !heavyMotion) return;

    doc.classList.add("has-wipe");

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: zone,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
      },
    });
    tl.fromTo(
      panel,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "none" }
    ).to(panel, { clipPath: "inset(0 0% 0 100%)", duration: 0.4, ease: "none" }, 0.6);
  })();

  /* -------------------------------------------- oversized CTA letter flip
     Split into inline-grid units (blue duplicate stacked under the black
     base). Hover / keyboard focus staggers the duplicates up, out reverses.
     Motion off: the split never happens, the plain label is the CTA. */
  (function bigCta() {
    var label = document.querySelector("[data-splitletters]");
    if (!label || !animate) return;
    var anchor = label.closest(".bigcta");
    if (!anchor) return;

    var text = label.textContent;
    var words = text.split("");
    label.textContent = "";
    var fills = [];
    var i;

    for (i = 0; i < words.length; i++) {
      var ch = words[i];
      if (ch === " ") {
        label.appendChild(document.createTextNode(" "));
        continue;
      }
      var unit = document.createElement("span");
      unit.className = "bcl";
      var base = document.createElement("span");
      base.className = "bcl__base";
      base.textContent = ch;
      var fill = document.createElement("span");
      fill.className = "bcl__fill";
      fill.setAttribute("aria-hidden", "true");
      fill.textContent = ch;
      unit.appendChild(base);
      unit.appendChild(fill);
      label.appendChild(unit);
      fills.push(fill);
    }
    if (!fills.length) return;

    gsap.set(fills, { yPercent: 106 });

    var show = gsap.to(fills, {
      yPercent: 0,
      duration: 0.5,
      ease: "power3.out",
      stagger: 0.035,
      paused: true,
    });
    var hide = gsap.to(fills, {
      yPercent: 106,
      duration: 0.35,
      ease: "power2.in",
      stagger: 0.02,
      paused: true,
      overwrite: "auto",
    });

    var on = function () {
      hide.pause();
      show.restart();
    };
    var off = function () {
      show.pause();
      hide.restart();
    };
    anchor.addEventListener("mouseenter", on);
    anchor.addEventListener("mouseleave", off);
    anchor.addEventListener("focusin", on);
    anchor.addEventListener("focusout", off);
  })();

  /* Re-measure once webfonts settle so ScrollTrigger end values stay honest
     (coalesced — see scheduleRefresh above). */
  if (animate && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      scheduleRefresh(false);
    });
  }

  window.addEventListener("load", function () {
    scheduleRefresh(false);
  });
})();
