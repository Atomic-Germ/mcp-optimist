// complex.js - High complexity functions

// Cyclomatic: 15+ (deeply nested with many branches)
// Cognitive: 25+ (very high)
function complexValidation(data) {
  if (!data) {
    return { valid: false, error: 'No data' };
  }
  
  if (data.type === 'user') {
    if (data.age) {
      if (data.age < 18) {
        if (data.hasParentalConsent) {
          if (data.consentVerified) {
            return { valid: true };
          } else {
            return { valid: false, error: 'Consent not verified' };
          }
        } else {
          return { valid: false, error: 'No parental consent' };
        }
      } else if (data.age > 100) {
        return { valid: false, error: 'Invalid age' };
      } else {
        return { valid: true };
      }
    } else {
      return { valid: false, error: 'Age required' };
    }
  } else if (data.type === 'admin') {
    if (data.accessLevel) {
      if (data.accessLevel > 5) {
        if (data.twoFactorEnabled) {
          return { valid: true };
        } else {
          return { valid: false, error: '2FA required for high access' };
        }
      } else {
        return { valid: true };
      }
    } else {
      return { valid: false, error: 'Access level required' };
    }
  } else {
    return { valid: false, error: 'Unknown type' };
  }
}

// Cyclomatic: 12+
// Cognitive: 20+ (nested loops + conditions)
function matrixOperation(matrix) {
  if (!matrix || !Array.isArray(matrix)) {
    return null;
  }
  
  const result = [];
  
  for (let i = 0; i < matrix.length; i++) {
    if (!Array.isArray(matrix[i])) {
      continue;
    }
    
    const row = [];
    for (let j = 0; j < matrix[i].length; j++) {
      if (typeof matrix[i][j] === 'number') {
        if (matrix[i][j] > 0) {
          if (matrix[i][j] % 2 === 0) {
            row.push(matrix[i][j] * 2);
          } else {
            row.push(matrix[i][j] * 3);
          }
        } else if (matrix[i][j] < 0) {
          row.push(Math.abs(matrix[i][j]));
        } else {
          row.push(0);
        }
      }
    }
    
    if (row.length > 0) {
      result.push(row);
    }
  }
  
  return result;
}

// Cyclomatic: 20+ (many branches)
// Cognitive: 30+ (extremely complex)
function processTransaction(transaction) {
  if (!transaction) {
    throw new Error('No transaction');
  }
  
  if (transaction.type === 'payment') {
    if (transaction.amount > 0) {
      if (transaction.currency === 'USD') {
        if (transaction.amount > 10000) {
          if (transaction.verified) {
            if (transaction.method === 'card') {
              if (transaction.cardType === 'credit') {
                if (transaction.limit && transaction.amount <= transaction.limit) {
                  return processPayment(transaction);
                } else {
                  return { error: 'Exceeds limit' };
                }
              } else if (transaction.cardType === 'debit') {
                if (transaction.balance >= transaction.amount) {
                  return processPayment(transaction);
                } else {
                  return { error: 'Insufficient funds' };
                }
              } else {
                return { error: 'Unknown card type' };
              }
            } else if (transaction.method === 'bank') {
              if (transaction.accountVerified) {
                return processBankTransfer(transaction);
              } else {
                return { error: 'Account not verified' };
              }
            } else {
              return { error: 'Unknown payment method' };
            }
          } else {
            return { error: 'Transaction not verified' };
          }
        } else {
          return processSmallPayment(transaction);
        }
      } else if (transaction.currency === 'EUR') {
        return processEuroPayment(transaction);
      } else {
        return { error: 'Unsupported currency' };
      }
    } else {
      return { error: 'Invalid amount' };
    }
  } else if (transaction.type === 'refund') {
    return processRefund(transaction);
  } else {
    return { error: 'Unknown transaction type' };
  }
}

// Helper functions (not analyzed)
function processPayment(t) { return { success: true }; }
function processBankTransfer(t) { return { success: true }; }
function processSmallPayment(t) { return { success: true }; }
function processEuroPayment(t) { return { success: true }; }
function processRefund(t) { return { success: true }; }

module.exports = { complexValidation, matrixOperation, processTransaction };
