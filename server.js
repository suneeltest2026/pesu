'use strict';
/* ==========================================================================
   PESU — application server
   Express + SQLite + EJS. One process, one database file, no third-party
   service in the request path. Card payments are the only outbound call, and
   only when a customer chooses to pay by card.
   ========================================================================== */
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const { migrate } = require('./db');
const shop = require('./lib/shop');
const cart = require('./lib/cart');
const { format } = require('./lib/money');

const app = express();
const PORT = process.env.PORT || 3000;

migrate();

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

const SqliteStore = require('./lib/session-store')(session);

app.use(session({
  name: 'pesu.sid',
  store: new SqliteStore(),
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

/* Static: the design system, and product photography we host ourselves. */
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '10m' }));
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '7d' }));
/* Images uploaded through the admin live on the persistent disk in
   production, so a redeploy never takes product photography with it. */
if (process.env.UPLOADS_PATH) {
  app.use('/images', express.static(process.env.UPLOADS_PATH, { maxAge: '7d' }));
}

/* --- View locals ---------------------------------------------------------
   Everything a template needs without each route re-assembling it. */
app.use((req, res, next) => {
  const settings = shop.settings();
  const groups = shop.groups();
  const materials = shop.materials();
  const products = shop.products();

  res.locals.settings = settings;
  res.locals.groups = groups;
  res.locals.materials = materials;
  res.locals.navProducts = products.slice(0, 4);
  res.locals.featured = products[0] || null;
  res.locals.cart = cart.summary(req.session);
  res.locals.deliveryFlatFils = Number(settings.ship_flat_fils || 2500);
  res.locals.money = format;
  res.locals.title = 'PESU — Handmade home decor, United Arab Emirates';
  res.locals.description = settings.shop_name +
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

  /* One image helper so every <img> gets dimensions and lazy-loading. */
  res.locals.img = (product, index, width) => {
    const file = product && product.images && product.images[index || 0];
    if (!file) return '';
    const alt = String(product.name || '').replace(/"/g, '&quot;');
    return `<img src="/images/${file}" alt="${alt}" loading="lazy" decoding="async" width="${width || 800}" height="${width || 800}">`;
  };

  next();
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

app.listen(PORT, () => console.log(`PESU running on http://localhost:${PORT}`));
