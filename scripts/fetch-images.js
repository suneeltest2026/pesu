#!/usr/bin/env node
'use strict';
/* Downloads the product photography off the Shopify CDN into public/images.
   Run once, before Shopify is closed:  npm run fetch-images
   Needs outbound access to cdn.shopify.com. */
const fs = require('fs');
const path = require('path');

const BASE = 'https://cdn.shopify.com/s/files/1/0769/8962/8589/files/';
const dir = path.join(__dirname, '..', 'public', 'images');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8'));

fs.mkdirSync(dir, { recursive: true });

const files = [...new Set(data.products.flatMap((p) => p.images))];

(async () => {
  let ok = 0, failed = [];
  for (const file of files) {
    const target = path.join(dir, file);
    if (fs.existsSync(target)) { ok++; continue; }
    try {
      const res = await fetch(BASE + encodeURIComponent(file));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      console.log('saved', file);
      ok++;
    } catch (err) {
      console.error('FAILED', file, err.message);
      failed.push(file);
    }
  }
  console.log(`\n${ok}/${files.length} images in public/images`);
  if (failed.length) {
    console.log('Missing:', failed.join(', '));
    console.log('Download these from Shopify admin → Content → Files and drop them in with the same names.');
    process.exitCode = 1;
  }
})();
