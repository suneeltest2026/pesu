/* ==========================================================================
   PESU — client behaviour
   The site works with JavaScript off: every action is a real form post. This
   layer adds reveals, overlays, the gallery, and turns add-to-bag into a
   fetch so the drawer can open without a page change.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* --- Reveals ----------------------------------------------------------- */
  function initReveals() {
    var items = $$('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) {
      if (el.hasAttribute('data-reveal-stagger')) {
        $$('[data-reveal-child]', el).forEach(function (c, j) {
          c.style.setProperty('--reveal-delay', (j * 90) + 'ms');
        });
      }
      io.observe(el);
    });
  }

  /* --- Header ------------------------------------------------------------ */
  function initHeader() {
    var header = $('.header');
    if (!header) return;
    var overlay = document.body.getAttribute('data-header') === 'overlay';
    var hero = $('.hero');
    var last = window.scrollY;
    function update() {
      var y = window.scrollY;
      var threshold = overlay && hero ? hero.offsetHeight - 120 : -1;
      header.classList.toggle('is-solid', y > threshold);
      if (!document.body.classList.contains('is-locked')) {
        header.classList.toggle('is-hidden', y > last && y > threshold + 200);
      }
      last = y;
      document.documentElement.style.setProperty('--scroll', String(y));
    }
    update();
    window.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
  }

  /* --- Overlays ---------------------------------------------------------- */
  var openPanel = null, lastFocus = null;
  function focusables(root) {
    return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function setPanel(el, open) {
    var scrim = $('.scrim');
    if (open) {
      if (openPanel && openPanel !== el) setPanel(openPanel, false);
      lastFocus = document.activeElement;
      el.classList.add('is-open');
      el.removeAttribute('aria-hidden');
      if (scrim) scrim.classList.add('is-open');
      document.body.classList.add('is-locked');
      openPanel = el;
      var f = focusables(el)[0];
      if (f) window.setTimeout(function () { f.focus(); }, 120);
    } else {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      if (scrim) scrim.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (openPanel === el) openPanel = null;
      $$('[aria-expanded="true"][data-panel]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
  }
  function initPanels() {
    $$('[data-panel]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var el = $(btn.getAttribute('data-panel'));
        if (!el) return;              /* no panel: let the link navigate */
        e.preventDefault();
        var open = !el.classList.contains('is-open');
        setPanel(el, open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    $$('[data-close-panel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = btn.closest('.drawer, .megamenu, .search') || openPanel;
        if (el) setPanel(el, false);
      });
    });
    var scrim = $('.scrim');
    if (scrim) scrim.addEventListener('click', function () { if (openPanel) setPanel(openPanel, false); });
    document.addEventListener('keydown', function (e) {
      if (!openPanel) return;
      if (e.key === 'Escape') return setPanel(openPanel, false);
      if (e.key !== 'Tab') return;
      var f = focusables(openPanel);
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });
  }

  /* --- Add to bag without leaving the page -------------------------------- */
  function initBagForms() {
    $$('form[action="/cart/add"]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        if (!window.fetch) return;                 /* no fetch: normal post */
        e.preventDefault();
        var button = form.querySelector('button[type="submit"]');
        if (button) button.disabled = true;
        fetch('/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'fetch' },
          body: new URLSearchParams(new FormData(form)).toString(),
          credentials: 'same-origin'
        }).then(function (r) { return r.json(); })
          .then(function (data) {
            if (button) button.disabled = false;
            if (!data.ok) { toast(data.error || 'That did not work'); return; }
            refreshBag(data);
            var drawer = $('#cart');
            if (drawer) setPanel(drawer, true);
            toast('Added to your bag');
          })
          .catch(function () { form.submit(); });
      });
    });
  }

  function refreshBag(data) {
    $$('[data-cart-count]').forEach(function (el) { el.textContent = data.count; });
    var body = $('[data-cart-body]');
    if (body && data.html) body.innerHTML = data.html;
    var foot = $('#cart .drawer__foot');
    if (foot && data.footHtml) foot.outerHTML = data.footHtml;
  }

  /* --- Quantity steppers --------------------------------------------------- */
  function initQty() {
    $$('[data-qty-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentNode.querySelector('input[name="qty"]');
        if (!input) return;
        var step = parseInt(btn.getAttribute('data-qty-step'), 10);
        var max = parseInt(input.getAttribute('max'), 10) || 99;
        input.value = Math.max(1, Math.min(max, (parseInt(input.value, 10) || 1) + step));
      });
    });
  }

  /* --- Gallery -------------------------------------------------------------- */
  function initGallery() {
    var stage = $('.gallery__stage');
    if (!stage) return;
    $$('.gallery__thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var view = thumb.getAttribute('data-view');
        $$('.gallery__thumb').forEach(function (t) { t.setAttribute('aria-selected', String(t === thumb)); });
        $$('.gallery__view').forEach(function (v) {
          v.classList.toggle('is-active', v.getAttribute('data-view') === view);
        });
        stage.classList.remove('is-zoomed');
      });
    });
    stage.addEventListener('click', function (e) {
      var rect = stage.getBoundingClientRect();
      stage.style.setProperty('--zx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      stage.style.setProperty('--zy', ((e.clientY - rect.top) / rect.height * 100) + '%');
      stage.classList.toggle('is-zoomed');
    });
  }

  /* --- Shop by material ----------------------------------------------------- */
  function initMaterialPicker() {
    var preview = $('[data-teaser-preview]');
    var object = $('[data-teaser-object]');
    var caption = $('[data-teaser-caption]');
    var note = $('[data-teaser-note]');
    var cta = $('[data-teaser-cta]');
    if (!preview || !object) return;
    $$('[data-material]').forEach(function (btn) {
      function show(e) {
        if (e) e.preventDefault();
        var piece;
        try { piece = JSON.parse(btn.getAttribute('data-piece')); } catch (err) { return; }
        if (piece.img) object.innerHTML = '<img src="' + piece.img + '" alt="' + piece.name + '">';
        preview.className = 'configure__preview surface ' + piece.swatch;
        if (caption) caption.textContent = piece.name + ' — ' + piece.price;
        if (note) note.textContent = piece.note;
        if (cta) cta.href = piece.href;
        $$('[data-material]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      }
      btn.addEventListener('mouseenter', show);
      btn.addEventListener('click', show);
    });
  }

  /* --- Search --------------------------------------------------------------- */
  function initSearch() {
    var input = $('[data-search-input]');
    var results = $('[data-search-results]');
    if (!input || !results) return;
    var timer;
    function run(q) {
      fetch('/search?json=1&q=' + encodeURIComponent(q), { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          results.innerHTML = data.results.length ? data.results.map(function (p) {
            return '<a class="search__result" href="/product/' + p.handle + '">' +
              '<span class="surface ' + p.swatch + '">' + (p.image ? '<img src="' + p.image + '" alt="">' : '') + '</span>' +
              '<span><span class="tile__name" style="font-size:var(--step-1)">' + p.name + '</span>' +
              '<span class="tile__meta" style="display:block">' + (p.blurb || '') + '</span></span>' +
              '<span class="tile__price num">' + p.price + '</span></a>';
          }).join('') : '<p class="prose">Nothing matches. <a class="link" href="/shop">See the whole range</a>.</p>';
        });
    }
    input.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { run(input.value); }, 180);
    });
    $$('[data-search-term]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.getAttribute('data-search-term');
        run(input.value);
        input.focus();
      });
    });
    run('');
  }

  /* --- Accordions, ticker, toasts, misc ------------------------------------- */
  function initAccordions() {
    $$('.accordion__trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.accordion__item');
        btn.setAttribute('aria-expanded', String(item.classList.toggle('is-open')));
      });
    });
  }

  function initTicker() {
    var track = $('.ticker__track');
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.parentNode.appendChild(clone);
  }

  function toast(message) {
    var stack = $('.toast-stack');
    if (!stack) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="toast__dot"></span>' + message;
    stack.appendChild(el);
    window.setTimeout(function () {
      el.classList.add('is-out');
      window.setTimeout(function () { el.remove(); }, 400);
    }, 2600);
  }

  function initHeroLight() {
    var hero = $('.hero');
    if (!hero || reduced || window.matchMedia('(pointer: coarse)').matches) return;
    var sun = $('.hero__sun', hero);
    if (!sun) return;
    hero.addEventListener('pointermove', function (e) {
      sun.style.translate = ((e.clientX / window.innerWidth - 0.5) * 60) + 'px ' +
                            ((e.clientY / window.innerHeight - 0.5) * 24) + 'px';
    });
  }

  function initBuyBar() {
    var bar = $('.buybar'), anchor = $('[data-buy-anchor]');
    if (!bar || !anchor || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(anchor);
  }

  function init() {
    initReveals(); initHeader(); initPanels(); initBagForms(); initQty();
    initGallery(); initMaterialPicker(); initSearch(); initAccordions();
    initTicker(); initHeroLight(); initBuyBar();
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    var flash = document.body.getAttribute('data-flash');
    if (flash) toast(flash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
