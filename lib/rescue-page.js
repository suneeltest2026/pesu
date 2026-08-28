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
    <figure data-file="${file}">
      <img src="${CDN}${encodeURIComponent(file)}?width=500" alt="${file}" loading="lazy">
      <figcaption>${file}</figcaption>
      <p class="state">checking…</p>
    </figure>`).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Rescue the PESU photography</title>
<style>
 :root{--ink:#12100e;--paper:#f6f3ed;--line:#ddd6c9;--gold:#a8874f;--good:#3f7d4f}
 *{box-sizing:border-box}
 body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:2rem 1.25rem 4rem;
      background:var(--paper);color:var(--ink)}
 .wrap{max-width:1000px;margin:0 auto}
 h1{font-weight:500;font-size:1.6rem;margin:0 0 .5rem}
 p{max-width:62ch;line-height:1.65}
 .cta{margin:1.5rem 0;padding:1.25rem;background:#fff;border:1px solid var(--line)}
 button{font:inherit;font-size:1.05rem;padding:.85rem 1.6rem;border:0;cursor:pointer;
        background:var(--ink);color:#fff;letter-spacing:.02em}
 button:disabled{opacity:.45;cursor:default}
 #status{margin-top:.9rem;font-size:.95rem;min-height:1.4em}
 ol{max-width:62ch;line-height:1.7}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.25rem;margin-top:2rem}
 figure{margin:0;background:#fff;padding:.6rem;border:1px solid var(--line)}
 figure img{width:100%;height:170px;object-fit:contain;background:#efe8dd}
 figcaption{font-size:.7rem;margin-top:.5rem;word-break:break-all;color:#6b6355}
 .state{margin:.35rem 0 0;font-size:.72rem;color:#6b6355}
 figure.have{opacity:.4}
 figure.have .state{color:#3f7d4f}
 figure.need{outline:2px solid var(--gold)}
 figure.saved{outline:2px solid #3f7d4f}
 .hide-have figure.have{display:none}
 label.toggle{display:inline-block;margin-top:1rem;font-size:.9rem}
</style></head><body><div class="wrap">

<h1>Rescue the PESU photography</h1>
<p>This page checks which of the ${files.length} photographs are already on
pesu.ae, and offers to fetch the rest from the old Shopify servers before they
go away.</p>

<div class="cta">
  <button id="go" disabled>Checking what is already here…</button>
  <div id="status"></div>
  <label class="toggle"><input type="checkbox" id="showall"> Show the ones already saved</label>
</div>

<ol>
  <li>Press the button. Chrome asks “Download multiple files?” — choose <strong>Allow</strong>.</li>
  <li>Upload what lands in <strong>Downloads</strong> to
      <a href="https://github.com/suneeltest2026/pesu/upload/main/public/images"
         target="_blank" rel="noopener">this GitHub page</a>, then press
      <em>Commit changes</em>.</li>
  <li>Come back here and refresh: every photograph should read
      <em>already on pesu.ae</em>.</li>
</ol>

<p><strong>If the button does not work:</strong> right-click any photograph
below and choose <em>Save image as…</em>, keeping the filename shown under it
exactly as written.</p>

<div class="grid hide-have" id="grid">${figures}</div>

<script>
const BASE = ${JSON.stringify(CDN)};
const FILES = ${JSON.stringify(files)};
const status = document.getElementById('status');
const button = document.getElementById('go');
const grid = document.getElementById('grid');
let missing = [];

function figure(file) {
  return grid.querySelector('figure[data-file="' + CSS.escape(file) + '"]');
}

/* Ask the live site for each photograph. One that loads is already saved. */
function alreadyHere(file) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = '/images/' + encodeURIComponent(file) + '?check=' + Date.now();
  });
}

async function audit() {
  const results = await Promise.all(FILES.map(alreadyHere));
  missing = [];
  FILES.forEach((file, i) => {
    const fig = figure(file);
    if (results[i]) {
      fig.classList.add('have');
      fig.querySelector('.state').textContent = 'already on pesu.ae';
    } else {
      fig.classList.add('need');
      fig.querySelector('.state').textContent = 'still needed';
      missing.push(file);
    }
  });
  if (!missing.length) {
    button.textContent = 'Nothing left to rescue';
    status.innerHTML = '<strong>All ' + FILES.length +
      ' photographs are on pesu.ae.</strong> Shopify can go.';
    document.getElementById('showall').checked = true;
    grid.classList.remove('hide-have');
    return;
  }
  button.disabled = false;
  button.textContent = 'Download the ' + missing.length + ' still missing';
  status.textContent = (FILES.length - missing.length) + ' of ' + FILES.length +
    ' are already saved.';
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
  const failed = [];
  let saved = 0;
  for (const file of missing) {
    status.textContent = 'Saving ' + (saved + failed.length + 1) + ' of ' +
      missing.length + '…';
    try {
      await save(file);
      figure(file).classList.add('saved');
      figure(file).querySelector('.state').textContent = 'saved to Downloads';
      saved++;
    } catch (err) {
      figure(file).querySelector('.state').textContent = 'could not fetch — right-click it';
      failed.push(file);
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  status.innerHTML = failed.length
    ? '<strong>' + saved + ' saved.</strong> ' + failed.length +
      ' could not be fetched — right-click those and choose “Save image as…”.'
    : '<strong>All ' + saved + ' are in your Downloads folder.</strong> ' +
      'Now upload them to GitHub, using the link in step 2.';
  button.disabled = false;
  button.textContent = 'Try the missing ones again';
});

document.getElementById('showall').addEventListener('change', (e) => {
  grid.classList.toggle('hide-have', !e.target.checked);
});

audit();
</script>
</div></body></html>`;
}

module.exports = { render, filenames };
