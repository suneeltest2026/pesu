'use strict';
/* Payment adapters.
   Every method implements the same shape, so swapping card providers — Stripe
   today, Telr / PayTabs / Network N-Genius tomorrow — is a new file here plus
   one environment variable. Nothing else in checkout changes.

     id            machine name stored on the order
     label         what the customer sees
     description   the line under it
     available()   false hides it (e.g. no API key configured)
     start(order)  { redirect: url } to send the customer to a hosted page,
                   or { done: true } to finish on our own confirmation page
*/
const cod = require('./cod');
const bank = require('./bank');
const card = require('./stripe');

const METHODS = [card, cod, bank];

function all() {
  return METHODS.filter((m) => m.available());
}

function get(id) {
  return all().find((m) => m.id === id) || null;
}

module.exports = { all, get };
