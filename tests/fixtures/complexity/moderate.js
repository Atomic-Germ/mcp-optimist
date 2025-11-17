// moderate.js - Moderate complexity functions

// Cyclomatic: 4 (1 + 3 decision points)
// Cognitive: ~5
function validateUser(user) {
  if (!user) {
    return false;
  }
  
  if (!user.name || user.name.length < 3) {
    return false;
  }
  
  if (!user.email || !user.email.includes('@')) {
    return false;
  }
  
  return true;
}

// Cyclomatic: 5 (switch has 4 cases)
// Cognitive: ~3
function getDiscount(memberType) {
  switch (memberType) {
    case 'gold':
      return 0.2;
    case 'silver':
      return 0.15;
    case 'bronze':
      return 0.1;
    default:
      return 0;
  }
}

// Cyclomatic: 3 (1 + 2 conditions)
// Cognitive: ~4 (nested)
function processOrder(order) {
  if (order.items && order.items.length > 0) {
    let total = 0;
    for (let item of order.items) {
      if (item.price > 0) {
        total += item.price * item.quantity;
      }
    }
    return total;
  }
  return 0;
}

// Cyclomatic: 4
// Cognitive: ~6 (loop + conditions)
function findMax(numbers) {
  if (!numbers || numbers.length === 0) {
    return null;
  }
  
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  
  return max;
}

module.exports = { validateUser, getDiscount, processOrder, findMax };
