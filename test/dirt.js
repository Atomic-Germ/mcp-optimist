// dirt.js - The worst code you've ever seen
// This file intentionally violates every performance best practice

// Anti-pattern 1: Deeply nested loops with O(n^4) complexity
function quadrupleLoop(data) {
  let results = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      for (let k = 0; k < data.length; k++) {
        for (let m = 0; m < data.length; m++) {
          // Even worse: nested includes() which is O(n) itself!
          if (!results.includes(data[i] + data[j] + data[k] + data[m])) {
            results.push(data[i] + data[j] + data[k] + data[m]);
          }
        }
      }
    }
  }
  return results;
}

// Anti-pattern 2: String concatenation in nested loops
function buildHugeString(items) {
  let result = '';
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      // Building strings in nested loops - memory nightmare
      result += items[i] + ',' + items[j] + '\n';
      result += 'Processing: ' + i + ' and ' + j + '\n';
      result += '=' + '='.repeat(50) + '\n';
    }
  }
  return result;
}

// Anti-pattern 3: Repeated array operations
function inefficientFilter(data) {
  // Multiple passes over the same array
  let step1 = data.filter(x => x > 0);
  let step2 = step1.filter(x => x < 100);
  let step3 = step2.filter(x => x % 2 === 0);
  let step4 = step3.map(x => x * 2);
  let step5 = step4.map(x => x + 1);
  let step6 = step5.map(x => x.toString());
  let step7 = step6.map(x => x.split('').reverse().join(''));
  return step7;
}

// Anti-pattern 4: O(n^3) with unnecessary operations
function findTripleDuplicates(arr) {
  let dupes = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      for (let k = 0; k < arr.length; k++) {
        // Checking same element multiple times
        if (arr[i] === arr[j] && arr[j] === arr[k]) {
          // Linear search in loop - O(n) inside O(n^3)!
          if (!dupes.includes(arr[i])) {
            dupes.push(arr[i]);
          }
        }
      }
    }
  }
  return dupes;
}

// Anti-pattern 5: Nested loops with string operations
function matrixStringify(matrix) {
  let output = '';
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      for (let k = 0; k < matrix[i][j].length; k++) {
        // String concat in triple nested loop
        output += matrix[i][j][k] + ' ';
      }
      output += '\n';
    }
    output += '---\n';
  }
  return output;
}

// Anti-pattern 6: Inefficient searching
function slowSearch(haystack, needles) {
  let found = [];
  // O(n * m) when it could be O(n + m) with a Set
  for (let i = 0; i < needles.length; i++) {
    for (let j = 0; j < haystack.length; j++) {
      if (needles[i] === haystack[j]) {
        if (!found.includes(needles[i])) {
          found.push(needles[i]);
        }
      }
    }
  }
  return found;
}

// Anti-pattern 7: Building arrays inefficiently
function buildArray(size) {
  let arr = [];
  for (let i = 0; i < size; i++) {
    // Using concat which creates new array each time
    arr = arr.concat([i]);
  }
  return arr;
}

// Anti-pattern 8: Nested loops with object creation
function createObjects(names, ages, cities) {
  let objects = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = 0; j < ages.length; j++) {
      for (let k = 0; k < cities.length; k++) {
        // Creating way too many objects
        let obj = {
          name: names[i],
          age: ages[j],
          city: cities[k],
          id: i + '-' + j + '-' + k,
          timestamp: new Date().toISOString()
        };
        objects.push(obj);
      }
    }
  }
  return objects;
}

// Anti-pattern 9: Checking membership inefficiently
function removeDuplicatesTheSlowestWay(arr) {
  let unique = [];
  for (let i = 0; i < arr.length; i++) {
    let isDupe = false;
    // O(n^2) duplicate check
    for (let j = 0; j < unique.length; j++) {
      if (arr[i] === unique[j]) {
        isDupe = true;
        break;
      }
    }
    if (!isDupe) {
      unique.push(arr[i]);
    }
  }
  return unique;
}

// Anti-pattern 10: The ultimate nightmare - everything combined
function theWorstFunction(data) {
  let result = '';
  let cache = [];
  
  // O(n^5) complexity - FIVE nested loops!
  for (let a = 0; a < data.length; a++) {
    for (let b = 0; b < data.length; b++) {
      for (let c = 0; c < data.length; c++) {
        for (let d = 0; d < data.length; d++) {
          for (let e = 0; e < data.length; e++) {
            // String concatenation in innermost loop
            result += data[a] + data[b] + data[c] + data[d] + data[e];
            result += '\n';
            
            // Linear search in O(n^5) loop
            let key = data[a] + data[b] + data[c] + data[d] + data[e];
            if (!cache.includes(key)) {
              cache.push(key);
            }
            
            // Unnecessary JSON operations
            let obj = JSON.parse(JSON.stringify({
              a: data[a],
              b: data[b],
              c: data[c],
              d: data[d],
              e: data[e]
            }));
            
            // More string operations
            result += JSON.stringify(obj) + ',';
          }
        }
      }
    }
  }
  
  return { result, cache };
}

module.exports = {
  quadrupleLoop,
  buildHugeString,
  inefficientFilter,
  findTripleDuplicates,
  matrixStringify,
  slowSearch,
  buildArray,
  createObjects,
  removeDuplicatesTheSlowestWay,
  theWorstFunction
};
