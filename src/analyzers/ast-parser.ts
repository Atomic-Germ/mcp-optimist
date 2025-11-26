import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { DEFAULT_IGNORES } from '../config/default-ignore';
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
  private supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];

  /**
   * Expand a path (file, directory, or glob) into a list of files to analyze
   */
  expandPath(
    inputPath: string,
    options?: { includeIgnored?: boolean; overrideIgnore?: string[] }
  ): string[] {
    // If path doesn't exist, treat as glob pattern
    if (!fs.existsSync(inputPath)) {
      return this.expandGlob(inputPath, options);
    }

    const stats = fs.statSync(inputPath);

    if (stats.isFile()) {
      // Single file
      return this.isSupportedFile(inputPath) ? [inputPath] : [];
    } else if (stats.isDirectory()) {
      // Directory - recursively find all supported files
      return this.findFilesInDirectory(inputPath, options);
    } else {
      // Not a file or directory, treat as glob
      return this.expandGlob(inputPath, options);
    }
  }

  /**
   * Check if a file has a supported extension
   */
  private isSupportedFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(extension);
  }

  /**
   * Recursively find all supported files in a directory
   */
  private findFilesInDirectory(
    dirPath: string,
    options?: { includeIgnored?: boolean; overrideIgnore?: string[] }
  ): string[] {
    const files: string[] = [];
    const ignores = options?.overrideIgnore ?? DEFAULT_IGNORES;

    const walkDirectory = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          // Decide whether to skip this directory based on ignores and options
          const shouldSkip = !options?.includeIgnored && ignores.includes(item);
          if (!shouldSkip) {
            walkDirectory(fullPath);
          }
        } else if (stats.isFile() && this.isSupportedFile(fullPath)) {
          files.push(fullPath);
        }
      }
    };

    walkDirectory(dirPath);
    return files;
  }

  /**
   * Expand a glob pattern into matching files
   */
  private expandGlob(
    pattern: string,
    options?: { includeIgnored?: boolean; overrideIgnore?: string[] }
  ): string[] {
    try {
      const ignoreList = options?.overrideIgnore ?? DEFAULT_IGNORES;
      const matches = glob.sync(pattern, {
        absolute: true,
        nodir: true, // Only files, not directories
      });

      // Filter to only supported file types
      let filteredMatches = matches.filter((file) => this.isSupportedFile(file));

      // Additionally filter out ignored paths if not including ignored
      if (!options?.includeIgnored) {
        filteredMatches = filteredMatches.filter((file) => {
          const relativePath = path.relative(process.cwd(), file);
          return !ignoreList.some((ignore) => {
            return relativePath.includes(`/${ignore}/`) || relativePath.startsWith(`${ignore}/`);
          });
        });
      }

      return filteredMatches;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If glob fails, return empty array
      return [];
    }
  }

  /**
   * Parse source code file to AST
   */
  parseFile(filePath: string): ParseResult {
    // Validate that the path exists and is a file
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Check for supported file extensions
    if (!this.isSupportedFile(filePath)) {
      const extension = path.extname(filePath).toLowerCase();
      throw new Error(
        `Unsupported file extension: ${extension}. Supported: ${this.supportedExtensions.join(', ')}`
      );
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    return this.parseCode(code, filePath);
  }

  /**
   * Parse source code string to AST
   */
  parseCode(code: string, filePath = 'unknown'): ParseResult {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.py') {
      // For Python files, return a mock AST for now
      // TODO: Implement proper Python AST parsing
      const mockAst = {
        type: 'File',
        program: {
          type: 'Program',
          body: [],
          sourceType: 'module',
        },
        loc: undefined,
      };
      return {
        ast: mockAst as any,
        code,
        filePath,
      };
    }

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
   * Extract dependencies (imports) from a file
   */
  extractDependencies(filePath: string): string[] {
    if (filePath.endsWith('.py')) {
      return this.extractPythonDependencies(filePath);
    }

    try {
      const result = this.parseFile(filePath);
      return this.extractDependenciesFromAST(result.ast, filePath);
    } catch (error) {
      console.warn(`Error extracting dependencies from ${filePath}:`, error);
      return [];
    }
  }

  private extractPythonDependencies(filePath: string): string[] {
    // For Python, use a simple regex-based approach since we have mock AST
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const dependencies: string[] = [];
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ')) {
          const parts = trimmed.split(' ');
          if (parts.length >= 2) {
            dependencies.push(parts[1].split('.')[0]); // Get module name
          }
        } else if (trimmed.startsWith('from ')) {
          const parts = trimmed.split(' ');
          if (parts.length >= 2) {
            dependencies.push(parts[1].split('.')[0]);
          }
        }
      }

      return dependencies;
    } catch (error) {
      console.warn(`Error extracting Python dependencies from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Extract dependencies from AST
   */
  private extractDependenciesFromAST(ast: File, filePath: string): string[] {
    const dependencies: string[] = [];
    const dirPath = path.dirname(filePath);

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const resolved = resolveImport(source, dirPath);
        if (resolved) dependencies.push(resolved);
      },
      CallExpression(path) {
        // Handle require() calls
        if (
          path.node.callee.type === 'Identifier' &&
          path.node.callee.name === 'require' &&
          path.node.arguments.length === 1 &&
          path.node.arguments[0].type === 'StringLiteral'
        ) {
          const source = path.node.arguments[0].value;
          const resolved = resolveImport(source, dirPath);
          if (resolved) dependencies.push(resolved);
        }
      },
    });

    return dependencies;
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

/**
 * Resolve an import path to an absolute file path
 */
function resolveImport(importPath: string, fromDir: string): string | null {
  // Skip external dependencies (node_modules, absolute paths starting with @ or single word)
  if (importPath.startsWith('@') || !importPath.includes('/') || importPath.startsWith('.')) {
    // Relative import - try to resolve
    try {
      let resolvedPath = path.resolve(fromDir, importPath);

      // Try different extensions
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json'];
      for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        if (fs.existsSync(testPath)) {
          return testPath;
        }
      }

      // Try as directory with index file
      for (const ext of extensions) {
        const testPath = path.join(resolvedPath, 'index' + ext);
        if (fs.existsSync(testPath)) {
          return testPath;
        }
      }

      // If no extension found, return the path without extension for now
      return resolvedPath;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }

  // External dependency - return as-is for now
  return null;
}
