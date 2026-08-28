/* A one-off rescue page, served from the live site so the photography can be
   pulled off the old Shopify CDN without anyone having to find a file on their
   own computer. Delete this once public/images is populated. */
const path = require('path');

const CDN = 'https://cdn.shopify.com/s/files/1/0769/8962/8589/files/';

function filenames() {
  const data = require(path.join(__dirname, '..', 'data', 'products.json'));
  const seen = [];
  for (const product of data.products || []) {
    for (const image of product.images || []) {
      if (!seen.includes(image)) seen.push(image);
    }
  }
  return seen;
}

function render() {
  const files = filenames();
  const figures = files.map((file) => `
    <figure>
      <img src="${CDN}${encodeURIComponent(file)}?width=500" alt="${file}" loading="lazy">
      <figcaption data-file="${file}">${file}</figcaption>
    </figure>`).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Rescue the PESU photography</title>
<style>
 :root{--ink:#12100e;--paper:#f6f3ed;--line:#ddd6c9;--gold:#a8874f}
 *{box-sizing:border-box}
 body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:2rem 1.25rem 4rem;
      background:var(--paper);color:var(--ink)}
 .wrap{max-width:1000px;margin:0 auto}
 h1{font-weight:500;font-size:1.6rem;margin:0 0 .5rem}
 p{max-width:62ch;line-height:1.65}
 .cta{margin:1.5rem 0;padding:1.25rem;background:#fff;border:1px solid var(--line)}
 button{font:inherit;font-size:1.05rem;padding:.85rem 1.6rem;border:0;cursor:pointer;
        background:var(--ink);color:#fff;letter-spacing:.02em}
 button:disabled{opacity:.5;cursor:default}
 #status{margin-top:.9rem;font-size:.95rem;min-height:1.4em}
 ol{max-width:62ch;line-height:1.7}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.25rem;margin-top:2rem}
 figure{margin:0;background:#fff;padding:.6rem;border:1px solid var(--line)}
 figure img{width:100%;height:170px;object-fit:contain;background:#efe8dd}
 figcaption{font-size:.7rem;margin-top:.5rem;word-break:break-all;color:#6b6355}
 figure.done{outline:2px solid var(--gold)}
 code{background:#eae4d9;padding:.1em .35em}
</style></head><body><div class="wrap">

<h1>Rescue the PESU photography</h1>
<p>These ${files.length} photographs still live on the old Shopify servers. Save them now,
then upload them to the site so they belong to you.</p>

<div class="cta">
  <button id="go">Download all ${files.length} photos</button>
  <div id="status">Chrome will ask “Download multiple files?” — choose <strong>Allow</strong>.</div>
</div>

<ol>
  <li>Press the button. The photos land in your <strong>Downloads</strong> folder.</li>
  <li>Go to <a href="/admin/products" target="_blank" rel="noopener">the admin</a>, open each
      product, and upload its photos using the filenames shown under each picture below.</li>
</ol>

<p><strong>If the button does not work:</strong> use <em>File → Save Page As</em> and choose
<em>Web Page, Complete</em>. Every photo below is then saved into a folder next to the page.
Or right-click any single photo and choose <em>Save image as…</em>.</p>

<div class="grid">${figures}</div>

<script>
const BASE = ${JSON.stringify(CDN)};
const FILES = ${JSON.stringify(files)};
const status = document.getElementById('status');
const button = document.getElementById('go');

function mark(file) {
  const cap = document.querySelector('figcaption[data-file="' + CSS.escape(file) + '"]');
  if (cap) cap.parentElement.classList.add('done');
}

async function save(file) {
  const response = await fetch(BASE + encodeURIComponent(file));
  if (!response.ok) throw new Error(response.status);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = file;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

button.addEventListener('click', async () => {
  button.disabled = true;
  let saved = 0;
  const failed = [];
  for (const file of FILES) {
    status.textContent = 'Saving ' + (saved + failed.length + 1) + ' of ' + FILES.length + '…';
    try {
      await save(file);
      mark(file);
      saved++;
    } catch (err) {
      failed.push(file);
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  status.innerHTML = failed.length
    ? '<strong>' + saved + ' saved.</strong> ' + failed.length + ' could not be fetched — ' +
      'right-click those below and choose “Save image as…”, or use File → Save Page As.'
    : '<strong>All ' + saved + ' photos are in your Downloads folder.</strong>';
  button.disabled = false;
  button.textContent = 'Download them again';
});
</script>
</div></body></html>`;
}

module.exports = { render, filenames };
