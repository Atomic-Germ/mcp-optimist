import * as fs from 'fs';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { Node, File } from '@babel/types';

export interface ParseResult {
  ast: File;
  code: string;
  filePath: string;
}

export interface LoopInfo {
  type: 'for' | 'while' | 'do-while' | 'for-in' | 'for-of';
  depth: number;
  line?: number;
  column?: number;
  nestedLoops: number;
}

export interface FunctionInfo {
  name: string;
  line?: number;
  params: number;
  complexity: number;
}

/**
 * AST Parser for analyzing JavaScript/TypeScript code
 */
export class ASTParser {
  /**
   * Parse source code file to AST
   */
  parseFile(filePath: string): ParseResult {
    const code = fs.readFileSync(filePath, 'utf-8');
    return this.parseCode(code, filePath);
  }

  /**
   * Parse source code string to AST
   */
  parseCode(code: string, filePath = 'unknown'): ParseResult {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    return {
      ast,
      code,
      filePath,
    };
  }

  /**
   * Find all loops in the AST
   */
  findLoops(ast: File): LoopInfo[] {
    const loops: LoopInfo[] = [];
    const loopStack: number[] = [];

    traverse(ast, {
      Loop: {
        enter(path) {
          const depth = loopStack.length + 1;
          loopStack.push(depth);

          const loopType = getLoopType(path.node);
          loops.push({
            type: loopType,
            depth,
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column,
            nestedLoops: 0,
          });
        },
        exit() {
          loopStack.pop();
        },
      },
    });

    // Calculate nested loop counts
    loops.forEach((loop, index) => {
      if (loop.depth > 1) {
        // Count deeper nested loops
        const nestedCount = loops.filter((l, i) => i > index && l.depth > loop.depth).length;
        loop.nestedLoops = nestedCount;
      }
    });

    return loops;
  }

  /**
   * Find all functions in the AST
   */
  findFunctions(ast: File): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          name: path.node.id?.name || 'anonymous',
          line: path.node.loc?.start.line,
          params: path.node.params.length,
          complexity: 1,
        });
      },
      FunctionExpression(path) {
        functions.push({
          name: 'anonymous',
          line: path.node.loc?.start.line,
          params: path.node.params.length,
          complexity: 1,
        });
      },
      ArrowFunctionExpression(path) {
        functions.push({
          name: 'arrow',
          line: path.node.loc?.start.line,
          params: path.node.params.length,
          complexity: 1,
        });
      },
    });

    return functions;
  }

  /**
   * Detect string concatenation in loops
   */
  findStringConcatenationInLoops(ast: File): Array<{ line?: number; variable: string }> {
    const issues: Array<{ line?: number; variable: string }> = [];
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
      AssignmentExpression(path) {
        if (!inLoop) return;

        const { operator, left, right } = path.node;

        if (operator === '+=' && right.type === 'BinaryExpression' && right.operator === '+') {
          const varName = left.type === 'Identifier' ? left.name : 'unknown';
          issues.push({
            line: path.node.loc?.start.line,
            variable: varName,
          });
        } else if (operator === '+=' && left.type === 'Identifier') {
          issues.push({
            line: path.node.loc?.start.line,
            variable: left.name,
          });
        }
      },
    });

    return issues;
  }
}

function getLoopType(node: Node): LoopInfo['type'] {
  switch (node.type) {
    case 'ForStatement':
      return 'for';
    case 'WhileStatement':
      return 'while';
    case 'DoWhileStatement':
      return 'do-while';
    case 'ForInStatement':
      return 'for-in';
    case 'ForOfStatement':
      return 'for-of';
    default:
      return 'for';
  }
}
