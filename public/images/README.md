# Photography

Product photographs live here, named exactly as `data/products.json` lists
them. They are served at `/images/<filename>` — by Vercel's CDN in
production, by Express when the server runs directly.

Upload them through GitHub (Add file → Upload files) or commit them
normally. Filenames must match the JSON exactly, including the extension
and its case.

Photographs added through the admin instead of committed here are stored
in the database and referenced as `db:<id>`; both kinds can coexist.
