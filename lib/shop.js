'use strict';
/* Read models for the storefront. Everything is async now that the database
   is Postgres; JSON columns come back already parsed by the driver. */
const db = require('../db');

const SELECT = `
  SELECT p.*, g.name AS group_name, m.name AS material_name,
         m.short AS material_short, m.swatch AS swatch, m.note AS material_note
  FROM products p
  JOIN groups g ON g.id = p.group_id
  JOIN materials m ON m.id = p.material_id`;

/* Images are attached in one extra query rather than one per product. */
async function attachImages(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const images = await db.all(
    `SELECT product_id, id, filename, data IS NOT NULL AS uploaded
     FROM product_images WHERE product_id = ANY($1) ORDER BY product_id, position`,
    [ids]
  );
  const byProduct = new Map();
  const detailed = new Map();
  images.forEach((img) => {
    if (!byProduct.has(img.product_id)) { byProduct.set(img.product_id, []); detailed.set(img.product_id, []); }
    /* Uploaded images are served from the database, repository ones from disk. */
    const ref = img.uploaded ? 'db:' + img.id : img.filename;
    byProduct.get(img.product_id).push(ref);
    detailed.get(img.product_id).push({ id: img.id, ref: ref, filename: img.filename, uploaded: img.uploaded });
  });
  rows.forEach((row) => {
    row.images = byProduct.get(row.id) || [];
    row.imageRows = detailed.get(row.id) || [];
    row.story = row.story_json || [];
    row.features = row.features_json || [];
    row.specs = row.specs_json || {};
    row.options = row.options_json || [];
    row.tags = row.tags_json || [];
  });
  return rows;
}

/* --- Catalogue cache ------------------------------------------------------
   Every page needs the range, the rooms, the materials and the settings, and
   the database sits a long way from the server: fetched fresh, that was a
   dozen round trips before a page could render. They change rarely, so each
   server instance keeps them for a minute. Anything that must be exact — the
   stock check when an order is placed — still reads the database directly. */
const TTL_MS = 60 * 1000;
const cache = new Map();

function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = load().catch((err) => { cache.delete(key); throw err; });
  cache.set(key, { at: Date.now(), value });
  return value;
}

/* Copies, so a caller decorating a product cannot change the cached one. */
const fresh = (rows) => rows.map((r) => Object.assign({}, r));

function activeProducts() {
  return cached('products', async () =>
    attachImages(await db.all(`${SELECT} WHERE p.active = TRUE ORDER BY p.position`)));
}

const shop = {
  /* Drop everything cached on this instance (after an edit or an order). */
  invalidate() { cache.clear(); },

  async products(opts = {}) {
    let rows = await activeProducts();
    if (opts.group) rows = rows.filter((p) => p.group_id === opts.group);
    if (opts.material) rows = rows.filter((p) => p.material_id === opts.material);
    if (opts.exclude) rows = rows.filter((p) => p.id !== opts.exclude);
    if (opts.limit) rows = rows.slice(0, Number(opts.limit));
    return fresh(rows);
  },

  async product(idOrHandle) {
    const key = String(idOrHandle);
    const hit = (await activeProducts()).find((p) =>
      p.id === key || p.handle === key || p.legacy_handle === key);
    if (hit) return Object.assign({}, hit);
    /* Retired pieces and old handles are not in the cache; ask the database. */
    const rows = await db.all(
      `${SELECT} WHERE p.id = $1 OR p.handle = $1 OR p.legacy_handle = $1 LIMIT 1`,
      [key]
    );
    return (await attachImages(rows))[0] || null;
  },

  async productAny(id) {
    const rows = await db.all(`${SELECT} WHERE p.id = $1`, [id]);
    return (await attachImages(rows))[0] || null;
  },

  async allProductsForAdmin() {
    return attachImages(await db.all(`${SELECT} ORDER BY p.position`));
  },

  groups() {
    return cached('groups', () => db.all(`
      SELECT g.*, COUNT(p.id)::int AS count,
             (SELECT MIN(price_fils) FROM products WHERE group_id = g.id AND active) AS from_fils
      FROM groups g JOIN products p ON p.group_id = g.id AND p.active
      GROUP BY g.id ORDER BY g.position`));
  },

  group(id) { return db.one('SELECT * FROM groups WHERE id = $1', [id]); },

  /* Only materials something on sale is made of. */
  materials() {
    return cached('materials', () => db.all(`SELECT m.* FROM materials m
      WHERE EXISTS (SELECT 1 FROM products p WHERE p.material_id = m.id AND p.active)
      ORDER BY m.position`));
  },

  material(id) { return db.one('SELECT * FROM materials WHERE id = $1', [id]); },

  async search(term) {
    const q = '%' + String(term || '').trim().toLowerCase() + '%';
    const rows = await db.all(`${SELECT}
      WHERE p.active AND (lower(p.name) LIKE $1 OR lower(p.full_title) LIKE $1
        OR lower(p.tags_json::text) LIKE $1 OR lower(m.name) LIKE $1 OR lower(g.name) LIKE $1)
      ORDER BY p.position LIMIT 8`, [q]);
    return attachImages(rows);
  },

  async settings() {
    const rows = await cached('settings', () => db.all('SELECT key, value FROM settings'));
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  },

  async setting(key, fallback) {
    const row = await db.one('SELECT value FROM settings WHERE key = $1', [key]);
    return row ? row.value : fallback;
  },

  image(id) {
    return db.one('SELECT data, content_type FROM product_images WHERE id = $1', [id]);
  }
};

module.exports = shop;
