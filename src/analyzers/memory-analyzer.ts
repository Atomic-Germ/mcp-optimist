import traverse from '@babel/traverse';
import { File } from '@babel/types';
import { ASTParser } from './ast-parser';

export interface AllocationInfo {
  type: 'array' | 'object' | 'buffer' | 'date' | 'regex';
  line?: number;
  inLoop: boolean;
  size?: string;
}

export interface LeakPattern {
  type: 'event_listener' | 'timer' | 'cache' | 'closure' | 'circular';
  line?: number;
  description: string;
}

/**
 * Memory Analyzer - Detects memory leaks and inefficient allocations
 */
export class MemoryAnalyzer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  /**
   * Analyze code for memory issues
   */
  analyzeMemory(filePath: string) {
    const { ast } = this.parser.parseFile(filePath);

    return {
      allocations: this.findAllocations(ast),
      leaks: this.findPotentialLeaks(ast),
      closures: this.findClosureIssues(ast),
    };
  }

  /**
   * Find memory allocations
   */
  private findAllocations(ast: File): AllocationInfo[] {
    const allocations: AllocationInfo[] = [];
    let inLoop = false;
    let loopDepth = 0;

    traverse(ast, {
      Loop: {
        enter() {
          inLoop = true;
          loopDepth++;
        },
        exit() {
          loopDepth--;
          if (loopDepth === 0) {
            inLoop = false;
          }
        },
      },

      // Detect new Array()
      NewExpression(path) {
        if (path.node.callee.type === 'Identifier') {
          const name = path.node.callee.name;

          if (name === 'Array' || name === 'Buffer' || name === 'Date') {
            allocations.push({
              type: name.toLowerCase() as any,
              line: path.node.loc?.start.line,
              inLoop,
            });
          }
        }
      },

      // Detect array literals
      ArrayExpression(path) {
        if (inLoop && path.node.elements.length > 100) {
          allocations.push({
            type: 'array',
            line: path.node.loc?.start.line,
            inLoop,
            size: 'large',
          });
        }
      },

      // Detect object literals in loops
      ObjectExpression(path) {
        if (inLoop && path.node.properties.length > 3) {
          allocations.push({
            type: 'object',
            line: path.node.loc?.start.line,
            inLoop,
          });
        }
      },

      // Detect regex in loops
      RegExpLiteral(path) {
        if (inLoop) {
          allocations.push({
            type: 'regex',
            line: path.node.loc?.start.line,
            inLoop,
          });
        }
      },
    });

    return allocations;
  }

  /**
   * Find potential memory leaks
   */
  private findPotentialLeaks(ast: File): LeakPattern[] {
    const leaks: LeakPattern[] = [];

    traverse(ast, {
      // Detect addEventListener without removeEventListener
      CallExpression(path) {
        if (
          path.node.callee.type === 'MemberExpression' &&
          path.node.callee.property.type === 'Identifier'
        ) {
          const methodName = path.node.callee.property.name;

          // Event listeners
          if (methodName === 'addEventListener') {
            leaks.push({
              type: 'event_listener',
              line: path.node.loc?.start.line,
              description: 'addEventListener called without corresponding removeEventListener',
            });
          }

          // Timers
          if (methodName === 'setInterval' || methodName === 'setTimeout') {
            leaks.push({
              type: 'timer',
              line: path.node.loc?.start.line,
              description: `${methodName} called without cleanup`,
            });
          }
        }

        // Detect unbounded cache growth (obj[key] = value pattern)
        if (path.node.callee.type === 'Identifier') {
          const funcName = path.node.callee.name;

          if (funcName.toLowerCase().includes('cache')) {
            leaks.push({
              type: 'cache',
              line: path.node.loc?.start.line,
              description: 'Cache operation without size limits',
            });
          }
        }
      },

      // Detect closures capturing large data
      FunctionExpression: (path) => {
        // Check if parent has large array/object declarations
        const parent = path.getFunctionParent();
        if (parent) {
          const hasLargeData = checkForLargeDataInScope(parent.node);
          if (hasLargeData) {
            leaks.push({
              type: 'closure',
              line: path.node.loc?.start.line,
              description: 'Function closure may capture large data structures',
            });
          }
        }
      },

      ArrowFunctionExpression: (path) => {
        const parent = path.getFunctionParent();
        if (parent) {
          const hasLargeData = checkForLargeDataInScope(parent.node);
          if (hasLargeData) {
            leaks.push({
              type: 'closure',
              line: path.node.loc?.start.line,
              description: 'Arrow function closure may capture large data',
            });
          }
        }
      },
    });

    return leaks;
  }

  /**
   * Find closure-related issues
   */
  private findClosureIssues(ast: File) {
    const issues: Array<{ line?: number; type: string }> = [];

    traverse(ast, {
      ReturnStatement(path) {
        if (
          path.node.argument &&
          (path.node.argument.type === 'FunctionExpression' ||
            path.node.argument.type === 'ArrowFunctionExpression')
        ) {
          issues.push({
            line: path.node.loc?.start.line,
            type: 'RETURNS_CLOSURE',
          });
        }
      },
    });

    return issues;
  }

  /**
   * Find unnecessary array spreading/copying
   */
  findUnnecessaryCopies(ast: File) {
    const copies: Array<{ line?: number; pattern: string }> = [];

    traverse(ast, {
      SpreadElement(path) {
        if (path.parent.type === 'ArrayExpression') {
          copies.push({
            line: path.node.loc?.start.line,
            pattern: 'array_spread',
          });
        }
      },

      CallExpression(path) {
        if (
          path.node.callee.type === 'MemberExpression' &&
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'slice' &&
          path.node.arguments.length === 0
        ) {
          copies.push({
            line: path.node.loc?.start.line,
            pattern: 'slice_copy',
          });
        }
      },
    });

    return copies;
  }
}

/**
 * Check if scope contains large data structures
 */
function checkForLargeDataInScope(node: any): boolean {
  // Simple heuristic: look for new Array with large size
  if (!node.body || !node.body.body) return false;

  for (const statement of node.body.body) {
    if (statement.type === 'VariableDeclaration') {
      for (const decl of statement.declarations) {
        if (
          decl.init &&
          decl.init.type === 'NewExpression' &&
          decl.init.callee.type === 'Identifier' &&
          decl.init.callee.name === 'Array' &&
          decl.init.arguments.length > 0
        ) {
          // Check if array size is large (> 1000)
          const sizeArg = decl.init.arguments[0];
          if (sizeArg.type === 'NumericLiteral' && sizeArg.value > 1000) {
            return true;
          }
        }
      }
    }
  }

  return false;
}
