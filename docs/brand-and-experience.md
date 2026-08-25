# PESU — Brand, Experience & Platform Notes

_Handmade home decor in natural materials. Ajman, United Arab Emirates._

> **Status.** This front end was first built as a concept for a made-to-order
> luxury furniture house. It has since been re-pointed at the real pesu.ae
> catalogue — eight products, AED 24.99–199 — and every claim on the site now
> traces to the live Shopify store or its published policies. The visual
> identity below survived that change; the merchandising and copy did not.

---

## 1. Positioning

PESU sells small, handmade objects for calm rooms: incense and tea light
holders, hand-woven lamps, hand-painted wall frames, decorative bowls and
planters. Natural materials, visible craft, priced so that a considered object
is an ordinary purchase rather than an event.

- **Market:** United Arab Emirates, AED-priced, delivered by Quiqup
- **Range:** eight products across four uses — Ritual, Light, Wall, Table
- **Price band:** AED 24.99 – 199
- **Differentiator:** the maker is visible in the object, and the variation
  that comes with that is stated rather than hidden

### Voice
Declarative, material-first, unhurried. Specific nouns over adjectives —
sabai grass, Mayurbhanj, 17 × 19 cm. Handmade variation is described as the
reason to buy, never apologised for. No urgency language, no invented
scarcity, no service the store does not actually provide.

- **We say:** "Dispatched in 1–2 business days. Free over AED 200."
- **We never say:** "Luxury redefined", "Limited time", or any lead time,
  guarantee or service that isn't in the store's own policies.

### What the site may claim
Everything asserted on the site comes from `assets/js/catalog.js`, which
mirrors the store:

| Claim | Source |
| --- | --- |
| Free UAE delivery over AED 200, AED 25 below | Shipping policy |
| Dispatch 1–2 days; Dubai 1–3; other emirates 5–7 | Shipping policy |
| 15-day returns, unused, original packaging | Refund policy |
| Handmade variation is not a defect | Legal notice |
| care@pesu.ae · +971 56 712 6966 · Ajman | Contact policy |

---

## 2. Visual identity

Unchanged from the original system, because it suits the range: warm
neutrals, one metal accent, a great deal of air.

### Wordmark
`P E S U` in Cormorant Garamond Light, uppercase, tracked at 0.42em in
navigation and 0.30em at hero scale, with the tracking mirrored as a
`text-indent` so the mark stays optically centred. Never stretched, never
outlined, never paired with a symbol.

### Colour

| Token | Hex | Role |
| --- | --- | --- |
| Ink | `#12100E` | Dark ground — warm, never pure black |
| Alabaster | `#F7F3ED` | Light ground |
| Gypsum | `#EFE8DD` | Secondary light, product stages |
| Dune | `#DCCEBB` | Tertiary surface |
| Gilt | `#B08D4F` | The only accent |
| Clay | `#A9765A` | Wishlist, low-stock |

Roughly 70% neutral ground, 25% material, 5% gilt. Sections alternate light
and dark down the page via a single `.on-dark` class that re-points the
semantic tokens.

### Typography
Cormorant Garamond Light for display, product names and prices; Jost
(200/300/400) for interface, uppercase at 0.22em for labels and buttons. Nine
fluid `clamp()` steps from a 390 px phone to a 1560 px desktop.

### Material surfaces
Six CSS textures — marble, cane, wood, sabai, silver, wood-and-glass — sit
behind every product image. They are the loading and failure state for
photography, so a slow connection degrades to a texture rather than a hole,
and they double as the swatches in the shop-by-material picker.

### Imagery
Product photography comes from the Shopify CDN at request-time widths.
Art direction is the biggest available upgrade: one object, warm neutral
seamless, single directional source, deep soft shadow, consistent crop.
Several products currently mix shot styles and aspect ratios.

---

## 3. Site map

```
PESU
├── Home
├── Shop            — four groups: Ritual · Light · Wall · Table
│   └── Product     — product.html?product=<id>, all eight pieces   ← built
├── Materials       — six materials, each linked to what it becomes
├── Gifting         — occasions, drawn from the store's own copy
├── Ordering        — delivery, returns, handmade variation, contact
└── Bag → checkout on pesu.ae
```

### Homepage, section by section

| # | Section | Job |
| --- | --- | --- |
| 1 | Hero | The house before the shop: wordmark, "Calm, made by hand", one CTA |
| 2 | Ticker | The four real promises in one calm line |
| 3 | About | Why handmade variation is the point, not a caveat |
| 4 | The range | Four group tiles, real photography, price from |
| 5 | Spotlight | One piece in full — the bamboo and cane lamps |
| 6 | Shop by material | Six swatches, each swapping to a real piece and its price |
| 7 | Materials | The six materials with their origins |
| 8 | Gifting | Housewarming, Ramadan and Eid, Diwali, a new home |
| 9 | Ordering | Delivery, returns, variation, how to reach a person |
| 10 | Care notes | Three short, true notes on living with the materials |
| 11 | Keep in touch | New pieces and restocks |
| 12 | Footer | Wordmark, real links, real contact details |

### Product page
Gallery with zoom and thumbnails on the left, a sticky purchase rail on the
right, story and accordions below. On a phone the order is gallery →
purchase rail → story, so nobody scrolls past the description to reach the
price, plus a sticky buy bar.

The rail shows group and material, name, stock (with a low-stock state under
six), price, the delivery line for that price, the product's own feature
list, quantity capped at available stock, add to bag, save, and a link
through to the live store. Options render only where the product has real
Shopify options — one of the eight does.

### Motion
One easing curve — `cubic-bezier(0.16, 1, 0.30, 1)` — at 260 ms for controls,
620 ms for state, 1100 ms for reveals. Nothing bounces; nothing enters from
off-screen except drawers. All of it gated behind `prefers-reduced-motion`.

---

## 4. Platform

| Capability | Today | Next |
| --- | --- | --- |
| Catalogue | `catalog.js`, mirroring the Shopify store | Generated from the Admin API on build |
| Groups | Four merchandising groups in code | Real Shopify collections |
| Search | Client-side over eight products | Fine at this size; revisit past ~50 |
| Bag | Local, persisted, keyed on product | Storefront API cart |
| Checkout | Hands off to pesu.ae/cart | Storefront API checkout in place |
| Accounts | Links to the Shopify account area | Same — no need to rebuild it |
| Currency | AED, exact | Shopify Markets, real per-market prices |
| Rendering | Client-side product pages | Pre-rendered per product for SEO |

---

## 5. Roadmap

**Phase 1 — make it publishable (1–2 weeks)**
1. Pre-render each product to its own URL, with per-product title, description
   and Open Graph tags.
2. Add product and breadcrumb structured data (JSON-LD) so listings show price
   and availability.
3. Generate `catalog.js` from the Admin API with a small script, so stock and
   price never drift from the store.

**Phase 2 — make it transact (2–3 weeks)**
4. Storefront API cart and checkout, replacing the hand-off.
5. Real Shopify collections behind the four groups; a proper listing page with
   filtering by material and price.
6. Low-stock and sold-out states driven by live inventory rather than a
   snapshot.

**Phase 3 — grow the range (ongoing)**
7. Consistent photography across all products; retire the mixed crops.
8. Variants where they make commercial sense — sizes for the frames, sets for
   the tea light holders — which the product page already supports.
9. Editorial: the sabai grass story is the strongest thing in the catalogue
   copy and deserves its own page.
10. Arabic locale — the CSS already uses logical properties, so it is a type
    and translation job rather than a rebuild.
