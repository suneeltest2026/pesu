# PESU

Handmade home decor in natural materials — marble, bamboo and cane,
hand-painted wood, sabai grass. Ajman, United Arab Emirates.

This repository holds a storefront front end for [pesu.ae](https://pesu.ae):
a homepage and a product page, built as a self-contained static site. Product
data, copy, imagery and policies come from the live Shopify store.

Brand and UX documentation: [`docs/brand-and-experience.md`](docs/brand-and-experience.md).

## Run it

No build step and no dependencies.

```bash
npx http-server . -p 8099     # then open http://localhost:8099
```

…or open `index.html` directly — the scripts are classic (non-module) scripts
so the pages work from `file://` too.

## Deploy

Static, nothing to build. On Vercel, import the repository and accept the
defaults — Framework Preset **Other**, no build command, output directory
`./`. Or from the folder: `npx vercel --prod`.

`vercel.json` sets clean URLs, a short revalidating cache on `/assets` (the
filenames are not fingerprinted, so long caching would strand visitors on
stale files) and baseline security headers.

## What's here

```
.
├── index.html            Homepage
├── product.html          Product detail — renders any product via ?product=<id>
├── vercel.json           Clean URLs, cache and security headers
├── docs/
│   └── brand-and-experience.md
└── assets/
    ├── css/
    │   ├── base.css        Tokens, reset, type scale, material surfaces, motion
    │   ├── components.css  Header, mega menu, drawers, search, forms, footer
    │   ├── home.css        Homepage sections
    │   └── product.css     Product detail
    └── js/
        ├── store.js        Currency, bag, wishlist — persisted, observable
        ├── catalog.js      The catalogue: products, materials, policies
        ├── ui.js           Shared chrome: reveals, overlays, prices, toasts
        ├── home.js         Hero parallax, shop-by-material picker
        └── product.js      Product page rendering
```

## The catalogue

`assets/js/catalog.js` mirrors the Shopify store: eight products with their
handles, Shopify GIDs, prices in AED, stock, CDN imagery, descriptions and
specifications, plus the shipping and returns facts taken from the published
store policies. Nothing on the site asserts anything that isn't in that file.

To refresh it, re-read the products from the Shopify Admin API and regenerate
the `PRODUCTS` array — ids and handles already match, so nothing else changes.

Merchandising note: the store runs one Shopify collection ("Home Decor"). The
four groups used on the site — Ritual, Light, Wall, Table — are a layer in
`catalog.js`. Create them as real collections in Shopify and they can be read
from there instead.

## Working features

- **Product page for the whole range** — `product.html?product=<id>` renders
  any of the eight products: gallery with zoom, specifications, delivery and
  returns, related pieces. Real Shopify options render only where a product
  actually has them.
- **Bag** — line items with quantity and stock ceiling, persisted in
  `localStorage`, checkout handed off to `pesu.ae/cart`.
- **Wishlist**, **search across the catalogue**, mega menu, mobile menu.
- Prices in AED exactly as the store charges them, decimals included.

## Known gaps before this replaces the live store

- **Rendering.** Product pages render client-side. Each product needs
  pre-rendering to its own URL (or a move to a framework with SSG) to be
  crawlable and shareable.
- **Checkout.** The bag hands off to Shopify rather than checking out here.
  A real implementation uses the Storefront API to create the cart.
- **Photography.** Images are hotlinked from the Shopify CDN at request-time
  widths. Fine to start; art direction is the bigger opportunity.
- **Currency.** AED only, matching the store. More currencies belong here
  once Shopify Markets publishes real per-market prices.
