/* ==========================================================================
   PESU — Product detail
   One page renders any product in the range: ?product=<id>, defaulting to
   the featured piece. Gallery, specifications, delivery and the purchase
   rail are all driven from catalog.js, so adding a product to Shopify and
   regenerating the catalogue is the only step needed to publish it here.

   Note for production: this renders client-side. Before launch each product
   should be pre-rendered to its own HTML file (or moved onto a framework
   with SSG) so it is crawlable and shareable.
   ========================================================================== */
(function (PESU) {
  'use strict';

  var $ = PESU.ui.$, $$ = PESU.ui.$$;
  var store = PESU.store, catalog = PESU.catalog;

  var product = null;
  var qty = 1;
  var els = {};

  function currentId() {
    var match = /[?&]product=([\w-]+)/.exec(window.location.search);
    return match ? match[1] : catalog.featuredId;
  }

  function groupName(id) {
    return catalog.byId(catalog.groups, id).name;
  }

  function materialName(id) {
    return catalog.byId(catalog.materials, id).name;
  }

  /* --- Gallery ------------------------------------------------------------ */
  function renderGallery() {
    var images = product.images;
    var swatch = catalog.byId(catalog.materials, product.material).swatch;

    els.stage.className = 'gallery__stage surface ' + swatch;
    els.stage.querySelectorAll('.gallery__view').forEach(function (el) { el.remove(); });

    images.forEach(function (url, i) {
      var view = document.createElement('div');
      view.className = 'gallery__view gallery__view--photo' + (i === 0 ? ' is-active' : '');
      view.setAttribute('data-view', String(i));
      view.innerHTML = '<img src="' + catalog.image(url, 1200) + '" alt="' +
        product.name + (i ? ' — view ' + (i + 1) : '') + '" loading="' + (i ? 'lazy' : 'eager') + '">';
      els.stage.appendChild(view);
    });

    els.thumbs.innerHTML = images.length < 2 ? '' : images.map(function (url, i) {
      return [
        '<button class="gallery__thumb surface ' + swatch + '" type="button" role="tab"',
        '  data-view="' + i + '" aria-selected="' + (i === 0) + '">',
        '  <img src="' + catalog.image(url, 300) + '" alt="">',
        '  <span class="visually-hidden">View ' + (i + 1) + '</span>',
        '</button>'
      ].join('');
    }).join('');

    $$('.gallery__thumb', els.thumbs).forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var view = thumb.getAttribute('data-view');
        $$('.gallery__thumb', els.thumbs).forEach(function (t) {
          t.setAttribute('aria-selected', String(t === thumb));
        });
        $$('.gallery__view', els.stage).forEach(function (v) {
          v.classList.toggle('is-active', v.getAttribute('data-view') === view);
        });
        els.stage.classList.remove('is-zoomed');
      });
    });
  }

  /* --- Purchase rail ------------------------------------------------------ */
  function renderRail() {
    els.eyebrow.textContent = groupName(product.group) + ' — ' + materialName(product.material);
    els.title.textContent = product.name;
    els.fullTitle.textContent = product.fullTitle;
    els.price.textContent = store.format(product.priceAED);

    var free = product.priceAED >= catalog.shipping.freeThresholdAED;
    els.delivery.textContent = free
      ? 'Free delivery across the UAE'
      : 'Delivery AED ' + catalog.shipping.flatAED + ' — free over AED ' + catalog.shipping.freeThresholdAED;

    els.stock.textContent = product.inventory > 0
      ? (product.inventory <= 5 ? 'Only ' + product.inventory + ' left' : 'In stock')
      : 'Sold out';
    els.stock.classList.toggle('is-low', product.inventory > 0 && product.inventory <= 5);

    els.features.innerHTML = product.features.map(function (f) {
      return '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L19 7"/></svg><span>' + f + '</span></li>';
    }).join('');

    /* Real Shopify options only. Most of the range is single-variant, and in
       that case no option group renders at all. */
    if (product.options && product.options.length) {
      els.optionsWrap.hidden = false;
      els.optionsWrap.innerHTML = product.options.map(function (opt) {
        return [
          '<div class="config__group">',
          '  <div class="config__group-head">',
          '    <span class="config__group-label">' + opt.name + '</span>',
          '  </div>',
          '  <div class="options">',
          opt.values.map(function (v, i) {
            return '<button class="option" type="button" aria-pressed="' + (i === 0) + '">' + v + '</button>';
          }).join(''),
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    } else {
      els.optionsWrap.hidden = true;
      els.optionsWrap.innerHTML = '';
    }

    els.qty.textContent = qty;
    els.buybarName.textContent = product.name;
    els.buybarPrice.textContent = store.format(product.priceAED * qty);
    els.addBtns.forEach(function (btn) {
      btn.disabled = product.inventory <= 0;
      btn.textContent = product.inventory > 0 ? 'Add to bag' : 'Sold out';
    });

    els.wish.setAttribute('data-wishlist-sku', product.id);
    els.wish.setAttribute('aria-pressed', String(store.inWishlist(product.id)));

    els.shopLink.href = catalog.shop.storeUrl + '/products/' + product.handle;
  }

  /* --- Story, specs, policies --------------------------------------------- */
  function renderStory() {
    els.story.innerHTML = product.story.map(function (p) { return '<p>' + p + '</p>'; }).join('');

    els.specs.innerHTML = Object.keys(product.specs).map(function (key) {
      return '<dt>' + key + '</dt><dd>' + product.specs[key] + '</dd>';
    }).join('');

    var ship = catalog.shipping;
    els.shipping.innerHTML = [
      '<dt>Processing</dt><dd>' + ship.processing + ' after payment</dd>',
      '<dt>Dubai</dt><dd>' + ship.dubai + '</dd>',
      '<dt>Other emirates</dt><dd>' + ship.emirates + '</dd>',
      '<dt>International</dt><dd>' + ship.international + '</dd>',
      '<dt>Cost</dt><dd>Free over AED ' + ship.freeThresholdAED + ' in the UAE; AED ' + ship.flatAED +
        ' below that, AED ' + ship.outsideUaeAED + ' outside the UAE</dd>',
      '<dt>Courier</dt><dd>' + ship.courier + ' and trusted logistics partners</dd>'
    ].join('');

    els.returns.innerHTML = [
      '<p>' + catalog.returns.days + '-day returns from the day your order arrives. ' +
        catalog.returns.note + '</p>',
      '<p>Start a return by writing to <a href="mailto:' + catalog.shop.email + '">' +
        catalog.shop.email + '</a> — we will send a return label and instructions. Returns sent ' +
        'without being requested first cannot be accepted. Customised and personal-care items are ' +
        'excluded.</p>'
    ].join('');
  }

  /* --- Related ------------------------------------------------------------- */
  function renderRelated() {
    var others = catalog.products.filter(function (p) { return p.id !== product.id; });
    /* Same group first, then the rest of the range. */
    others.sort(function (a, b) {
      return (b.group === product.group) - (a.group === product.group);
    });
    els.related.innerHTML = others.slice(0, 4).map(function (p) {
      var swatch = catalog.byId(catalog.materials, p.material).swatch;
      return [
        '<a class="tile" href="' + catalog.productUrl(p) + '" data-reveal-child>',
        '  <div class="tile__media surface ' + swatch + '">',
        '    <img src="' + catalog.image(p.images[0], 600) + '" alt="' + p.name + '" loading="lazy">',
        '  </div>',
        '  <div class="tile__body">',
        '    <div><h3 class="tile__name">' + p.name + '</h3>',
        '    <p class="tile__meta">' + groupName(p.group) + '</p></div>',
        '    <p class="tile__price num">' + store.format(p.priceAED) + '</p>',
        '  </div>',
        '</a>'
      ].join('');
    }).join('');
  }

  /* --- Page --------------------------------------------------------------- */
  function render() {
    renderGallery();
    renderRail();
    renderStory();
    renderRelated();

    document.title = product.name + ' — PESU';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', product.story[0]);
    els.crumb.textContent = product.name;
  }

  function addToBag() {
    store.addToCart({
      sku: product.id,
      name: product.name,
      collection: groupName(product.group),
      priceAED: product.priceAED,
      qty: qty,
      specLines: [materialName(product.material)],
      options: {},
      swatch: catalog.byId(catalog.materials, product.material).swatch,
      image: catalog.image(product.images[0], 200),
      leadTime: '',
      href: catalog.productUrl(product)
    });
    PESU.ui.toast('Added to your bag');
    PESU.ui.openPanel('#cart');
  }

  function init() {
    els.rail = $('.config');
    if (!els.rail) return;

    product = catalog.product(currentId());

    els.stage      = $('.gallery__stage');
    els.thumbs     = $('.gallery__thumbs');
    els.eyebrow    = $('[data-product-eyebrow]');
    els.title      = $('[data-product-title]');
    els.fullTitle  = $('[data-product-fulltitle]');
    els.price      = $('[data-unit-price]');
    els.delivery   = $('[data-delivery-line]');
    els.stock      = $('[data-stock]');
    els.features   = $('[data-features]');
    els.optionsWrap = $('[data-product-options]');
    els.qty        = $('[data-qty]');
    els.wish       = $('[data-wish]');
    els.shopLink   = $('[data-shop-link]');
    els.story      = $('[data-story]');
    els.specs      = $('[data-specs]');
    els.shipping   = $('[data-shipping]');
    els.returns    = $('[data-returns]');
    els.related    = $('[data-related]');
    els.crumb      = $('[data-crumb]');
    els.buybarName = $('[data-buybar-name]');
    els.buybarPrice = $('[data-buybar-price]');
    els.addBtns    = $$('[data-add-to-cart]');

    els.stage.addEventListener('click', function (e) {
      var rect = els.stage.getBoundingClientRect();
      els.stage.style.setProperty('--zx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      els.stage.style.setProperty('--zy', ((e.clientY - rect.top) / rect.height * 100) + '%');
      els.stage.classList.toggle('is-zoomed');
    });

    $$('[data-qty-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = qty + parseInt(btn.getAttribute('data-qty-step'), 10);
        qty = Math.max(1, Math.min(product.inventory || 1, next));
        renderRail();
      });
    });

    els.addBtns.forEach(function (btn) { btn.addEventListener('click', addToBag); });

    els.wish.addEventListener('click', function () {
      var on = store.toggleWishlist(product.id);
      els.wish.setAttribute('aria-pressed', String(on));
      PESU.ui.toast(on ? 'Saved to your wishlist' : 'Removed from wishlist');
    });

    var bar = $('.buybar'), anchor = $('[data-buy-anchor]');
    if (bar && anchor && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('is-visible', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(anchor);
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.PESU);
