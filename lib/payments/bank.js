'use strict';
/* Bank transfer — the order is placed, payment confirmed by hand in the admin
   once the transfer lands. Details come from the environment so they are not
   in the repository. */
module.exports = {
  id: 'bank',
  label: 'Bank transfer',
  description: 'We email our account details; your order ships once the transfer clears.',
  available: () => Boolean(process.env.BANK_ACCOUNT_NAME && process.env.BANK_IBAN),
  details: () => ({
    accountName: process.env.BANK_ACCOUNT_NAME,
    bank: process.env.BANK_NAME,
    iban: process.env.BANK_IBAN
  }),
  async start() { return { done: true }; }
};
