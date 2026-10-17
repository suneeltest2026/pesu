'use strict';
/* Where PESU delivers, and what delivery costs.

   Zendrop ships every order from China. To the UAE it has a cheap dedicated
   rate; to the rest of the GCC each item costs several times more to send,
   so those countries pay a delivery charge per item. The UAE keeps its flat
   charge and free-delivery threshold, which come from settings.

   Delivery times are Zendrop's published averages, rounded up into ranges. */

const PER_ITEM_FILS = 7900;          /* AED 79 per item, GCC outside the UAE */
const PER_ITEM_REDUCED_FILS = 2900;  /* AED 29 per item ... */
const REDUCED_FROM_FILS = 100000;    /* ... once the order reaches AED 1,000 */

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', regionLabel: 'Emirate', regions: EMIRATES, phone: '05X XXX XXXX', time: null },
  { code: 'SA', name: 'Saudi Arabia', regionLabel: 'Region / province', regions: null, phone: '+966 5X XXX XXXX', time: '14–21 business days' },
  { code: 'KW', name: 'Kuwait', regionLabel: 'Governorate', regions: null, phone: '+965 XXXX XXXX', time: '10–14 business days' },
  { code: 'QA', name: 'Qatar', regionLabel: 'Municipality', regions: null, phone: '+974 XXXX XXXX', time: '10–14 business days' },
  { code: 'BH', name: 'Bahrain', regionLabel: 'Governorate', regions: null, phone: '+973 XXXX XXXX', time: '10–14 business days' },
  { code: 'OM', name: 'Oman', regionLabel: 'Governorate', regions: null, phone: '+968 XXXX XXXX', time: '15–21 business days' }
];

function country(code) {
  return COUNTRIES.find((c) => c.code === String(code || '').toUpperCase()) || null;
}

const isHome = (code) => String(code || 'AE').toUpperCase() === 'AE';

/* Delivery for a bag. `settings` supplies the UAE flat charge and threshold. */
function delivery({ countryCode, subtotalFils, itemCount, settings }) {
  if (!itemCount) return 0;
  if (isHome(countryCode)) {
    const freeThreshold = Number(settings.ship_free_threshold_fils || 20000);
    const flat = Number(settings.ship_flat_fils || 2500);
    return subtotalFils >= freeThreshold ? 0 : flat;
  }
  const perItem = subtotalFils >= REDUCED_FROM_FILS ? PER_ITEM_REDUCED_FILS : PER_ITEM_FILS;
  return perItem * itemCount;
}

/* How long it takes to arrive, in words, for a country. */
function deliveryTime(code, settings) {
  const c = country(code);
  if (!c || !c.time) return settings.ship_dubai;
  return c.time;
}

module.exports = {
  COUNTRIES, EMIRATES, PER_ITEM_FILS, PER_ITEM_REDUCED_FILS, REDUCED_FROM_FILS,
  country, isHome, delivery, deliveryTime
};
