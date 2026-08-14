/* ═══════════════════════════════════════════════════════════
   കോർളി ശ്രീ നരസിംഹമൂർത്തി ക്ഷേത്രം — interactions
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── header: stuck state + scroll progress ─────────────── */
  var hdr      = $('#hdr');
  var progress = $('#progress');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    hdr.classList.toggle('is-stuck', y > 40);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ── mobile nav ────────────────────────────────────────── */
  var burger = $('#burger');
  var nav    = $('#nav');

  function setNav(open) {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    /* the header's backdrop-filter would otherwise contain the fixed drawer */
    hdr.classList.toggle('is-navopen', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'മെനു അടയ്ക്കുക' : 'മെനു തുറക്കുക');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    setNav(!nav.classList.contains('is-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });
  document.addEventListener('click', function (e) {
    if (!nav.classList.contains('is-open')) return;
    if (!e.target.closest('#nav') && !e.target.closest('#burger')) setNav(false);
  });

  /* ── reveal on scroll ──────────────────────────────────── */
  var reveals = $$('.reveal');
  reveals.forEach(function (el) {
    if (el.dataset.d) el.style.setProperty('--d', el.dataset.d);
  });

  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealIO.observe(el); });
  }

  /* ── active nav link ───────────────────────────────────── */
  var navLinks = $$('.nav__list a, .nav__cta');
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ── collapse (read more) ──────────────────────────────── */
  $$('[data-collapse]').forEach(function (box) {
    var body = $('.collapse__body', box);
    var btn  = $('.collapse__btn', box);
    if (!body || !btn) return;

    btn.addEventListener('click', function () {
      var open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
    });

    window.addEventListener('resize', function () {
      if (box.classList.contains('is-open')) body.style.maxHeight = body.scrollHeight + 'px';
    });
  });

  /* ── before / after comparison ─────────────────────────── */
  $$('[data-ba]').forEach(function (ba) {
    var range  = $('.ba__range', ba);
    var clip   = $('.ba__clip', ba);
    var handle = $('.ba__handle', ba);
    if (!range || !clip || !handle) return;

    function paint(pct) {
      clip.style.width = pct + '%';
      handle.style.left = pct + '%';
      /* keep the clipped image at full frame width so it never squashes */
      clip.style.setProperty('--ba-w', ba.clientWidth + 'px');
    }

    range.addEventListener('input', function () { paint(parseFloat(range.value)); });
    window.addEventListener('resize', function () { paint(parseFloat(range.value)); });

    /* drag anywhere on the frame, not just the thumb */
    function fromPointer(e) {
      var r = ba.getBoundingClientRect();
      var pct = ((e.clientX - r.left) / r.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      range.value = pct;
      paint(pct);
    }
    var dragging = false;
    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    ba.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      ba.addEventListener(ev, function () { dragging = false; });
    });

    paint(parseFloat(range.value));

    /* a gentle one-time hint when the frame first comes into view */
    if (!reduced && 'IntersectionObserver' in window) {
      var hinted = false;
      var hintIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting || hinted) return;
          hinted = true;
          hintIO.disconnect();
          var t0 = null;
          (function step(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min((ts - t0) / 1600, 1);
            var eased = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            var v = 50 + Math.sin(eased * Math.PI * 2) * 16;
            range.value = v;
            paint(v);
            if (p < 1) requestAnimationFrame(step);
            else { range.value = 50; paint(50); }
          })(performance.now());
        });
      }, { threshold: 0.55 });
      hintIO.observe(ba);
    }
  });

  /* ── count-up totals ───────────────────────────────────── */
  var counters = $$('[data-count]');
  function fmtINR(n) {
    var s = String(Math.round(n));
    if (s.length <= 3) return s;
    var last3 = s.slice(-3);
    var rest  = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  if (!reduced && 'IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        countIO.unobserve(el);
        var target = parseInt(el.dataset.count, 10);
        var t0 = null, dur = 1500;
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmtINR(target * eased);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ── toast ─────────────────────────────────────────────── */
  var toast = $('#toast');
  var toastT;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }

  /* ── copy bank details ─────────────────────────────────── */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy;
      var done = function () { say('പകർത്തി: ' + text); };
      var fail = function () { say('പകർത്താൻ കഴിഞ്ഞില്ല'); };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy') ? done() : fail(); } catch (e) { fail(); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ── lightbox ──────────────────────────────────────────── */
  var lb    = $('#lb');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCap');
  var items = $$('.gal__it');
  var idx   = 0;
  var lastFocus = null;

  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx];
    lbImg.src = it.dataset.full;
    lbImg.alt = it.dataset.cap || '';
    lbCap.textContent = it.dataset.cap || '';
  }

  function openLB(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('is-on'); });
    $('#lbX').focus();
  }

  function closeLB() {
    lb.classList.remove('is-on');
    document.body.style.overflow = '';
    setTimeout(function () {
      lb.hidden = true;
      lbImg.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    }, 300);
  }

  items.forEach(function (it, i) {
    it.addEventListener('click', function () { openLB(i); });
  });
  $('#lbX').addEventListener('click', closeLB);
  $('#lbP').addEventListener('click', function () { show(idx - 1); });
  $('#lbN').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb__fig')) closeLB();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setNav(false);
      return;
    }
    if (e.key === 'Escape')     closeLB();
    if (e.key === 'ArrowLeft')  show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'Tab') {                       /* keep focus inside the dialog */
      var f = $$('button', lb);
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* swipe on touch */
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 55) show(dx > 0 ? idx - 1 : idx + 1);
    tx = null;
  }, { passive: true });

  /* ── footer year ───────────────────────────────────────── */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
