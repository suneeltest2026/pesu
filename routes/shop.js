'use strict';
const express = require('express');
const shop = require('../lib/shop');
const router = express.Router();

router.get('/', (req, res) => {
  const products = shop.products();
  res.render('home', {
    products,
    spotlight: products.find((p) => p.group_id === 'light') || products[0] || null
  });
});

/* Listing: whole range, or one group. */
function listing(res, { products, heading, activeGroup, activeMaterial }) {
  res.render('collection', {
    products,
    heading,
    activeGroup: activeGroup || null,
    activeMaterial: activeMaterial || null,
    totalCount: shop.products().length,
    title: heading.title + ' — PESU',
    description: heading.line || 'Handmade home decor from PESU.'
  });
}

router.get('/shop', (req, res) => {
  listing(res, {
    products: shop.products(),
    heading: { eyebrow: 'The range', title: 'Everything', line: 'Eight pieces, made by hand from natural materials.' }
  });
});

router.get('/shop/:group', (req, res, next) => {
  const group = shop.group(req.params.group);
  if (!group) return next();
  listing(res, {
    products: shop.products({ group: group.id }),
    activeGroup: group.id,
    heading: { eyebrow: 'The range', title: group.name, line: group.line, crumb: group.name }
  });
});

router.get('/materials', (req, res) => {
  listing(res, {
    products: shop.products(),
    heading: {
      eyebrow: 'Materials',
      title: 'Shop by material',
      line: 'Six materials run through the range. Pick one and see what it becomes.',
      crumb: 'Materials'
    }
  });
});

router.get('/materials/:material', (req, res, next) => {
  const material = shop.material(req.params.material);
  if (!material) return next();
  listing(res, {
    products: shop.products({ material: material.id }),
    activeMaterial: material.id,
    heading: { eyebrow: 'Material', title: material.name, line: material.note, crumb: material.name }
  });
});

router.get('/product/:handle', (req, res, next) => {
  const product = shop.product(req.params.handle);
  if (!product || !product.active) return next();

  /* Old Shopify URLs keep working. */
  if (product.handle !== req.params.handle) {
    return res.redirect(301, '/product/' + product.handle);
  }

  const related = shop.products({ exclude: product.id }).sort(
    (a, b) => (b.group_id === product.group_id) - (a.group_id === product.group_id)
  ).slice(0, 4);

  res.render('product', {
    product,
    related,
    title: product.name + ' — PESU',
    description: product.seo_desc || product.story[0] || product.name,
    error: req.query.error || null
  });
});

/* Search, used by the overlay and by anyone with JavaScript off. */
router.get('/search', (req, res) => {
  const q = String(req.query.q || '');
  const products = q ? shop.search(q) : [];
  if (req.query.json) return res.json({ results: products.map((p) => ({
    name: p.name, handle: p.handle, blurb: p.blurb, price: require('../lib/money').format(p.price_fils),
    image: p.images[0] ? '/images/' + p.images[0] : null, swatch: p.swatch
  })) });
  listing(res, {
    products,
    heading: { eyebrow: 'Search', title: q ? `“${q}”` : 'Search', line: q ? `${products.length} result${products.length === 1 ? '' : 's'}` : '', crumb: 'Search' }
  });
});

/* --- Content pages, written from the store's real policies --------------- */
const pages = require('../lib/pages');
Object.keys(pages).forEach((slug) => {
  router.get('/' + slug, (req, res) => {
    const page = pages[slug](shop.settings());
    res.render('page', { page, title: page.title + ' — PESU', description: page.lede || page.title });
  });
});

router.post('/subscribe', (req, res) => {
  const email = String(req.body.email || '').trim();
  if (email) {
    try {
      require('../db').db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
    } catch (err) { /* never block the page on a mailing list */ }
  }
  req.session.flash = 'Thank you — we will be in touch.';
  res.redirect(req.get('referer') || '/');
});

module.exports = router;
