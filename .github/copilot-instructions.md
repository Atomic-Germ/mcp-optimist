# Copilot Instructions for MCP Optimist

## Project Overview

MCP Optimist is a Model Context Protocol server that analyzes and optimizes codebases across performance, memory, complexity, and code quality dimensions. It provides 8 analysis tools for static code analysis.

**Supported Languages**: Primarily JavaScript and TypeScript (via Babel AST parsing). Python support added for complexity, performance, refactoring, and dependency analysis.

Key architecture:

- `src/server.ts`: Main MCP server with tool definitions
- `src/analyzers/`: Core analysis engines (AST parsing, complexity, memory, smells)
- `src/tools/`: MCP tool implementations
- Built with TypeScript, uses pnpm, Jest, ESLint, Prettier

## Development Workflows

- **Install**: `pnpm install`
- **Build**: `pnpm build` (compiles to dist/)
- **Test**: `pnpm test` (Jest with coverage)
- **Dev**: `pnpm run dev` (ts-node for development)
- **Lint**: `pnpm run lint` (ESLint + Prettier)
- **Format**: `pnpm run format`

Follow TDD: write tests first in `tests/unit/`, then implement in `src/`.

## Project Conventions

- **Complexity**: Keep functions under 10 cyclomatic complexity (use `src/analyzers/complexity-analyzer.ts` to check)
- **Linting**: Use `void _e;` for unused catch variables to satisfy @typescript-eslint/no-unused-vars
- **Commits**: Use conventional commits (feat:, fix:, refactor:, test:, perf:)
- **Branching**: Feature branches for changes, propose non-trivial moves in `CLEANUP_PROPOSAL.md`
- **AI Tasks**: Use todo tracking for multi-step changes, create CLEANUP_PROPOSAL.md for reorganizations

## Adding New Features

1. Write failing tests first in `tests/unit/`
2. Implement analyzer in `src/analyzers/`
3. Add tool in `src/tools/`
4. Register in `src/server.ts`
5. Update types in `src/types/`

Example: Adding a new analyzer

```typescript
// tests/unit/analyzers/new-analyzer.test.ts
describe('NewAnalyzer', () => {
  it('should analyze correctly', () => {
    // test
  });
});

// src/analyzers/new-analyzer.ts
export class NewAnalyzer {
  analyze(code: string) {
    // implementation
  }
}
```

## Integration Points

- MCP protocol via `@modelcontextprotocol/sdk`
- AST parsing with `@babel/parser` and `@babel/traverse`
- Configuration via `optimist.config.json`
- Test fixtures in `tests/fixtures/` for realistic examples

Reference: `ARCHITECTURE.md`, `CONTRIBUTING.md`, `README.md` for detailed docs; update as project evolves.
