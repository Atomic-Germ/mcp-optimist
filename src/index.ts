#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { OptimistServer } from './server.js';
import { PerformanceAnalyzer } from './tools/performance.js';
import { MemoryOptimizer } from './tools/memory.js';
import { ComplexityAnalyzer } from './tools/complexity.js';
import { CodeSmellDetector } from './tools/code-smells.js';
import { RefactoringSuggester } from './tools/refactoring.js';
import { DeadCodeDetector } from './tools/dead-code.js';
import { DependenciesAnalyzer } from './tools/dependencies.js';

/**
 * Main entry point for the Optimist MCP server
 */
async function main() {
  const optimist = new OptimistServer();
  const performanceAnalyzer = new PerformanceAnalyzer();
  const memoryOptimizer = new MemoryOptimizer();
  const complexityAnalyzer = new ComplexityAnalyzer();
  const codeSmellDetector = new CodeSmellDetector();
  const refactoringSuggester = new RefactoringSuggester();
  const deadCodeDetector = new DeadCodeDetector();
  const dependenciesAnalyzer = new DependenciesAnalyzer();

  const server = new Server(
    {
      name: optimist.name,
      version: optimist.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = optimist.listTools();
    return { tools };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'analyze_performance': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const result = await performanceAnalyzer.analyze(toolArgs.path);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'optimize_memory': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            detectLeaks: toolArgs.detectLeaks,
            suggestFixes: toolArgs.suggestFixes,
          };
          const result = await memoryOptimizer.analyze(toolArgs.path, options);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'analyze_complexity': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            maxComplexity: toolArgs.maxComplexity,
            reportFormat: toolArgs.reportFormat,
          };
          const result = await complexityAnalyzer.analyze(toolArgs.path, options);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'detect_code_smells': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            severity: toolArgs.severity,
          };
          const result = await codeSmellDetector.analyze(toolArgs.path, options);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'suggest_refactoring': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            focusArea: toolArgs.focusArea,
          };
          const result = await refactoringSuggester.analyze(toolArgs.path, options);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'analyze_dependencies': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            checkCircular: toolArgs.checkCircular,
            suggestUpdates: toolArgs.suggestUpdates,
          };
          const result = await dependenciesAnalyzer.analyze(toolArgs.path, options);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'find_dead_code': {
          const toolArgs = args as any;
          if (!toolArgs.path) {
            throw new Error('Missing required argument: path');
          }
          const result = await deadCodeDetector.analyze(toolArgs.path);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default: {
          return {
            content: [
              {
                type: 'text',
                text: `Tool '${name}' implementation pending. Arguments received: ${JSON.stringify(args, null, 2)}`,
              },
            ],
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool '${name}': ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Optimist MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
