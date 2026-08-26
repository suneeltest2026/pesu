# data/

`products.json` is the canonical PESU catalogue — exported from Shopify on
2026-08-26 and now the source of truth for the independent store. The database
is seeded from this file.

## One migration step is still outstanding

`images` lists **filenames only**. The actual image files still live on
Shopify's CDN and must be downloaded and placed in `public/images/` before the
Shopify store is closed, otherwise every product photograph on the site breaks
the day the store goes away.

The 26 files, by product:

| Product | Files |
| --- | --- |
| Marble Incense Holder | IMG-8088.png |
| Bamboo & Cane Lamps | IMG-8060.jpg, IMG-8061.jpg, IMG-8062.jpg, IMG-8063.jpg |
| Wall Frames, Classic | IMG-8059.png, IMG-8058.png, IMG-8057.png, IMG-8056.png, IMG-8055.png |
| Wall Frame, Turquoise | IMG-8054.png, IMG-8053.png |
| Krishna T-Light Holder | IMG-8052.jpg, IMG-8051.jpg, IMG-8050.png, IMG-8049.png |
| Silver Elephant Bowl | kTcMELfR_*_2025-03-19_1..4.webp |
| Sabai Grass Tea Light | HR6010134010200_1.jpg, 6010134010200_2.jpg, 6010134010200_3.jpg |
| Dovetail Planter | IMG-7931.jpg, IMG-7932.jpg, IMG-7933.jpg |

Two ways to get them:

1. **Shopify admin → Content → Files**, select all, download. Then drop them
   into `public/images/` keeping the filenames exactly.
2. Fetch them by URL — every file is at
   `https://cdn.shopify.com/s/files/1/0769/8962/8589/files/<filename>`.

Keep the filenames unchanged and nothing else needs editing.
