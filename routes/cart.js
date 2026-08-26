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

router.post('/cart/add', (req, res) => {
  const { productId, qty } = req.body;
  const result = cart.add(req.session, productId, qty);
  const wantsJson = req.get('X-Requested-With') === 'fetch';

  if (wantsJson) {
    const summary = cart.summary(req.session);
    if (!result.ok) return res.json({ ok: false, error: result.error, count: summary.count });
    return res.render('partials/cart-lines', { cart: summary, money: res.locals.money }, (err, html) => {
      if (err) return res.json({ ok: true, count: summary.count });
      res.render('partials/cart-foot', { cart: summary, settings: res.locals.settings, money: res.locals.money },
        (err2, footHtml) => res.json({ ok: true, count: summary.count, html, footHtml: err2 ? null : footHtml }));
    });
  }

  if (!result.ok) {
    const product = shop.product(productId);
    if (product) return res.redirect(`/product/${product.handle}?error=${encodeURIComponent(result.error)}`);
    return back(req, res);
  }
  req.session.flash = 'Added to your bag';
  const product = shop.product(productId);
  res.redirect(product ? `/product/${product.handle}?added=1` : '/cart');
});

router.post('/cart/update', (req, res) => {
  cart.setQty(req.session, req.body.productId, req.body.qty);
  back(req, res);
});

router.post('/cart/remove', (req, res) => {
  cart.remove(req.session, req.body.productId);
  back(req, res);
});

module.exports = router;
