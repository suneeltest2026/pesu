'use strict';
/* Seeds the catalogue from data/products.json — the export taken out of
   Shopify. Idempotent: products are upserted by id, orders are never touched.
   Runs either from the CLI (`npm run seed`) or lazily on first boot. */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { toFils } = require('../lib/money');

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8')
);

async function seedWith(client) {
  for (const [i, g] of data.groups.entries()) {
    await client.query(
      `INSERT INTO groups (id, name, line, position) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = $2, line = $3, position = $4`,
      [g.id, g.name, g.line, i]
    );
  }

  for (const [i, m] of data.materials.entries()) {
    await client.query(
      `INSERT INTO materials (id, name, short, swatch, origin, note, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET name = $2, short = $3, swatch = $4,
         origin = $5, note = $6, position = $7`,
      [m.id, m.name, m.short, m.swatch, m.origin, m.note, i]
    );
  }

  for (const [i, p] of data.products.entries()) {
    await client.query(
      `INSERT INTO products (id, handle, legacy_handle, name, full_title, group_id,
         material_id, price_fils, compare_fils, inventory, active, blurb, seo_desc,
         story_json, features_json, specs_json, options_json, tags_json, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO UPDATE SET
         handle = $2, name = $4, full_title = $5, group_id = $6, material_id = $7,
         price_fils = $8, compare_fils = $9, inventory = $10, active = $11,
         blurb = $12, seo_desc = $13, story_json = $14, features_json = $15,
         specs_json = $16, options_json = $17, tags_json = $18, position = $19,
         updated_at = now()`,
      [
        p.id, p.handle, p.legacyHandle || null, p.name, p.fullTitle, p.group,
        p.material, toFils(p.priceAED), p.compareAtAED ? toFils(p.compareAtAED) : null,
        p.inventory, p.active !== false, p.blurb || null, p.seoDescription || null,
        JSON.stringify(p.story || []), JSON.stringify(p.features || []),
        JSON.stringify(p.specs || {}), JSON.stringify(p.options || []),
        JSON.stringify(p.tags || []), i
      ]
    );

    /* Only replace repository images; anything uploaded through the admin
       (which carries its own bytes) is left alone. */
    await client.query('DELETE FROM product_images WHERE product_id = $1 AND data IS NULL', [p.id]);
    for (const [j, filename] of (p.images || []).entries()) {
      await client.query(
        'INSERT INTO product_images (product_id, filename, alt, position) VALUES ($1, $2, $3, $4)',
        [p.id, filename, p.name, j]
      );
    }
  }

  const s = data.shop, sh = data.shipping, r = data.returns;
  const settings = {
    shop_name: s.name, shop_email: s.email, shop_phone: s.phone,
    shop_address: s.address, returns_address: s.returnsAddress,
    ship_processing: sh.processing, ship_dubai: sh.dubai, ship_emirates: sh.emirates,
    ship_international: sh.international,
    ship_free_threshold_fils: String(toFils(sh.freeThresholdAED)),
    ship_flat_fils: String(toFils(sh.flatAED)), ship_courier: sh.courier,
    returns_days: String(r.days), returns_note: r.note
  };
  for (const [key, value] of Object.entries(settings)) {
    await client.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, value]
    );
  }

  /* First admin, from the environment. Never a default password. */
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await client.query(
      `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [email.toLowerCase(), bcrypt.hashSync(password, 12)]
    );
  }
}

module.exports = { seedWith };

/* CLI entry point. */
if (require.main === module) {
  (async () => {
    const { pool, transaction } = require('./index');
    const fsSchema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(fsSchema);
    await transaction(seedWith);
    const counts = await pool.query(`
      SELECT (SELECT COUNT(*) FROM products)::int AS products,
             (SELECT COUNT(*) FROM product_images)::int AS images,
             (SELECT COUNT(*) FROM groups)::int AS groups,
             (SELECT COUNT(*) FROM materials)::int AS materials,
             (SELECT COUNT(*) FROM admins)::int AS admins`);
    console.log('Seeded:', counts.rows[0]);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('No admin set — export ADMIN_EMAIL and ADMIN_PASSWORD, then run again.');
    }
    await pool.end();
  })().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
}
