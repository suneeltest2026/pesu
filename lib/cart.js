'use strict';
/* The bag lives in the session, server-side. Prices are never taken from the
   client — every line is re-priced from the database on read, so a tampered
   request cannot change what an order costs. */
const shop = require('./shop');
const shipping = require('./shipping');

function raw(session) {
  if (!session.cart) session.cart = [];
  return session.cart;
}

/* A line is one product in one chosen option (a colour, a size). The
   option is checked against the product's own list, never taken on trust. */
function pickOption(product, option) {
  const values = (product.options && product.options[0] && product.options[0].values) || [];
  if (!values.length) return '';
  return values.includes(option) ? option : values[0];
}

const same = (productId, option) => (l) => l.productId === productId && (l.option || '') === (option || '');

async function add(session, productId, qty, option) {
  const product = await shop.product(productId);
  if (!product || !product.active) return { ok: false, error: 'That piece is no longer available.' };
  const chosen = pickOption(product, option);

  const lines = raw(session);
  const existing = lines.find(same(product.id, chosen));
  const inBag = lines.filter((l) => l.productId === product.id).reduce((n, l) => n + l.qty, 0);
  const adding = Math.max(1, Number(qty) || 1);

  if (inBag + adding > product.inventory) {
    return {
      ok: false,
      error: product.inventory === 0
        ? 'Sold out.'
        : `Only ${product.inventory} left, and you have ${inBag} in your bag.`
    };
  }

  if (existing) existing.qty += adding;
  else lines.push({ productId: product.id, option: chosen, qty: adding });
  return { ok: true };
}

async function setQty(session, productId, qty, option) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n <= 0) return remove(session, productId, option);
  const product = await shop.product(productId);
  const line = raw(session).find(same(productId, option));
  if (line && product) line.qty = Math.min(n, product.inventory);
  return { ok: true };
}

function remove(session, productId, option) {
  const match = same(productId, option);
  session.cart = raw(session).filter((l) => !match(l));
  return { ok: true };
}

function clear(session) { session.cart = []; }

async function summary(session) {
  const lines = raw(session);
  const settings = await shop.settings();
  const freeThreshold = Number(settings.ship_free_threshold_fils || 20000);

  const items = [];
  let subtotal = 0;

  for (const line of lines) {
    const product = await shop.product(line.productId);
    if (!product || !product.active) continue;
    const qty = Math.min(line.qty, product.inventory);
    if (qty <= 0) continue;
    const lineTotal = product.price_fils * qty;
    subtotal += lineTotal;
    items.push({
      productId: product.id,
      option: line.option || '',
      handle: product.handle,
      name: product.name,
      /* What the order and the admin record: the piece and the option chosen. */
      orderName: line.option ? `${product.name} — ${line.option}` : product.name,
      groupName: product.group_name,
      materialName: product.material_name,
      swatch: product.swatch,
      image: product.images[0] || null,
      priceFils: product.price_fils,
      qty,
      lineFils: lineTotal,
      inventory: product.inventory
    });
  }

  /* Delivery depends on where the bag is going; the country is chosen at
     checkout and kept in the session, so the bag and checkout always agree. */
  const countryCode = (shipping.country(session.country) || shipping.COUNTRIES[0]).code;
  const count = items.reduce((n, i) => n + i.qty, 0);
  const home = shipping.isHome(countryCode);
  const delivery = shipping.delivery({ countryCode, subtotalFils: subtotal, itemCount: count, settings });
  return {
    items,
    count,
    country: countryCode,
    countryName: shipping.country(countryCode).name,
    home,
    deliveryTime: shipping.deliveryTime(countryCode, settings),
    subtotalFils: subtotal,
    deliveryFils: delivery,
    totalFils: subtotal + delivery,
    freeThresholdFils: freeThreshold,
    remainingForFreeFils: home ? Math.max(0, freeThreshold - subtotal) : 0,
    /* GCC: how much more until the per-item charge drops. */
    remainingForReducedFils: home ? 0 : Math.max(0, shipping.REDUCED_FROM_FILS - subtotal)
  };
}

module.exports = { add, setQty, remove, clear, summary };
