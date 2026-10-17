# Fulfilling a pesu.ae order through Zendrop

Every product on pesu.ae is supplied and shipped by Zendrop. Zendrop only takes
orders from a connected Shopify store, so each pesu.ae order is copied into the
private Shopify store (izzwsp-9k.myshopify.com) and Zendrop ships it from there.
The Shopify store stays password-protected; customers only ever see pesu.ae.

## One-time setup

1. In Zendrop, open each product link in the table below and click **Add**.
2. In Zendrop → **My products**, select them all and click **Publish to my store**.
3. In Zendrop, add a payment card (Zendrop charges you for each order it ships).

## For every order

1. pesu.ae admin (`/admin`) → **Orders** → open the new order. Each line shows the
   piece and the option the customer chose, e.g. *Round Metal Tray — Grey*.
2. If the customer paid cash on delivery, note that Zendrop will **not** collect
   cash: you pay Zendrop up front and collect from the customer yourself.
3. Shopify admin → **Orders** → **Create order**. Add the same products, pick the
   Zendrop option shown in the table below, enter the customer's name, phone and
   address — including the **country** shown on the pesu.ae order (UAE, Saudi
   Arabia, Kuwait, Qatar, Bahrain or Oman) — and mark it as paid.

   GCC orders outside the UAE cost Zendrop more to ship; the customer has already
   paid AED 79 per item (AED 29 per item on orders of AED 1,000 or more) for that.
4. Zendrop → **Orders**: the order appears within a few minutes. Click
   **Fulfill order** (or turn on auto-fulfil on a paid Zendrop plan).
5. When Zendrop gives you a tracking number, paste it into the order in the
   pesu.ae admin and set the status to *shipped*.

## Which Zendrop option to pick

| pesu.ae product | Price | Zendrop product | Option to choose in Zendrop/Shopify |
| --- | --- | --- | --- |
| Glazed Ceramic Serving Tray | AED 249 | [Zendrop 2903371](https://app.zendrop.com/product/2903371) | Same name as the pattern chosen (e.g. "Sunny Red (22-02P)") |
| Acrylic Night Light | AED 299 | [Zendrop 2903763](https://app.zendrop.com/product/2903763) | Orange / 18cm |
| Round Metal Tray | AED 189 | [Zendrop 2903342](https://app.zendrop.com/product/2903342) | Beige → "Beige-Yellow", Grey → "Grey-Grey", Blue → "Blue-Blue", Green → "Green-Green" |
| Wooden Weather Station Clock | AED 259 | [Zendrop 2917094](https://app.zendrop.com/product/2917094) | Solid Wood weather clock |
| Cream Cloud Rug | AED 189 | [Zendrop 2909238](https://app.zendrop.com/product/2909238) | "Soft candy cream style-N" (N = style chosen), size 80*120cm |
| Clear Acrylic Flower Rack | AED 129 | [Zendrop 2922743](https://app.zendrop.com/product/2922743) | 30*10 * 6cm 12 holes |
| Twisted Ceramic Vase | AED 139 | [Zendrop 2925638](https://app.zendrop.com/product/2925638) | White → "Twist Flower Device (Plain White)", Coffee → "Twist Flower (Shallow Coffee)" |
| Glass Dome Rose Lamp | AED 119 | [Zendrop 2903801](https://app.zendrop.com/product/2903801) | White → "Phantom White", Blue → "magic blue", Rose Red → "Fantasy Rose Red", Red → "magic red" |
| Flip Clock | AED 279 | [Zendrop 2923943](https://app.zendrop.com/product/2923943) | White → "12 hours stainless steel white", Black → "12 hours stainless steel black" |
| Thinker Bookend | AED 109 | [Zendrop 2926592](https://app.zendrop.com/product/2926592) | Thinker — Black → "Thinking Man-Black", Thinker — White → "Thinking about people-white.", Head — Black → "Thinking Man's Head-Black", Head — White → "Thinking Man's Head-White" |
| Wood Frame Propagation Vase | AED 119 | [Zendrop 2909321](https://app.zendrop.com/product/2909321) | One → "Retro rack + a bottle", Two → "Retro rack + two bottles", Three → "Retro rack + three bottles" |
| Crystal Candle Holder | AED 99 | [Zendrop 2918194](https://app.zendrop.com/product/2918194) | K9 |
| Sculpted Soy Candle | AED 69 | [Zendrop 2909200](https://app.zendrop.com/product/2909200) | Same name as the colour chosen |
| Spiral Ceramic Vase | AED 79 | [Zendrop 2911788](https://app.zendrop.com/product/2911788) | Frosted → "Spiral (frosted)", Glazed → "Spiral (Yurun)" |
| Glass Mushroom Lamp | AED 69 | [Zendrop 2925916](https://app.zendrop.com/product/2925916) | Clear → "SKU-01-transparent", Pink → "SKU-02-Pink", Yellow & Purple → "SKU-03-yellow purple" |
| Vintage Square Tray | AED 89 | [Zendrop 2903369](https://app.zendrop.com/product/2903369) | Camel |
| Bamboo Incense Burner | AED 59 | [Zendrop 2769170](https://app.zendrop.com/product/2769170) | Chevron → "Chevron Pattern", Water Ripple → "Water Ripple", Window → "Hi-Window Pattern", Grass → "Tang Grass Pattern" |
| Ceramic Bird | AED 59 | [Zendrop 2619237](https://app.zendrop.com/product/2619237) | "Big White Bird" / "Big Black Bird" / "Big Silver Bird" / "Big Golden Bird" |
| Cotton Ball String Lights | AED 59 | [Zendrop 2708147](https://app.zendrop.com/product/2708147) | Same name as the colour chosen ("Mixed colours" → "Colorful") |
| Dancing Couple Sculpture | AED 99 | [Zendrop 2889410](https://app.zendrop.com/product/2889410) | A |

## Changing the range

Edit `data/products.json`, then change `catalogVersion` to any new value (today's
date works). On the next deploy the live database picks up the change; products
no longer in the file come off sale but stay in the database for past orders.
