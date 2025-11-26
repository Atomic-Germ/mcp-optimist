import { AnalysisResult, Finding, Suggestion } from '../types';
import { DeadCodeAnalyzer, DeadCodeItem } from '../analyzers/dead-code-analyzer';

/**
 * Dead Code Detector - Identifies unused code elements
 */
export class DeadCodeDetector {
  private analyzer: DeadCodeAnalyzer;

  constructor() {
    this.analyzer = new DeadCodeAnalyzer();
  }

  /**
   * Analyze a file or directory for dead code
   */
  async analyze(inputPath: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];

    try {
      // Import ASTParser here to avoid circular dependency
      const { ASTParser } = await import('../analyzers/ast-parser');
      const parser = new ASTParser();

      // Expand the input path to get all files to analyze
      const filesToAnalyze = parser.expandPath(inputPath);

      if (filesToAnalyze.length === 0) {
        return {
          status: 'error',
          tool: 'find_dead_code',
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
      let totalDeadCode = 0;
      let unusedVariables = 0;
      let unusedFunctions = 0;
      let unusedImports = 0;
      const allDeadCode: DeadCodeItem[] = [];

      // Analyze each file
      for (const filePath of filesToAnalyze) {
        try {
          const analysis = this.analyzer.analyzeDeadCode(filePath);

          // Set file path for each dead code item
          const fileDeadCode = [
            ...analysis.unusedVariables.map(item => ({ ...item, file: filePath })),
            ...analysis.unusedFunctions.map(item => ({ ...item, file: filePath })),
            ...analysis.unusedImports.map(item => ({ ...item, file: filePath })),
          ];

          allDeadCode.push(...fileDeadCode);

          // Aggregate metrics
          totalDeadCode += analysis.totalDeadCode;
          unusedVariables += analysis.unusedVariables.length;
          unusedFunctions += analysis.unusedFunctions.length;
          unusedImports += analysis.unusedImports.length;

        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Convert dead code items to findings
      allDeadCode.forEach((item) => {
        findings.push({
          type: `UNUSED_${item.type.toUpperCase()}`,
          severity: this.getSeverityForDeadCode(item),
          location: {
            file: item.file,
            line: item.line,
          },
          message: item.reason,
          code: item.name,
        });

        // Add corresponding suggestion
        const suggestion = this.getSuggestionForDeadCode(item);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });

      // Deduplicate suggestions by type
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);

      const metrics = {
        totalDeadCode,
        unusedVariables,
        unusedFunctions,
        unusedImports,
      };

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'find_dead_code',
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
        tool: 'find_dead_code',
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

  private getSeverityForDeadCode(item: DeadCodeItem): Finding['severity'] {
    switch (item.type) {
      case 'variable':
        return 'low';
      case 'function':
        return 'medium';
      case 'import':
        return 'medium';
      case 'class':
        return 'high';
      case 'method':
        return 'medium';
      default:
        return 'low';
    }
  }

  private getSuggestionForDeadCode(item: DeadCodeItem): Suggestion | null {
    switch (item.type) {
      case 'variable':
        return {
          type: 'REMOVE_UNUSED_VARIABLE',
          priority: 'low',
          description: `Remove unused variable '${item.name}'`,
          example: `// Remove this line:\n// const ${item.name} = ...;`,
          impact: 'Reduces code clutter and potential confusion',
        };

      case 'function':
        return {
          type: 'REMOVE_UNUSED_FUNCTION',
          priority: 'medium',
          description: `Remove unused function '${item.name}' or export it if used elsewhere`,
          example: `// If not used elsewhere, remove:\n// function ${item.name}() { ... }\n\n// If used in other files, export:\n// export function ${item.name}() { ... }`,
          impact: 'Reduces bundle size and improves maintainability',
        };

      case 'import':
        return {
          type: 'REMOVE_UNUSED_IMPORT',
          priority: 'medium',
          description: `Remove unused import '${item.name}'`,
          example: `// Remove this import line:\n// import { ${item.name} } from 'module';`,
          impact: 'Reduces bundle size and cleans up dependencies',
        };

      case 'class':
        return {
          type: 'REMOVE_UNUSED_CLASS',
          priority: 'high',
          description: `Remove unused class '${item.name}' or export it if used elsewhere`,
          example: `// If not used elsewhere, remove the entire class\n// If used in other files, export:\n// export class ${item.name} { ... }`,
          impact: 'Significantly reduces bundle size and improves code organization',
        };

      case 'method':
        return {
          type: 'REMOVE_UNUSED_METHOD',
          priority: 'medium',
          description: `Remove unused method '${item.name}'`,
          example: `// Remove this method from the class:\n// ${item.name}() { ... }`,
          impact: 'Improves class maintainability and reduces complexity',
        };

      default:
        return null;
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
      return 'No dead code detected. All code elements appear to be used!';
    }

    const parts = [];
    if (metrics.unusedVariables > 0) parts.push(`${metrics.unusedVariables} unused variable(s)`);
    if (metrics.unusedFunctions > 0) parts.push(`${metrics.unusedFunctions} unused function(s)`);
    if (metrics.unusedImports > 0) parts.push(`${metrics.unusedImports} unused import(s)`);

    let summary = `Found ${findings.length} dead code item(s)`;
    if (parts.length > 0) {
      summary += `: ${parts.join(', ')}`;
    }

    summary += '. Removing dead code can reduce bundle size and improve maintainability.';

    return summary;
  }
}