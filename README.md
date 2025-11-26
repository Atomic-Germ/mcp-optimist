# Optimist MCP Server

> An intelligent code optimization MCP server that analyzes and improves codebases across multiple dimensions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![CI/CD](https://github.com/Atomic-Germ/mcp-optimist/actions/workflows/ci.yml/badge.svg)](https://github.com/Atomic-Germ/mcp-optimist/actions/workflows/ci.yml)

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

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- An MCP-compatible client (e.g., Claude Desktop)
- A codebase to analyze

### Installation

```bash
# Clone the repository
git clone https://github.com/Atomic-Germ/mcp-optimist.git
cd mcp-optimist
npm install
npm run build
```

### Test the Server

```bash
# Run tests to verify everything works
npm test

# Run with coverage
npm run test:coverage

# Verify build output
ls -la dist/
```

### Configure MCP Client

#### Claude Desktop

Edit your configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

Add the server:

```json
{
  "mcpServers": {
    "optimist": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-optimist/dist/index.js"],
      "env": {}
    }
  }
}
```

### Verify Setup

1. Restart your MCP client
2. Look for "optimist" in the available tools
3. You should see 8 optimization tools available

### First Code Analysis

Try these examples in your MCP client:

#### Analyze Code Complexity

```
Use analyze_complexity tool on your project:
Path: "./src"
Max Complexity: 10
Report Format: "summary"
```

#### Detect Performance Issues

```
Use analyze_performance tool:
Path: "./src"
Include Tests: false
Threshold: "medium"
```

#### Find Code Smells

```
Use detect_code_smells tool:
Path: "./src"
Severity: "medium"
```

#### Memory Analysis

```
Use optimize_memory tool:
Path: "./src"
Detect Leaks: true
Suggest Fixes: true
```

## Development

### Development Commands

```bash
# Development
npm run dev              # Run with ts-node (development mode)
npm run build:watch      # Auto-rebuild on changes

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode for tests
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting

# Build
npm run build            # Compile to dist/
npm run clean            # Remove dist/
```

### Project Structure

```
mcp-optimist/
├── src/
│   ├── index.ts         # MCP server entry point
│   ├── server.ts        # OptimistServer class
│   ├── types/           # TypeScript definitions
│   ├── tools/           # Tool implementations
│   ├── analyzers/       # Analysis engines
│   └── utils/           # Utility functions
│
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── fixtures/        # Test fixtures
│
├── docs/                # Documentation
├── archive/             # Archived documentation
├── README.md            # This file
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Test configuration
├── eslint.config.js     # Linting rules
├── .prettierrc          # Code formatting
└── dist/                # Compiled JavaScript
```

## Examples

### Basic Project Analysis

Perform comprehensive analysis of your entire project:

```typescript
// Analyze overall code quality
{
  tool: "detect_code_smells",
  arguments: {
    path: "./src",
    severity: "medium"
  }
}

// Check performance issues
{
  tool: "analyze_performance",
  arguments: {
    path: "./src",
    threshold: "medium",
    includeTests: false
  }
}

// Find complexity issues
{
  tool: "analyze_complexity",
  arguments: {
    path: "./src",
    maxComplexity: 8,
    reportFormat: "detailed"
  }
}
```

### Single File Analysis

Analyze a specific problematic file:

```typescript
{
  tool: "analyze_performance",
  arguments: {
    path: "./src/services/dataProcessor.ts",
    threshold: "low",
    profileHotPaths: true,
    trackAsyncOperations: true
  }
}
```

### Memory Optimization

Find and fix memory leaks in a React component:

```typescript
{
  tool: "optimize_memory",
  arguments: {
    path: "./src/components",
    detectLeaks: true,
    analyzeClosures: true
  }
}
```

**Leak Analysis Result:**

```typescript
{
  data: {
    findings: [
      {
        type: 'event-listener-leak',
        file: 'src/components/DataChart.tsx',
        line: 23,
        description: 'Event listeners not cleaned up in useEffect',
        leakPotential: 'high',
      },
      {
        type: 'closure-retention',
        file: 'src/hooks/useDataFetch.ts',
        line: 15,
        description: 'Closure retaining large objects unnecessarily',
      },
    ];
  }
}
```

**Memory Leak Fixes:**

Problem - Event Listener Leak:

```typescript
// Problematic - no cleanup
function DataChart() {
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    // Missing cleanup function
  }, []);
}
```

Fixed:

```typescript
// Fixed with proper cleanup
function DataChart() {
  useEffect(() => {
    const handleResize = () => {
      // Handle resize
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function prevents leak
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}
```

### Performance Optimization

Identify and fix performance bottlenecks:

```typescript
{
  tool: "analyze_performance",
  arguments: {
    path: "./src/services/dataProcessor.ts",
    threshold: "low",
    profileHotPaths: true
  }
}
```

**Before (Problematic):**

```typescript
// O(n²) complexity - problematic
function processLargeDataset(items: Item[], lookup: LookupItem[]): ProcessedItem[] {
  return items.map((item) => {
    // Inner loop for each item - O(n²)
    const match = lookup.find((l) => l.id === item.lookupId);
    return { ...item, enrichedData: match?.data };
  });
}
```

**After (Optimized):**

```typescript
// O(n) complexity - optimized
function processLargeDataset(items: Item[], lookup: LookupItem[]): ProcessedItem[] {
  // Create lookup map once - O(n)
  const lookupMap = new Map(lookup.map((l) => [l.id, l.data]));

  // Single pass through items - O(n)
  return items.map((item) => ({
    ...item,
    enrichedData: lookupMap.get(item.lookupId),
  }));
}
```

### Code Quality Analysis

Analyze function complexity and code smells:

```typescript
{
  tool: "analyze_complexity",
  arguments: {
    path: "./src/utils/validation.ts",
    maxComplexity: 6,
    includeCognitive: true
  }
}

{
  tool: "detect_code_smells",
  arguments: {
    path: "./src/services/UserService.ts",
    severity: "high"
  }
}
```

---

For more examples, see the [API Reference](docs/API_REFERENCE.md).
