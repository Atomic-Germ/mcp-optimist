#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OptimistServer } from './server.js';
import { PerformanceAnalyzer } from './tools/performance.js';
import { MemoryOptimizer } from './tools/memory.js';
import { ComplexityAnalyzer } from './tools/complexity.js';

/**
 * Main entry point for the Optimist MCP server
 */
async function main() {
  const optimist = new OptimistServer();
  const performanceAnalyzer = new PerformanceAnalyzer();
  const memoryOptimizer = new MemoryOptimizer();
  const complexityAnalyzer = new ComplexityAnalyzer();
  
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
          const path = (args as any).path;
          if (!path) {
            throw new Error('Missing required argument: path');
          }
          const result = await performanceAnalyzer.analyze(path);
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
          const path = (args as any).path;
          if (!path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            detectLeaks: (args as any).detectLeaks,
            suggestFixes: (args as any).suggestFixes,
          };
          const result = await memoryOptimizer.analyze(path, options);
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
          const path = (args as any).path;
          if (!path) {
            throw new Error('Missing required argument: path');
          }
          const options = {
            maxComplexity: (args as any).maxComplexity,
            reportFormat: (args as any).reportFormat,
          };
          const result = await complexityAnalyzer.analyze(path, options);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          // Tool implementations will be added in future TDD cycles
          return {
            content: [
              {
                type: 'text',
                text: `Tool '${name}' implementation pending. Arguments received: ${JSON.stringify(args, null, 2)}`,
              },
            ],
          };
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
