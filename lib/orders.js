'use strict';
/* Order creation. One transaction: reserve stock, write the order, capture
   the line items at the price they were bought at. If anything throws,
   nothing is written and no stock moves. */
const db = require('../db');
const cart = require('./cart');

async function create(session, form, method) {
  const summary = await cart.summary(session);
  if (!summary.items.length) throw new Error('Your bag is empty.');

  return db.transaction(async (client) => {
    /* Lock the rows we are about to decrement so two simultaneous checkouts
       cannot both sell the last piece. */
    for (const item of summary.items) {
      const { rows } = await client.query(
        'SELECT inventory, active, name FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );
      const live = rows[0];
      if (!live || !live.active) throw new Error(`${item.name} is no longer available.`);
      if (live.inventory < item.qty) throw new Error(`${item.name}: only ${live.inventory} left.`);
    }

    const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS c FROM orders');
    const reference = 'PESU-' + String(1000 + countRows[0].c + 1);

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (reference, email, phone, name, address1, address2, city,
         emirate, notes, subtotal_fils, delivery_fils, total_fils, payment_method, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending') RETURNING id`,
      [
        reference, form.email.trim(), form.phone.trim(), form.name.trim(),
        form.address1.trim(), (form.address2 || '').trim() || null, form.city.trim(),
        form.emirate.trim(), (form.notes || '').trim() || null,
        summary.subtotalFils, summary.deliveryFils, summary.totalFils, method
      ]
    );
    const orderId = orderRows[0].id;

    for (const item of summary.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, price_fils, qty, image)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, item.productId, item.name, item.priceFils, item.qty, item.image]
      );
      await client.query('UPDATE products SET inventory = inventory - $1 WHERE id = $2',
        [item.qty, item.productId]);
    }

    return { id: orderId, reference, summary };
  });
}

async function byReference(reference) {
  const order = await db.one('SELECT * FROM orders WHERE reference = $1', [reference]);
  if (!order) return null;
  order.items = await db.all('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [order.id]);
  return order;
}

function list({ status, limit = 100 } = {}) {
  const params = [];
  let sql = `SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int AS item_count
             FROM orders o`;
  if (status) { params.push(status); sql += ` WHERE o.status = $${params.length}`; }
  sql += ` ORDER BY o.created_at DESC LIMIT ${Number(limit)}`;
  return db.all(sql, params);
}

function markPaid(reference, paymentRef) {
  return db.query(
    `UPDATE orders SET payment_status = 'paid', payment_ref = COALESCE($1, payment_ref),
     updated_at = now() WHERE reference = $2`, [paymentRef || null, reference]);
}

function setPaymentRef(reference, paymentRef) {
  return db.query('UPDATE orders SET payment_ref = $1, updated_at = now() WHERE reference = $2',
    [paymentRef, reference]);
}

function update(id, fields) {
  const allowed = ['status', 'payment_status', 'tracking', 'notes'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k) && fields[k] !== undefined);
  if (!keys.length) return Promise.resolve();
  const sets = keys.map((k, i) => `${k} = $${i + 1}`);
  const params = keys.map((k) => fields[k]);
  params.push(id);
  return db.query(
    `UPDATE orders SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length}`, params);
}

/* Restock when an order is cancelled, so inventory stays honest. */
function cancel(id) {
  return db.transaction(async (client) => {
    const { rows } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0] || rows[0].status === 'cancelled') return;
    const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    for (const item of items.rows) {
      await client.query('UPDATE products SET inventory = inventory + $1 WHERE id = $2',
        [item.qty, item.product_id]);
    }
    await client.query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`, [id]);
  });
}

module.exports = { create, byReference, list, markPaid, setPaymentRef, update, cancel };
