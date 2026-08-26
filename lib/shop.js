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
  images.forEach((img) => {
    if (!byProduct.has(img.product_id)) byProduct.set(img.product_id, []);
    /* Uploaded images are served from the database, repository ones from disk. */
    byProduct.get(img.product_id).push(img.uploaded ? 'db:' + img.id : img.filename);
  });
  rows.forEach((row) => {
    row.images = byProduct.get(row.id) || [];
    row.story = row.story_json || [];
    row.features = row.features_json || [];
    row.specs = row.specs_json || {};
    row.options = row.options_json || [];
    row.tags = row.tags_json || [];
  });
  return rows;
}

const shop = {
  async products(opts = {}) {
    const where = ['p.active = TRUE'];
    const params = [];
    if (opts.group) { params.push(opts.group); where.push(`p.group_id = $${params.length}`); }
    if (opts.material) { params.push(opts.material); where.push(`p.material_id = $${params.length}`); }
    if (opts.exclude) { params.push(opts.exclude); where.push(`p.id <> $${params.length}`); }
    let sql = `${SELECT} WHERE ${where.join(' AND ')} ORDER BY p.position`;
    if (opts.limit) sql += ` LIMIT ${Number(opts.limit)}`;
    return attachImages(await db.all(sql, params));
  },

  async product(idOrHandle) {
    const rows = await db.all(
      `${SELECT} WHERE p.id = $1 OR p.handle = $1 OR p.legacy_handle = $1 LIMIT 1`,
      [idOrHandle]
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
    return db.all(`
      SELECT g.*, COUNT(p.id)::int AS count,
             (SELECT MIN(price_fils) FROM products WHERE group_id = g.id AND active) AS from_fils
      FROM groups g LEFT JOIN products p ON p.group_id = g.id AND p.active
      GROUP BY g.id ORDER BY g.position`);
  },

  group(id) { return db.one('SELECT * FROM groups WHERE id = $1', [id]); },

  materials() { return db.all('SELECT * FROM materials ORDER BY position'); },

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
    const rows = await db.all('SELECT key, value FROM settings');
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
