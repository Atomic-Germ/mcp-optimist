import traverse from '@babel/traverse';
import { File } from '@babel/types';
import { ASTParser } from './ast-parser';

export interface FunctionComplexity {
  name: string;
  line?: number;
  cyclomatic: number;
  cognitive: number;
  nestingDepth: number;
  decisionPoints: number;
}

/**
 * Complexity Analyzer - Calculates cyclomatic and cognitive complexity
 */
export class ComplexityAnalyzer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  /**
   * Analyze code complexity
   */
  analyzeComplexity(filePath: string) {
    const { ast } = this.parser.parseFile(filePath);
    const functions = this.analyzeFunctions(ast);

    return {
      functions,
      totalFunctions: functions.length,
      averageComplexity: this.calculateAverage(functions.map((f) => f.cyclomatic)),
      maxComplexity: Math.max(...functions.map((f) => f.cyclomatic), 0),
      averageCognitive: this.calculateAverage(functions.map((f) => f.cognitive)),
      totalDecisionPoints: functions.reduce((sum, f) => sum + f.decisionPoints, 0),
      mostComplexFunction: this.findMostComplex(functions),
    };
  }

  /**
   * Analyze all functions in AST
   */
  private analyzeFunctions(ast: File): FunctionComplexity[] {
    const functions: FunctionComplexity[] = [];

    traverse(ast, {
      FunctionDeclaration: (path) => {
        const complexity = this.calculateFunctionComplexity(path);
        functions.push({
          name: path.node.id?.name || 'anonymous',
          line: path.node.loc?.start.line,
          ...complexity,
        });
      },
      FunctionExpression: (path) => {
        const complexity = this.calculateFunctionComplexity(path);
        functions.push({
          name: 'anonymous',
          line: path.node.loc?.start.line,
          ...complexity,
        });
      },
      ArrowFunctionExpression: (path) => {
        const complexity = this.calculateFunctionComplexity(path);
        functions.push({
          name: 'arrow',
          line: path.node.loc?.start.line,
          ...complexity,
        });
      },
    });

    return functions;
  }

  /**
   * Calculate complexity metrics for a function
   */
  private calculateFunctionComplexity(functionPath: any) {
    let cyclomatic = 1; // Start at 1
    let cognitive = 0;
    let maxNesting = 0;
    let decisionPoints = 0;

    // Traverse the function body
    const visitor = {
      // Cyclomatic & Cognitive complexity contributors
      IfStatement: (subPath: any) => {
        cyclomatic++;
        decisionPoints++;
        const currentNesting = this.getNestingLevel(subPath);
        cognitive += currentNesting + 1;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
        }
      },

      ConditionalExpression: () => {
        cyclomatic++;
        decisionPoints++;
      },

      ForStatement: (subPath: any) => {
        cyclomatic++;
        decisionPoints++;
        const currentNesting = this.getNestingLevel(subPath);
        cognitive += currentNesting + 1;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
        }
      },

      WhileStatement: (subPath: any) => {
        cyclomatic++;
        decisionPoints++;
        const currentNesting = this.getNestingLevel(subPath);
        cognitive += currentNesting + 1;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
        }
      },

      DoWhileStatement: (subPath: any) => {
        cyclomatic++;
        decisionPoints++;
        const currentNesting = this.getNestingLevel(subPath);
        cognitive += currentNesting + 1;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
        }
      },

      ForInStatement: (subPath: any) => {
        cyclomatic++;
        decisionPoints++;
        const currentNesting = this.getNestingLevel(subPath);
        cognitive += currentNesting + 1;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
        }
      },

      ForOfStatement: (subPath: any) => {
        cyclomatic++;
        decisionPoints++;
        const currentNesting = this.getNestingLevel(subPath);
        cognitive += currentNesting + 1;
        if (currentNesting > maxNesting) {
          maxNesting = currentNesting;
        }
      },

      SwitchCase: (subPath: any) => {
        if (!subPath.node.test) return; // Skip default case
        cyclomatic++;
        decisionPoints++;
      },

      LogicalExpression: (subPath: any) => {
        if (subPath.node.operator === '&&' || subPath.node.operator === '||') {
          cyclomatic++;
          decisionPoints++;
        }
      },

      CatchClause: () => {
        cyclomatic++;
        cognitive++;
      },
    };

    // Traverse the function body
    functionPath.traverse(visitor);

    return {
      cyclomatic,
      cognitive,
      nestingDepth: maxNesting,
      decisionPoints,
    };
  }

  /**
   * Get nesting level of a path
   */
  private getNestingLevel(path: any): number {
    let level = 0;
    let current = path.parentPath;

    while (current) {
      if (
        current.isIfStatement() ||
        current.isForStatement() ||
        current.isWhileStatement() ||
        current.isDoWhileStatement() ||
        current.isForInStatement() ||
        current.isForOfStatement() ||
        current.isSwitchStatement()
      ) {
        level++;
      }
      current = current.parentPath;
    }

    return level;
  }

  /**
   * Calculate average
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return Math.round((sum / numbers.length) * 10) / 10;
  }

  /**
   * Find most complex function
   */
  private findMostComplex(functions: FunctionComplexity[]): string | undefined {
    if (functions.length === 0) return undefined;

    const most = functions.reduce((max, f) => (f.cyclomatic > max.cyclomatic ? f : max));

    return `${most.name} (complexity: ${most.cyclomatic})`;
  }
}
