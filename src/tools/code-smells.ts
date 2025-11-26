import { AnalysisResult, Finding, Suggestion } from '../types';
import { QualityAnalyzer, CodeSmell } from '../analyzers/quality-analyzer';
import { ASTParser } from '../analyzers/ast-parser';

/**
 * Code Smell Detector - Identifies anti-patterns and code quality issues
 */
export class CodeSmellDetector {
  private analyzer: QualityAnalyzer;
  private parser: ASTParser;

  constructor() {
    this.analyzer = new QualityAnalyzer();
    this.parser = new ASTParser();
  }

  /**
   * Analyze a file for code smells
   */
  async analyze(inputPath: string, options: { severity?: string } = {}): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];

    try {
      // Expand the input path to get all files to analyze
      const filesToAnalyze = this.parser.expandPath(inputPath);

      if (filesToAnalyze.length === 0) {
        return {
          status: 'error',
          tool: 'detect_code_smells',
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
      let totalSmells = 0;
      let classesAnalyzed = 0;
      let largeClasses = 0;
      let functionsAnalyzed = 0;
      let longFunctions = 0;
      let godObjects = 0;
      let longParameterLists = 0;
      let longMethods = 0;
      let magicNumbers = 0;
      let emptyCatches = 0;

      // Analyze each file
      for (const filePath of filesToAnalyze) {
        try {
          const analysis = this.analyzer.analyzeQuality(filePath).smells;

          // Process all smell types
          const allSmells = [
            ...analysis.godObjects,
            ...analysis.longParameterLists,
            ...analysis.longMethods,
            ...analysis.magicNumbers,
            ...analysis.emptyCatches,
          ];

          // Filter by severity if specified
          const filteredSmells = options.severity
            ? allSmells.filter((smell) => this.matchesSeverity(smell.severity, options.severity!))
            : allSmells;

          // Convert smells to findings
          filteredSmells.forEach((smell) => {
            findings.push({
              type: smell.type,
              severity: smell.severity,
              location: {
                file: filePath,
                line: smell.line,
              },
              message: smell.description,
            });

            // Add corresponding suggestion
            const suggestion = this.getSuggestionForSmell(smell);
            if (suggestion) {
              suggestions.push(suggestion);
            }
          });

          // Aggregate metrics
          totalSmells += allSmells.length;
          classesAnalyzed += analysis.classMetrics.total;
          largeClasses += analysis.classMetrics.large;
          functionsAnalyzed += analysis.functionMetrics.total;
          longFunctions += analysis.functionMetrics.long;
          godObjects += analysis.godObjects.length;
          longParameterLists += analysis.longParameterLists.length;
          longMethods += analysis.longMethods.length;
          magicNumbers += analysis.magicNumbers.length;
          emptyCatches += analysis.emptyCatches.length;
        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Deduplicate suggestions by type
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);

      const metrics = {
        totalSmells,
        classesAnalyzed,
        largeClasses,
        functionsAnalyzed,
        longFunctions,
        godObjects,
        longParameterLists,
        longMethods,
        magicNumbers,
        emptyCatches,
      };

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'detect_code_smells',
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
        tool: 'detect_code_smells',
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

  private matchesSeverity(smellSeverity: string, filterSeverity: string): boolean {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const smellLevel = severityLevels.indexOf(smellSeverity);
    const filterLevel = severityLevels.indexOf(filterSeverity);
    return smellLevel >= filterLevel;
  }

  private getSuggestionForSmell(smell: CodeSmell): Suggestion | null {
    switch (smell.type) {
      case 'GOD_OBJECT':
        return {
          type: 'SPLIT_RESPONSIBILITIES',
          priority: 'high',
          description:
            'Split class into smaller, focused classes following Single Responsibility Principle',
          example:
            '// Instead of one UserManager:\nclass UserService { /* user operations */ }\nclass ProductService { /* product operations */ }\nclass OrderService { /* order operations */ }',
          impact: 'Improves maintainability, testability, and reduces coupling',
        };

      case 'LONG_PARAMETER_LIST':
        return {
          type: 'USE_PARAMETER_OBJECT',
          priority: 'medium',
          description:
            'Replace long parameter list with a parameter object or configuration object',
          example:
            '// Before:\nfunction create(a, b, c, d, e, f) {}\n\n// After:\nfunction create(options) {\n  const { a, b, c, d, e, f } = options;\n}',
          impact: 'Easier to call, extend, and maintain',
        };

      case 'LONG_METHOD':
        return {
          type: 'EXTRACT_METHOD',
          priority: 'medium',
          description: 'Break down long method into smaller, focused functions',
          example:
            '// Extract logical blocks:\nfunction process() {\n  validate();\n  transform();\n  save();\n}\n\nfunction validate() { /* ... */ }\nfunction transform() { /* ... */ }',
          impact: 'Improves readability and reusability',
        };

      case 'MAGIC_NUMBER':
        return {
          type: 'USE_NAMED_CONSTANT',
          priority: 'low',
          description: 'Replace magic numbers with named constants',
          example:
            '// Before:\nif (age > 18) {}\n\n// After:\nconst ADULT_AGE = 18;\nif (age > ADULT_AGE) {}',
          impact: 'Makes code self-documenting and easier to maintain',
        };

      case 'EMPTY_CATCH':
        return {
          type: 'HANDLE_ERRORS_PROPERLY',
          priority: 'high',
          description: 'Handle errors explicitly or at minimum log them',
          example:
            'try {\n  risky();\n} catch (error) {\n  console.error("Operation failed:", error);\n  // or re-throw: throw error;\n}',
          impact: 'Prevents silent failures and aids debugging',
        };

      default:
        return null;
    }
  }

  private deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();
    return suggestions.filter((s) => {
      if (seen.has(s.type)) return false;
      seen.add(s.type);
      return true;
    });
  }

  private generateSummary(findings: Finding[], metrics: Record<string, any>): string {
    if (findings.length === 0) {
      return 'No code smells detected. Code quality looks good!';
    }

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;
    const low = findings.filter((f) => f.severity === 'low').length;

    let summary = `Found ${findings.length} code smell(s): `;
    const parts = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (high > 0) parts.push(`${high} high`);
    if (medium > 0) parts.push(`${medium} medium`);
    if (low > 0) parts.push(`${low} low`);
    summary += parts.join(', ');

    // Add specific metrics
    const details = [];
    if (metrics.godObjects > 0) details.push(`${metrics.godObjects} god object(s)`);
    if (metrics.longParameterLists > 0)
      details.push(`${metrics.longParameterLists} long parameter list(s)`);
    if (metrics.emptyCatches > 0) details.push(`${metrics.emptyCatches} empty catch block(s)`);

    if (details.length > 0) {
      summary += '. Includes: ' + details.join(', ');
    }

    return summary;
  }
}
