'use strict';
/* Cash on delivery — no third party involved at any point. */
module.exports = {
  id: 'cod',
  label: 'Cash on delivery',
  description: 'Pay the courier in cash when your order arrives. UAE only.',
  available: () => process.env.ENABLE_COD !== 'false',
  async start() { return { done: true }; }
};
