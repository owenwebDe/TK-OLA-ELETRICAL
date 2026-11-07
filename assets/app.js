/* TK-OLA — motion layer
   Lenis smooth scroll + GSAP ScrollTrigger + SplitText.
   Everything is gated behind prefers-reduced-motion. */

(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var $  = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  // ?motion=on forces the motion layer on. Windows Server and many locked-down
  // Windows installs ship with "Animation effects" off, which Edge reports as
  // prefers-reduced-motion:reduce — a machine setting, not always a real
  // preference. The override lets you demo the page on such a machine.
  var forceMotion = /[?&]motion=on(&|$)/.test(window.location.search);
  if (forceMotion) document.documentElement.classList.add('force-motion');
  var reduce = !forceMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- always-on, no-motion basics ---------------- */

  var yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // mobile menu
  var burger = $('.burger');
  var sheet = $('.sheet');
  if (burger && sheet) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    $$('a', sheet).forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        sheet.setAttribute('aria-hidden', 'true');
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) burger.click();
    });
  }

  // nav hairline once scrolled
  var nav = $('.nav');
  var onScrollNav = function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 12);
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ---------------- reduced motion / no GSAP: stop here ---------------- */

  if (reduce || !hasGSAP) {
    body.classList.remove('is-loading');
    $$('[data-count]').forEach(function (el) { el.textContent = '100'; });
    $$('[data-num]').forEach(function (el) {
      var n = el.getAttribute('data-num');
      el.textContent = el.hasAttribute('data-pad') && n.length < 2 ? '0' + n : n;
    });
    $$('[data-step]').forEach(function (s) { s.classList.add('is-active'); });
    // anchor links still need to work
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var canSplit = typeof window.SplitText !== 'undefined';
  if (canSplit) gsap.registerPlugin(SplitText);

  /* ---------------- Lenis <-> ScrollTrigger ---------------- */

  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  // in-page anchors through Lenis
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var t = doc.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.2 });
      else t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------------- loader ---------------- */

  function runLoader(done) {
    var loader = $('.loader');
    if (!loader) { done(); return; }
    var num = $('[data-count]', loader);
    var bar = $('.loader__bar', loader);
    var o = { v: 0 };

    var tl = gsap.timeline({
      onComplete: function () {
        body.classList.remove('is-loading');
        loader.style.display = 'none';
        done();
      }
    });

    tl.to(o, {
      v: 100, duration: 1.15, ease: 'power2.inOut',
      onUpdate: function () { if (num) num.textContent = Math.round(o.v); }
    }, 0)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
      .to([num, $('.loader__word', loader)], { y: -28, opacity: 0, duration: .45, ease: 'power2.in' }, 1.2)
      .to(loader, { yPercent: -100, duration: .85, ease: 'expo.inOut' }, 1.35);
  }

  /* ---------------- custom cursor + magnetic buttons ---------------- */

  if (!coarse) {
    var dot = $('.cursor');
    var ring = $('.cursor__ring');
    if (dot && ring) {
      var dx = gsap.quickTo(dot, 'x', { duration: .14, ease: 'power3' });
      var dy = gsap.quickTo(dot, 'y', { duration: .14, ease: 'power3' });
      var rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
      var ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });

      window.addEventListener('mousemove', function (e) {
        dx(e.clientX - 7);  dy(e.clientY - 7);
        rx(e.clientX - 21); ry(e.clientY - 21);
      }, { passive: true });

      $$('a, button, .svc__item').forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          gsap.to(ring, { scale: 1.75, opacity: .45, duration: .35, ease: 'power3' });
          gsap.to(dot, { scale: .35, duration: .35, ease: 'power3' });
        });
        el.addEventListener('mouseleave', function () {
          gsap.to(ring, { scale: 1, opacity: 1, duration: .35, ease: 'power3' });
          gsap.to(dot, { scale: 1, duration: .35, ease: 'power3' });
        });
      });
    }

    $$('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
      var my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.32);
        my((e.clientY - (r.top + r.height / 2)) * 0.42);
      });
      el.addEventListener('mouseleave', function () { mx(0); my(0); });
    });
  }

  /* ---------------- scroll progress ---------------- */

  gsap.to('.progress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .25 }
  });

  /* ---------------- headline line reveals ---------------- */

  function lineReveals() {
    $$('.reveal-line > span').forEach(function (span) {
      gsap.set(span, { yPercent: 110 });
    });

    $$('h1, h2').forEach(function (h) {
      var spans = $$('.reveal-line > span', h);
      if (!spans.length) return;
      gsap.to(spans, {
        yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .09,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });
  }

  /* ---------------- paragraph line reveals (SplitText) ---------------- */

  function paraReveals() {
    if (!canSplit) return;
    $$('.lead, .hero__lead').forEach(function (p) {
      try {
        var split = new SplitText(p, { type: 'lines', linesClass: 'sline' });
        gsap.set(p, { opacity: 1 });
        gsap.from(split.lines, {
          yPercent: 60, opacity: 0, duration: .9, ease: 'power3.out', stagger: .055,
          scrollTrigger: { trigger: p, start: 'top 90%', once: true }
        });
      } catch (err) { /* leave the paragraph as plain text */ }
    });
  }

  /* ---------------- generic fade-ups ---------------- */

  function fades() {
    $$('[data-fade]').forEach(function (el) {
      // skip anything already animated elsewhere — a second gsap.from() on the same
      // element records opacity:0 as its end value and the element never reappears.
      if (el.classList.contains('lead') || el.classList.contains('hero__lead')) return;
      if (el.closest('.hero')) return;                 // hero entrance timeline owns these
      if (el.classList.contains('svc__item')) return;  // the tile stagger owns these
      gsap.from(el, {
        y: 34, opacity: 0, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });

    // service tiles stagger as a set
    var tiles = $$('.svc__item');
    if (tiles.length) {
      gsap.from(tiles, {
        y: 46, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07,
        scrollTrigger: { trigger: '.svc', start: 'top 85%', once: true }
      });
    }
  }

  /* ---------------- clip-path image reveals + parallax ---------------- */

  function images() {
    $$('[data-clip]').forEach(function (box) {
      var img = $('img', box);
      gsap.fromTo(box,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out',
          scrollTrigger: { trigger: box, start: 'top 86%', once: true }
        });
      if (img) {
        gsap.fromTo(img, { scale: 1.35 }, {
          scale: 1, duration: 1.6, ease: 'expo.out',
          scrollTrigger: { trigger: box, start: 'top 86%', once: true }
        });
        // drift while in view
        gsap.fromTo(img, { yPercent: -5 }, {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
      box.addEventListener('mouseenter', function () { if (img) gsap.to(img, { scale: 1.045, duration: .7, ease: 'power3' }); });
      box.addEventListener('mouseleave', function () { if (img) gsap.to(img, { scale: 1, duration: .7, ease: 'power3' }); });
    });

    var band = $('[data-band-img]');
    if (band) {
      gsap.fromTo(band, { yPercent: -14 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ---------------- marquee ---------------- */

  function marquee() {
    var box = $('[data-marquee]');
    if (!box) return;
    var first = $('.marquee__row', box);
    if (!first) return;

    var w = first.getBoundingClientRect().width;
    if (!w) return;
    var copies = Math.ceil((window.innerWidth * 2) / w) + 1;
    for (var i = 0; i < copies; i++) box.appendChild(first.cloneNode(true));

    var rows = $$('.marquee__row', box);
    var tween = gsap.to(rows, {
      x: -w, duration: w / 90, ease: 'none', repeat: -1
    });

    var proxy = { skew: 0 };
    var setSkew = gsap.quickSetter(rows, 'skewX', 'deg');
    var clamp = gsap.utils.clamp(-14, 14);

    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        var s = clamp(v / 220);
        if (Math.abs(s) > Math.abs(proxy.skew)) {
          proxy.skew = s;
          gsap.to(tween, { timeScale: gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 900), duration: .3, overwrite: true });
          gsap.to(proxy, {
            skew: 0, duration: .7, ease: 'power3',
            overwrite: true,
            onUpdate: function () { setSkew(proxy.skew); },
            onComplete: function () { gsap.to(tween, { timeScale: 1, duration: .6 }); }
          });
        }
      }
    });
  }

  /* ---------------- counters ---------------- */

  function counters() {
    $$('[data-num]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-num'));
      var pad = el.hasAttribute('data-pad');
      var plain = el.hasAttribute('data-plain');
      var from = plain ? target - 14 : 0;
      var o = { v: from };
      el.textContent = pad && String(from).length < 2 ? '0' + from : String(from);

      gsap.to(o, {
        v: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: function () {
          var n = Math.round(o.v);
          el.textContent = (pad && String(n).length < 2) ? '0' + n : String(n);
        }
      });
    });
  }

  /* ---------------- process steps ---------------- */

  function process() {
    var steps = $$('[data-step]');
    var media = $('[data-proc-media]');
    var shots = media ? $$('img', media) : [];

    steps.forEach(function (step, i) {
      var bar = $('.step__bar i', step);

      function light() {
        steps.forEach(function (s) { s.classList.remove('is-active'); });
        step.classList.add('is-active');
        shots.forEach(function (img, j) { img.classList.toggle('is-on', j === i); });
      }
      // onEnter/onEnterBack only: the step you last passed stays lit, so the
      // section never ends with every step greyed out.
      ScrollTrigger.create({
        trigger: step,
        start: 'top 68%',
        end: 'bottom 45%',
        onEnter: light,
        onEnterBack: light
      });

      if (bar) {
        gsap.fromTo(bar, { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: step, start: 'top 72%', end: 'bottom 55%', scrub: .4 }
        });
      }
    });

    if (steps[0]) steps[0].classList.add('is-active');
  }

  /* ---------------- stats background grid (2D canvas) ---------------- */

  function statsGrid() {
    var cv = doc.getElementById('grid-canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, cols = 0, rows = 0, gap = 34;
    var running = false, raf = 0, t = 0;

    function size() {
      var r = cv.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 700 ? 26 : 34;
      cols = Math.ceil(W / gap) + 1;
      rows = Math.ceil(H / gap) + 1;
    }

    function frame() {
      if (!running) return;
      t += 0.012;
      ctx.clearRect(0, 0, W, H);
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var px = x * gap, py = y * gap;
          var wave = Math.sin((px * 0.012) + (py * 0.016) - t * 1.7);
          var a = (wave + 1) / 2;                   // 0..1
          var r = 1 + a * 2.1;
          if (a > 0.82) {
            ctx.fillStyle = 'rgba(255,122,24,' + (a * 0.9) + ')';
          } else {
            ctx.fillStyle = 'rgba(14,122,66,' + (0.18 + a * 0.62) + ')';
          }
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    window.addEventListener('resize', function () { size(); }, { passive: true });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !running) { running = true; size(); frame(); }
        else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
      });
    }, { rootMargin: '120px' });
    io.observe(cv);
  }

  /* ---------------- boot ---------------- */

  function boot() {
    lineReveals();
    paraReveals();
    fades();
    images();
    marquee();
    counters();
    process();
    statsGrid();
    ScrollTrigger.refresh();

    // hero entrance
    var tl = gsap.timeline({ delay: .05 });
    tl.to('.hero h1 .reveal-line > span', { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: .1 }, 0)
      .from('.hero__side > *', { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .09 }, .25)
      .from('.nav .wrap > *', { y: -22, opacity: 0, duration: .7, ease: 'power3.out', stagger: .07 }, .1)
      .from('.hero__cue', { opacity: 0, duration: .6 }, .9);
  }

  function start() {
    if (lenis) lenis.stop();
    runLoader(function () {
      if (lenis) lenis.start();
      boot();
    });
  }

  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(start).catch(start);
  } else {
    window.addEventListener('load', start);
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
