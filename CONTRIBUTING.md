# Contributing to Optimist MCP Server

Thank you for your interest in contributing to Optimist! This document provides guidelines and instructions for contributing to our code optimization MCP server.

## 🎯 Project Goals

Optimist aims to provide a comprehensive MCP server for code optimization, featuring:

- Intelligent code analysis across multiple dimensions
- High-quality, maintainable codebase (complexity < 10 per function)
- Comprehensive test coverage (90%+ target)
- Professional documentation and examples
- Reliable CI/CD pipeline with automated testing
- Performance-optimized analysis algorithms

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git
- Understanding of static code analysis principles

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/Atomic-Germ/mcp-optimist.git
cd mcp-optimist

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📋 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b analyzer/new-analysis-type
```

### 2. Follow TDD Methodology

Optimist is built using Test-Driven Development:

**RED** → **GREEN** → **REFACTOR**

```bash
# 1. Write failing tests first
npm test -- --watch

# 2. Implement minimal code to pass tests
# 3. Refactor for quality and performance
# 4. Ensure all tests still pass
```

### 3. Make Your Changes

Follow our coding standards:

- **TDD**: Write tests first, then implementation
- **Complexity**: Keep functions under 10 cyclomatic complexity
- **Performance**: Optimize for large codebases
- **Formatting**: Use Prettier (`npm run format`)
- **Linting**: Follow ESLint rules (`npm run lint`)

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check coverage (target: >90%)
npm run test:coverage

# Lint your code
npm run lint

# Format your code
npm run format
```

### 5. Commit Your Changes

We follow conventional commits:

```bash
git commit -m "feat: add dead code detection analyzer"
git commit -m "fix: resolve memory leak in AST parsing"
git commit -m "refactor: improve complexity calculation algorithm"
git commit -m "docs: update analyzer API documentation"
git commit -m "test: add comprehensive analyzer test suite"
git commit -m "perf: optimize hot path analysis performance"
```

**Commit Types:**

- `feat`: New analysis features or tools
- `fix`: Bug fixes
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `perf`: Performance improvements
- `chore`: Maintenance tasks

## 🧪 Testing Guidelines

### Test-Driven Development

All features must be developed using TDD:

1. **RED**: Write failing test that defines desired behavior
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code while maintaining tests

### Writing Tests

Place tests in the `tests/` directory following the structure:

```typescript
// tests/unit/analyzers/complexity.test.ts
import { describe, it, expect, beforeEach } from 'jest';
import { ComplexityAnalyzer } from '../../../src/analyzers/complexity-analyzer';

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer();
  });

  describe('calculateCyclomaticComplexity', () => {
    it('should return 1 for simple function', () => {
      const code = 'function simple() { return true; }';
      const result = analyzer.analyze(code);
      expect(result.cyclomatic).toBe(1);
    });

    it('should handle conditional statements', () => {
      const code = `
        function conditional(x) {
          if (x > 0) return 'positive';
          return 'negative';
        }
      `;
      const result = analyzer.analyze(code);
      expect(result.cyclomatic).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', () => {
      const invalidCode = 'function broken() { return';
      expect(() => analyzer.analyze(invalidCode)).not.toThrow();
    });
  });
});
```

### Test Coverage Requirements

Minimum coverage thresholds:

- **Statements**: 95%
- **Branches**: 90%
- **Functions**: 95%
- **Lines**: 95%

### Test Categories

```bash
# Unit tests (individual components)
npm test tests/unit/

# Integration tests (tool workflows)
npm test tests/integration/

# Performance tests (large codebases)
npm test tests/performance/
```

## 🎨 Code Style

### Formatting and Linting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Lint all files
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### TypeScript Guidelines

- Use TypeScript for all code
- Strict mode enabled
- Avoid `any` types - use proper type definitions
- Document complex types and interfaces
- Use generics for reusable components

### Code Complexity

- Maximum cyclomatic complexity: 10
- Maximum cognitive complexity: 15
- Maximum function lines: 50
- Maximum parameter count: 5

**Example:**

```typescript
// ❌ Bad: High complexity
function analyzeComplexCode(ast: any, options: any) {
  if (ast) {
    if (ast.type === 'Program') {
      for (const node of ast.body) {
        if (node.type === 'FunctionDeclaration') {
          if (options.includeNestedFunctions) {
            // ... deep nesting
          }
        }
      }
    }
  }
}

// ✅ Good: Low complexity, single responsibility
function analyzeComplexCode(ast: Program, options: AnalysisOptions): AnalysisResult {
  if (!isValidProgram(ast)) return emptyResult();

  const functions = extractFunctions(ast, options);
  return analyzeFunctions(functions, options);
}

function isValidProgram(ast: Program): boolean {
  return ast?.type === 'Program' && ast.body?.length > 0;
}

function extractFunctions(ast: Program, options: AnalysisOptions): FunctionNode[] {
  const extractor = new FunctionExtractor(options);
  return extractor.extract(ast);
}
```

## 🏗️ Architecture

### Project Structure

```
mcp-optimist/
├── src/
│   ├── analyzers/            # Core analysis engines
│   │   ├── ast-parser.ts     # AST parsing foundation
│   │   ├── complexity-analyzer.ts
│   │   ├── memory-analyzer.ts
│   │   └── smell-analyzer.ts
│   ├── tools/                # MCP tool implementations
│   │   ├── performance.ts
│   │   ├── memory.ts
│   │   ├── complexity.ts
│   │   └── code-smells.ts
│   ├── types/                # TypeScript definitions
│   ├── utils/                # Utility functions
│   ├── config/               # Configuration
│   ├── server.ts             # MCP server implementation
│   └── index.ts              # Entry point
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test code samples
└── docs/                     # Documentation
```

### Adding a New Analyzer

1. **Write Tests First** (TDD):

```typescript
// tests/unit/analyzers/security.test.ts
describe('SecurityAnalyzer', () => {
  it('should detect SQL injection vulnerabilities', () => {
    const code = `const query = "SELECT * FROM users WHERE id = " + userId;`;
    const result = analyzer.analyze(code);
    expect(result.vulnerabilities).toContainEqual(
      expect.objectContaining({ type: 'sql-injection' })
    );
  });
});
```

2. **Create Analyzer Interface**:

```typescript
// src/analyzers/security-analyzer.ts
export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  column: number;
  description: string;
}

export class SecurityAnalyzer extends BaseAnalyzer {
  analyze(code: string): SecurityAnalysisResult {
    // Implementation
  }
}
```

3. **Create Tool Interface**:

```typescript
// src/tools/security.ts
export async function analyzeSecurity(args: SecurityAnalysisArgs): Promise<ToolResponse> {
  const analyzer = new SecurityAnalyzer();
  const result = analyzer.analyze(args.path);
  return formatResponse(result);
}
```

4. **Register Tool**:

```typescript
// src/server.ts
async listTools(): Promise<Tool[]> {
  return [
    // existing tools...
    {
      name: 'analyze_security',
      description: 'Detect security vulnerabilities in code',
      inputSchema: SecurityAnalysisArgsSchema
    }
  ];
}
```

### Adding Language Support

1. **Extend AST Parser**:

```typescript
// src/analyzers/ast-parser.ts
export class ASTParser {
  parseFile(filePath: string): AST {
    const extension = path.extname(filePath);
    switch (extension) {
      case '.ts':
      case '.tsx':
        return this.parseTypeScript(filePath);
      case '.py':
        return this.parsePython(filePath); // New language
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }
}
```

## 📊 Performance Guidelines

### Optimization Strategies

**1. AST Parsing Efficiency**

```typescript
// ❌ Bad: Re-parsing same files
for (const file of files) {
  const ast = parseFile(file);
  analyze(ast);
}

// ✅ Good: Cache parsed ASTs
const astCache = new Map<string, AST>();
for (const file of files) {
  if (!astCache.has(file)) {
    astCache.set(file, parseFile(file));
  }
  analyze(astCache.get(file)!);
}
```

**2. Parallel Analysis**

```typescript
// ❌ Bad: Sequential processing
const results = [];
for (const file of files) {
  results.push(await analyzeFile(file));
}

// ✅ Good: Parallel processing
const results = await Promise.allSettled(files.map((file) => analyzeFile(file)));
```

**3. Memory Management**

```typescript
// ✅ Good: Clean up large objects
function analyzeProject(projectPath: string): AnalysisResult {
  const ast = parseProject(projectPath);
  const result = performAnalysis(ast);

  // Clean up memory
  ast.clear?.();

  return result;
}
```

### Performance Testing

```typescript
// tests/performance/large-codebase.test.ts
describe('Performance Tests', () => {
  it('should analyze large codebase within time limit', async () => {
    const startTime = Date.now();
    const result = await analyzeProject('./fixtures/large-project');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(30000); // 30 seconds max
    expect(result.filesAnalyzed).toBeGreaterThan(1000);
  });
});
```

## 🐛 Debugging

### Local Development

```bash
# Run with debugging
npm run dev:debug

# Run specific analyzer test
npm test -- tests/unit/analyzers/complexity.test.ts --watch
```

### Testing with Real Codebases

```bash
# Test against real projects
npm run build
node dist/index.js analyze_complexity \
  --path ./path/to/real/project \
  --format json > analysis.json
```

## 📖 Documentation

### Code Documentation

Use comprehensive JSDoc:

````typescript
/**
 * Analyzes code complexity metrics including cyclomatic and cognitive complexity.
 *
 * @param filePath - Path to the file to analyze
 * @param options - Analysis configuration options
 * @returns Complexity analysis results with metrics and suggestions
 *
 * @example
 * ```typescript
 * const analyzer = new ComplexityAnalyzer();
 * const result = await analyzer.analyzeFile('./src/complex.ts', {
 *   maxComplexity: 10,
 *   includeCognitive: true
 * });
 *
 * console.log(`Cyclomatic: ${result.cyclomatic}`);
 * console.log(`Cognitive: ${result.cognitive}`);
 * ```
 *
 * @throws {Error} When file cannot be parsed or analyzed
 */
export async function analyzeComplexity(
  filePath: string,
  options: ComplexityOptions
): Promise<ComplexityResult> {
  // Implementation
}
````

### README Updates

When adding features:

1. Update tool list in README
2. Add usage examples
3. Update configuration documentation
4. Add to API reference

## 🚢 Release Process

Releases follow semantic versioning and are automated:

1. **Update version**:

```bash
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes
```

2. **Create release**:

```bash
git tag -a v0.2.0 -m "Release v0.2.0: Add dead code detection"
git push origin v0.2.0
```

The CI/CD pipeline will:

- Run full test suite
- Build and verify package
- Create GitHub release with changelog
- Publish to npm (if configured)

## 🔍 Code Review

### Review Checklist

- ✅ **TDD Followed**: Tests written first, implementation follows
- ✅ **Tests Pass**: All tests pass, coverage targets met
- ✅ **Performance**: No significant performance regressions
- ✅ **Documentation**: Code documented, README updated
- ✅ **Type Safety**: Proper TypeScript types throughout
- ✅ **Complexity**: Functions remain under complexity limits
- ✅ **Architecture**: Follows established patterns

### Getting Your PR Merged

1. All CI checks must pass
2. Code review approval from maintainer
3. No merge conflicts with main branch
4. Tests demonstrate the feature works correctly

## 🤝 Community

### Getting Help

- 🐛 **Bug Reports**: Open GitHub issues with reproduction steps
- 💡 **Feature Requests**: Describe use case and expected behavior
- ❓ **Questions**: Use GitHub Discussions for general questions
- 📖 **Documentation**: Check existing docs and examples

### Code of Conduct

- Be respectful and constructive in discussions
- Focus on the code, not the person
- Help newcomers learn and contribute
- Follow professional communication standards

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Optimist!** 🎉

Your efforts help make code optimization accessible and intelligent for developers everywhere.

For questions or guidance, open an issue or reach out to the maintainers.
