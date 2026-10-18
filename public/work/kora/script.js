/* Kora — concept page script. No frameworks, no build step; loaded from
   ../vendor/gsap.min.js + ScrollTrigger.min.js (both work on file://).

   Motion contract (same as inkflow and the rest of the concept pages):
   - window.__motionOK() from ../motion.js is the single source of truth; it
     honors the OS reduced-motion setting plus the motion override that page
     sets from ../motion.js ('reduced'/'full' query param). There is no
     visible toggle on the page.
   - Anything that moves is created only inside the `animate` gate below.
     The one exception is the hero reveal timeline, which is also inside the
     gate; the .reveal-armed / .js reveal gate in the <head> script removes
     itself once GSAP owns those states.
   - Animations only use transforms, opacity, clip paths and stroke offsets.
     No filters, no backdrop-filter, no will-change on text.

   What this script does:
   1. Sticky nav state
   2. Mobile menu open/close (focus trap, Escape)
   3. Glaze switcher (two synced copies: hero + order panel). Adds
      data-glaze to <html> for the theme transition, runs the sweep band
      across the product and gives the sticky cart bar a small bounce.
   4. Sticky cart bar (appears after the hero, measures its own height so
      the page footer is never covered)
   5. Add-to-cart button: honest confirmation toast only
   6. Scroll reveals for [data-reveal] elements
   7. MOTION (animate gate only):
      - hero entrance timeline (nav, eyebrow, clip-path line reveal of the
        h1, lead, price, CTAs, glaze, product pieces rising with rotation)
      - slow rotateY/rotateX float of the hero product (paused when off-screen
        or the tab is hidden)
      - looping steam strokes above the cup (hero product)
      - warm light field following the pointer (transform only)
      - pour preview on the hero product (hover/focus on desktop, tap on
        touch): water arc draws from the dripper into the cup, traveling
        glint, ripples in the cup, the dripper lifts a few pixels. The
        control is a real <button> with aria-pressed and is disabled
        entirely when motion is off.
      - exploded-view story stage (desktop >= 901px only, via
        gsap.matchMedia): the sticky stage holds for 3 viewport heights
        while the pieces separate vertically, five callout lines draw in
        (material, shape, drip rate, hand finish, care), then the pieces
        recombine as the stage scrolls away. Under 901px, or with reduced
        motion, the section is a normal stacked list - no sticky, no
        transform.
      - server fill level scrubbed on scroll (clipped rect scaled from the
        base of the server in both the hero and story products)
      - material-words marquee band (transform-only loop, paused off-screen)
      - spec table rows building in one row at a time (scroll-triggered)
      - stroke-draw vignettes (throwing wheel, dimensions cross-section,
        care drop) (scroll-triggered)
   8. Add-to-cart buttons in header and order panel */

(function () {
  "use strict";

  var doc = document;
  var docEl = doc.documentElement;
  var reduceMotion = !(window.__motionLight ? window.__motionLight() : true); // Light animations always run
  var heavyMotion = window.__motionOK ? window.__motionOK() : true; // Heavy features gate
  var hasGsap = typeof window.gsap !== "undefined";
  var hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  var animate = hasGsap && reduceMotion === false; // GSAP runs with light or full

  if (hasGsap && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  } else {
    animate = false;
  }

  /* Helper: plays a set of tweens only while `container` is on screen and
     the tab is visible; pauses them otherwise. Keeps the continuous loops
     (float, steam, marquee) from burning cycles in background tabs. */
  function loopScope(container, tweens) {
    if (!container || !tweens.length) return;
    var inView = false;
    var hidden = doc.hidden;
    function sync() {
      var play = inView && !hidden;
      for (var i = 0; i < tweens.length; i++) {
        if (play) tweens[i].play();
        else tweens[i].pause();
      }
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          inView = entries[0].isIntersecting;
          sync();
        },
        { threshold: 0 }
      );
      io.observe(container);
    } else {
      inView = true;
      sync();
    }
    doc.addEventListener("visibilitychange", function () {
      hidden = doc.hidden;
      sync();
    });
  }

  /* 1. Sticky nav ---------------------------------------------------------- */
  var nav = doc.querySelector(".nav");
  if (nav) {
    var navRaf = false;
    window.addEventListener(
      "scroll",
      function () {
        if (navRaf) return;
        navRaf = true;
        window.requestAnimationFrame(function () {
          nav.classList.toggle("is-scrolled", window.scrollY > 24);
          navRaf = false;
        });
      },
      { passive: true }
    );
  }

  /* 2. Mobile menu --------------------------------------------------------- */
  var menuBtn = doc.querySelector("[data-menu]");
  var menu = doc.querySelector("[data-menu-panel]");
  if (menuBtn && menu) {
    var menuFocusables = function () {
      return Array.prototype.slice
        .call(menu.querySelectorAll("a, button"))
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    };
    var closeMenu = function (focusBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      if (focusBtn) menuBtn.focus();
    };
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu(false);
      } else {
        menuBtn.setAttribute("aria-expanded", "true");
        menu.classList.add("is-open");
        var first = menuFocusables()[0];
        if (first) first.focus();
      }
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (e.key !== "Tab") return;
      var f = menuFocusables();
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* 3. Glaze switcher ------------------------------------------------------ */
  var GLAZE_NAMES = { clay: "Clay", ash: "Ash", moss: "Moss", ink: "Ink" };

  function runSweep() {
    var bands = doc.querySelectorAll("[data-sweep]");
    for (var i = 0; i < bands.length; i++) {
      (function (band) {
        gsap.killTweensOf(band);
        gsap.fromTo(
          band,
          { xPercent: -130, opacity: 1 },
          {
            xPercent: 130,
            opacity: 1,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: function () {
              gsap.set(band, { opacity: 0 });
            }
          }
        );
      })(bands[i]);
    }
  }

  function bounceBar() {
    var inner = doc.querySelector("[data-cartbar-inner]");
    if (!inner) return;
    gsap.killTweensOf(inner);
    gsap
      .timeline()
      .to(inner, { y: -9, duration: 0.16, ease: "power2.out" })
      .to(inner, { y: 0, duration: 0.65, ease: "bounce.out" });
  }

  function applyGlaze(value, userAction) {
    var name = GLAZE_NAMES[value] || "Clay";
    docEl.setAttribute("data-glaze", value);
    var labels = doc.querySelectorAll("[data-cart-glaze]");
    for (var i = 0; i < labels.length; i++) labels[i].textContent = name;
    var hints = doc.querySelectorAll("[data-glaze-hint]");
    for (var h = 0; h < hints.length; h++) hints[h].textContent = "Shown in " + name + ".";
    /* The hero and order-panel copies use separate radio groups (so both can
       show the same glaze checked); sync them here. */
    var inputs = doc.querySelectorAll(".glaze__input");
    for (var g = 0; g < inputs.length; g++) {
      inputs[g].checked = inputs[g].value === value;
    }
    if (userAction && animate) {
      runSweep();
      bounceBar();
    }
  }

  var glazeInputs = doc.querySelectorAll(".glaze__input");
  if (glazeInputs.length) {
    for (var gi = 0; gi < glazeInputs.length; gi++) {
      glazeInputs[gi].addEventListener("change", function (e) {
        applyGlaze(e.target.value, true);
      });
    }
    var checkedGlaze = doc.querySelector(".glaze__input:checked");
    applyGlaze(checkedGlaze ? checkedGlaze.value : "clay", false);
  }

  /* 4. Sticky cart bar ----------------------------------------------------- */
  var bar = doc.querySelector(".cartbar");
  var hero = doc.querySelector(".hero");
  if (bar && hero) {
    var barRaf = false;
    var syncBar = function () {
      var threshold = hero.offsetTop + hero.offsetHeight - 120;
      var on = window.scrollY > threshold;
      bar.classList.toggle("is-visible", on);
      /* CSS contract: .has-cartbar on <body> reserves the bar's height
         (ribbon-nav clearance on desktop, body padding on mobile), and
         --cartbar-h feeds that calc plus the toast's offset above the bar. */
      doc.body.classList.toggle("has-cartbar", on);
      docEl.style.setProperty("--cartbar-h", bar.offsetHeight + "px");
    };
    window.addEventListener(
      "scroll",
      function () {
        if (barRaf) return;
        barRaf = true;
        window.requestAnimationFrame(function () {
          syncBar();
          barRaf = false;
        });
      },
      { passive: true }
    );
    window.addEventListener("resize", syncBar);
    syncBar();
  }

  /* 5. Add to cart -> honest confirmation toast ---------------------------- */
  var toast = doc.querySelector("[data-toast]");
  if (toast) {
    var toastTimer = 0;
    var toastRaf = 0;
    var showToast = function () {
      toast.classList.add("is-showing");
      window.clearTimeout(toastTimer);
      window.clearTimeout(toastRaf);
      toastRaf = window.setTimeout(function () {
        toast.classList.add("is-parked");
      }, 3400);
      toastTimer = window.setTimeout(function () {
        toast.classList.remove("is-showing", "is-parked");
      }, 4200);
    };
    var addButtons = doc.querySelectorAll("[data-add]");
    for (var i = 0; i < addButtons.length; i++) {
      addButtons[i].addEventListener("click", showToast);
    }
  }

  /* 6. Reveals -------------------------------------------------------------- */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));
  if (!animate || !hasGsap || !hasScrollTrigger || !("IntersectionObserver" in window)) {
    for (var r = 0; r < revealItems.length; r++) revealItems[r].classList.remove("js");
  } else {
    doc.body.classList.add("reveal-armed");
    var revealIO = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          observer.unobserve(el);
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 22 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              onComplete: function () {
                el.classList.remove("js");
              }
            }
          );
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    for (var v = 0; v < revealItems.length; v++) revealIO.observe(revealItems[v]);
    /* Failsafe: reveal anything still hidden after 1.5 s (e.g. an element
       whose trigger never fired). */
    window.setTimeout(function () {
      for (var f = 0; f < revealItems.length; f++) {
        var el = revealItems[f];
        if (el.classList.contains("js")) {
          el.classList.remove("js");
          gsap.set(el, { clearProps: "opacity,visibility,transform" });
        }
      }
    }, 1500);
  }

  /* 7. Motion --------------------------------------------------------------- */
  var heroProduct = doc.querySelector(".hero__product .product");

  if (animate) {
    /* 7a. Hero entrance ----------------------------------------------------- */
    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTl
      .from(".nav", { autoAlpha: 0, y: -16, duration: 0.6 }, 0)
      .from(".hero__copy .eyebrow", { autoAlpha: 0, y: 14, duration: 0.6 }, 0.1)
      .fromTo(
        ".hero__line",
        { clipPath: "inset(0% 0% 100% 0%)", y: 12 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          y: 0,
          duration: 0.85,
          stagger: 0.13,
          onComplete: function () {
            gsap.set(".hero__line", { clearProps: "clipPath,y" });
          }
        },
        0.18
      )
      .from(".hero__lead", { autoAlpha: 0, y: 18, duration: 0.7 }, 0.5)
      .from(".hero__price", { autoAlpha: 0, y: 18, duration: 0.7 }, 0.6)
      .from(".hero__cta", { autoAlpha: 0, y: 18, duration: 0.7 }, 0.7)
      .from(".glaze", { autoAlpha: 0, y: 18, duration: 0.7 }, 0.8)
      .from(".hero__light", { autoAlpha: 0, duration: 1.1 }, 0.2)
      .from(
        ".hero__product .layer--server",
        { autoAlpha: 0, y: 30, rotationY: -16, scale: 0.96, duration: 1.0 },
        0.35
      )
      .from(
        ".hero__product .layer--dripper",
        { autoAlpha: 0, y: -40, rotationY: -26, scale: 0.93, duration: 1.0 },
        0.5
      )
      .from(
        ".hero__product .layer--cup",
        { autoAlpha: 0, y: 20, rotationX: 8, rotationY: 20, scale: 0.9, duration: 1.0 },
        0.65
      );

    /* 7b. Slow float of the hero product ------------------------------------ */
    var floatTl = null;
    if (heroProduct) {
      floatTl = gsap.to(heroProduct, {
        rotationY: 3.6,
        rotationX: 1.4,
        duration: 4.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true
      });
      loopScope(doc.querySelector(".hero__product"), [floatTl]);
    }

    /* 7c. Steam loops (hero cup) -------------------------------------------- */
    function makeSteam(container, delay) {
      if (!container) return null;
      var paths = container.querySelectorAll("[data-steam]");
      if (!paths.length) return null;
      var tl = gsap.timeline({ paused: true, repeat: -1, delay: delay || 0 });
      for (var s = 0; s < paths.length; s++) {
        var p = paths[s];
        /* pathLength=1: one dash cycle = the whole path. Offsetting the
           dash 0 -> -1 marches the wisp forward along the path (upwards). */
        tl.fromTo(
          p,
          { strokeDashoffset: 0 },
          { strokeDashoffset: -1, duration: 2.3, ease: "power1.inOut" },
          s * 0.55
        )
          .fromTo(
            p,
            { opacity: 0 },
            { opacity: 0.85, duration: 0.45, ease: "power1.out" },
            s * 0.55
          )
          .to(p, { opacity: 0, duration: 0.95, ease: "power1.in" }, s * 0.55 + 1.35);
      }
      return tl;
    }
    var heroSteam = makeSteam(doc.querySelector(".hero__product .layer--steam"), 1.7);
    if (heroSteam) loopScope(doc.querySelector(".hero__product"), [heroSteam]);

    /* 7d. Warm light follows the pointer (hero only, hover devices) ---------- */
    var lightEl = doc.querySelector(".hero__light");
    if (
      lightEl &&
      hero &&
      window.matchMedia &&
      window.matchMedia("(hover: hover)").matches
    ) {
      var xTo = gsap.quickTo(lightEl, "x", { duration: 0.7, ease: "power3" });
      var yTo = gsap.quickTo(lightEl, "y", { duration: 0.7, ease: "power3" });
      var lightOn = false;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          lightOn = entries[0].isIntersecting;
        }, { threshold: 0 }).observe(hero);
      } else {
        lightOn = true;
      }
      hero.addEventListener(
        "pointermove",
        function (e) {
          if (!lightOn || doc.hidden) return;
          var rect = hero.getBoundingClientRect();
          xTo(((e.clientX - rect.left) / rect.width - 0.5) * 96);
          yTo(((e.clientY - rect.top) / rect.height - 0.5) * 64);
        },
        { passive: true }
      );
    }

    /* 7e. Pour preview on the hero product ----------------------------------- */
    var pourBtn = doc.querySelector("[data-pour]");
    if (pourBtn) {
      if (!animate) {
        pourBtn.disabled = true;
      } else {
        var pourStream = pourBtn.querySelector("[data-pour-path]");
        var pourGlint = pourBtn.querySelector("[data-pour-glint]");
        var pourRipples = pourBtn.querySelectorAll(".ripple");
        var pourDripper = pourBtn.querySelector(".layer--dripper");

        /* Children start rendering their from-states only when the timeline
           actually starts (immediateRender off), so the stream/ripples/glint
           are never accidentally visible at rest. */
        gsap.set(pourStream, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(pourGlint, { strokeDashoffset: 0 });

        var pourTl = gsap.timeline({ paused: true });
        pourTl
          .fromTo(
            pourStream,
            { strokeDashoffset: 1, opacity: 0 },
            {
              strokeDashoffset: 0,
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
              immediateRender: false
            },
            0
          )
          .to(pourDripper, { y: -12, duration: 0.35, ease: "power2.out" }, 0)
          .fromTo(
            pourGlint,
            { strokeDashoffset: 0, opacity: 0.9 },
            {
              strokeDashoffset: -1,
              duration: 0.85,
              repeat: -1,
              ease: "none",
              immediateRender: false
            },
            0.5
          );
        for (var ri = 0; ri < pourRipples.length; ri++) {
          pourTl.fromTo(
            pourRipples[ri],
            { scale: 0.35, opacity: 0.85 },
            {
              scale: 1.8,
              opacity: 0,
              duration: 1.3,
              ease: "power1.out",
              repeat: -1,
              svgOrigin: "546 566",
              immediateRender: false
            },
            0.3 + ri * 0.42
          );
        }

        /* The stop fade is kept as standalone tweens in this list and killed
           only on restart. (Never gsap.killTweensOf the stream/ripples
           themselves: that would kill the paused timeline's children too and
           the pour could never play again.) */
        var pouring = false;
        var stopTweens = [];
        var killStopTweens = function () {
          for (var k = 0; k < stopTweens.length; k++) stopTweens[k].kill();
          stopTweens = [];
        };
        var setPour = function (on) {
          if (on === pouring) return;
          pouring = on;
          pourBtn.setAttribute("aria-pressed", on ? "true" : "false");
          if (on) {
            killStopTweens();
            pourTl.play(0);
          } else {
            pourTl.pause();
            stopTweens = [
              gsap.to([pourStream, pourGlint], { opacity: 0, duration: 0.3 }),
              gsap.to(pourRipples, { opacity: 0, duration: 0.3 }),
              gsap.to(pourDripper, { y: 0, duration: 0.4, ease: "power2.out" })
            ];
          }
        };

        var hoverable =
          window.matchMedia && window.matchMedia("(hover: hover)").matches;
        if (hoverable) {
          pourBtn.addEventListener("pointerenter", function () {
            setPour(true);
          });
          pourBtn.addEventListener("pointerleave", function () {
            if (doc.activeElement !== pourBtn) setPour(false);
          });
          pourBtn.addEventListener("focus", function () {
            setPour(true);
          });
          pourBtn.addEventListener("blur", function () {
            setPour(false);
          });
        } else {
          /* Touch: one tap starts, the next stops (no hover to hold it on). */
          pourBtn.addEventListener("click", function () {
            setPour(!pouring);
          });
        }
      }
    }

    /* 7f. Exploded-view pinned story (desktop only) -------------------------- */
    (function story() {
      var section = doc.querySelector("[data-story]");
      var inner = doc.querySelector("[data-story-inner]");
      var zone = doc.querySelector("[data-story-pinzone]");
      var list = doc.querySelector("[data-callouts]");
      if (!section || !inner || !zone || !list || !gsap.matchMedia) return;

      var items = Array.prototype.slice.call(list.querySelectorAll(".callout"));
      var markers = Array.prototype.slice.call(section.querySelectorAll(".marker"));
      var markersBox = section.querySelector(".markers");
      var len = items.length;
      if (!len) return;

      var mm = gsap.matchMedia();

      mm.add("(min-width: 901px)", function () {
        docEl.classList.add("has-story");

        var product = inner.querySelector(".product--static");
        var dripper = inner.querySelector(".layer--dripper");
        var server = inner.querySelector(".layer--server");
        var cup = inner.querySelector(".layer--cup");
        var pieces = [dripper, server, cup];
        var current = -1;

        function activate(index) {
          if (index < 0) index = 0;
          if (index > len - 1) index = len - 1;
          if (index === current) return;
          current = index;
          for (var c = 0; c < len; c++) {
            items[c].classList.toggle("is-active", c === index);
          }
          for (var m = 0; m < markers.length; m++) {
            markers[m].classList.toggle(
              "is-active",
              markers[m].getAttribute("data-marker") === String(index + 1)
            );
          }
        }
        activate(0);

        /* The stage itself is sticky (see .has-story .story__inner); this
           trigger only scrubs the explode/recombine timeline across the
           zone's 3 extra viewports and drives the callout switching. No
           ScrollTrigger pin: nothing is reparented, so no pin-spacer and no
           layout shifts. */
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: zone,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            onUpdate: function (self) {
              var p = self.progress;
              /* Callout windows inside the pin: explode 0-18%, hold 18-82%
                 (five callouts at 12.8% each), recombine 82-100%. */
              var t = (p - 0.18) / 0.64;
              activate(t <= 0 ? 0 : t >= 1 ? len - 1 : Math.floor(t * len));
              if (markersBox) {
                markersBox.classList.toggle("is-shown", p >= 0.1 && p <= 0.9);
              }
            },
            onLeave: function () {
              activate(len - 1);
              if (markersBox) markersBox.classList.remove("is-shown");
            },
            onLeaveBack: function () {
              activate(0);
              if (markersBox) markersBox.classList.remove("is-shown");
            }
          }
        });

        tl.to(dripper, { yPercent: -26, duration: 18, ease: "power2.inOut" }, 0)
          .to(server, { yPercent: 5, duration: 18, ease: "power2.inOut" }, 0)
          .to(cup, { yPercent: 15, duration: 18, ease: "power2.inOut" }, 0)
          .to(product, { scale: 0.92, duration: 18, ease: "power2.inOut" }, 0)
          .to({ hold: 0 }, { hold: 1, duration: 64 }, 18)
          .to(
            pieces,
            { yPercent: 0, duration: 18, ease: "power2.inOut" },
            82
          )
          .to(product, { scale: 1, duration: 18, ease: "power2.inOut" }, 82);

        ScrollTrigger.refresh();

        /* Cleanup: below 901px (or reduced motion) the section is a plain
           stacked list again - no pin, no leftover transforms. */
        return function () {
          docEl.classList.remove("has-story");
          if (markersBox) markersBox.classList.remove("is-shown");
          current = -1;
          for (var c2 = 0; c2 < len; c2++) items[c2].classList.remove("is-active");
          for (var m2 = 0; m2 < markers.length; m2++) {
            markers[m2].classList.remove("is-active");
          }
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
          gsap.set([product].concat(pieces), { clearProps: "transform" });
        };
      });
    })();

    /* 7g. Server fill level, scrubbed on scroll ------------------------------ */
    var liquidRects = doc.querySelectorAll("[data-liquid]");
    if (liquidRects.length) {
      gsap.fromTo(
        liquidRects,
        { scaleY: 0.05 },
        {
          scaleY: 1,
          ease: "none",
          svgOrigin: "300 700",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom 60%",
            scrub: 0.35
          }
        }
      );
    }

    /* 7h. Material-words marquee band ---------------------------------------- */
    var marqueeEl = doc.querySelector("[data-marquee]");
    if (marqueeEl) {
      var mqTween = gsap.to(marqueeEl, {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
        paused: true
      });
      loopScope(doc.querySelector(".marquee"), [mqTween]);
    }

    /* 7i. Spec table rows build in one by one -------------------------------- */
    var tableRows = doc.querySelectorAll(".table tbody tr");
    if (tableRows.length) {
      gsap.fromTo(
        tableRows,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".table",
            start: "top 82%",
            once: true
          }
        }
      );
    }

    /* 7j. Stroke-draw vignettes ---------------------------------------------- */
    var vignettes = doc.querySelectorAll("[data-vignette]");
    for (var vi = 0; vi < vignettes.length; vi++) {
      (function (svg) {
        var shapes = svg.querySelectorAll("path, ellipse, circle, line, polyline, polygon");
        var drawables = [];
        for (var sh = 0; sh < shapes.length; sh++) {
          var node = shapes[sh];
          if (typeof node.getTotalLength !== "function") continue;
          var l;
          try {
            l = node.getTotalLength();
          } catch (err) {
            continue;
          }
          if (!l || !isFinite(l)) continue;
          node.style.strokeDasharray = l + " " + l;
          node.style.strokeDashoffset = String(l);
          drawables.push(node);
        }
        var tlV = gsap.timeline({
          scrollTrigger: {
            trigger: svg,
            start: "top 85%",
            once: true
          }
        });
        tlV.fromTo(
          svg,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }
        );
        if (drawables.length) {
          tlV.to(
            drawables,
            { strokeDashoffset: 0, duration: 1.3, stagger: 0.1, ease: "power2.out" },
            0.1
          );
        }
      })(vignettes[vi]);
    }
  } else {
    /* Motion off: the pour control must not be a dead button. */
    var pourOff = doc.querySelector("[data-pour]");
    if (pourOff) pourOff.disabled = true;
  }

  /* 8. Add-to-cart buttons (header + order panel) --------------------------- */
  var allAddButtons = doc.querySelectorAll("[data-add]");
  for (var ab = 0; ab < allAddButtons.length; ab++) {
    allAddButtons[ab].addEventListener("click", function () {
      var barEl = doc.querySelector(".cartbar");
      if (barEl) barEl.classList.add("is-visible");
    });
  }

  /* Web fonts can change layout height; keep pinned/scrubbed positions in
     sync after they load, and once more on full load (file:// included). */
  if (hasGsap && hasScrollTrigger && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
  if (hasGsap && hasScrollTrigger) {
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }
})();
