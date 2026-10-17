'use strict';
const express = require('express');
const cart = require('../lib/cart');
const orders = require('../lib/orders');
const payments = require('../lib/payments');
const shop = require('../lib/shop');
const mail = require('../lib/mail');
const shipping = require('../lib/shipping');
const router = express.Router();

function origin(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

function renderCheckout(req, res, { error, form } = {}) {
  res.render('checkout', {
    title: 'Checkout — PESU',
    description: 'Complete your order.',
    methods: payments.all(),
    countries: shipping.COUNTRIES,
    destination: shipping.country(req.session.country) || shipping.COUNTRIES[0],
    form: form || {},
    error: error || null
  });
}

/* Choosing where the order goes. Kept in the session so the bag, checkout
   and the order all price delivery the same way. */
function setCountry(req, code) {
  const c = shipping.country(code);
  if (c) req.session.country = c.code;
  return c;
}

router.get('/checkout', async (req, res, next) => {
  try {
    if (req.query.country) {
      setCountry(req, req.query.country);
      return res.redirect(303, '/checkout');
    }
    const summary = await cart.summary(req.session);
    if (!summary.items.length) return res.redirect('/cart');
    renderCheckout(req, res, {
      error: req.query.cancelled ? 'Payment was cancelled — nothing has been charged.' : null
    });
  } catch (err) { next(err); }
});

router.post('/checkout', async (req, res, next) => {
  const form = req.body;
  const destination = setCountry(req, form.country);
  if (!destination) {
    return renderCheckout(req, res, { form, error: 'We do not deliver to that country yet.' });
  }
  /* Load the bag only after the destination is set, so the delivery charge
     the customer pays is the one for where it is going. The country chosen
     here is also the one shown in the summary when the page re-renders. */
  const summary = await cart.summary(req.session);
  res.locals.cart = summary;
  if (!summary.items.length) return res.redirect('/cart');

  const required = ['name', 'email', 'phone', 'address1', 'city', 'emirate'];
  const missing = required.filter((f) => !String(form[f] || '').trim());
  if (missing.length) {
    return renderCheckout(req, res, { form, error: 'Please complete every required field.' });
  }
  if (destination.regions && !destination.regions.includes(form.emirate)) {
    return renderCheckout(req, res, { form, error: 'Choose an emirate.' });
  }
  form.country = destination.name;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    return renderCheckout(req, res, { form, error: 'That email address does not look right.' });
  }

  const method = payments.get(form.method);
  if (!method) return renderCheckout(req, res, { form, error: 'Choose a payment method.' });

  let order;
  try {
    order = await orders.create(req.session, form, method.id);
  } catch (err) {
    return renderCheckout(req, res, { form, error: err.message });
  }

  try {
    const started = await method.start(
      { ...order, email: form.email, summary: order.summary },
      { origin: origin(req) }
    );

    if (started.redirect) {
      /* Keep the gateway's session id: it is how the webhook and the return
         journey both identify this order. */
      if (started.reference) await orders.setPaymentRef(order.reference, started.reference);
      /* The bag is only emptied once the customer is safely at the gateway. */
      cart.clear(req.session);
      return res.redirect(303, started.redirect);
    }

    cart.clear(req.session);
    const [placed, settings] = await Promise.all([
      orders.byReference(order.reference), shop.settings()
    ]);
    await mail.orderPlaced(placed, settings).catch((err) => console.error('[mail]', err.message));
    return res.redirect(303, '/order/' + order.reference);
  } catch (err) {
    /* Payment could not start: put the stock back rather than stranding it. */
    console.error('[checkout] payment start failed:', err.message);
    await orders.cancel(order.id);
    return renderCheckout(req, res, {
      form,
      error: 'We could not reach the payment provider. Nothing has been charged — please try again.'
    });
  }
});

router.get('/order/:reference', async (req, res, next) => {
  try {
  const order = await orders.byReference(req.params.reference);
  if (!order) return next();

  /* A customer returning from the gateway: verify with the provider, never
     trust the query string. */
  if (req.query.paid && order.payment_status !== 'paid' && order.payment_method === 'card') {
    try {
      const card = payments.get('card');
      if (card && card.verify && order.payment_ref && await card.verify(order.payment_ref)) {
        await orders.markPaid(order.reference, order.payment_ref);
        order.payment_status = 'paid';
        await mail.orderPlaced(order, await shop.settings()).catch((err) => console.error('[mail]', err.message));
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
  } catch (err) { next(err); }
});

router.get('/order-lookup', (req, res) => {
  res.render('order-lookup', { title: 'Track an order — PESU', description: 'Find your order.', error: null });
});

router.post('/order-lookup', async (req, res, next) => {
  try {
  const order = await orders.byReference(String(req.body.reference || '').trim().toUpperCase());
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!order || order.email.toLowerCase() !== email) {
    return res.render('order-lookup', {
      title: 'Track an order — PESU',
      description: 'Find your order.',
      error: 'We could not find an order with that reference and email.'
    });
  }
  res.redirect('/order/' + order.reference);
  } catch (err) { next(err); }
});

module.exports = router;
