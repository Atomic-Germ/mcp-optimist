# Optimist MCP Server - Quick Start Guide

Get your code optimization MCP server running in under 5 minutes!

## Prerequisites

- Node.js 18+
- npm or pnpm
- An MCP-compatible client (e.g., Claude Desktop)
- A codebase to analyze

## 1. Installation

```bash
# Clone and setup
git clone https://github.com/Atomic-Germ/mcp-optimist.git
cd mcp-optimist
npm install
npm run build
```

## 2. Test the Server

```bash
# Run tests to verify everything works
npm test

# Run with coverage
npm run test:coverage

# Verify build output
ls -la dist/
```

## 3. Configure MCP Client

### Claude Desktop

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

### Other MCP Clients

Use these connection details:

- **Command**: `node`
- **Args**: `["/path/to/mcp-optimist/dist/index.js"]`
- **Protocol**: stdio

## 4. Verify Setup

1. Restart your MCP client
2. Look for "optimist" in the available tools
3. You should see 8 optimization tools available

## 5. First Code Analysis

Try these examples in your MCP client:

### Analyze Code Complexity

```
Use analyze_complexity tool on your project:
Path: "./src"
Max Complexity: 10
Report Format: "summary"
```

### Detect Performance Issues

```
Use analyze_performance tool:
Path: "./src"
Include Tests: false
Threshold: "medium"
```

### Find Code Smells

```
Use detect_code_smells tool:
Path: "./src"
Severity: "medium"
```

### Memory Analysis

```
Use optimize_memory tool:
Path: "./src"
Detect Leaks: true
Suggest Fixes: true
```

## 6. Verify Everything Works

✅ **Tools Listed**: All 8 optimization tools are available  
✅ **Analysis Runs**: Tools execute without errors  
✅ **Results Format**: Consistent response structure  
✅ **File Processing**: Can analyze your codebase

## Available Tools

| Tool                   | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `analyze_performance`  | Find performance bottlenecks              |
| `optimize_memory`      | Detect memory leaks and inefficiencies    |
| `analyze_complexity`   | Measure code complexity metrics           |
| `detect_code_smells`   | Identify anti-patterns and quality issues |
| `analyze_dependencies` | Analyze dependency graphs                 |
| `find_dead_code`       | Locate unused code                        |
| `optimize_hot_paths`   | Optimize frequently executed code         |
| `suggest_refactoring`  | Get AI-powered refactoring suggestions    |

## Common Issues

### Build errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### MCP client can't find tools

- Check the absolute path in configuration
- Restart your MCP client after config changes
- Verify build succeeded: `ls -la dist/`

### Analysis errors

- Ensure the target path exists and is readable
- Check that file extensions are supported (`.js`, `.ts`, `.jsx`, `.tsx`)
- Review ignore patterns in configuration

## Configuration

Create `optimist.config.json` in your project root:

```json
{
  "analysis": {
    "depth": "deep",
    "ignorePatterns": ["**/node_modules/**", "**/dist/**"],
    "fileExtensions": [".js", ".ts", ".jsx", ".tsx"]
  },
  "complexity": {
    "maxCyclomatic": 10,
    "maxCognitive": 15
  },
  "performance": {
    "threshold": "medium",
    "profileHotPaths": true
  }
}
```

## Next Steps

- 📖 **Full Documentation**: See [README.md](./README.md)
- 🏗️ **Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- 🤝 **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- 📊 **Project Summary**: Check [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## Integration with Other Tools

Optimist works great with:

- **mcp-consult** - Get AI consultation on optimization strategies
- **mcp-tdd** - Apply optimizations using test-driven development
- **Your IDE** - Use analysis results to guide refactoring

---

**🎉 You're ready to optimize your codebase with AI-powered analysis!**

Need help? Check our [documentation](./docs/) or [open an issue](https://github.com/Atomic-Germ/mcp-optimist/issues).

1. **Define in server.ts** - Add to `listTools()` method
2. **Create analyzer** - Add to `src/analyzers/your-tool.ts`
3. **Write tests** - Add to `tests/unit/tools/your-tool.test.ts`
4. **Implement** - Follow TDD: RED → GREEN → REFACTOR
5. **Wire up** - Add handler in `src/index.ts`

## Development Commands

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

## Project Structure

```
mcp-optimist/
├── src/
│   ├── index.ts         # MCP server entry point ← START HERE
│   ├── server.ts        # OptimistServer class
│   ├── types/           # TypeScript definitions
│   ├── tools/           # Tool implementations (empty, ready for you!)
│   ├── analyzers/       # Analysis engines (empty, ready for you!)
│   └── utils/           # Utility functions (empty, ready for you!)
│
├── tests/
│   ├── unit/            # Unit tests
│   │   └── server.test.ts  # Server tests (5 passing)
│   ├── integration/     # Integration tests (empty)
│   └── fixtures/        # Test fixtures (empty)
│
├── README.md               # Full documentation
├── IMPLEMENTATION_PLAN.md  # Development roadmap
├── PROJECT_SUMMARY.md      # What we built
└── QUICKSTART.md          # This file!
```

## Example: Using the Server

### Programmatically

```typescript
import { OptimistServer } from './src/server';

// Create server instance
const server = new OptimistServer({
  maxComplexity: 15,
  analysisDepth: 'deep',
});

// Get server info
console.log(server.getServerInfo());
// { name: 'optimist', version: '0.1.0', protocolVersion: '2024-11-05' }

// List available tools
const tools = server.listTools();
console.log(`${tools.length} tools available`);
// 8 tools available

// See tool details
console.log(tools[0]);
// {
//   name: 'analyze_performance',
//   description: 'Analyze code performance...',
//   inputSchema: { ... }
// }
```

### Via MCP Client

Once integrated with Claude Desktop or another MCP client:

```
User: "Analyze the performance of my src/ directory"

Claude: [Uses analyze_performance tool]
Tool: analyze_performance
Args: { path: "./src" }

Response: [Currently placeholder, will be real analysis in Phase 2]
```

## Testing Your Changes

### Run Specific Test File

```bash
npm test -- server.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="initialization"
```

### Debug Tests

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Common Tasks

### Add a New Test

```typescript
// tests/unit/tools/performance.test.ts
import { PerformanceAnalyzer } from '../../../src/analyzers/performance';

describe('PerformanceAnalyzer', () => {
  it('should detect slow loops', async () => {
    const analyzer = new PerformanceAnalyzer();
    const result = await analyzer.analyze('./fixtures/slow-loop.js');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].type).toBe('SLOW_LOOP');
  });
});
```

### Add Implementation

```typescript
// src/analyzers/performance.ts
export class PerformanceAnalyzer {
  async analyze(path: string): Promise<AnalysisResult> {
    // Implementation here
    return {
      status: 'success',
      tool: 'analyze_performance',
      data: {
        summary: 'Analysis complete',
        findings: [],
        suggestions: [],
        metrics: {},
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
        filesAnalyzed: 0,
      },
    };
  }
}
```

## Resources

- **MCP Spec**: https://modelcontextprotocol.io/docs
- **MCP SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **TypeScript**: https://www.typescriptlang.org/docs

## Troubleshooting

### Tests Not Running

```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Check TypeScript version
npx tsc --version

# Clean and rebuild
npm run clean
npm run build
```

### MCP Connection Issues

- Ensure the path in Claude Desktop config is absolute
- Check that `dist/index.js` exists after building
- Look at Claude Desktop logs for errors
- Verify Node.js version (18+ required)

## Get Help

- Read `README.md` for full documentation
- Check `IMPLEMENTATION_PLAN.md` for development roadmap
- See `PROJECT_SUMMARY.md` for what's implemented
- Review tests in `tests/unit/` for examples

## Next Steps

1. ✅ You've set up the foundation
2. 📝 Review the implementation plan
3. 🔨 Start implementing the first tool (performance analyzer)
4. ✅ Write tests first (TDD)
5. 🚀 Build and iterate

**Happy Coding! 🎉**

---

_Built with Test-Driven Development and the Model Context Protocol_
