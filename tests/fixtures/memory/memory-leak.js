// memory-leak.js - Common memory leak patterns

// Pattern 1: Event listener not cleaned up
class EventManager {
  constructor() {
    this.listeners = [];
  }

  addListener(element, event, callback) {
    element.addEventListener(event, callback);
    // Never removed - memory leak!
    this.listeners.push({ element, event, callback });
  }

  // Missing cleanup method
}

// Pattern 2: Closure capturing large objects
function createProcessor() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hugeData = new Array(1000000).fill('data');

  return function process(item) {
    // Closure keeps hugeData in memory even if not used
    return item.toUpperCase();
  };
}

// Pattern 3: Detached DOM nodes (simulated)
let detachedNodes = [];
function removeNode(node) {
  node.parentElement.removeChild(node);
  // Still referenced in array - memory leak!
  detachedNodes.push(node);
}

// Pattern 4: Timer not cleared
function startPolling() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const intervalId = setInterval(() => {
     
    console.log('Polling...');
  }, 1000);
  // intervalId never cleared - memory leak!
}

// Pattern 5: Growing cache without limits
const cache = {};
function cacheData(key, value) {
  cache[key] = value;
  // Cache grows forever - memory leak!
}

// Pattern 6: Circular references
function createCircular() {
  const obj1 = { name: 'obj1' };
  const obj2 = { name: 'obj2' };

  obj1.ref = obj2;
  obj2.ref = obj1;
  // Circular reference can cause issues

  return obj1;
}

module.exports = {
  EventManager,
  createProcessor,
  removeNode,
  startPolling,
  cacheData,
  createCircular,
};
