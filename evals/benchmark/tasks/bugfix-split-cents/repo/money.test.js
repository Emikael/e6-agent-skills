'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { splitCents, formatCents } = require('./money');

test('splits evenly divisible totals', () => {
  assert.deepEqual(splitCents(90, 3), [30, 30, 30]);
});

test('formats cents as dollars', () => {
  assert.equal(formatCents(1234), '$12.34');
  assert.equal(formatCents(-5), '-$0.05');
});
