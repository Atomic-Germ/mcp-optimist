// simple.js - Low complexity functions

function add(a, b) {
  return a + b;
}

function multiply(x, y) {
  return x * y;
}

function greet(name) {
  return `Hello, ${name}!`;
}

// Cyclomatic complexity: 1 (no branches)
function linearFlow() {
  const x = 1;
  const y = 2;
  const z = x + y;
  return z;
}

module.exports = { add, multiply, greet, linearFlow };
