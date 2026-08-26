-- PESU — schema (PostgreSQL)
-- Money is stored in fils (AED x 100) as integers: no floating point ever
-- touches a price.

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

CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  handle        TEXT NOT NULL UNIQUE,
  legacy_handle TEXT,
  name          TEXT NOT NULL,
  full_title    TEXT NOT NULL,
  group_id      TEXT NOT NULL REFERENCES groups(id),
  material_id   TEXT NOT NULL REFERENCES materials(id),
  price_fils    INTEGER NOT NULL,
  compare_fils  INTEGER,
  inventory     INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  blurb         TEXT,
  seo_desc      TEXT,
  story_json    JSONB NOT NULL DEFAULT '[]'::jsonb,
  features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  options_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags_json     JSONB NOT NULL DEFAULT '[]'::jsonb,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Images either live in the repository (filename, no data) or were uploaded
-- through the admin (data + content_type). Serverless hosting has no writable
-- disk, so uploads are kept in the database rather than on the filesystem.
CREATE TABLE IF NOT EXISTS product_images (
  id           SERIAL PRIMARY KEY,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  alt          TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  data         BYTEA,
  content_type TEXT
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id, position);

CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  reference      TEXT NOT NULL UNIQUE,
  email          TEXT NOT NULL,
  phone          TEXT NOT NULL,
  name           TEXT NOT NULL,
  address1       TEXT NOT NULL,
  address2       TEXT,
  city           TEXT NOT NULL,
  emirate        TEXT NOT NULL,
  country        TEXT NOT NULL DEFAULT 'United Arab Emirates',
  notes          TEXT,
  subtotal_fils  INTEGER NOT NULL,
  delivery_fils  INTEGER NOT NULL,
  total_fils     INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_ref    TEXT,
  status         TEXT NOT NULL DEFAULT 'new',
  tracking       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  price_fils INTEGER NOT NULL,
  qty        INTEGER NOT NULL,
  image      TEXT
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- connect-pg-simple's session table.
CREATE TABLE IF NOT EXISTS session (
  sid    TEXT PRIMARY KEY,
  sess   JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
