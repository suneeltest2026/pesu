'use strict';
/* ==========================================================================
   PESU — application server
   Express + PostgreSQL + EJS. Runs as a long-lived process (node server.js)
   or as a serverless function on Vercel (api/index.js imports this module).
   ========================================================================== */
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const pgSession = require('connect-pg-simple')(session);

const db = require('./db');
const shop = require('./lib/shop');
const cart = require('./lib/cart');
const { format } = require('./lib/money');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

/* Stripe webhooks need the raw body for signature verification, so they are
   mounted ahead of the body parsers. */
app.use('/', require('./routes/webhooks'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set — using a temporary secret. Bags will not survive a restart.');
}

app.use(session({
  name: 'pesu.sid',
  store: new pgSession({ pool: db.pool, tableName: 'session', createTableIfMissing: false }),
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}));

/* Static assets. On Vercel these are served from the CDN before the function
   is reached; this covers running the server directly. */
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '10m' }));
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '7d' }));

/* Images uploaded through the admin live in the database, because serverless
   hosting has no writable disk that survives an invocation. */
app.get('/img/:id', async (req, res, next) => {
  try {
    const image = await shop.image(Number(req.params.id));
    if (!image || !image.data) return next();
    res.set('Content-Type', image.content_type || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=604800');
    res.send(image.data);
  } catch (err) { next(err); }
});

/* Schema and seed are applied once, lazily, before the first request. */
app.use(async (req, res, next) => {
  try { await db.ensureReady(); next(); } catch (err) { next(err); }
});

/* --- View locals --------------------------------------------------------- */
app.use(async (req, res, next) => {
  try {
    const [settings, groups, materials, products, bag] = await Promise.all([
      shop.settings(), shop.groups(), shop.materials(), shop.products(), cart.summary(req.session)
    ]);

    res.locals.settings = settings;
    res.locals.groups = groups;
    res.locals.materials = materials;
    res.locals.navProducts = products.slice(0, 4);
    res.locals.featured = products[0] || null;
    res.locals.cart = bag;
    res.locals.deliveryFlatFils = Number(settings.ship_flat_fils || 2500);
    res.locals.money = format;
    res.locals.title = 'PESU — Handmade home decor, United Arab Emirates';
    res.locals.description = (settings.shop_name || 'PESU') +
      ' makes and curates handmade home decor in natural materials. Delivered across the UAE.';
    res.locals.error = null;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    res.locals.handleFor = (id) => {
      const p = products.find((x) => x.id === id);
      return p ? p.handle : '';
    };
    res.locals.leadFor = (groupId) => products.find((p) => p.group_id === groupId) || null;
    res.locals.pieceOfMaterial = (materialId) => products.find((p) => p.material_id === materialId) || null;

    /* One image helper: repository files come from /images, uploaded ones
       from the database at /img/<id>. */
    res.locals.imageSrc = (file) =>
      !file ? '' : (String(file).startsWith('db:') ? '/img/' + String(file).slice(3) : '/images/' + file);

    res.locals.img = (product, index, width) => {
      const file = product && product.images && product.images[index || 0];
      if (!file) return '';
      const alt = String(product.name || '').replace(/"/g, '&quot;');
      /* A missing photograph degrades to the material texture behind it,
         rather than a broken-image icon with alt text spilling across it. */
      return `<img src="${res.locals.imageSrc(file)}" alt="${alt}" loading="lazy" decoding="async"` +
        ` width="${width || 800}" height="${width || 800}" onerror="this.hidden=true">`;
    };

    next();
  } catch (err) { next(err); }
});

app.use('/', require('./routes/shop'));
app.use('/', require('./routes/cart'));
app.use('/', require('./routes/checkout'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('page', {
    title: 'Not found — PESU',
    description: 'That page does not exist.',
    page: {
      eyebrow: '404',
      title: 'Nothing here',
      lede: 'That page has moved or never existed.',
      body: '<p><a class="link" href="/shop">Browse the range</a></p>'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('page', {
    title: 'Something went wrong — PESU',
    description: 'An error occurred.',
    page: {
      eyebrow: 'Error',
      title: 'Something went wrong',
      lede: 'We have logged it. Please try again, or write to us.',
      body: '<p><a class="link" href="/">Back to the shop</a></p>'
    }
  });
});

/* Listen only when run directly; on Vercel the app is imported. */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  db.ensureReady()
    .then(() => app.listen(PORT, () => console.log(`PESU running on http://localhost:${PORT}`)))
    .catch((err) => { console.error('Could not start:', err.message); process.exit(1); });
}

module.exports = app;
