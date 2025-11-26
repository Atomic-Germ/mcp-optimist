import { OptimistConfig, ServerInfo, Tool } from './types';

/**
 * Default configuration for Optimist server
 */
const DEFAULT_CONFIG: Required<OptimistConfig> = {
  maxComplexity: 10,
  analysisDepth: 'medium',
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
  fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py'],
  enabledTools: 'all',
};

/**
 * OptimistServer - Main MCP server implementation
 */
export class OptimistServer {
  public readonly name = 'optimist';
  public readonly version = '0.1.0';
  private readonly protocolVersion = '2024-11-05';
  public readonly config: Required<OptimistConfig>;

  constructor(config: OptimistConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get server information
   */
  getServerInfo(): ServerInfo {
    return {
      name: this.name,
      version: this.version,
      protocolVersion: this.protocolVersion,
    };
  }

  /**
   * List available tools
   */
  listTools(): Tool[] {
    const tools: Tool[] = [
      {
        name: 'analyze_performance',
        description: 'Analyze code performance and identify bottlenecks',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
            includeTests: { type: 'boolean', description: 'Include test files', default: false },
            threshold: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Alert threshold',
              default: 'medium',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'optimize_memory',
        description: 'Detect memory leaks and suggest memory-efficient patterns',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
            detectLeaks: { type: 'boolean', description: 'Check for memory leaks', default: true },
            suggestFixes: {
              type: 'boolean',
              description: 'Provide fix suggestions',
              default: true,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'analyze_complexity',
        description: 'Evaluate cyclomatic and cognitive complexity',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
            maxComplexity: { type: 'number', description: 'Maximum allowed complexity' },
            reportFormat: {
              type: 'string',
              enum: ['summary', 'detailed', 'json'],
              default: 'summary',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'detect_code_smells',
        description: 'Identify anti-patterns and code quality issues',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Minimum severity to report',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'analyze_dependencies',
        description: 'Map and analyze dependency graphs',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Project root path' },
            checkCircular: {
              type: 'boolean',
              description: 'Detect circular dependencies',
              default: true,
            },
            suggestUpdates: {
              type: 'boolean',
              description: 'Suggest dependency updates',
              default: false,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'find_dead_code',
        description: 'Identify and locate unused code',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
          },
          required: ['path'],
        },
      },
      {
        name: 'optimize_hot_paths',
        description: 'Analyze and optimize frequently executed code paths',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
            profilingData: { type: 'string', description: 'Path to profiling data (optional)' },
          },
          required: ['path'],
        },
      },
      {
        name: 'suggest_refactoring',
        description: 'Provide AI-powered refactoring recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path to analyze' },
            focusArea: {
              type: 'string',
              enum: ['performance', 'maintainability', 'readability', 'all'],
              default: 'all',
              description: 'Focus area for refactoring suggestions',
            },
            minPriority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'low',
              description:
                'Minimum priority level for suggestions (filters out lower priority items)',
            },
            maxResults: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              default: 50,
              description: 'Maximum number of suggestions to return',
            },
            excludeTypes: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Types of refactoring suggestions to exclude (e.g., ["LONG_FUNCTION", "COMPLEX_CONDITION"])',
            },
          },
          required: ['path'],
        },
      },
    ];

    return tools;
  }
}
