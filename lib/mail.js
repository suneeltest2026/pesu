'use strict';
/* Transactional email. Optional by design: with no SMTP configured the store
   still takes orders, it just doesn't send confirmations — so a mail outage
   can never block a sale. */
const nodemailer = require('nodemailer');
const { format } = require('./money');

let transport = null;
function client() {
  if (transport || !process.env.SMTP_HOST) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transport;
}

async function orderPlaced(order, settings) {
  const api = client();
  if (!api || !order) {
    console.log('[mail] order', order && order.reference, '— no SMTP configured, skipping');
    return;
  }
  const lines = order.items
    .map((i) => `${i.qty} × ${i.name} — ${format(i.price_fils * i.qty)}`)
    .join('\n');

  await api.sendMail({
    from: process.env.SMTP_FROM || settings.shop_email,
    to: order.email,
    bcc: settings.shop_email,
    subject: `Your PESU order ${order.reference}`,
    text: [
      `Thank you — we have your order.`,
      ``,
      `Reference: ${order.reference}`,
      ``,
      lines,
      ``,
      `Subtotal: ${format(order.subtotal_fils)}`,
      `Delivery: ${order.delivery_fils ? format(order.delivery_fils) : 'Free'}`,
      `Total: ${format(order.total_fils)}`,
      ``,
      `Delivering to:`,
      `${order.name}`,
      `${order.address1}${order.address2 ? ', ' + order.address2 : ''}`,
      `${order.city}, ${order.emirate}`,
      ``,
      `Dispatched in ${settings.ship_processing} by ${settings.ship_courier}.`,
      `Track it any time: ${process.env.PUBLIC_URL || ''}/order-lookup`,
      ``,
      `${settings.shop_name} · ${settings.shop_email} · ${settings.shop_phone}`
    ].join('\n')
  });
}

module.exports = { orderPlaced };
