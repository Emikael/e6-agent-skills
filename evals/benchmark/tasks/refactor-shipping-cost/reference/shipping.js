'use strict';

// Shipping cost in dollars for an order.
// order: { weightKg, country, express, subtotal, member }
function shippingCost(order) {
  var cost = 0;
  if (order.country == 'US') {
    if (order.subtotal >= 100) {
      if (!order.express) {
        return 0;
      } else {
        if (order.weightKg <= 1) {
          cost = 5;
        } else {
          if (order.weightKg <= 5) {
            cost = 10;
          } else {
            if (order.weightKg <= 20) {
              cost = 25;
            } else {
              cost = 25 + Math.ceil(order.weightKg - 20) * 2;
            }
          }
        }
        cost = cost + 15;
      }
    } else {
      if (order.weightKg <= 1) {
        cost = 5;
      } else if (order.weightKg <= 5) {
        cost = 10;
      } else if (order.weightKg <= 20) {
        cost = 25;
      } else {
        cost = 25 + Math.ceil(order.weightKg - 20) * 2;
      }
      if (order.express) {
        cost = cost + 15;
      }
    }
  } else {
    if (order.weightKg <= 1) {
      cost = 5;
    } else if (order.weightKg <= 5) {
      cost = 10;
    } else if (order.weightKg <= 20) {
      cost = 25;
    } else {
      cost = 25 + Math.ceil(order.weightKg - 20) * 2;
    }
    if (order.country == 'CA') {
      cost = cost * 1.5;
      if (order.express) {
        cost = cost + 15;
      }
    } else {
      cost = cost * 3;
      if (order.express == true) {
        cost = cost + 30;
      }
    }
  }
  if (order.member) {
    cost = Math.round(cost * 0.9 * 100) / 100;
  }
  return cost;
}

module.exports = { shippingCost };
