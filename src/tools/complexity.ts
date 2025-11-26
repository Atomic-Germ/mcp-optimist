import { AnalysisResult, Finding, Suggestion } from '../types';
import { ComplexityAnalyzer as CyclomaticCognitiveComplexityAnalyzer } from '../analyzers/complexity-analyzer';

/**
 * Complexity Analyzer - Measures cyclomatic and cognitive complexity
 * (Ironically named to emphasize the complexity of complexity analysis!)
 */
export class ComplexityAnalyzer {
  private analyzer: CyclomaticCognitiveComplexityAnalyzer;

  constructor() {
    this.analyzer = new CyclomaticCognitiveComplexityAnalyzer();
  }

  /**
   * Analyze a file for complexity issues
   */
  async analyze(
    inputPath: string,
    options: { maxComplexity?: number; reportFormat?: string } = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];
    const maxComplexity = options.maxComplexity || 10;

    try {
      // Import ASTParser here to avoid circular dependency
      const { ASTParser } = await import('../analyzers/ast-parser');
      const parser = new ASTParser();

      // Expand the input path to get all files to analyze
      const filesToAnalyze = parser.expandPath(inputPath);

      if (filesToAnalyze.length === 0) {
        return {
          status: 'error',
          tool: 'analyze_complexity',
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

      // Aggregate metrics across all files
      let totalFunctions = 0;
      let totalCyclomatic = 0;
      let maxComplexityOverall = 0;
      let totalCognitive = 0;
      let totalDecisionPoints = 0;
      let mostComplexFunction = '';
      let mostComplexFile = '';
      const allFunctions: any[] = [];

      // Analyze each file
      for (const filePath of filesToAnalyze) {
        try {
          const analysis = this.analyzer.analyzeComplexity(filePath);

          // Aggregate metrics
          totalFunctions += analysis.totalFunctions;
          totalCyclomatic += analysis.averageComplexity * analysis.totalFunctions;
          maxComplexityOverall = Math.max(maxComplexityOverall, analysis.maxComplexity);
          totalCognitive += analysis.averageCognitive * analysis.totalFunctions;
          totalDecisionPoints += analysis.totalDecisionPoints;

          // Track most complex function
          if (analysis.maxComplexity > maxComplexityOverall) {
            mostComplexFunction = analysis.mostComplexFunction || '';
            mostComplexFile = filePath;
          }

          // Collect all functions for detailed analysis
          analysis.functions.forEach((func) => {
            allFunctions.push({ ...func, file: filePath });
          });
        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Calculate averages
      const averageComplexity = totalFunctions > 0 ? totalCyclomatic / totalFunctions : 0;
      const averageCognitive = totalFunctions > 0 ? totalCognitive / totalFunctions : 0;

      const metrics: Record<string, any> = {
        totalFunctions,
        averageComplexity: Math.round(averageComplexity * 100) / 100,
        maxComplexity: maxComplexityOverall,
        averageCognitive: Math.round(averageCognitive * 100) / 100,
        totalDecisionPoints,
        mostComplexFunction: mostComplexFunction || 'N/A',
        mostComplexFile,
      };

      // Analyze each function for findings
      allFunctions.forEach((func) => {
        // Check cyclomatic complexity
        if (func.cyclomatic > maxComplexity * 2) {
          findings.push({
            type: 'HIGH_CYCLOMATIC_COMPLEXITY',
            severity: 'critical',
            location: {
              file: func.file,
              line: func.line,
            },
            message: `Function '${func.name}' has very high cyclomatic complexity (${func.cyclomatic}). Recommended max: ${maxComplexity}.`,
            code: func.name,
          });

          suggestions.push({
            type: 'BREAK_DOWN_FUNCTION',
            priority: 'high',
            description: `Break down '${func.name}' into smaller, focused functions`,
            example:
              '// Extract complex logic into separate functions:\nfunction validate() {\n  if (!checkA()) return false;\n  if (!checkB()) return false;\n  return true;\n}\n\nfunction checkA() { /* ... */ }\nfunction checkB() { /* ... */ }',
            impact: `Reducing complexity from ${func.cyclomatic} to ~${Math.ceil(func.cyclomatic / 3)} per function improves testability and maintainability`,
          });
        } else if (func.cyclomatic > maxComplexity) {
          findings.push({
            type: 'HIGH_CYCLOMATIC_COMPLEXITY',
            severity: 'high',
            location: {
              file: func.file,
              line: func.line,
            },
            message: `Function '${func.name}' has high cyclomatic complexity (${func.cyclomatic}). Recommended max: ${maxComplexity}.`,
            code: func.name,
          });

          suggestions.push({
            type: 'REFACTOR_FUNCTION',
            priority: 'medium',
            description: `Refactor '${func.name}' to reduce complexity`,
            example:
              'Consider using early returns, extracting methods, or simplifying conditional logic',
            impact: 'Makes code easier to test, understand, and maintain',
          });
        }

        // Check cognitive complexity
        if (func.cognitive > maxComplexity * 1.5) {
          findings.push({
            type: 'HIGH_COGNITIVE_COMPLEXITY',
            severity: 'high',
            location: {
              file: func.file,
              line: func.line,
            },
            message: `Function '${func.name}' has high cognitive complexity (${func.cognitive}). This makes it hard to understand.`,
            code: func.name,
          });

          suggestions.push({
            type: 'REDUCE_COGNITIVE_LOAD',
            priority: 'high',
            description: 'Reduce cognitive complexity by simplifying control flow',
            example:
              '// Use early returns:\nif (!valid) return error;\nif (!ready) return pending;\nreturn success;\n\n// Instead of nested ifs',
            impact: 'Significantly improves code readability and comprehension',
          });
        }

        // Check nesting depth
        if (func.nestingDepth > 4) {
          findings.push({
            type: 'HIGH_NESTING_DEPTH',
            severity: 'medium',
            location: {
              file: func.file,
              line: func.line,
            },
            message: `Function '${func.name}' has deep nesting (depth ${func.nestingDepth}). Consider flattening.`,
            code: func.name,
          });

          suggestions.push({
            type: 'REDUCE_NESTING',
            priority: 'medium',
            description: 'Flatten nested conditions using guard clauses',
            example:
              '// BAD:\nif (a) {\n  if (b) {\n    if (c) {\n      doWork();\n    }\n  }\n}\n\n// GOOD:\nif (!a) return;\nif (!b) return;\nif (!c) return;\ndoWork();',
            impact: 'Improves readability and reduces cognitive load',
          });
        }
      });

      // Add positive feedback for simple code
      if (findings.length === 0) {
        suggestions.push({
          type: 'GENERAL',
          priority: 'low',
          description:
            'Code complexity is well-managed. All functions are within acceptable limits.',
          impact: 'Maintain current practices for readable, maintainable code',
        });
      }

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'analyze_complexity',
        data: {
          summary: this.generateSummary(findings, metrics),
          findings,
          suggestions,
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
        tool: 'analyze_complexity',
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

  private generateSummary(findings: Finding[], metrics: Record<string, any>): string {
    if (findings.length === 0) {
      return `Complexity analysis complete. Analyzed ${metrics.totalFunctions} function(s). Average complexity: ${metrics.averageComplexity}. No issues found.`;
    }

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;

    let summary = `Found ${findings.length} complexity issue(s): `;
    const parts = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (high > 0) parts.push(`${high} high`);
    if (medium > 0) parts.push(`${medium} medium`);
    summary += parts.join(', ');

    summary += `. Max complexity: ${metrics.maxComplexity} (function: ${metrics.mostComplexFunction})`;

    return summary;
  }
}
