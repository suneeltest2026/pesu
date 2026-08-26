-- PESU — schema
-- SQLite, one file, owned entirely by this application. Money is stored in
-- fils (AED × 100) as integers: no floating point ever touches a price.

CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  handle        TEXT NOT NULL UNIQUE,
  legacy_handle TEXT,
  name          TEXT NOT NULL,
  full_title    TEXT NOT NULL,
  group_id      TEXT NOT NULL,
  material_id   TEXT NOT NULL,
  price_fils    INTEGER NOT NULL,
  compare_fils  INTEGER,
  inventory     INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,
  blurb         TEXT,
  seo_desc      TEXT,
  story_json    TEXT NOT NULL DEFAULT '[]',
  features_json TEXT NOT NULL DEFAULT '[]',
  specs_json    TEXT NOT NULL DEFAULT '{}',
  options_json  TEXT NOT NULL DEFAULT '[]',
  tags_json     TEXT NOT NULL DEFAULT '[]',
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  alt        TEXT,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id, position);

CREATE TABLE IF NOT EXISTS groups (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  line     TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS materials (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  short    TEXT NOT NULL,
  swatch   TEXT NOT NULL,
  origin   TEXT,
  note     TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

-- Orders -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reference       TEXT NOT NULL UNIQUE,          -- PESU-1042
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  name            TEXT NOT NULL,
  address1        TEXT NOT NULL,
  address2        TEXT,
  city            TEXT NOT NULL,
  emirate         TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'United Arab Emirates',
  notes           TEXT,
  subtotal_fils   INTEGER NOT NULL,
  delivery_fils   INTEGER NOT NULL,
  total_fils      INTEGER NOT NULL,
  payment_method  TEXT NOT NULL,                 -- card | cod | bank
  payment_status  TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
  payment_ref     TEXT,                          -- gateway session/charge id
  status          TEXT NOT NULL DEFAULT 'new',   -- new | packed | shipped | delivered | cancelled
  tracking        TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  name         TEXT NOT NULL,            -- captured at purchase time
  price_fils   INTEGER NOT NULL,
  qty          INTEGER NOT NULL,
  image        TEXT
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);

-- Admin --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Store settings, editable from the admin ----------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
