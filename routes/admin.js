'use strict';
/* Admin — products, stock, images and orders. Session-authenticated against
   the admins table; passwords are bcrypt hashes, never plain text. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../db');
const shop = require('../lib/shop');
const orders = require('../lib/orders');
const { toFils, format } = require('../lib/money');

const router = express.Router();

/* Serverless hosting has no writable disk that survives a request, so
   uploaded images are held in memory and written into the database. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype))
});

function requireAdmin(req, res, next) {
  if (req.session.adminId) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
}

function view(res, template, extra) {
  res.render('admin/' + template, Object.assign({
    layoutTitle: 'PESU admin',
    title: 'Admin — PESU',
    description: 'PESU admin',
    money: format,
    imageSrc: res.locals.imageSrc
  }, extra));
}

/* --- Auth ---------------------------------------------------------------- */
router.get('/login', (req, res) => view(res, 'login', { error: null }));

router.post('/login', async (req, res, next) => {
  try {
  const email = String(req.body.email || '').trim().toLowerCase();
  const admin = await db.one('SELECT * FROM admins WHERE lower(email) = $1', [email]);
  const ok = admin && bcrypt.compareSync(String(req.body.password || ''), admin.password_hash);
  if (!ok) {
    /* Same message either way — never reveal whether an account exists. */
    return view(res, 'login', { error: 'Email or password is wrong.' });
  }
  req.session.adminId = admin.id;
  const to = req.session.returnTo || '/admin';
  delete req.session.returnTo;
  res.redirect(to);
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  delete req.session.adminId;
  res.redirect('/admin/login');
});

router.use(requireAdmin);

/* --- Dashboard ----------------------------------------------------------- */
router.get('/', async (req, res, next) => {
  try {
    const [all, stats, products] = await Promise.all([
      orders.list({ limit: 20 }),
      db.one(`SELECT COUNT(*)::int AS orders,
                     COALESCE(SUM(total_fils), 0)::int AS revenue,
                     COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0)::int AS pending
              FROM orders WHERE status <> 'cancelled'`),
      shop.allProductsForAdmin()
    ]);
    const low = products.filter((p) => p.active && p.inventory <= 5);
    view(res, 'dashboard', { orders: all, stats, low });
  } catch (err) { next(err); }
});

/* --- Orders -------------------------------------------------------------- */
router.get('/orders', async (req, res, next) => {
  try {
    const list = await orders.list({ status: req.query.status, limit: 200 });
    view(res, 'orders', { orders: list, status: req.query.status || '' });
  } catch (err) { next(err); }
});

router.get('/orders/:reference', async (req, res, next) => {
  try {
    const order = await orders.byReference(req.params.reference);
    if (!order) return next();
    view(res, 'order', { order });
  } catch (err) { next(err); }
});

router.post('/orders/:reference', async (req, res, next) => {
  try {
    const order = await orders.byReference(req.params.reference);
    if (!order) return next();
    if (req.body.cancel) await orders.cancel(order.id);
    else {
      await orders.update(order.id, {
        status: req.body.status,
        payment_status: req.body.payment_status,
        tracking: req.body.tracking
      });
    }
    res.redirect('/admin/orders/' + order.reference);
  } catch (err) { next(err); }
});

/* --- Products ------------------------------------------------------------ */
router.get('/products', async (req, res, next) => {
  try {
    view(res, 'products', { products: await shop.allProductsForAdmin() });
  } catch (err) { next(err); }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const [product, groups, materials] = await Promise.all([
      shop.productAny(req.params.id), shop.groups(), shop.materials()
    ]);
    if (!product) return next();
    view(res, 'product', { product, groups, materials, saved: req.query.saved });
  } catch (err) { next(err); }
});

router.post('/products/:id', upload.array('images', 8), async (req, res, next) => {
  try {
    const product = await shop.productAny(req.params.id);
    if (!product) return next();
    const b = req.body;

    await db.query(
      `UPDATE products SET name = $1, full_title = $2, blurb = $3, group_id = $4,
         material_id = $5, price_fils = $6, compare_fils = $7, inventory = $8,
         active = $9, seo_desc = $10, story_json = $11, features_json = $12,
         updated_at = now() WHERE id = $13`,
      [
        b.name.trim(), b.full_title.trim(), (b.blurb || '').trim(), b.group_id, b.material_id,
        toFils(b.price), b.compare ? toFils(b.compare) : null,
        Math.max(0, parseInt(b.inventory, 10) || 0), Boolean(b.active), (b.seo_desc || '').trim(),
        JSON.stringify(String(b.story || '').split('\n\n').map((x) => x.trim()).filter(Boolean)),
        JSON.stringify(String(b.features || '').split('\n').map((x) => x.trim()).filter(Boolean)),
        product.id
      ]
    );

    for (const file of req.files || []) {
      const { rows } = await db.query(
        'SELECT COALESCE(MAX(position), -1) AS m FROM product_images WHERE product_id = $1',
        [product.id]
      );
      await db.query(
        `INSERT INTO product_images (product_id, filename, alt, position, data, content_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [product.id, file.originalname, b.name, Number(rows[0].m) + 1, file.buffer, file.mimetype]
      );
    }

    res.redirect('/admin/products/' + product.id + '?saved=1');
  } catch (err) { next(err); }
});

router.post('/products/:id/images/:imageId/delete', async (req, res, next) => {
  try {
    await db.query('DELETE FROM product_images WHERE id = $1 AND product_id = $2',
      [req.params.imageId, req.params.id]);
    res.redirect('/admin/products/' + req.params.id);
  } catch (err) { next(err); }
});

module.exports = router;
