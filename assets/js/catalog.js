/* ==========================================================================
   PESU — Catalogue
   Real store data, pulled from the pesu.ae Shopify store.
   Prices in AED, images from the Shopify CDN, copy and specifications taken
   from the live product records and the published store policies.

   Product identity (id / handle / gid) matches Shopify exactly, so this file
   can be regenerated from the Admin API rather than hand-edited.
   ========================================================================== */
window.PESU = window.PESU || {};

(function (PESU) {
  'use strict';

  /* --- The house ---------------------------------------------------------
     From the published store policies — not invented. Any claim shown on the
     site should be traceable to something here.                             */
  var SHOP = {
    name: 'PESU',
    phone: '+971 56 712 6966',
    phoneHref: 'tel:+971567126966',
    email: 'care@pesu.ae',
    city: 'Ajman, United Arab Emirates',
    returnsAddress: 'C1 Building, Ajman Free Zone, Ajman',
    courier: 'Quiqup',
    storeUrl: 'https://pesu.ae'
  };

  var SHIPPING = {
    processing: '1–2 business days',
    dubai: '1–3 business days',
    emirates: '5–7 business days',
    international: 'up to 15 business days',
    freeThresholdAED: 200,
    flatAED: 25,
    outsideUaeAED: 75,
    note: 'Free delivery across the UAE on orders of AED 200 and above.'
  };

  var RETURNS = {
    days: 15,
    note: 'Unused, in original packaging, with proof of purchase.'
  };

  /* --- Materials ----------------------------------------------------------
     Six materials that actually run through the range. `swatch` is the CSS
     texture; `products` links each material to what is made from it.        */
  var MATERIALS = [
    {
      id: 'marble',
      name: 'Marble',
      short: 'Marble',
      origin: 'Hand-finished natural stone',
      note: 'Cool to the touch, honest in texture — no two pieces exactly alike.',
      swatch: 'mat-travertine',
      products: ['marble-incense']
    },
    {
      id: 'bamboo',
      name: 'Bamboo & cane',
      short: 'Cane',
      origin: 'Traditional hand-weaving',
      note: 'Light passes through in soft, uneven patterns — never harsh, never perfect.',
      swatch: 'mat-boucle',
      products: ['bamboo-lamps']
    },
    {
      id: 'wood',
      name: 'Hand-painted wood',
      short: 'Wood',
      origin: 'Painted by hand, piece by piece',
      note: 'Brushwork you can read up close, on a frame built to outlast a trend.',
      swatch: 'mat-oak',
      products: ['frames-classic', 'frame-turquoise']
    },
    {
      id: 'sabai',
      name: 'Sabai grass',
      short: 'Sabai',
      origin: 'Mayurbhanj, Odisha',
      note: 'Sun-dried, hand-twisted into rope, then braided by rural artisans.',
      swatch: 'mat-clay',
      products: ['sabai-tealight']
    },
    {
      id: 'silver',
      name: 'Silver finish',
      short: 'Silver',
      origin: 'Premium metal finish',
      note: 'A quiet shine that holds the light without shouting about it.',
      swatch: 'mat-brass',
      products: ['elephant-bowl', 'krishna-tlight']
    },
    {
      id: 'ply',
      name: 'Wood & glass',
      short: 'Glass',
      origin: 'Handmade, dovetailed',
      note: 'Knots, scratches and blemishes left in place — the evidence of real wood.',
      swatch: 'mat-basalt',
      products: ['dovetail-planter']
    }
  ];

  /* --- Groupings ---------------------------------------------------------
     The store runs one Shopify collection today ("Home Decor"). These four
     groups are a merchandising layer over the same products; when real
     collections exist in Shopify they replace this list.                    */
  var GROUPS = [
    { id: 'ritual', name: 'Ritual',  line: 'Incense, tea lights and the quiet minutes',   swatch: 'mat-travertine' },
    { id: 'light',  name: 'Light',   line: 'Hand-woven shades and warm, uneven glow',      swatch: 'mat-boucle' },
    { id: 'wall',   name: 'Wall',    line: 'Hand-painted frames and gallery walls',        swatch: 'mat-oak' },
    { id: 'table',  name: 'Table',   line: 'Centrepieces, bowls and small green things',   swatch: 'mat-brass' }
  ];

  var CDN = 'https://cdn.shopify.com/s/files/1/0769/8962/8589/files/';

  /* --- Products ----------------------------------------------------------- */
  var PRODUCTS = [
    {
      id: 'marble-incense',
      gid: 'gid://shopify/Product/8597235859629',
      handle: 'luxury-marble-incense-holder-handmade-minimal-home-decor-pesu-uae',
      name: 'Marble Incense Holder',
      fullTitle: 'Handcrafted Marble Incense Holder — Raw Stone, Quiet Ritual',
      group: 'ritual',
      material: 'marble',
      priceAED: 89,
      inventory: 10,
      blurb: 'A small ritual, carved in stone',
      images: [CDN + 'IMG-8088.png?v=1780069020'],
      story: [
        'A small ritual, carved in stone. This incense holder is cut from natural marble — cool to the touch, honest in texture, with no two pieces exactly alike.',
        'Light it during meditation, prayer, or simply the quiet minutes before bed. Let the smoke settle the room, and let the stone settle you.'
      ],
      features: [
        'Natural marble, hand-finished',
        'Minimal form, raw material',
        'A daily reset for your space'
      ],
      specs: {
        Material: 'Natural marble, hand-finished',
        Finish: 'Raw stone, honest texture',
        Care: 'Wipe with a soft, dry cloth',
        Note: 'Handmade — colour and veining vary piece to piece'
      }
    },
    {
      id: 'bamboo-lamps',
      gid: 'gid://shopify/Product/8596344963245',
      handle: 'handmade-bamboo-cane-hanging-lamps-set-of-3',
      name: 'Bamboo & Cane Hanging Lamps',
      fullTitle: 'Handmade Bamboo & Cane Hanging Lamps — Set of 3',
      group: 'light',
      material: 'bamboo',
      priceAED: 149,
      inventory: 5,
      blurb: 'Set of three, hand-woven',
      images: [
        CDN + 'IMG-8060.jpg?v=1779981651',
        CDN + 'IMG-8061.jpg?v=1779981651',
        CDN + 'IMG-8062.jpg?v=1779981651',
        CDN + 'IMG-8063.jpg?v=1779981651'
      ],
      story: [
        'Light, filtered through something real. Hand-woven from natural bamboo and cane, these lamps let light pass through in soft, uneven patterns — never harsh, never perfect.',
        'Hang them over a dining table, a reading corner, or a quiet hallway, and watch the room settle into a warmer glow. No two lamps are identical — the small irregularities are part of the craft, not a flaw in it.'
      ],
      features: [
        'Hand-woven bamboo and cane, set of 3',
        'Soft, ambient light with natural shadow texture',
        'Lightweight, easy to hang',
        'Eco-friendly, sustainably made'
      ],
      specs: {
        'Set includes': '3 hanging lamps',
        Material: 'Natural bamboo & cane',
        Dimensions: '17 cm diameter × 19 cm height, each',
        Includes: 'Bulb holder + 2 m wire with plug',
        Care: 'Wipe gently with a soft, dry cloth'
      }
    },
    {
      id: 'frames-classic',
      gid: 'gid://shopify/Product/8596307673261',
      handle: 'classic-handpainted-wooden-wall-frames-elegant-artistic-wall-decor',
      name: 'Handpainted Wall Frames, Classic',
      fullTitle: 'Classic Handpainted Wooden Wall Frames — Elegant Artistic Wall Décor',
      group: 'wall',
      material: 'wood',
      priceAED: 199,
      inventory: 10,
      blurb: 'Intricate brushwork on wood',
      images: [
        CDN + 'IMG-8059.png?v=1779979974',
        CDN + 'IMG-8058.png?v=1779979974',
        CDN + 'IMG-8057.png?v=1779979974',
        CDN + 'IMG-8056.png?v=1779979974'
      ],
      story: [
        'Intricate handpainted detailing on premium wood, for walls that need warmth rather than another print.',
        'Built for gallery arrangements and statement walls — living rooms, hallways, entryways — and equally at home in modern, traditional or layered interiors.'
      ],
      features: [
        'Handpainted detailing, piece by piece',
        'Premium wooden craftsmanship',
        'Made for gallery walls and statement arrangements'
      ],
      specs: {
        Type: 'Decorative wall frames',
        Material: 'Wood',
        Finish: 'Handpainted',
        Spaces: 'Living room, bedroom, hallway, entryway, office',
        Care: 'Wipe with a soft, dry cloth only'
      }
    },
    {
      id: 'frame-turquoise',
      gid: 'gid://shopify/Product/8596301807789',
      handle: 'turquoise-handpainted-wooden-wall-frame-artistic-luxury-wall-decor',
      name: 'Handpainted Wall Frame, Turquoise',
      fullTitle: 'Turquoise Handpainted Wooden Wall Frame — Artistic Luxury Wall Décor',
      group: 'wall',
      material: 'wood',
      priceAED: 69,
      inventory: 25,
      blurb: 'One colour, held against a neutral wall',
      images: [
        CDN + 'IMG-8054.png?v=1779979790',
        CDN + 'IMG-8053.png?v=1779979791'
      ],
      story: [
        'A rich turquoise finish over handpainted detailing — colour used the way a room can take it, in one place rather than everywhere.',
        'Hang it alone against a neutral wall, or let it anchor a gallery arrangement of quieter frames.'
      ],
      features: [
        'Rich turquoise finish, handpainted',
        'Artistic detailing on premium wood',
        'Anchors a gallery wall or stands alone'
      ],
      specs: {
        Type: 'Decorative wall frame',
        Material: 'Wood',
        Finish: 'Handpainted turquoise',
        Spaces: 'Living room, bedroom, hallway, entryway, office',
        Care: 'Wipe with a soft, dry cloth only'
      }
    },
    {
      id: 'krishna-tlight',
      gid: 'gid://shopify/Product/8596289159341',
      handle: 'krishna-t-light-candle-holder-elegant-spiritual-home-decor',
      name: 'Krishna T-Light Holder',
      fullTitle: 'Krishna T-Light Candle Holder — Elegant Spiritual Home Décor',
      group: 'ritual',
      material: 'silver',
      priceAED: 49,
      inventory: 10,
      blurb: 'Candlelight for a prayer corner',
      images: [
        CDN + 'IMG-8052.jpg?v=1779979420',
        CDN + 'IMG-8051.jpg?v=1779979420',
        CDN + 'IMG-8050.png?v=1779979423',
        CDN + 'IMG-8049.png?v=1779979420'
      ],
      story: [
        'A Krishna-inspired form with intricate detailing, made to hold a single tea light and the warmth that comes with it.',
        'For coffee tables, prayer corners, shelves and festive setups — Ramadan, Eid, Diwali, or an ordinary evening that deserves better light.'
      ],
      features: [
        'Krishna-inspired decorative design',
        'Warm, peaceful candlelight ambiance',
        'For festive setups, prayer corners and shelves'
      ],
      specs: {
        Type: 'T-light candle holder',
        Material: 'Premium decorative finish',
        Spaces: 'Living room, prayer room, bedroom, entryway, office',
        Care: 'Wipe with a soft, dry cloth only'
      }
    },
    {
      id: 'elephant-bowl',
      gid: 'gid://shopify/Product/8596269170861',
      handle: 'silver-elephant-decorative-bowl-elegant-luxury-home-decor',
      name: 'Silver Elephant Bowl',
      fullTitle: 'Silver Elephant Decorative Bowl — Elegant Luxury Home Décor',
      group: 'table',
      material: 'silver',
      priceAED: 99,
      inventory: 10,
      blurb: 'A centrepiece that carries symbolism',
      images: [
        CDN + 'kTcMELfR_C31DFRVVG2_2025-03-19_4.webp?v=1779977074',
        CDN + 'kTcMELfR_8ZNGJOKFMI_2025-03-19_3.webp?v=1779977074',
        CDN + 'kTcMELfR_ICMVLCFBU5_2025-03-19_2.webp?v=1779977074',
        CDN + 'kTcMELfR_LOV9P61VHQ_2025-03-19_1.webp?v=1779977074'
      ],
      story: [
        'An elephant-inspired form in a premium silver finish — a centrepiece for a coffee table, a console, or a dining table that needs one considered object rather than five.',
        'The elephant carries its own symbolism: wisdom, prosperity, strength. It reads as decoration first and meaning second, which is the right order.'
      ],
      features: [
        'Luxury silver finish with premium detailing',
        'Elephant-inspired decorative form',
        'Centrepiece for coffee tables, consoles and shelves'
      ],
      specs: {
        Type: 'Decorative bowl',
        Material: 'Premium metal, silver finish',
        Spaces: 'Living room, dining room, bedroom, office, entryway',
        Care: 'Wipe with a soft, dry cloth only'
      }
    },
    {
      id: 'sabai-tealight',
      gid: 'gid://shopify/Product/8592413425837',
      handle: 'handwoven-sabai-grass-tea-light-holder',
      name: 'Sabai Grass Tea Light Holder',
      fullTitle: 'Handwoven Sabai Grass Tea Light Holder',
      group: 'ritual',
      material: 'sabai',
      priceAED: 24.99,
      inventory: 20,
      blurb: 'Hand-twisted grass, braided by artisans',
      images: [
        CDN + 'HR6010134010200_1.jpg?v=1779608582',
        CDN + '6010134010200_2.jpg?v=1779608581',
        CDN + '6010134010200_3.jpg?v=1779608581'
      ],
      story: [
        'Mayurbhanj in Odisha is known as the land of tigers, and also for its handicrafts. This holder is woven there, by rural artisans, from sabai grass.',
        'The grass is sun-dried, hand-twisted into rope, rubbed against tree bark to take off the rough edges, then braided. It is slow work, and it shows in the object.'
      ],
      features: [
        'Handwoven sabai grass',
        'Eco-friendly and artisanal',
        'One-of-a-kind by nature of the process'
      ],
      specs: {
        Material: 'Sabai grass',
        Dimensions: '1.7 in × 1.7 in',
        Weight: '20 g',
        Method: 'Handwoven',
        Care: 'Wipe clean or dust with a soft, damp cloth'
      }
    },
    {
      id: 'dovetail-planter',
      gid: 'gid://shopify/Product/8590823981229',
      handle: 'dovetail-wooden-test-tube-planter',
      name: 'Dovetail Test Tube Planter',
      fullTitle: 'Dovetail Wooden Test Tube Planter',
      group: 'table',
      material: 'ply',
      priceAED: 69,
      inventory: 5,
      blurb: 'Cuttings, held in glass and wood',
      images: [
        CDN + 'IMG-7931.jpg?v=1779481422',
        CDN + 'IMG-7932.jpg?v=1779481422',
        CDN + 'IMG-7933.jpg?v=1779481422'
      ],
      /* The only product in the range carrying a real Shopify option. */
      options: [{ name: 'Size — inches', values: ['9.75 × 2.5 × 7.25'] }],
      story: [
        'Test tubes set into dovetailed wood, for cuttings, single stems and the kind of green that does not need a pot.',
        'Made from wood, and left with its rustic aesthetic intact: knot holes, scratches and blemishes are part of the offering rather than faults in it.'
      ],
      features: [
        'Handmade, dovetailed construction',
        'Plywood and glass test tubes',
        'Table-top scale'
      ],
      specs: {
        Material: 'Plywood & glass test tubes',
        Dimensions: '9.75 in × 2.5 in × 7.25 in',
        Weight: '434 g',
        Method: 'Handmade',
        Care: 'Wipe with a soft cloth'
      }
    }
  ];

  /* --- Helpers ------------------------------------------------------------ */
  function byId(list, id) {
    return list.filter(function (item) { return item.id === id; })[0] || list[0];
  }

  function product(id) { return byId(PRODUCTS, id); }

  function inGroup(groupId) {
    return PRODUCTS.filter(function (p) { return p.group === groupId; });
  }

  function ofMaterial(materialId) {
    return PRODUCTS.filter(function (p) { return p.material === materialId; });
  }

  /* Shopify's CDN resizes on request — ask for what the layout actually uses. */
  function image(url, width) {
    if (!url) return '';
    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'width=' + (width || 800);
  }

  function productUrl(p) {
    return 'product.html?product=' + p.id;
  }

  PESU.catalog = {
    shop: SHOP,
    shipping: SHIPPING,
    returns: RETURNS,
    materials: MATERIALS,
    groups: GROUPS,
    products: PRODUCTS,
    byId: byId,
    product: product,
    inGroup: inGroup,
    ofMaterial: ofMaterial,
    image: image,
    productUrl: productUrl,
    /* The piece the homepage leads with, and the PDP's default. */
    featuredId: 'marble-incense',
    spotlightId: 'bamboo-lamps'
  };
})(window.PESU);
