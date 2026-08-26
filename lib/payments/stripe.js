'use strict';
/* Card payments via Stripe Checkout — the customer is redirected to Stripe's
   hosted page, so no card data ever touches this server and PCI scope stays
   minimal. Set STRIPE_SECRET_KEY to switch it on.

   To use a UAE gateway instead (Telr, PayTabs, Network N-Genius), copy this
   file, build their hosted-payment-page request in start(), and return its
   redirect URL. The rest of checkout is provider-agnostic. */
const { format } = require('../money');

let stripe = null;
function client() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

module.exports = {
  id: 'card',
  label: 'Card',
  description: 'Visa, Mastercard, Apple Pay and Google Pay, on a secure page.',
  available: () => Boolean(process.env.STRIPE_SECRET_KEY),

  async start(order, ctx) {
    const api = client();
    const session = await api.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: order.reference,
      customer_email: order.email,
      line_items: [
        ...order.summary.items.map((item) => ({
          quantity: item.qty,
          price_data: {
            currency: 'aed',
            unit_amount: item.priceFils,
            product_data: { name: item.name, description: item.materialName }
          }
        })),
        ...(order.summary.deliveryFils
          ? [{
              quantity: 1,
              price_data: {
                currency: 'aed',
                unit_amount: order.summary.deliveryFils,
                product_data: { name: 'Delivery', description: format(order.summary.deliveryFils) }
              }
            }]
          : [])
      ],
      success_url: `${ctx.origin}/order/${order.reference}?paid=1`,
      cancel_url: `${ctx.origin}/checkout?cancelled=1`,
      metadata: { reference: order.reference }
    });
    return { redirect: session.url, reference: session.id };
  },

  /* Verifies a returning customer actually paid, without trusting the URL. */
  async verify(sessionId) {
    const api = client();
    if (!api || !sessionId) return false;
    const session = await api.checkout.sessions.retrieve(sessionId);
    return session.payment_status === 'paid';
  }
};
