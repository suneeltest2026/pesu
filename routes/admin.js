'use strict';
/* Admin — products, stock, images and orders. Session-authenticated against
   the admins table; passwords are bcrypt hashes, never plain text. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const shop = require('../lib/shop');
const orders = require('../lib/orders');
const { toFils, format } = require('../lib/money');

const router = express.Router();

const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const safe = file.originalname.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
      cb(null, Date.now() + '-' + safe);
    }
  }),
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
    money: format
  }, extra));
}

/* --- Auth ---------------------------------------------------------------- */
router.get('/login', (req, res) => view(res, 'login', { error: null }));

router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const admin = db.prepare('SELECT * FROM admins WHERE lower(email) = ?').get(email);
  const ok = admin && bcrypt.compareSync(String(req.body.password || ''), admin.password_hash);
  if (!ok) {
    /* Same message either way — never reveal whether an account exists. */
    return view(res, 'login', { error: 'Email or password is wrong.' });
  }
  req.session.adminId = admin.id;
  const to = req.session.returnTo || '/admin';
  delete req.session.returnTo;
  res.redirect(to);
});

router.post('/logout', (req, res) => {
  delete req.session.adminId;
  res.redirect('/admin/login');
});

router.use(requireAdmin);

/* --- Dashboard ----------------------------------------------------------- */
router.get('/', (req, res) => {
  const all = orders.list({ limit: 20 });
  const stats = db.prepare(`
    SELECT COUNT(*) AS orders,
           COALESCE(SUM(total_fils), 0) AS revenue,
           COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) AS pending
    FROM orders WHERE status != 'cancelled'`).get();
  const low = shop.allProductsForAdmin().filter((p) => p.active && p.inventory <= 5);
  view(res, 'dashboard', { orders: all, stats, low });
});

/* --- Orders -------------------------------------------------------------- */
router.get('/orders', (req, res) => {
  view(res, 'orders', { orders: orders.list({ status: req.query.status, limit: 200 }), status: req.query.status || '' });
});

router.get('/orders/:reference', (req, res, next) => {
  const order = orders.byReference(req.params.reference);
  if (!order) return next();
  view(res, 'order', { order });
});

router.post('/orders/:reference', (req, res, next) => {
  const order = orders.byReference(req.params.reference);
  if (!order) return next();
  if (req.body.cancel) orders.cancel(order.id);
  else {
    orders.update(order.id, {
      status: req.body.status,
      payment_status: req.body.payment_status,
      tracking: req.body.tracking
    });
  }
  res.redirect('/admin/orders/' + order.reference);
});

/* --- Products ------------------------------------------------------------ */
router.get('/products', (req, res) => {
  view(res, 'products', { products: shop.allProductsForAdmin() });
});

router.get('/products/:id', (req, res, next) => {
  const product = shop.productAny(req.params.id);
  if (!product) return next();
  view(res, 'product', { product, groups: shop.groups(), materials: shop.materials(), saved: req.query.saved });
});

router.post('/products/:id', upload.array('images', 8), (req, res, next) => {
  const product = shop.productAny(req.params.id);
  if (!product) return next();
  const b = req.body;

  db.prepare(`UPDATE products SET name = @name, full_title = @full_title, blurb = @blurb,
      group_id = @group_id, material_id = @material_id, price_fils = @price_fils,
      compare_fils = @compare_fils, inventory = @inventory, active = @active,
      seo_desc = @seo_desc, story_json = @story_json, features_json = @features_json,
      updated_at = datetime('now') WHERE id = @id`).run({
    id: product.id,
    name: b.name.trim(),
    full_title: b.full_title.trim(),
    blurb: (b.blurb || '').trim(),
    group_id: b.group_id,
    material_id: b.material_id,
    price_fils: toFils(b.price),
    compare_fils: b.compare ? toFils(b.compare) : null,
    inventory: Math.max(0, parseInt(b.inventory, 10) || 0),
    active: b.active ? 1 : 0,
    seo_desc: (b.seo_desc || '').trim(),
    story_json: JSON.stringify(String(b.story || '').split('\n\n').map((s) => s.trim()).filter(Boolean)),
    features_json: JSON.stringify(String(b.features || '').split('\n').map((s) => s.trim()).filter(Boolean))
  });

  (req.files || []).forEach((file, i) => {
    const max = db.prepare('SELECT COALESCE(MAX(position), -1) m FROM product_images WHERE product_id = ?')
      .get(product.id).m;
    db.prepare('INSERT INTO product_images (product_id, filename, alt, position) VALUES (?, ?, ?, ?)')
      .run(product.id, file.filename, b.name, max + 1 + i);
  });

  res.redirect('/admin/products/' + product.id + '?saved=1');
});

router.post('/products/:id/images/:imageId/delete', (req, res) => {
  db.prepare('DELETE FROM product_images WHERE id = ? AND product_id = ?')
    .run(req.params.imageId, req.params.id);
  res.redirect('/admin/products/' + req.params.id);
});

module.exports = router;
