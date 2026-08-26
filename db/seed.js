'use strict';
/* Seeds the database from data/products.json — the catalogue exported out of
   Shopify. Safe to re-run: products are upserted by id, orders untouched. */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { db, migrate } = require('./index');
const { toFils } = require('../lib/money');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8'));

migrate();

const upsertGroup = db.prepare(`
  INSERT INTO groups (id, name, line, position) VALUES (@id, @name, @line, @position)
  ON CONFLICT(id) DO UPDATE SET name=@name, line=@line, position=@position`);

const upsertMaterial = db.prepare(`
  INSERT INTO materials (id, name, short, swatch, origin, note, position)
  VALUES (@id, @name, @short, @swatch, @origin, @note, @position)
  ON CONFLICT(id) DO UPDATE SET name=@name, short=@short, swatch=@swatch,
    origin=@origin, note=@note, position=@position`);

const upsertProduct = db.prepare(`
  INSERT INTO products (id, handle, legacy_handle, name, full_title, group_id, material_id,
    price_fils, compare_fils, inventory, active, blurb, seo_desc,
    story_json, features_json, specs_json, options_json, tags_json, position)
  VALUES (@id, @handle, @legacy_handle, @name, @full_title, @group_id, @material_id,
    @price_fils, @compare_fils, @inventory, @active, @blurb, @seo_desc,
    @story_json, @features_json, @specs_json, @options_json, @tags_json, @position)
  ON CONFLICT(id) DO UPDATE SET
    handle=@handle, name=@name, full_title=@full_title, group_id=@group_id,
    material_id=@material_id, price_fils=@price_fils, compare_fils=@compare_fils,
    inventory=@inventory, active=@active, blurb=@blurb, seo_desc=@seo_desc,
    story_json=@story_json, features_json=@features_json, specs_json=@specs_json,
    options_json=@options_json, tags_json=@tags_json, position=@position,
    updated_at=datetime('now')`);

const clearImages = db.prepare('DELETE FROM product_images WHERE product_id = ?');
const insertImage = db.prepare(
  'INSERT INTO product_images (product_id, filename, alt, position) VALUES (?, ?, ?, ?)');

const setSetting = db.prepare(
  `INSERT INTO settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value=excluded.value`);

const seed = db.transaction(() => {
  data.groups.forEach((g, i) => upsertGroup.run({ ...g, position: i }));
  data.materials.forEach((m, i) => upsertMaterial.run({ ...m, position: i }));

  data.products.forEach((p, i) => {
    upsertProduct.run({
      id: p.id,
      handle: p.handle,
      legacy_handle: p.legacyHandle || null,
      name: p.name,
      full_title: p.fullTitle,
      group_id: p.group,
      material_id: p.material,
      price_fils: toFils(p.priceAED),
      compare_fils: p.compareAtAED ? toFils(p.compareAtAED) : null,
      inventory: p.inventory,
      active: p.active === false ? 0 : 1,
      blurb: p.blurb || null,
      seo_desc: p.seoDescription || null,
      story_json: JSON.stringify(p.story || []),
      features_json: JSON.stringify(p.features || []),
      specs_json: JSON.stringify(p.specs || {}),
      options_json: JSON.stringify(p.options || []),
      tags_json: JSON.stringify(p.tags || []),
      position: i
    });
    clearImages.run(p.id);
    (p.images || []).forEach((filename, j) => insertImage.run(p.id, filename, p.name, j));
  });

  /* Store facts, editable later from the admin rather than in code. */
  const s = data.shop, sh = data.shipping, r = data.returns;
  setSetting.run('shop_name', s.name);
  setSetting.run('shop_email', s.email);
  setSetting.run('shop_phone', s.phone);
  setSetting.run('shop_address', s.address);
  setSetting.run('returns_address', s.returnsAddress);
  setSetting.run('ship_processing', sh.processing);
  setSetting.run('ship_dubai', sh.dubai);
  setSetting.run('ship_emirates', sh.emirates);
  setSetting.run('ship_international', sh.international);
  setSetting.run('ship_free_threshold_fils', String(toFils(sh.freeThresholdAED)));
  setSetting.run('ship_flat_fils', String(toFils(sh.flatAED)));
  setSetting.run('ship_courier', sh.courier);
  setSetting.run('returns_days', String(r.days));
  setSetting.run('returns_note', r.note);
});

seed();

/* First admin, from the environment. Never a default password. */
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
  const exists = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
  if (!exists) {
    db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)')
      .run(email, bcrypt.hashSync(password, 12));
    console.log('Admin created:', email);
  }
} else {
  const count = db.prepare('SELECT COUNT(*) c FROM admins').get().c;
  if (!count) console.log('No admin yet — set ADMIN_EMAIL and ADMIN_PASSWORD, then run: npm run seed');
}

const counts = {
  products: db.prepare('SELECT COUNT(*) c FROM products').get().c,
  images: db.prepare('SELECT COUNT(*) c FROM product_images').get().c,
  groups: db.prepare('SELECT COUNT(*) c FROM groups').get().c,
  materials: db.prepare('SELECT COUNT(*) c FROM materials').get().c
};
console.log('Seeded:', counts);
