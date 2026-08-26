'use strict';
/* Read models for the storefront. Every query returns plain objects with the
   JSON columns already parsed, so views never see raw rows. */
const { db } = require('../db');

function hydrate(row) {
  if (!row) return null;
  return {
    ...row,
    active: !!row.active,
    story: JSON.parse(row.story_json || '[]'),
    features: JSON.parse(row.features_json || '[]'),
    specs: JSON.parse(row.specs_json || '{}'),
    options: JSON.parse(row.options_json || '[]'),
    tags: JSON.parse(row.tags_json || '[]'),
    images: db.prepare(
      'SELECT filename, alt FROM product_images WHERE product_id = ? ORDER BY position'
    ).all(row.id).map((i) => i.filename)
  };
}

const withJoins = `
  SELECT p.*, g.name AS group_name, m.name AS material_name,
         m.short AS material_short, m.swatch AS swatch, m.note AS material_note
  FROM products p
  JOIN groups g ON g.id = p.group_id
  JOIN materials m ON m.id = p.material_id`;

const shop = {
  products(opts = {}) {
    let sql = withJoins + ' WHERE p.active = 1';
    const params = {};
    if (opts.group) { sql += ' AND p.group_id = @group'; params.group = opts.group; }
    if (opts.material) { sql += ' AND p.material_id = @material'; params.material = opts.material; }
    if (opts.exclude) { sql += ' AND p.id != @exclude'; params.exclude = opts.exclude; }
    sql += ' ORDER BY p.position';
    if (opts.limit) sql += ' LIMIT ' + Number(opts.limit);
    return db.prepare(sql).all(params).map(hydrate);
  },

  product(idOrHandle) {
    const row = db.prepare(withJoins + ' WHERE p.id = ? OR p.handle = ? OR p.legacy_handle = ?')
      .get(idOrHandle, idOrHandle, idOrHandle);
    return hydrate(row);
  },

  /* Admin needs drafts too. */
  productAny(id) {
    return hydrate(db.prepare(withJoins + ' WHERE p.id = ?').get(id));
  },

  allProductsForAdmin() {
    return db.prepare(withJoins + ' ORDER BY p.position').all().map(hydrate);
  },

  groups() {
    return db.prepare(`
      SELECT g.*, COUNT(p.id) AS count,
             (SELECT MIN(price_fils) FROM products WHERE group_id = g.id AND active = 1) AS from_fils
      FROM groups g LEFT JOIN products p ON p.group_id = g.id AND p.active = 1
      GROUP BY g.id ORDER BY g.position`).all();
  },

  group(id) { return db.prepare('SELECT * FROM groups WHERE id = ?').get(id); },

  materials() { return db.prepare('SELECT * FROM materials ORDER BY position').all(); },

  material(id) { return db.prepare('SELECT * FROM materials WHERE id = ?').get(id); },

  search(term) {
    const q = '%' + String(term || '').trim().toLowerCase() + '%';
    return db.prepare(withJoins + `
      AND p.active = 1 AND (lower(p.name) LIKE @q OR lower(p.full_title) LIKE @q
        OR lower(p.tags_json) LIKE @q OR lower(m.name) LIKE @q OR lower(g.name) LIKE @q)
      ORDER BY p.position LIMIT 8`.replace('AND p.active', 'WHERE p.active'))
      .all({ q }).map(hydrate);
  },

  settings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  },

  setting(key, fallback) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : fallback;
  }
};

module.exports = shop;
