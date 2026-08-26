'use strict';
const express = require('express');
const cart = require('../lib/cart');
const shop = require('../lib/shop');
const router = express.Router();

function back(req, res, fallback) {
  /* Only ever redirect within this site. */
  const ref = req.get('referer');
  if (ref) {
    try {
      const url = new URL(ref);
      if (url.host === req.get('host')) return res.redirect(url.pathname + url.search);
    } catch (err) { /* fall through */ }
  }
  res.redirect(fallback || '/cart');
}

router.get('/cart', (req, res) => {
  res.render('cart', { title: 'Your bag — PESU', description: 'The pieces in your bag.' });
});

router.post('/cart/add', async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const result = await cart.add(req.session, productId, qty);
    const wantsJson = req.get('X-Requested-With') === 'fetch';

    if (wantsJson) {
      const summary = await cart.summary(req.session);
      if (!result.ok) return res.json({ ok: false, error: result.error, count: summary.count });
      const locals = { cart: summary, money: res.locals.money, settings: res.locals.settings,
        imageSrc: res.locals.imageSrc };
      return res.render('partials/cart-lines', locals, (err, html) => {
        if (err) return next(err);
        res.render('partials/cart-foot', locals, (err2, footHtml) =>
          res.json({ ok: true, count: summary.count, html, footHtml: err2 ? null : footHtml }));
      });
    }

    const product = await shop.product(productId);
    if (!result.ok) {
      if (product) return res.redirect(`/product/${product.handle}?error=${encodeURIComponent(result.error)}`);
      return back(req, res);
    }
    req.session.flash = 'Added to your bag';
    res.redirect(product ? `/product/${product.handle}?added=1` : '/cart');
  } catch (err) { next(err); }
});

router.post('/cart/update', async (req, res, next) => {
  try {
    await cart.setQty(req.session, req.body.productId, req.body.qty);
    back(req, res);
  } catch (err) { next(err); }
});

router.post('/cart/remove', (req, res) => {
  cart.remove(req.session, req.body.productId);
  back(req, res);
});

module.exports = router;
