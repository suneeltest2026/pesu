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
cp .env.example .env          # set DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                  # creates the schema and loads data/products.json
npm start                     # http://localhost:3000
```

Any PostgreSQL will do — a local server, Neon, Supabase, or Vercel's own.
Schema and seed also run automatically on first request, so a fresh database
fills itself in.

Admin is at `/admin`.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Server | Node + Express | Plain, portable, no framework lock-in |
| Database | PostgreSQL (`pg`) | Durable, free tiers everywhere, and the data is exportable |
| Views | EJS, server-rendered | Every page crawlable, works with JS off |
| Payments | Adapter per method | Stripe today; a UAE gateway is one new file |
| Email | Nodemailer, optional | No SMTP configured = no confirmations, orders still work |
| Hosting | Vercel, or any Node host | `vercel.json` and `Dockerfile` included |

## How it's laid out

```
server.js              Express app, sessions, view locals
api/index.js           Serverless entry point; imports the same Express app
db/
  index.js             Pooled Postgres connection, transactions, lazy migrate
  schema.sql           Products, images, orders, admins, settings, sessions
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

**Stock is checked twice, and locked once.** It is checked when adding to the
bag, then re-checked inside the order transaction with `SELECT … FOR UPDATE`,
so two shoppers racing for the last piece cannot both get it — one gets the
order, the other gets told how many are left. Cancelling an order returns the
stock.

**Uploaded images live in the database.** Serverless hosting has no writable
disk that survives a request, so images added through the admin are stored as
bytes and served from `/img/<id>`. Photography committed to `public/images`
is served straight from the CDN.

**The site works without JavaScript.** Add to bag, quantity changes, search
and checkout are all real form posts. `site.js` upgrades them: it opens the
bag drawer instead of reloading, and adds reveals and the gallery.

## Payments

`lib/payments/` holds one file per method. Each exports `id`, `label`,
`description`, `available()` and `start(order, ctx)`. A method whose
`available()` returns false simply doesn't appear at checkout — so the shop
runs with cash on delivery until card keys exist.

- **Card** — Stripe Checkout. The customer pays on Stripe's hosted page, so
  card details never touch this server and PCI scope stays minimal. See the
  setup below.
- **To use a UAE gateway instead** (Telr, PayTabs, Network N-Genius): copy
  `stripe.js`, build their hosted-payment-page request in `start()`, return
  `{ redirect: url }`. Nothing else in checkout changes.
- **Cash on delivery** — on by default, `ENABLE_COD=false` to remove it.
- **Bank transfer** — appears when `BANK_ACCOUNT_NAME` and `BANK_IBAN` are set.

### Stripe setup

1. **Keys.** Stripe dashboard → Developers → API keys. Set
   `STRIPE_SECRET_KEY` (`sk_test_…` to trial it, `sk_live_…` when you go
   live). Card payment appears at checkout as soon as the key is set.
2. **Webhook.** Developers → Webhooks → Add endpoint:
   - URL: `https://your-domain/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`,
     `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. **Test it** before going live: use a `sk_test_` key and card
   `4242 4242 4242 4242`, any future expiry, any CVC. To test webhooks
   locally, `stripe listen --forward-to localhost:3000/webhooks/stripe`.
4. **Account settings.** Make sure AED is enabled for your Stripe account and
   your payout account is UAE-based.

**Why the webhook matters.** The success page marks an order paid when the
customer comes back, but people close tabs. The webhook is the authoritative
record: signature-verified, idempotent on replay, and it releases reserved
stock when a checkout session expires unpaid. Without it, a paid order can
sit as `pending` until someone notices.

To use a different gateway (Telr, PayTabs, Network N-Genius) instead, copy
`lib/payments/stripe.js`, build their hosted-payment-page request in
`start()`, return `{ redirect: url }`, and point their callback at an
equivalent route in `routes/webhooks.js`.

## Deploying to Vercel

Free on the Hobby plan, including the database.

1. **Import the repository** at vercel.com → Add New → Project. No build
   settings to change; `vercel.json` routes everything to `api/index.js` and
   serves `public/` from the CDN.
2. **Add a Postgres store**: project → Storage → Create → Postgres. Vercel
   sets `DATABASE_URL` (and friends) on the project automatically.
3. **Set the remaining environment variables** (Settings → Environment
   Variables):

   | Key | Value |
   | --- | --- |
   | `SESSION_SECRET` | 64 random hex characters |
   | `PUBLIC_URL` | your deployment URL |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your admin login |
   | `STRIPE_SECRET_KEY` | `sk_test_…` to begin |
   | `STRIPE_WEBHOOK_SECRET` | after registering the webhook |

4. **Deploy.** On the first request the schema is created and the catalogue
   seeded, behind a Postgres advisory lock so concurrent cold starts cannot
   duplicate the work.

**Sessions live in Postgres**, so a bag survives across serverless
invocations and deployments.

### Running it anywhere else

`Dockerfile` builds the same app for a VPS or any container host. Set
`DATABASE_URL` and it behaves identically — nothing in the code is
Vercel-specific.

## Outstanding before this replaces pesu.ae

1. **Product photography.** `public/images/` is empty. Run
   `npm run fetch-images` from a machine that can reach the Shopify CDN, or
   download from Shopify admin → Content → Files and drop the files in with
   their names unchanged. See `data/README.md`.
2. **Stripe keys.** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` and
   register the webhook endpoint (see Stripe setup above). Until then,
   checkout offers cash on delivery only.
3. **SMTP.** Without it, order confirmations aren't sent. Orders are still
   taken and visible in the admin.
4. **DNS.** Point pesu.ae at the deployment only once 1–3 are done. Until
   then use the Vercel URL or a subdomain.
