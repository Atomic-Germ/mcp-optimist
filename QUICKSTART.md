# Quick Start Guide - Optimist MCP Server

## What You Have

A fully functional MCP server foundation for code optimization with:
- ✅ 8 analysis tools defined
- ✅ TypeScript configuration
- ✅ Test infrastructure (Jest)
- ✅ 5 passing unit tests
- ✅ MCP protocol integration
- ✅ Build system ready

## Try It Now

### 1. Test the Server

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### 2. Build the Server

```bash
# Compile TypeScript
npm run build

# The compiled server will be in dist/
ls -l dist/
```

### 3. Run the MCP Server

```bash
# Run directly (requires MCP client to connect via stdio)
npm start

# Or use the built version
node dist/index.js
```

### 4. Integrate with Claude Desktop

Edit your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add:
```json
{
  "mcpServers": {
    "optimist": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-optimist/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop and you'll see "optimist" in the MCP tools list!

## What Works Now

### List Tools
The server can list all 8 optimization tools:
- analyze_performance
- optimize_memory
- analyze_complexity
- detect_code_smells
- analyze_dependencies
- find_dead_code
- optimize_hot_paths
- suggest_refactoring

### Tool Invocation
Tools can be called via MCP, though implementations are pending (will return placeholder messages).

## Next Development Steps

### Phase 2: Implement First Tool (Performance Analyzer)

```bash
# Start new TDD cycle
# (Using mcp-tdd tools if available)

# 1. Write failing tests for performance analyzer
# 2. Implement minimal code to pass tests
# 3. Refactor
# 4. Move to next tool
```

### Add Your Own Tool

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
  analysisDepth: 'deep'
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
        metrics: {}
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
        filesAnalyzed: 0
      }
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

*Built with Test-Driven Development and the Model Context Protocol*
