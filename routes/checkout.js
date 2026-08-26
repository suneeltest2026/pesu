'use strict';
const express = require('express');
const cart = require('../lib/cart');
const orders = require('../lib/orders');
const payments = require('../lib/payments');
const shop = require('../lib/shop');
const mail = require('../lib/mail');
const router = express.Router();

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

function origin(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

function renderCheckout(req, res, { error, form } = {}) {
  res.render('checkout', {
    title: 'Checkout — PESU',
    description: 'Complete your order.',
    methods: payments.all(),
    emirates: EMIRATES,
    form: form || {},
    error: error || null
  });
}

router.get('/checkout', (req, res) => {
  const summary = cart.summary(req.session);
  if (!summary.items.length) return res.redirect('/cart');
  renderCheckout(req, res, { error: req.query.cancelled ? 'Payment was cancelled — nothing has been charged.' : null });
});

router.post('/checkout', async (req, res, next) => {
  const form = req.body;
  const summary = cart.summary(req.session);
  if (!summary.items.length) return res.redirect('/cart');

  const required = ['name', 'email', 'phone', 'address1', 'city', 'emirate'];
  const missing = required.filter((f) => !String(form[f] || '').trim());
  if (missing.length) {
    return renderCheckout(req, res, { form, error: 'Please complete every required field.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    return renderCheckout(req, res, { form, error: 'That email address does not look right.' });
  }

  const method = payments.get(form.method);
  if (!method) return renderCheckout(req, res, { form, error: 'Choose a payment method.' });

  let order;
  try {
    order = orders.create(req.session, form, method.id);
  } catch (err) {
    return renderCheckout(req, res, { form, error: err.message });
  }

  try {
    const started = await method.start(
      { ...order, email: form.email, summary: order.summary },
      { origin: origin(req) }
    );

    if (started.redirect) {
      /* The bag is only emptied once the customer is safely at the gateway. */
      cart.clear(req.session);
      return res.redirect(303, started.redirect);
    }

    cart.clear(req.session);
    mail.orderPlaced(orders.byReference(order.reference), shop.settings()).catch(() => {});
    return res.redirect(303, '/order/' + order.reference);
  } catch (err) {
    /* Payment could not start: put the stock back rather than stranding it. */
    orders.cancel(order.id);
    return renderCheckout(req, res, {
      form,
      error: 'We could not reach the payment provider. Nothing has been charged — please try again.'
    });
  }
});

router.get('/order/:reference', async (req, res, next) => {
  const order = orders.byReference(req.params.reference);
  if (!order) return next();

  /* A customer returning from the gateway: verify with the provider, never
     trust the query string. */
  if (req.query.paid && order.payment_status !== 'paid' && order.payment_method === 'card') {
    try {
      const card = payments.get('card');
      if (card && card.verify && order.payment_ref && await card.verify(order.payment_ref)) {
        orders.markPaid(order.reference, order.payment_ref);
        order.payment_status = 'paid';
        mail.orderPlaced(order, shop.settings()).catch(() => {});
      }
    } catch (err) { /* show the order regardless; the admin can confirm */ }
  }

  const bank = order.payment_method === 'bank' ? require('../lib/payments/bank').details() : null;
  res.render('order', {
    order,
    bank,
    title: 'Order ' + order.reference + ' — PESU',
    description: 'Your PESU order.'
  });
});

router.get('/order-lookup', (req, res) => {
  res.render('order-lookup', { title: 'Track an order — PESU', description: 'Find your order.', error: null });
});

router.post('/order-lookup', (req, res) => {
  const order = orders.byReference(String(req.body.reference || '').trim().toUpperCase());
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!order || order.email.toLowerCase() !== email) {
    return res.render('order-lookup', {
      title: 'Track an order — PESU',
      description: 'Find your order.',
      error: 'We could not find an order with that reference and email.'
    });
  }
  res.redirect('/order/' + order.reference);
});

module.exports = router;
