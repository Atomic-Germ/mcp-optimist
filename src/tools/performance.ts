import { AnalysisResult, Finding, Suggestion } from '../types';
import { ASTParser } from '../analyzers/ast-parser';
import { PythonShell } from 'python-shell';
import path from 'path';

/**
 * Performance Analyzer - Identifies performance bottlenecks and inefficiencies
 */
export class PerformanceAnalyzer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  /**
   * Analyze a file for performance issues
   */
  async analyze(inputPath: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];
    const metrics: Record<string, any> = {
      totalFunctions: 0,
      totalLoops: 0,
      nestedLoops: 0,
      maxLoopDepth: 0,
    };

    try {
      // Expand the input path to get all files to analyze
      const filesToAnalyze = this.parser.expandPath(inputPath);

      if (filesToAnalyze.length === 0) {
        return {
          status: 'error',
          tool: 'analyze_performance',
          data: {
            summary: `No supported files found in: ${inputPath}`,
            findings: [],
            suggestions: [],
            metrics: {},
          },
          metadata: {
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            filesAnalyzed: 0,
          },
        };
      }

      // Analyze each file
      for (const filePath of filesToAnalyze) {
        try {
          let loops: any[] = [];
          let functions: any[] = [];
          let stringConcatIssues: any[] = [];

          if (filePath.endsWith('.py')) {
            // Analyze Python file
            const pythonAnalysis = await this.analyzePythonPerformance(filePath);
            loops = pythonAnalysis.loops;
            functions = pythonAnalysis.functions;
            stringConcatIssues = pythonAnalysis.stringConcatIssues;
          } else {
            const parseResult = this.parser.parseFile(filePath);
            const { ast } = parseResult;

            // Analyze loops
            loops = this.parser.findLoops(ast);
            // Analyze functions
            functions = this.parser.findFunctions(ast);
            // Detect string concatenation in loops
            stringConcatIssues = this.parser.findStringConcatenationInLoops(ast);
          }

          // Process loops
          metrics.totalLoops += loops.length;
          const fileMaxDepth = Math.max(...loops.map((l) => l.depth), 0);
          metrics.maxLoopDepth = Math.max(metrics.maxLoopDepth, fileMaxDepth);
          metrics.nestedLoops += loops.filter((l) => l.depth > 1).length;

          // Detect nested loops
          loops.forEach((loop) => {
            if (loop.depth >= 3) {
              findings.push({
                type: 'NESTED_LOOPS',
                severity: 'critical',
                location: {
                  file: filePath,
                  line: loop.line,
                  column: loop.column,
                },
                message: `Deeply nested loop detected (depth ${loop.depth}). This results in O(n^${loop.depth}) complexity.`,
                code: `${loop.type} loop`,
              });

              suggestions.push({
                type: 'OPTIMIZE_ALGORITHM',
                priority: 'high',
                description: `Reduce loop nesting from depth ${loop.depth}. Consider using more efficient algorithms or data structures.`,
                example:
                  'Use hash maps for lookups instead of nested loops, or consider streaming/chunking for large datasets.',
                impact: `Potential performance improvement: O(n^${loop.depth}) → O(n) or O(n log n)`,
              });
            } else if (loop.depth === 2) {
              findings.push({
                type: 'NESTED_LOOPS',
                severity: 'high',
                location: {
                  file: filePath,
                  line: loop.line,
                  column: loop.column,
                },
                message: `Nested loop detected (depth ${loop.depth}). Results in O(n^2) or quadratic complexity.`,
                code: `${loop.type} loop`,
              });

              suggestions.push({
                type: 'OPTIMIZE_ALGORITHM',
                priority: 'medium',
                description: `Consider optimizing nested loop at depth ${loop.depth}.`,
                example: 'Use Set or Map for O(1) lookups, or consider sorting and binary search.',
                impact: 'Potential improvement from O(n^2) to O(n) or O(n log n)',
              });
            }
          });

          // Analyze functions
          metrics.totalFunctions += functions.length;

          // Detect string concatenation in loops
          stringConcatIssues.forEach((issue) => {
            findings.push({
              type: 'INEFFICIENT_STRING_CONCAT',
              severity: 'medium',
              location: {
                file: filePath,
                line: issue.line,
              },
              message: `String concatenation in loop detected for variable '${issue.variable}'. This creates a new string on each iteration.`,
              code: `${issue.variable} += ...`,
            });

            suggestions.push({
              type: 'USE_ARRAY_JOIN',
              priority: 'medium',
              description: 'Use array join instead of string concatenation in loops',
              example: 'Instead of: str += item\nUse: items.push(item); str = items.join("")',
              impact:
                'Reduces memory allocations and improves performance significantly for large strings',
            });
          });
        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Deduplicate suggestions by type
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);

      // Add general suggestion if no specific issues found
      if (findings.length === 0) {
        uniqueSuggestions.push({
          type: 'GENERAL',
          priority: 'low',
          description: 'No significant performance issues detected. Code appears well-optimized.',
          impact: 'Continue monitoring performance as codebase grows.',
        });
      }

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'analyze_performance',
        data: {
          summary: this.generateSummary(findings, metrics),
          findings,
          suggestions: uniqueSuggestions,
          metrics,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          filesAnalyzed: filesToAnalyze.length,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        status: 'error',
        tool: 'analyze_performance',
        data: {
          summary: `Error analyzing path: ${errorMessage}`,
          findings: [],
          suggestions: [],
          metrics: {},
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration,
          filesAnalyzed: 0,
        },
      };
    }
  }

  private deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();
    return suggestions.filter((suggestion) => {
      const key = `${suggestion.type}-${suggestion.description}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private generateSummary(findings: Finding[], metrics: Record<string, any>): string {
    if (findings.length === 0) {
      return `Performance analysis complete. Analyzed ${metrics.totalFunctions} functions and ${metrics.totalLoops} loops. No critical issues found.`;
    }

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;

    let summary = `Found ${findings.length} performance issue(s): `;
    const parts = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (high > 0) parts.push(`${high} high`);
    if (medium > 0) parts.push(`${medium} medium`);
    summary += parts.join(', ');

    if (metrics.maxLoopDepth >= 3) {
      summary += `. Maximum loop depth: ${metrics.maxLoopDepth} (consider refactoring)`;
    }

    return summary;
  }
  private analyzePythonPerformance(filePath: string): Promise<{
    loops: any[];
    functions: any[];
    stringConcatIssues: any[];
  }> {
    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, '../python/performance_analyzer.py');
      const absoluteFilePath = path.resolve(filePath);

      const pyshell = new PythonShell(scriptPath, {
        args: [absoluteFilePath],
        mode: 'text',
        pythonPath: 'python3',
      });

      let output = '';
      pyshell.on('message', (message) => {
        output += message;
      });

      pyshell.on('close', () => {
        try {
          const data = JSON.parse(output.trim());
          resolve(data);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          resolve({
            loops: [],
            functions: [],
            stringConcatIssues: [],
          });
        }
      });

      pyshell.on('error', () => {
        resolve({
          loops: [],
          functions: [],
          stringConcatIssues: [],
        });
      });
    });
  }
}
