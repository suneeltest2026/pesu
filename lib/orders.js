'use strict';
/* Order creation. One transaction: write the order, capture the line items at
   the price they were bought at, and decrement stock. If anything throws,
   nothing is written and no stock moves. */
const { db } = require('../db');
const cart = require('./cart');
const shop = require('./shop');

function nextReference() {
  const row = db.prepare('SELECT COUNT(*) c FROM orders').get();
  return 'PESU-' + String(1000 + row.c + 1);
}

const create = db.transaction((session, form, method) => {
  const summary = cart.summary(session);
  if (!summary.items.length) throw new Error('Your bag is empty.');

  /* Re-check stock inside the transaction — the last word on availability. */
  summary.items.forEach((item) => {
    const live = db.prepare('SELECT inventory, active FROM products WHERE id = ?').get(item.productId);
    if (!live || !live.active) throw new Error(`${item.name} is no longer available.`);
    if (live.inventory < item.qty) {
      throw new Error(`${item.name}: only ${live.inventory} left.`);
    }
  });

  const reference = nextReference();
  const info = db.prepare(`
    INSERT INTO orders (reference, email, phone, name, address1, address2, city, emirate,
      notes, subtotal_fils, delivery_fils, total_fils, payment_method, payment_status)
    VALUES (@reference, @email, @phone, @name, @address1, @address2, @city, @emirate,
      @notes, @subtotal, @delivery, @total, @method, 'pending')`).run({
    reference,
    email: form.email.trim(),
    phone: form.phone.trim(),
    name: form.name.trim(),
    address1: form.address1.trim(),
    address2: (form.address2 || '').trim() || null,
    city: form.city.trim(),
    emirate: form.emirate.trim(),
    notes: (form.notes || '').trim() || null,
    subtotal: summary.subtotalFils,
    delivery: summary.deliveryFils,
    total: summary.totalFils,
    method
  });

  const orderId = info.lastInsertRowid;
  const addItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, name, price_fils, qty, image)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const decrement = db.prepare('UPDATE products SET inventory = inventory - ? WHERE id = ?');

  summary.items.forEach((item) => {
    addItem.run(orderId, item.productId, item.name, item.priceFils, item.qty, item.image);
    decrement.run(item.qty, item.productId);
  });

  return { id: orderId, reference, summary };
});

function byReference(reference) {
  const order = db.prepare('SELECT * FROM orders WHERE reference = ?').get(reference);
  if (!order) return null;
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  return order;
}

function list({ status, limit = 100 } = {}) {
  let sql = `SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
             FROM orders o`;
  if (status) sql += ' WHERE o.status = @status';
  sql += ' ORDER BY o.created_at DESC LIMIT ' + Number(limit);
  return db.prepare(sql).all(status ? { status } : {});
}

function setPaymentRef(reference, paymentRef) {
  db.prepare(`UPDATE orders SET payment_ref = ?, updated_at = datetime('now')
              WHERE reference = ?`).run(paymentRef, reference);
}

function markPaid(reference, paymentRef) {
  db.prepare(`UPDATE orders SET payment_status = 'paid', payment_ref = ?,
              updated_at = datetime('now') WHERE reference = ?`).run(paymentRef || null, reference);
}

function update(id, fields) {
  const allowed = ['status', 'payment_status', 'tracking', 'notes'];
  const sets = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!sets.length) return;
  db.prepare(`UPDATE orders SET ${sets.map((k) => `${k} = @${k}`).join(', ')},
              updated_at = datetime('now') WHERE id = @id`).run({ ...fields, id });
}

/* Restock when an order is cancelled, so inventory stays honest. */
const cancel = db.transaction((id) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order || order.status === 'cancelled') return;
  db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id).forEach((item) => {
    db.prepare('UPDATE products SET inventory = inventory + ? WHERE id = ?')
      .run(item.qty, item.product_id);
  });
  db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(id);
});

module.exports = { create, byReference, list, markPaid, setPaymentRef, update, cancel, nextReference };
