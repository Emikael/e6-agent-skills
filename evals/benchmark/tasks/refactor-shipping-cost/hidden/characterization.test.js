"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { shippingCost } = require("../shipping");

// Expected values were captured from the original implementation.
const CASES = [
  [{"weightKg":0.2,"country":"US","express":false,"subtotal":50,"member":false}, 5],
  [{"weightKg":1,"country":"US","express":false,"subtotal":50,"member":false}, 5],
  [{"weightKg":1.01,"country":"US","express":false,"subtotal":50,"member":false}, 10],
  [{"weightKg":5,"country":"US","express":false,"subtotal":50,"member":false}, 10],
  [{"weightKg":5.5,"country":"US","express":false,"subtotal":50,"member":false}, 25],
  [{"weightKg":20,"country":"US","express":false,"subtotal":50,"member":false}, 25],
  [{"weightKg":20.1,"country":"US","express":false,"subtotal":50,"member":false}, 27],
  [{"weightKg":23.4,"country":"US","express":false,"subtotal":50,"member":false}, 33],
  [{"weightKg":0.2,"country":"CA","express":false,"subtotal":50,"member":false}, 7.5],
  [{"weightKg":1,"country":"CA","express":false,"subtotal":50,"member":false}, 7.5],
  [{"weightKg":1.01,"country":"CA","express":false,"subtotal":50,"member":false}, 15],
  [{"weightKg":5,"country":"CA","express":false,"subtotal":50,"member":false}, 15],
  [{"weightKg":5.5,"country":"CA","express":false,"subtotal":50,"member":false}, 37.5],
  [{"weightKg":20,"country":"CA","express":false,"subtotal":50,"member":false}, 37.5],
  [{"weightKg":20.1,"country":"CA","express":false,"subtotal":50,"member":false}, 40.5],
  [{"weightKg":23.4,"country":"CA","express":false,"subtotal":50,"member":false}, 49.5],
  [{"weightKg":0.2,"country":"DE","express":false,"subtotal":50,"member":false}, 15],
  [{"weightKg":1,"country":"DE","express":false,"subtotal":50,"member":false}, 15],
  [{"weightKg":1.01,"country":"DE","express":false,"subtotal":50,"member":false}, 30],
  [{"weightKg":5,"country":"DE","express":false,"subtotal":50,"member":false}, 30],
  [{"weightKg":5.5,"country":"DE","express":false,"subtotal":50,"member":false}, 75],
  [{"weightKg":20,"country":"DE","express":false,"subtotal":50,"member":false}, 75],
  [{"weightKg":20.1,"country":"DE","express":false,"subtotal":50,"member":false}, 81],
  [{"weightKg":23.4,"country":"DE","express":false,"subtotal":50,"member":false}, 99],
  [{"weightKg":3,"country":"US","express":false,"subtotal":100,"member":false}, 0],
  [{"weightKg":3,"country":"US","express":false,"subtotal":99.99,"member":false}, 10],
  [{"weightKg":3,"country":"US","express":true,"subtotal":100,"member":false}, 25],
  [{"weightKg":21,"country":"US","express":true,"subtotal":150,"member":true}, 37.8],
  [{"weightKg":0.5,"country":"US","express":true,"subtotal":20,"member":false}, 20],
  [{"weightKg":0.5,"country":"US","express":false,"subtotal":120,"member":true}, 0],
  [{"weightKg":2,"country":"CA","express":true,"subtotal":500,"member":false}, 30],
  [{"weightKg":2,"country":"CA","express":true,"subtotal":50,"member":true}, 27],
  [{"weightKg":7,"country":"DE","express":true,"subtotal":50,"member":false}, 105],
  [{"weightKg":7,"country":"DE","express":true,"subtotal":500,"member":true}, 94.5],
  [{"weightKg":33,"country":"JP","express":false,"subtotal":10,"member":true}, 137.7],
  [{"weightKg":1,"country":"CA","express":false,"subtotal":10,"member":true}, 6.75],
];

for (const [order, expected] of CASES) {
  test(`shippingCost(${JSON.stringify(order)}) === ${expected}`, () => {
    assert.equal(shippingCost({ ...order }), expected);
  });
}

test("export and arity are unchanged", () => {
  assert.equal(typeof shippingCost, "function");
  assert.equal(shippingCost.length, 1);
});
