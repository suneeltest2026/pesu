'use strict';
/* Stripe webhooks — the authoritative record of whether an order was paid.
   The customer returning to the success page is a convenience; this is what
   we trust. Mounted before the JSON body parser because signature
   verification needs the raw bytes. */
const express = require('express');
const orders = require('../lib/orders');
const shop = require('../lib/shop');
const mail = require('../lib/mail');

const router = express.Router();

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return res.status(503).send('Stripe is not configured');

  const stripe = require('stripe')(key);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), secret);
  } catch (err) {
    /* An unverified payload is not ours. Never act on it. */
    console.warn('[stripe] signature check failed:', err.message);
    return res.status(400).send('Invalid signature');
  }

  handle(event)
    .then(() => res.json({ received: true }))
    .catch((err) => {
      console.error('[stripe] handler failed for', event.type, err);
      /* 500 asks Stripe to retry — better than losing a paid order. */
      res.status(500).send('Handler error');
    });
});

function referenceFrom(session) {
  return (session.metadata && session.metadata.reference) || session.client_reference_id;
}

async function handle(event) {
  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const reference = referenceFrom(session);
      const order = reference && await orders.byReference(reference);
      if (!order) { console.warn('[stripe] no order for', reference); return; }
      if (order.payment_status === 'paid') return;             /* idempotent */
      if (session.payment_status && session.payment_status !== 'paid') return;

      await orders.markPaid(order.reference, session.id);
      console.log('[stripe] paid:', order.reference);
      const [placed, settings] = await Promise.all([
        orders.byReference(order.reference), shop.settings()
      ]);
      mail.orderPlaced(placed, settings).catch(() => {});
      break;
    }

    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      /* The customer never paid: release the stock rather than holding it. */
      const reference = referenceFrom(session);
      const order = reference && await orders.byReference(reference);
      if (!order || order.payment_status === 'paid' || order.status === 'cancelled') return;
      await orders.cancel(order.id);
      await orders.update(order.id, { payment_status: 'failed' });
      console.log('[stripe] expired, stock returned:', order.reference);
      break;
    }

    default:
      /* Everything else is noise for this store. */
      break;
  }
}

module.exports = router;
