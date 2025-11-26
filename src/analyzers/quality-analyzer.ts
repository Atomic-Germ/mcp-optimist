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

export interface CodeSmell {
  type: string;
  line?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QualityAnalysis {
  complexity: {
    functions: FunctionComplexity[];
    totalFunctions: number;
    averageComplexity: number;
    maxComplexity: number;
    averageCognitive: number;
    totalDecisionPoints: number;
    mostComplexFunction?: string;
  };
  smells: {
    godObjects: CodeSmell[];
    longParameterLists: CodeSmell[];
    longMethods: CodeSmell[];
    magicNumbers: CodeSmell[];
    emptyCatches: CodeSmell[];
    classMetrics: { total: number; large: number };
    functionMetrics: { total: number; long: number };
  };
}

/**
 * Quality Analyzer - Combines complexity and smell analysis
 */
export class QualityAnalyzer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  /**
   * Analyze code quality (complexity and smells)
   */
  analyzeQuality(filePath: string): QualityAnalysis {
    const { ast } = this.parser.parseFile(filePath);

    return {
      complexity: this.analyzeComplexity(ast),
      smells: this.analyzeSmells(ast),
    };
  }

  /**
   * Analyze code complexity
   */
  private analyzeComplexity(ast: File) {
    const functions = this.analyzeFunctionsForComplexity(ast);

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
   * Analyze all functions in AST for complexity
   */
  private analyzeFunctionsForComplexity(ast: File): FunctionComplexity[] {
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
   * Analyze code for smells
   */
  private analyzeSmells(ast: File) {
    return {
      godObjects: this.findGodObjects(ast),
      longParameterLists: this.findLongParameterLists(ast),
      longMethods: this.findLongMethods(ast),
      magicNumbers: this.findMagicNumbers(ast),
      emptyCatches: this.findEmptyCatches(ast),
      classMetrics: this.analyzeClasses(ast),
      functionMetrics: this.analyzeFunctionsForSmells(ast),
    };
  }

  /**
   * Find God Objects (classes with too many methods/responsibilities)
   */
  private findGodObjects(ast: File): CodeSmell[] {
    const smells: CodeSmell[] = [];

    traverse(ast, {
      ClassDeclaration(path) {
        const className = path.node.id?.name || 'anonymous';
        const methods = path.node.body.body.filter((node: any) => node.type === 'ClassMethod');

        // God object: >10 methods
        if (methods.length > 10) {
          smells.push({
            type: 'GOD_OBJECT',
            line: path.node.loc?.start.line,
            description: `Class '${className}' has ${methods.length} methods. Consider splitting responsibilities.`,
            severity: methods.length > 15 ? 'critical' : 'high',
          });
        }
      },
    });

    return smells;
  }

  /**
   * Find functions with long parameter lists
   */
  private findLongParameterLists(ast: File): CodeSmell[] {
    const smells: CodeSmell[] = [];

    const checkParams = (node: any, name: string) => {
      const paramCount = node.params.length;

      if (paramCount > 5) {
        smells.push({
          type: 'LONG_PARAMETER_LIST',
          line: node.loc?.start.line,
          description: `Function '${name}' has ${paramCount} parameters. Consider using a parameter object.`,
          severity: paramCount > 10 ? 'high' : 'medium',
        });
      }
    };

    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name || 'anonymous';
        checkParams(path.node, name);
      },
      FunctionExpression(path) {
        checkParams(path.node, 'anonymous');
      },
      ArrowFunctionExpression(path) {
        checkParams(path.node, 'arrow');
      },
    });

    return smells;
  }

  /**
   * Find long methods
   */
  private findLongMethods(ast: File): CodeSmell[] {
    const smells: CodeSmell[] = [];

    const checkLength = (path: any, name: string) => {
      if (!path.node.body || !path.node.loc) return;

      const start = path.node.loc.start.line;
      const end = path.node.loc.end.line;
      const lines = end - start;

      if (lines > 50) {
        smells.push({
          type: 'LONG_METHOD',
          line: start,
          description: `Function '${name}' is ${lines} lines long. Consider breaking it down.`,
          severity: lines > 100 ? 'high' : 'medium',
        });
      }
    };

    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name || 'anonymous';
        checkLength(path, name);
      },
      FunctionExpression(path) {
        checkLength(path, 'anonymous');
      },
      ArrowFunctionExpression(path) {
        checkLength(path, 'arrow');
      },
    });

    return smells;
  }

  /**
   * Find magic numbers
   */
  private findMagicNumbers(ast: File): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const allowedNumbers = new Set([0, 1, -1, 2, 10, 100, 1000]);

    traverse(ast, {
      NumericLiteral(path) {
        const value = path.node.value;

        // Skip allowed numbers and array indices
        if (allowedNumbers.has(value)) return;
        if (path.parent.type === 'ArrayExpression') return;

        // Flag if used multiple times or looks suspicious
        if (value > 10 && value !== Math.floor(value / 100) * 100) {
          smells.push({
            type: 'MAGIC_NUMBER',
            line: path.node.loc?.start.line,
            description: `Magic number ${value} found. Consider using a named constant.`,
            severity: 'low',
          });
        }
      },
    });

    return smells;
  }

  /**
   * Find empty catch blocks
   */
  private findEmptyCatches(ast: File): CodeSmell[] {
    const smells: CodeSmell[] = [];

    traverse(ast, {
      CatchClause(path) {
        const body = path.node.body;

        // Check if catch block is empty or only has comments
        if (body.body.length === 0) {
          smells.push({
            type: 'EMPTY_CATCH',
            line: path.node.loc?.start.line,
            description: 'Empty catch block swallows errors silently. At minimum, log the error.',
            severity: 'high',
          });
        }
      },
    });

    return smells;
  }

  /**
   * Analyze classes
   */
  private analyzeClasses(ast: File) {
    let classCount = 0;
    let largeClasses = 0;

    traverse(ast, {
      ClassDeclaration(path) {
        classCount++;
        const methods = path.node.body.body.filter((node: any) => node.type === 'ClassMethod');
        if (methods.length > 10) {
          largeClasses++;
        }
      },
    });

    return {
      total: classCount,
      large: largeClasses,
    };
  }

  /**
   * Analyze functions for smells
   */
  private analyzeFunctionsForSmells(ast: File) {
    let functionCount = 0;
    let longFunctions = 0;

    const countFunction = (path: any) => {
      functionCount++;
      if (path.node.loc) {
        const lines = path.node.loc.end.line - path.node.loc.start.line;
        if (lines > 50) {
          longFunctions++;
        }
      }
    };

    traverse(ast, {
      FunctionDeclaration: countFunction,
      FunctionExpression: countFunction,
      ArrowFunctionExpression: countFunction,
    });

    return {
      total: functionCount,
      long: longFunctions,
    };
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
