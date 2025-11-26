import traverse from '@babel/traverse';
import { File } from '@babel/types';
import { ASTParser } from './ast-parser';

export interface DeadCodeItem {
  type: 'variable' | 'function' | 'import' | 'class' | 'method';
  name: string;
  line?: number;
  file: string;
  reason: string;
}

/**
 * Dead Code Analyzer - Identifies unused code elements
 */
export class DeadCodeAnalyzer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  /**
   * Analyze code for dead/unused elements
   */
  analyzeDeadCode(filePath: string) {
    const { ast } = this.parser.parseFile(filePath);

    const unusedVariables = this.findUnusedVariables(ast);
    const unusedFunctions = this.findUnusedFunctions(ast);
    const unusedImports = this.findUnusedImports(ast);

    return {
      unusedVariables,
      unusedFunctions,
      unusedImports,
      totalDeadCode: unusedVariables.length + unusedFunctions.length + unusedImports.length,
    };
  }

  /**
   * Find unused variables in a single file
   */
  private findUnusedVariables(ast: File): DeadCodeItem[] {
    const deadCode: DeadCodeItem[] = [];
    const declaredVars = new Map<string, { line?: number; used: boolean }>();
    const scopeStack: Array<Map<string, boolean>> = [new Map()];

    const enterScope = () => scopeStack.push(new Map());
    const exitScope = () => scopeStack.pop();

    traverse(ast, {
      // Track variable declarations
      VariableDeclarator(path) {
        if (path.node.id.type === 'Identifier') {
          const name = path.node.id.name;
          declaredVars.set(name, {
            line: path.node.loc?.start.line,
            used: false,
          });
        }
      },

      // Track function parameters
      FunctionDeclaration: {
        enter(path) {
          enterScope();
          path.node.params.forEach((param) => {
            if (param.type === 'Identifier') {
              declaredVars.set(param.name, {
                line: param.loc?.start.line,
                used: false,
              });
            }
          });
        },
        exit() {
          exitScope();
        },
      },

      FunctionExpression: {
        enter(path) {
          enterScope();
          path.node.params.forEach((param) => {
            if (param.type === 'Identifier') {
              declaredVars.set(param.name, {
                line: param.loc?.start.line,
                used: false,
              });
            }
          });
        },
        exit() {
          exitScope();
        },
      },

      ArrowFunctionExpression: {
        enter(path) {
          enterScope();
          path.node.params.forEach((param) => {
            if (param.type === 'Identifier') {
              declaredVars.set(param.name, {
                line: param.loc?.start.line,
                used: false,
              });
            }
          });
        },
        exit() {
          exitScope();
        },
      },

      // Track usage
      Identifier(path) {
        const name = path.node.name;

        // Skip if it's a declaration
        if (
          (path.parent.type === 'VariableDeclarator' && path.parent.id === path.node) ||
          (path.parent.type === 'FunctionDeclaration' && path.parent.id === path.node) ||
          (path.parent.type === 'ClassDeclaration' && path.parent.id === path.node) ||
          (path.parent.type === 'ImportSpecifier' && path.parent.imported === path.node) ||
          path.parent.type === 'ImportDefaultSpecifier' ||
          path.parent.type === 'ImportNamespaceSpecifier'
        ) {
          return;
        }

        // Mark as used
        if (declaredVars.has(name)) {
          declaredVars.get(name)!.used = true;
        }
      },
    });

    // Find unused variables
    for (const [name, info] of declaredVars) {
      if (!info.used) {
        deadCode.push({
          type: 'variable',
          name,
          line: info.line,
          file: '', // Will be set by caller
          reason: 'Variable is declared but never used',
        });
      }
    }

    return deadCode;
  }

  /**
   * Find unused functions in a single file
   */
  private findUnusedFunctions(ast: File): DeadCodeItem[] {
    const deadCode: DeadCodeItem[] = [];
    const declaredFunctions = new Map<string, { line?: number; used: boolean }>();

    traverse(ast, {
      // Track function declarations
      FunctionDeclaration(path) {
        if (path.node.id?.name) {
          declaredFunctions.set(path.node.id.name, {
            line: path.node.loc?.start.line,
            used: false,
          });
        }
      },

      // Track function expressions assigned to variables
      VariableDeclarator(path) {
        if (
          path.node.init?.type === 'FunctionExpression' ||
          path.node.init?.type === 'ArrowFunctionExpression'
        ) {
          if (path.node.id.type === 'Identifier') {
            declaredFunctions.set(path.node.id.name, {
              line: path.node.loc?.start.line,
              used: false,
            });
          }
        }
      },

      // Track usage
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier') {
          const name = path.node.callee.name;
          if (declaredFunctions.has(name)) {
            declaredFunctions.get(name)!.used = true;
          }
        }
      },

      // Track references (like function passed as callback)
      Identifier(path) {
        const name = path.node.name;

        // Skip if it's a declaration
        if (
          (path.parent.type === 'FunctionDeclaration' && path.parent.id === path.node) ||
          (path.parent.type === 'VariableDeclarator' && path.parent.id === path.node)
        ) {
          return;
        }

        if (declaredFunctions.has(name)) {
          declaredFunctions.get(name)!.used = true;
        }
      },
    });

    // Find unused functions
    for (const [name, info] of declaredFunctions) {
      if (!info.used) {
        deadCode.push({
          type: 'function',
          name,
          line: info.line,
          file: '', // Will be set by caller
          reason: 'Function is declared but never called or referenced',
        });
      }
    }

    return deadCode;
  }

  /**
   * Find unused imports in a single file
   */
  private findUnusedImports(ast: File): DeadCodeItem[] {
    const deadCode: DeadCodeItem[] = [];
    const importedItems = new Map<string, { line?: number; used: boolean; isDefault?: boolean }>();

    traverse(ast, {
      // Track imports
      ImportDeclaration(path) {
        path.node.specifiers.forEach((spec) => {
          let name: string;
          let isDefault = false;

          if (spec.type === 'ImportDefaultSpecifier') {
            name = spec.local.name;
            isDefault = true;
          } else if (spec.type === 'ImportSpecifier') {
            name = spec.local.name;
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            name = spec.local.name;
          } else {
            return;
          }

          importedItems.set(name, {
            line: path.node.loc?.start.line,
            used: false,
            isDefault,
          });
        });
      },

      // Track usage
      Identifier(path) {
        const name = path.node.name;

        // Skip if it's an import declaration
        if (
          (path.parent.type === 'ImportSpecifier' && path.parent.local === path.node) ||
          path.parent.type === 'ImportDefaultSpecifier' ||
          path.parent.type === 'ImportNamespaceSpecifier'
        ) {
          return;
        }

        if (importedItems.has(name)) {
          importedItems.get(name)!.used = true;
        }
      },
    });

    // Find unused imports
    for (const [name, info] of importedItems) {
      if (!info.used) {
        deadCode.push({
          type: 'import',
          name,
          line: info.line,
          file: '', // Will be set by caller
          reason: `Import '${name}' is imported but never used`,
        });
      }
    }

    return deadCode;
  }
}
