'use strict';

/**
 * Split an amount of cents into `parts` installments.
 * Used by checkout to schedule payments.
 */
function splitCents(totalCents, parts) {
  const share = Math.floor(totalCents / parts);
  const result = [];
  for (let i = 0; i < parts; i++) {
    result.push(share);
  }
  return result;
}

function formatCents(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

module.exports = { splitCents, formatCents };
