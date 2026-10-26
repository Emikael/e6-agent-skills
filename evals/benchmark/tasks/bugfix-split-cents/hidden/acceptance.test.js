'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { splitCents, formatCents } = require('../money');

const sum = values => values.reduce((a, b) => a + b, 0);

test('reported case: 100 in 3 parts', () => {
  assert.deepEqual(splitCents(100, 3), [34, 33, 33]);
});

test('leftover cents go to the earliest parts', () => {
  assert.deepEqual(splitCents(101, 3), [34, 34, 33]);
  assert.deepEqual(splitCents(7, 4), [2, 2, 2, 1]);
});

test('installments always add up to the total', () => {
  for (const total of [0, 1, 2, 99, 100, 101, 999, 1000, 12345]) {
    for (const parts of [1, 2, 3, 4, 7, 12]) {
      const result = splitCents(total, parts);
      assert.equal(result.length, parts);
      assert.equal(sum(result), total, `${total}/${parts}`);
      assert.ok(Math.max(...result) - Math.min(...result) <= 1, `${total}/${parts} is balanced`);
    }
  }
});

test('even totals and single parts are unchanged', () => {
  assert.deepEqual(splitCents(90, 3), [30, 30, 30]);
  assert.deepEqual(splitCents(250, 1), [250]);
  assert.deepEqual(splitCents(0, 2), [0, 0]);
});

for (const parts of [0, -1, 1.5, Number.NaN]) {
  test(`parts=${parts} throws RangeError`, () => {
    assert.throws(() => splitCents(100, parts), RangeError);
  });
}

test('formatCents is unchanged', () => {
  assert.equal(formatCents(1234), '$12.34');
  assert.equal(formatCents(-5), '-$0.05');
});
