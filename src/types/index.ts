/**
 * Configuration options for Optimist server
 */
export interface OptimistConfig {
  maxComplexity?: number;
  analysisDepth?: 'shallow' | 'medium' | 'deep';
  ignorePatterns?: string[];
  fileExtensions?: string[];
  enabledTools?: string[] | 'all';
}

/**
 * Server information
 */
export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

/**
 * Analysis result structure
 */
export interface AnalysisResult {
  status: 'success' | 'error';
  tool: string;
  data: {
    summary: string;
    findings: Finding[];
    suggestions: Suggestion[];
    metrics: Record<string, any>;
  };
  metadata: {
    timestamp: string;
    duration: number;
    filesAnalyzed: number;
    filesProcessed?: number;
    parseErrors?: any[];
  };
}

/**
 * Finding structure
 */
export interface Finding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  message: string;
  code?: string;
}

/**
 * Suggestion structure
 */
export interface Suggestion {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  example?: string;
  impact?: string;
}

/**
 * Tool argument interfaces
 */
export interface AnalyzePerformanceArgs {
  path: string;
  includeTests?: boolean;
  threshold?: 'low' | 'medium' | 'high';
}

export interface OptimizeMemoryArgs {
  path: string;
  detectLeaks?: boolean;
  suggestFixes?: boolean;
}

export interface AnalyzeComplexityArgs {
  path: string;
  maxComplexity?: number;
  reportFormat?: 'summary' | 'detailed' | 'json';
}

export interface DetectCodeSmellsArgs {
  path: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SuggestRefactoringArgs {
  path: string;
  focusArea?: string;
  minPriority?: 'low' | 'medium' | 'high';
  maxResults?: number;
  excludeTypes?: string[];
}
