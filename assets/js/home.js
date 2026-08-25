/* ==========================================================================
   PESU — Homepage behaviour
   Hero parallax and the shop-by-material picker.
   ========================================================================== */
(function (PESU) {
  'use strict';

  var $ = PESU.ui.$, $$ = PESU.ui.$$;
  var catalog = PESU.catalog, store = PESU.store;

  /* --- Shop by material ---------------------------------------------------
     Each swatch swaps the preview to a real piece made from that material. */
  function initMaterialPicker() {
    var preview = $('[data-teaser-preview]');
    var object = $('[data-teaser-object]');
    var caption = $('[data-teaser-caption]');
    var note = $('[data-teaser-note]');
    var cta = $('[data-teaser-cta]');
    var swatchWrap = $('[data-teaser-swatches]');
    if (!preview || !object || !swatchWrap) return;

    var materials = catalog.materials;

    swatchWrap.innerHTML = materials.map(function (m, i) {
      return [
        '<span class="swatch-item">',
        '  <button class="swatch surface ' + m.swatch + '" type="button"',
        '     data-material="' + m.id + '" aria-pressed="' + (i === 0) + '"',
        '     aria-label="' + m.name + '"></button>',
        '  <span class="swatch__label">' + m.short + '</span>',
        '</span>'
      ].join('');
    }).join('');

    function select(id) {
      var material = catalog.byId(materials, id);
      var piece = catalog.ofMaterial(id)[0];
      if (!piece) return;

      object.innerHTML = '<img src="' + catalog.image(piece.images[0], 900) + '" alt="' + piece.name + '">';
      preview.className = 'configure__preview surface ' + material.swatch;
      if (caption) caption.textContent = piece.name + ' — ' + store.format(piece.priceAED);
      if (note) note.textContent = material.note;
      if (cta) {
        cta.href = catalog.productUrl(piece);
        cta.textContent = 'View the ' + material.short.toLowerCase() + ' piece';
      }
      $$('[data-material]', swatchWrap).forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-material') === id));
      });
    }

    $$('[data-material]', swatchWrap).forEach(function (btn) {
      var id = btn.getAttribute('data-material');
      btn.addEventListener('click', function () { select(id); });
      btn.addEventListener('mouseenter', function () { select(id); });
    });

    select(materials[0].id);
  }

  /* --- Ticker -------------------------------------------------------------- */
  function initTicker() {
    var track = $('.ticker__track');
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.parentNode.appendChild(clone);
  }

  /* --- Hero: pointer-led light --------------------------------------------- */
  function initHeroLight() {
    var hero = $('.hero');
    if (!hero || PESU.ui.reduced || window.matchMedia('(pointer: coarse)').matches) return;
    var sun = $('.hero__sun', hero);
    if (!sun) return;
    hero.addEventListener('pointermove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 60;
      var y = (e.clientY / window.innerHeight - 0.5) * 24;
      sun.style.translate = x + 'px ' + y + 'px';
    });
  }

  function init() {
    initMaterialPicker();
    initTicker();
    initHeroLight();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.PESU);
