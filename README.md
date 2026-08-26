# PESU

Handmade home decor in natural materials — marble, bamboo and cane,
hand-painted wood, sabai grass. Ajman, United Arab Emirates.

An independent storefront: catalogue, bag, checkout, orders and admin, all
running on one server against one database. **No Shopify, and no third-party
service in the request path.** The only outbound call is to the card payment
provider, and only when a customer chooses to pay by card.

## Run it locally

```bash
npm install
cp .env.example .env          # set SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                  # creates the database from data/products.json
npm start                     # http://localhost:3000
```

Admin is at `/admin`.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Server | Node + Express | Plain, portable, no framework lock-in |
| Database | SQLite (better-sqlite3) | One file you own. Back it up by copying it |
| Views | EJS, server-rendered | Every page crawlable, works with JS off |
| Payments | Adapter per method | Stripe today; a UAE gateway is one new file |
| Email | Nodemailer, optional | No SMTP configured = no confirmations, orders still work |
| Hosting | Anything running Node | `render.yaml` and `Dockerfile` included |

## How it's laid out

```
server.js              Express app, sessions, view locals
db/
  schema.sql           Products, images, orders, admins, settings
  seed.js              Seeds from data/products.json — safe to re-run
lib/
  money.js             Integer fils; no float ever touches a price
  shop.js              Read models for the storefront
  cart.js              Session bag, re-priced from the database on every read
  orders.js            Order creation in one transaction, with restock on cancel
  mail.js              Optional order confirmations
  pages.js             Delivery, returns, terms, privacy — from real policy text
  payments/            index · stripe (card) · cod · bank
routes/                shop · cart · checkout · admin
views/                 EJS templates and partials
public/assets/         The design system (CSS) and site.js
public/images/         Product photography, self-hosted
data/products.json     The canonical catalogue
```

## Things worth knowing

**Money is integer fils.** AED 24.99 is `2499`. Nothing is ever stored or
totalled as a float, so no rounding drift reaches a customer.

**Prices come from the database, never the browser.** The bag stores product
ids and quantities only; every total is recalculated server-side. A tampered
form cannot change what an order costs.

**Stock is checked twice** — when adding to the bag, and again inside the
order transaction. Cancelling an order in the admin returns the stock.

**The site works without JavaScript.** Add to bag, quantity changes, search
and checkout are all real form posts. `site.js` upgrades them: it opens the
bag drawer instead of reloading, and adds reveals and the gallery.

## Payments

`lib/payments/` holds one file per method. Each exports `id`, `label`,
`description`, `available()` and `start(order, ctx)`. A method whose
`available()` returns false simply doesn't appear at checkout — so the shop
runs with cash on delivery until card keys exist.

- **Card** — Stripe Checkout. Set `STRIPE_SECRET_KEY`. The customer pays on
  Stripe's page, so card details never touch this server. On return, payment
  is verified against Stripe rather than trusted from the URL.
- **To use a UAE gateway instead** (Telr, PayTabs, Network N-Genius): copy
  `stripe.js`, build their hosted-payment-page request in `start()`, return
  `{ redirect: url }`. Nothing else in checkout changes.
- **Cash on delivery** — on by default, `ENABLE_COD=false` to remove it.
- **Bank transfer** — appears when `BANK_ACCOUNT_NAME` and `BANK_IBAN` are set.

## Deploying to Render

`render.yaml` describes the service: a web instance plus a 1 GB persistent
disk mounted at `/var/data` holding both the database and admin-uploaded
images.

1. Render → New → Blueprint → point at this repository.
2. Set the secrets it asks for: `PUBLIC_URL`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, and SMTP if you want order emails.
3. Deploy. The build runs `npm ci && npm run seed`.

A persistent disk needs a paid instance type — on the free tier the database
is wiped on every deploy.

**Back-ups:** the database is one file. `cp /var/data/pesu.db backup.db` is a
complete back-up, and there is no export process to depend on.

## Outstanding before this replaces pesu.ae

1. **Product photography.** `public/images/` is empty. Run
   `npm run fetch-images` from a machine that can reach the Shopify CDN, or
   download from Shopify admin → Content → Files and drop the files in with
   their names unchanged. See `data/README.md`.
2. **Card keys.** Checkout offers cash on delivery until `STRIPE_SECRET_KEY`
   (or another gateway) is set.
3. **SMTP.** Without it, order confirmations aren't sent. Orders are still
   taken and visible in the admin.
4. **DNS.** Point pesu.ae at the deployment only once 1–3 are done. Until
   then use a subdomain.
