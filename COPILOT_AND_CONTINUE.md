# Copilot & Continue: MCP Optimist

> Quick reference to using `mcp-optimist` with GitHub Copilot and Continue

## Purpose

MCP Optimist analyzes and optimizes codebases for performance, memory, and maintainability. Use it when you need automated analysis, performance profiling, or AI-driven refactoring suggestions.

## When to use

- Performance profiling for hotspots or slow test suites
- Finding memory leaks and suggesting fixes
- Analyzing cyclomatic and cognitive complexity
- Detecting dead code and refactoring opportunities

## Quick start

```bash
# Install
npm install

# Build
npm run build

# Run server (dev)
npm run dev

# Start as MCP server
npm start

# Run tests
npm test
```

## Running with Continue

There is a `.continue` server entry at `.continue/mcpServers/mcp-optimist.yaml`.

```bash
# Use your Continue client or CLI to run the server
continue run --config .continue/mcpServers/mcp-optimist.yaml

# Or run directly
node dist/index.js
```

## Copilot prompt examples

- "Copilot, add a new tool `suggest_refactoring` that targets `src/utils` and produce an inline patch with suggested changes."
- "Copilot, produce a test harness to simulate heavy IO workloads and verify memory usage reporting for `optimize_memory`."
- "Copilot, create a performance profile example for `analyze_performance` and add sample metrics to fixtures for tests."

## Recommended usage patterns

- **CI integration**: Run `analyze_complexity` and `analyze_dependencies` in PR checks.
- **TDD**: Use `mcp-tdd` to enforce tests when refactoring suggested by `optimist`.
- **Iterative improvements**: Use Copilot to suggest small refactors, then run `optimize_hot_paths`.

## Helpful files & commands

- `optimist.config.json` - Configuration file you can customize
- `npm test` / `npm run build` - Standard dev workflow
- `.continue/mcpServers/mcp-optimist.yaml` - Continue config

---

_Use this file to guide Copilot-assisted edits and for `continue` execution._
