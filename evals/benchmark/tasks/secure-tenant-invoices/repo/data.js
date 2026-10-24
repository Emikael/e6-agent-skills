'use strict';

// Demo data. `costBasis` and `internalNotes` are internal and must never leave the server.
const INVOICES = [
  { id: 1, tenantId: 'acme', number: 'ACME-001', amount: 1200, status: 'paid', costBasis: 700, internalNotes: 'margin ok' },
  { id: 2, tenantId: 'acme', number: 'ACME-002', amount: 450, status: 'open', costBasis: 300, internalNotes: 'late payer' },
  { id: 3, tenantId: 'globex', number: 'GLX-001', amount: 9900, status: 'open', costBasis: 5000, internalNotes: 'strategic' },
];

const TOKENS = {
  'token-acme-ann': { userId: 'ann', tenantId: 'acme' },
  'token-globex-gus': { userId: 'gus', tenantId: 'globex' },
};

module.exports = { INVOICES, TOKENS };
