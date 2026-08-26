'use strict';
/* Money is integer fils (AED × 100) everywhere inside the app. It only turns
   into a string at the edge, and never into a float. */

function toFils(aed) {
  return Math.round(Number(aed) * 100);
}

function fromFils(fils) {
  return fils / 100;
}

function format(fils) {
  const value = fils / 100;
  const decimals = fils % 100 === 0 ? 0 : 2;
  return 'AED ' + value.toLocaleString('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

module.exports = { toFils, fromFils, format };
