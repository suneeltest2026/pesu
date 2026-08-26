'use strict';
const express = require('express');
const shop = require('../lib/shop');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await shop.products();
    res.render('home', {
      products,
      spotlight: products.find((p) => p.group_id === 'light') || products[0] || null
    });
  } catch (err) { next(err); }
});

/* Listing: whole range, or one group. */
async function listing(res, { products, heading, activeGroup, activeMaterial }) {
  const all = await shop.products();
  res.render('collection', {
    products,
    heading,
    activeGroup: activeGroup || null,
    activeMaterial: activeMaterial || null,
    totalCount: all.length,
    title: heading.title + ' — PESU',
    description: heading.line || 'Handmade home decor from PESU.'
  });
}

router.get('/shop', async (req, res, next) => {
  try {
    await listing(res, {
      products: await shop.products(),
      heading: { eyebrow: 'The range', title: 'Everything', line: 'Made by hand from natural materials.' }
    });
  } catch (err) { next(err); }
});

router.get('/shop/:group', async (req, res, next) => {
  try {
    const group = await shop.group(req.params.group);
    if (!group) return next();
    await listing(res, {
      products: await shop.products({ group: group.id }),
      activeGroup: group.id,
      heading: { eyebrow: 'The range', title: group.name, line: group.line, crumb: group.name }
    });
  } catch (err) { next(err); }
});

router.get('/materials', async (req, res, next) => {
  try {
    await listing(res, {
      products: await shop.products(),
    heading: {
      eyebrow: 'Materials',
      title: 'Shop by material',
      line: 'Six materials run through the range. Pick one and see what it becomes.',
        crumb: 'Materials'
      }
    });
  } catch (err) { next(err); }
});

router.get('/materials/:material', async (req, res, next) => {
  try {
    const material = await shop.material(req.params.material);
    if (!material) return next();
    await listing(res, {
      products: await shop.products({ material: material.id }),
      activeMaterial: material.id,
      heading: { eyebrow: 'Material', title: material.name, line: material.note, crumb: material.name }
    });
  } catch (err) { next(err); }
});

router.get('/product/:handle', async (req, res, next) => {
  try {
    const product = await shop.product(req.params.handle);
    if (!product || !product.active) return next();

  /* Old Shopify URLs keep working. */
  if (product.handle !== req.params.handle) {
    return res.redirect(301, '/product/' + product.handle);
  }

    const related = (await shop.products({ exclude: product.id })).sort(
      (a, b) => (b.group_id === product.group_id) - (a.group_id === product.group_id)
    ).slice(0, 4);

    res.render('product', {
      product,
      related,
      title: product.name + ' — PESU',
      description: product.seo_desc || product.story[0] || product.name,
      error: req.query.error || null
    });
  } catch (err) { next(err); }
});

/* Search, used by the overlay and by anyone with JavaScript off. */
router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '');
    const products = q ? await shop.search(q) : [];
    if (req.query.json) {
      return res.json({ results: products.map((p) => ({
        name: p.name, handle: p.handle, blurb: p.blurb,
        price: require('../lib/money').format(p.price_fils),
        image: p.images[0] ? res.locals.imageSrc(p.images[0]) : null, swatch: p.swatch
      })) });
    }
    await listing(res, {
      products,
      heading: {
        eyebrow: 'Search', title: q ? `“${q}”` : 'Search',
        line: q ? `${products.length} result${products.length === 1 ? '' : 's'}` : '', crumb: 'Search'
      }
    });
  } catch (err) { next(err); }
});

/* --- Content pages, written from the store's real policies --------------- */
const pages = require('../lib/pages');
Object.keys(pages).forEach((slug) => {
  router.get('/' + slug, async (req, res, next) => {
    try {
      const page = pages[slug](await shop.settings());
      res.render('page', { page, title: page.title + ' — PESU', description: page.lede || page.title });
    } catch (err) { next(err); }
  });
});

router.post('/subscribe', async (req, res) => {
  const email = String(req.body.email || '').trim();
  if (email) {
    try {
      await require('../db').query(
        'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [email]);
    } catch (err) { /* never block the page on a mailing list */ }
  }
  req.session.flash = 'Thank you — we will be in touch.';
  res.redirect(req.get('referer') || '/');
});

module.exports = router;
