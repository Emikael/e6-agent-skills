'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { shippingCost } = require('./shipping');

test('light domestic order', () => {
  assert.equal(shippingCost({ weightKg: 0.5, country: 'US', express: false, subtotal: 20, member: false }), 5);
});

test('free domestic shipping over $100', () => {
  assert.equal(shippingCost({ weightKg: 3, country: 'US', express: false, subtotal: 150, member: false }), 0);
});
