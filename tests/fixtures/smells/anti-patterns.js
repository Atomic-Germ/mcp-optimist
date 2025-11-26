// anti-patterns.js - Various code smells

// Long parameter list
function createUser(
  firstName,
  lastName,
  email,
  password,
  age,
  address,
  city,
  state,
  zipCode,
  country,
  phoneNumber,
  alternatePhone,
  emergencyContact,
  preferredLanguage,
  timezone,
  newsletter,
  terms,
  privacy
) {
  return {
    firstName,
    lastName,
    email,
    password,
    age,
    address,
    city,
    state,
    zipCode,
    country,
    phoneNumber,
    alternatePhone,
    emergencyContact,
    preferredLanguage,
    timezone,
    newsletter,
    terms,
    privacy,
  };
}

// Long method
function processOrder(order) {
  // Validate order
  if (!order) throw new Error('No order');
  if (!order.items) throw new Error('No items');
  if (!order.customer) throw new Error('No customer');

  // Calculate totals
  let subtotal = 0;
  for (let item of order.items) {
    subtotal += item.price * item.quantity;
  }

  // Apply discounts
  let discount = 0;
  if (order.customer.vip) {
    discount = subtotal * 0.15;
  } else if (subtotal > 100) {
    discount = subtotal * 0.1;
  }

  // Calculate tax
  const taxRate = 0.08;
  const tax = (subtotal - discount) * taxRate;

  // Calculate shipping
  let shipping = 0;
  if (subtotal < 50) {
    shipping = 10;
  } else if (subtotal < 100) {
    shipping = 5;
  }

  // Calculate total
  const total = subtotal - discount + tax + shipping;

  // Update inventory
  for (let item of order.items) {
    const product = findProduct(item.productId);
    if (product) {
      product.stock -= item.quantity;
      if (product.stock < 0) {
        throw new Error('Out of stock');
      }
    }
  }

  // Send notifications
  sendEmailToCustomer(order.customer.email, total);
  sendNotificationToWarehouse(order.items);
  updateAnalytics('order_processed', total);

  // Log everything
   
  console.log('Order processed:', order.id);
   
  console.log('Total:', total);
   
  console.log('Items:', order.items.length);

  return { subtotal, discount, tax, shipping, total };
}

// Magic numbers
function calculatePrice(quantity) {
  if (quantity > 100) {
    return quantity * 9.99 * 0.85;
  } else if (quantity > 50) {
    return quantity * 9.99 * 0.9;
  } else if (quantity > 10) {
    return quantity * 9.99 * 0.95;
  }
  return quantity * 9.99;
}

// Dead code
function oldCalculation(x, y) {
  return x + y; // Never called
}

function unusedHelper() {
  return 42; // Never called
}

// Empty catch blocks
function riskyOperation() {
  try {
    dangerousFunction();
  } catch (e) {
    // Swallowing errors silently
  }
}

// Type checking anti-pattern
function handleValue(value) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  } else if (typeof value === 'number') {
    return value * 2;
  } else if (typeof value === 'boolean') {
    return !value;
  } else if (Array.isArray(value)) {
    return value.length;
  } else if (typeof value === 'object') {
    return Object.keys(value).length;
  }
  return null;
}

// Helper stubs
function findProduct(id) {
  return { id, stock: 100 };
}
function sendEmailToCustomer() {}
function sendNotificationToWarehouse() {}
function updateAnalytics() {}
function dangerousFunction() {}

module.exports = {
  createUser,
  processOrder,
  calculatePrice,
  oldCalculation,
  unusedHelper,
  riskyOperation,
  handleValue,
};
