# Optimist MCP Server

> An intelligent code optimization MCP server that analyzes and improves codebases across multiple dimensions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

## Overview

Optimist is a Model Context Protocol (MCP) server designed to work alongside other development tools to provide comprehensive codebase optimization. It analyzes code for performance bottlenecks, memory issues, code smells, and maintainability concerns, offering actionable suggestions for improvement.

### Key Features

- 🚀 **Performance Analysis** - Identify bottlenecks and hot paths
- 💾 **Memory Optimization** - Detect leaks and inefficient allocations
- 📊 **Code Quality Metrics** - Complexity analysis and maintainability scoring
- 🔍 **Dead Code Detection** - Find and eliminate unused code
- 📦 **Dependency Management** - Optimize and analyze dependency graphs
- 🎯 **Smart Refactoring** - AI-powered refactoring suggestions
- 🔗 **MCP Integration** - Seamless integration with other MCP tools
- ✅ **Test-Driven** - Built using TDD methodology

## Architecture

Optimist exposes a set of tools via the Model Context Protocol that can be invoked by MCP clients (like Claude Desktop, IDEs, or CI/CD pipelines).

### Core Tools

| Tool | Purpose |
|------|---------|
| `analyze_performance` | Profile code execution and identify performance bottlenecks |
| `optimize_memory` | Detect memory leaks and suggest memory-efficient patterns |
| `analyze_complexity` | Evaluate cyclomatic and cognitive complexity |
| `analyze_dependencies` | Map dependency graphs and find optimization opportunities |
| `detect_code_smells` | Identify anti-patterns and code quality issues |
| `find_dead_code` | Locate unused code, variables, and dependencies |
| `optimize_hot_paths` | Analyze and optimize frequently executed code paths |
| `suggest_refactoring` | Provide AI-powered refactoring recommendations |

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-optimist.git
cd mcp-optimist

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Quick Start

### As an MCP Server

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "optimist": {
      "command": "node",
      "args": ["/path/to/mcp-optimist/dist/index.js"],
      "env": {}
    }
  }
}
```

### Programmatic Usage

```typescript
import { OptimistServer } from 'mcp-optimist';

const server = new OptimistServer({
  port: 3000,
  analysisDepth: 'deep',
  enabledTools: ['all']
});

await server.start();
```

## Usage Examples

### Analyze Performance

```typescript
// Request via MCP
{
  "tool": "analyze_performance",
  "arguments": {
    "path": "./src",
    "includeTests": false,
    "threshold": "medium"
  }
}
```

### Optimize Memory

```typescript
{
  "tool": "optimize_memory",
  "arguments": {
    "path": "./src/services",
    "detectLeaks": true,
    "suggestFixes": true
  }
}
```

### Analyze Code Complexity

```typescript
{
  "tool": "analyze_complexity",
  "arguments": {
    "path": "./src",
    "maxComplexity": 10,
    "reportFormat": "summary"
  }
}
```

## Configuration

Create an `optimist.config.json` in your project root:

```json
{
  "analysis": {
    "depth": "deep",
    "ignorePatterns": ["**/node_modules/**", "**/dist/**"],
    "fileExtensions": [".js", ".ts", ".jsx", ".tsx"]
  },
  "performance": {
    "threshold": "medium",
    "profileHotPaths": true
  },
  "memory": {
    "detectLeaks": true,
    "trackAllocations": true
  },
  "complexity": {
    "maxCyclomatic": 10,
    "maxCognitive": 15
  },
  "dependencies": {
    "checkCircular": true,
    "suggestUpdates": false
  }
}
```

## Development

### Project Structure

```
mcp-optimist/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # MCP server implementation
│   ├── tools/                # Tool implementations
│   │   ├── performance.ts    # Performance analysis
│   │   ├── memory.ts         # Memory optimization
│   │   ├── complexity.ts     # Complexity analysis
│   │   ├── dependencies.ts   # Dependency management
│   │   ├── code-smells.ts    # Code smell detection
│   │   ├── dead-code.ts      # Dead code finder
│   │   ├── hot-paths.ts      # Hot path optimization
│   │   └── refactoring.ts    # Refactoring suggestions
│   ├── analyzers/            # Core analysis engines
│   ├── utils/                # Utility functions
│   └── types/                # TypeScript definitions
├── tests/                    # Test suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test fixtures
├── docs/                     # Documentation
├── package.json
├── tsconfig.json
└── optimist.config.json      # Default configuration
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "performance"

# Watch mode
npm run test:watch
```

### Building

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Watch mode
npm run build:watch
```

## TDD Methodology

This project is built using Test-Driven Development:

1. **RED** - Write failing tests first
2. **GREEN** - Implement minimal code to pass tests
3. **REFACTOR** - Improve code quality while maintaining tests

All features are developed following this cycle, ensuring high code quality and test coverage.

## Integration with Other MCP Tools

Optimist is designed to work alongside:

- **Code Analysis Tools** - Linters, formatters, type checkers
- **Testing Frameworks** - Jest, Vitest, Mocha
- **Build Tools** - Webpack, Vite, Rollup
- **Documentation Generators** - TypeDoc, JSDoc
- **CI/CD Systems** - GitHub Actions, GitLab CI, Jenkins

## API Reference

### Tool Schemas

#### analyze_performance

```typescript
{
  path: string;              // Directory or file path
  includeTests?: boolean;    // Include test files (default: false)
  threshold?: 'low' | 'medium' | 'high'; // Alert threshold
  profileHotPaths?: boolean; // Analyze hot execution paths
}
```

#### optimize_memory

```typescript
{
  path: string;              // Directory or file path
  detectLeaks?: boolean;     // Check for memory leaks
  suggestFixes?: boolean;    // Provide fix suggestions
  trackAllocations?: boolean; // Track allocation patterns
}
```

#### analyze_complexity

```typescript
{
  path: string;              // Directory or file path
  maxComplexity?: number;    // Maximum allowed complexity
  reportFormat?: 'summary' | 'detailed' | 'json';
}
```

### Response Format

All tools return responses in this structure:

```typescript
{
  status: 'success' | 'error';
  tool: string;
  data: {
    summary: string;
    findings: Array<Finding>;
    suggestions: Array<Suggestion>;
    metrics: Record<string, any>;
  };
  metadata: {
    timestamp: string;
    duration: number;
    filesAnalyzed: number;
  };
}
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests first (TDD approach)
4. Implement your feature
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Follow TDD methodology
- Maintain >90% test coverage
- Use TypeScript strict mode
- Follow existing code style
- Update documentation

## Roadmap

### Phase 1 - Foundation (Current)
- [x] Project setup
- [x] Core MCP server implementation
- [x] Basic tool scaffolding
- [x] Test infrastructure

### Phase 2 - Core Features (In Progress)
- [x] Performance analyzer ✅ **COMPLETE**
- [x] Memory optimizer ✅ **COMPLETE**
- [ ] Complexity analyzer
- [ ] Code smell detector

### Phase 3 - Advanced Features
- [ ] Dependency graph analysis
- [ ] Dead code elimination
- [ ] Hot path optimization
- [ ] AI-powered refactoring

### Phase 4 - Integration & Polish
- [ ] CI/CD integration
- [ ] IDE plugins
- [ ] Performance optimizations
- [ ] Documentation completion

## Performance

Optimist is designed to be lightweight and fast:

- Async analysis for non-blocking operations
- Incremental analysis support
- Caching for repeated operations
- Parallel processing where applicable

## Security

- No code execution during analysis
- Read-only file access by default
- Sandboxed analysis environment
- Secure MCP protocol implementation

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io)
- Inspired by tools like ESLint, SonarQube, and CodeClimate
- Developed with TDD using the mcp-tdd framework

## Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/mcp-optimist/issues)
- 💬 [Discussions](https://github.com/yourusername/mcp-optimist/discussions)
- 📧 Email: support@optimist-mcp.dev

## Links

- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Example MCP Servers](https://github.com/modelcontextprotocol/servers)

---

**Built with ❤️ using Test-Driven Development and the Model Context Protocol**
