import traverse from '@babel/traverse';
import { File } from '@babel/types';
import { ASTParser } from './ast-parser';

export interface CodeSmell {
  type: string;
  line?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Smell Analyzer - Detects code smells and anti-patterns
 */
export class SmellAnalyzer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  /**
   * Analyze code for smells
   */
  analyzeSmells(filePath: string) {
    const { ast } = this.parser.parseFile(filePath);

    return {
      godObjects: this.findGodObjects(ast),
      longParameterLists: this.findLongParameterLists(ast),
      longMethods: this.findLongMethods(ast),
      magicNumbers: this.findMagicNumbers(ast),
      emptyCatches: this.findEmptyCatches(ast),
      classMetrics: this.analyzeClasses(ast),
      functionMetrics: this.analyzeFunctions(ast),
    };
  }

  /**
   * Find God Objects (classes with too many methods/responsibilities)
   */
  private findGodObjects(ast: File): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const classes: Array<{ name: string; methods: number; line?: number }> = [];

    traverse(ast, {
      ClassDeclaration(path) {
        const className = path.node.id?.name || 'anonymous';
        const methods = path.node.body.body.filter((node: any) => node.type === 'ClassMethod');

        classes.push({
          name: className,
          methods: methods.length,
          line: path.node.loc?.start.line,
        });

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
    const foundNumbers = new Map<number, number>();

    traverse(ast, {
      NumericLiteral(path) {
        const value = path.node.value;

        // Skip allowed numbers and array indices
        if (allowedNumbers.has(value)) return;
        if (path.parent.type === 'ArrayExpression') return;

        // Count occurrences
        foundNumbers.set(value, (foundNumbers.get(value) || 0) + 1);

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
   * Analyze functions
   */
  private analyzeFunctions(ast: File) {
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
}
