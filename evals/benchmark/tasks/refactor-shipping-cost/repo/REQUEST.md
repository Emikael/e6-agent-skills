# Refactor request

`shippingCost` in `shipping.js` has grown into nested conditionals with duplicated weight
tiers, and nobody wants to touch it. Refactor it so the pricing rules are easy to read
and change.

This is a pure refactor: for every possible order, the function must return exactly
what it returns today. Keep the export and its signature.
