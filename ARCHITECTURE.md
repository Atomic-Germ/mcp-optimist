# Optimist MCP Server Architecture

## Overview

Optimist is built using a layered architecture that separates analysis logic from tool interfaces, providing a extensible foundation for code optimization across multiple dimensions.

## Project Structure

```
mcp-optimist/
├── src/
│   ├── index.ts                    # Entry point & MCP server setup
│   ├── server.ts                   # OptimistServer class & tool definitions
│   ├── tools/                      # MCP tool implementations
│   │   ├── performance.ts          # Performance analysis tool
│   │   ├── memory.ts               # Memory optimization tool
│   │   ├── complexity.ts           # Complexity analysis tool
│   │   └── code-smells.ts          # Code smell detection tool
│   ├── analyzers/                  # Core analysis engines
│   │   ├── ast-parser.ts           # Abstract syntax tree parsing
│   │   ├── complexity-analyzer.ts  # Cyclomatic/cognitive complexity
│   │   ├── memory-analyzer.ts      # Memory usage analysis
│   │   └── smell-analyzer.ts       # Anti-pattern detection
│   ├── types/                      # TypeScript definitions
│   │   ├── analysis.ts             # Analysis result types
│   │   ├── config.ts               # Configuration types
│   │   └── tools.ts                # Tool schema types
│   ├── utils/                      # Utility functions
│   │   ├── file-scanner.ts         # File system scanning
│   │   ├── logger.ts               # Logging utilities
│   │   └── validators.ts           # Input validation
│   └── config/                     # Configuration management
│       ├── defaults.ts             # Default configuration
│       └── loader.ts               # Configuration loading
└── tests/                          # Test suites
    ├── unit/                       # Unit tests
    │   ├── analyzers/              # Analyzer tests
    │   └── tools/                  # Tool tests
    ├── integration/                # Integration tests
    └── fixtures/                   # Test data and code samples
```

## Core Components

### 1. OptimistServer (server.ts)

The main server class that:

- Implements MCP protocol interfaces
- Defines all available optimization tools
- Manages server metadata and capabilities
- Handles tool registration and discovery
- Provides configuration management

**Key Responsibilities:**

- Tool schema definition and validation
- Server lifecycle management
- Error handling and response formatting
- Configuration loading and validation

### 2. Analysis Engines (analyzers/)

#### AST Parser (ast-parser.ts)

Foundation for all code analysis:

- Parses TypeScript, JavaScript, and other supported languages
- Generates Abstract Syntax Trees for analysis
- Provides AST traversal utilities
- Handles syntax error recovery

**Key Methods:**

- `parseFile()` - Parse individual files
- `parseProject()` - Parse entire project
- `traverse()` - AST traversal with visitors
- `extractMetrics()` - Extract basic code metrics

#### Complexity Analyzer (complexity-analyzer.ts)

Measures code complexity:

- **Cyclomatic Complexity**: Decision points and branching
- **Cognitive Complexity**: Human readability and understanding
- **Nesting Depth**: Maximum nesting levels
- **Function Size**: Lines of code and parameters

**Analysis Output:**

```typescript
{
  cyclomatic: number,
  cognitive: number,
  nestingDepth: number,
  functionSize: number,
  hotspots: ComplexityHotspot[]
}
```

#### Memory Analyzer (memory-analyzer.ts)

Identifies memory-related issues:

- Memory leak detection patterns
- Inefficient allocation patterns
- Unused object retention
- Closure memory implications
- Event listener cleanup

#### Smell Analyzer (smell-analyzer.ts)

Detects anti-patterns and code smells:

- Large classes and functions
- Feature envy and inappropriate intimacy
- Dead code and unused variables
- Duplicated code patterns
- God objects and classes

### 3. Tool Implementations (tools/)

Each tool provides a specific analysis capability:

#### Performance Tool (performance.ts)

- Algorithm complexity analysis
- Hot path identification
- Performance bottleneck detection
- Optimization recommendations

#### Memory Tool (memory.ts)

- Memory leak detection
- Allocation optimization
- Memory-efficient pattern suggestions
- Reference cleanup recommendations

#### Complexity Tool (complexity.ts)

- Complexity metric calculation
- Refactoring recommendations
- Complexity trend analysis
- Maintainability scoring

#### Code Smells Tool (code-smells.ts)

- Anti-pattern identification
- Code quality assessment
- Refactoring priority ranking
- Best practice recommendations

### 4. Configuration System (config/)

#### Default Configuration (defaults.ts)

Provides sensible defaults:

```typescript
{
  analysis: {
    depth: 'deep',
    ignorePatterns: ['**/node_modules/**', '**/dist/**'],
    fileExtensions: ['.js', '.ts', '.jsx', '.tsx']
  },
  complexity: {
    maxCyclomatic: 10,
    maxCognitive: 15,
    maxNestingDepth: 4
  },
  performance: {
    threshold: 'medium',
    profileHotPaths: true
  },
  memory: {
    detectLeaks: true,
    trackAllocations: true
  }
}
```

#### Configuration Loader (loader.ts)

- Loads `optimist.config.json` from project root
- Merges user config with defaults
- Validates configuration schema
- Provides runtime configuration updates

## Data Flow

### Single Tool Execution

```
MCP Client
    ↓
OptimistServer (tool dispatch)
    ↓
Tool Implementation (e.g., complexity.ts)
    ↓
Analyzer Engine (e.g., complexity-analyzer.ts)
    ↓
AST Parser (ast-parser.ts)
    ↓
File System & Code Analysis
    ↓
Formatted Results
```

### Multi-File Analysis

```
Tool Implementation
    ↓
File Scanner (utils/file-scanner.ts)
    ↓ ↓ ↓
Multiple Files Analyzed in Parallel
    ↓
Results Aggregation
    ↓
Summary Report Generation
```

## Tool Architecture

### Available Tools

| Tool                   | Analyzer          | Purpose                               |
| ---------------------- | ----------------- | ------------------------------------- |
| `analyze_performance`  | Performance + AST | Identify bottlenecks and hot paths    |
| `optimize_memory`      | Memory + AST      | Detect leaks and allocation issues    |
| `analyze_complexity`   | Complexity + AST  | Measure code complexity metrics       |
| `detect_code_smells`   | Smell + AST       | Find anti-patterns and quality issues |
| `analyze_dependencies` | _(Planned)_       | Dependency graph analysis             |
| `find_dead_code`       | _(Planned)_       | Unused code detection                 |
| `optimize_hot_paths`   | _(Planned)_       | Hot path optimization                 |
| `suggest_refactoring`  | _(Planned)_       | AI-powered refactoring                |

### Tool Response Format

All tools follow a consistent response structure:

```typescript
{
  status: 'success' | 'error',
  tool: string,
  data: {
    summary: string,
    findings: Finding[],
    suggestions: Suggestion[],
    metrics: Record<string, any>
  },
  metadata: {
    timestamp: string,
    duration: number,
    filesAnalyzed: number,
    linesOfCode: number
  }
}
```

## Design Principles

1. **Separation of Concerns**: Tools, analyzers, and parsers are independent
2. **Extensibility**: Easy to add new analysis capabilities
3. **Performance**: Parallel analysis and caching strategies
4. **Type Safety**: Comprehensive TypeScript throughout
5. **Testability**: All components are unit tested
6. **Configuration**: Flexible and user-customizable

## Extension Points

### Adding a New Analysis Tool

1. Create analyzer in `analyzers/` (e.g., `security-analyzer.ts`)
2. Implement tool in `tools/` (e.g., `security.ts`)
3. Add tool definition in `server.ts`
4. Define types in `types/analysis.ts`
5. Write comprehensive tests

### Adding Language Support

1. Extend AST parser in `ast-parser.ts`
2. Add language-specific analysis rules
3. Update file extension configuration
4. Add language-specific test fixtures

### Adding New Analysis Metrics

1. Define metric types in `types/analysis.ts`
2. Implement collection in appropriate analyzer
3. Update tool response formatting
4. Add metric visualization support

## Dependencies

### Production Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `typescript` - TypeScript compiler and AST access
- `zod` - Runtime type validation and schema definition

### Development Dependencies

- `jest` - Test framework with coverage
- `eslint` - Code linting and quality checks
- `prettier` - Code formatting
- `ts-node` - TypeScript execution for development

## Testing Strategy

### Test Structure

```
tests/
├── unit/
│   ├── analyzers/              # Individual analyzer tests
│   │   ├── complexity.test.ts  # Complexity calculation tests
│   │   ├── memory.test.ts      # Memory analysis tests
│   │   └── smell.test.ts       # Code smell detection tests
│   └── tools/                  # Tool integration tests
│       ├── performance.test.ts # Performance tool tests
│       └── memory.test.ts      # Memory tool tests
├── integration/                # End-to-end tool tests
│   ├── full-analysis.test.ts   # Complete analysis workflow
│   └── config-loading.test.ts  # Configuration integration
└── fixtures/                   # Test code samples
    ├── complex-code/           # High complexity examples
    ├── memory-leaks/           # Memory issue examples
    └── code-smells/            # Anti-pattern examples
```

### Testing Philosophy

- **Test-Driven Development**: All features developed using TDD
- **High Coverage**: Target >90% test coverage
- **Realistic Fixtures**: Use real-world code examples
- **Performance Testing**: Measure analysis performance
- **Error Scenarios**: Test edge cases and error conditions

### Coverage Targets

- **Analyzers**: >95% (core analysis logic)
- **Tools**: >90% (tool implementations)
- **Utilities**: >85% (helper functions)
- **Overall**: >90% (project-wide)

## Performance Considerations

### Analysis Performance

- **Parallel Processing**: Analyze multiple files concurrently
- **Incremental Analysis**: Cache and reuse previous results
- **Memory Management**: Efficient AST processing and cleanup
- **Streaming**: Process large files without loading entirely

### Optimization Strategies

1. **AST Caching**: Cache parsed ASTs for repeated analysis
2. **File Filtering**: Skip files based on ignore patterns
3. **Lazy Loading**: Load analyzers only when needed
4. **Result Memoization**: Cache analysis results by file hash

### Resource Limits

- **Memory Usage**: Monitor and limit memory consumption
- **CPU Usage**: Throttle analysis for large codebases
- **File Limits**: Configurable limits on files analyzed
- **Timeout Handling**: Prevent analysis from hanging

## Security

- **Sandboxed Analysis**: No code execution during analysis
- **File System Isolation**: Restrict file access to project directory
- **Input Validation**: Validate all tool inputs and configuration
- **Safe AST Parsing**: Handle malformed code safely
- **No Network Access**: All analysis performed locally

## Configuration

### Project Configuration

Create `optimist.config.json` in project root:

```json
{
  "analysis": {
    "depth": "deep",
    "ignorePatterns": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
    "fileExtensions": [".js", ".ts", ".jsx", ".tsx", ".vue"]
  },
  "complexity": {
    "maxCyclomatic": 8,
    "maxCognitive": 12,
    "maxNestingDepth": 3
  },
  "performance": {
    "threshold": "high",
    "profileHotPaths": true,
    "trackAsyncOperations": true
  },
  "memory": {
    "detectLeaks": true,
    "trackAllocations": true,
    "analyzeClosures": true
  },
  "codeSmells": {
    "severity": "medium",
    "enabledRules": ["all"],
    "customRules": []
  }
}
```

### Runtime Configuration

Environment variables for runtime behavior:

```bash
# Analysis configuration
OPTIMIST_LOG_LEVEL=info
OPTIMIST_MAX_FILES=1000
OPTIMIST_ANALYSIS_TIMEOUT=300000

# Performance tuning
OPTIMIST_PARALLEL_WORKERS=4
OPTIMIST_CACHE_ENABLED=true
OPTIMIST_CACHE_DIR=/tmp/optimist-cache
```

## Error Handling

### Error Categories

1. **Parsing Errors**: Syntax errors in source code
2. **Analysis Errors**: Failures during code analysis
3. **Configuration Errors**: Invalid configuration values
4. **File System Errors**: Unable to read/access files
5. **Resource Errors**: Memory or time limit exceeded

### Error Recovery

- **Graceful Degradation**: Continue analysis when individual files fail
- **Partial Results**: Return results for successfully analyzed files
- **Error Reporting**: Detailed error messages with context
- **Retry Logic**: Retry transient failures with backoff
