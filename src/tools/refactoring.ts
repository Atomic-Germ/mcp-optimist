import { AnalysisResult, Finding, Suggestion } from '../types';
import { RefactoringAnalyzer } from '../analyzers/refactoring-analyzer';

interface RefactoringOpportunity {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  location: {
    file: string;
    line?: number;
  };
  suggestion: string;
  impact: string;
  example?: string;
}

/**
 * Refactoring Suggester - Provides AI-powered refactoring recommendations
 */
export class RefactoringSuggester {
  private analyzer: RefactoringAnalyzer;

  constructor() {
    this.analyzer = new RefactoringAnalyzer();
  }

  /**
   * Analyze a file or directory for refactoring opportunities
   */
  async analyze(inputPath: string, options: { focusArea?: string } = {}): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];
    // Normalize focusArea with fallback to 'all' for invalid values
    const focusArea = (
      ['performance', 'maintainability', 'readability', 'all'].includes(options.focusArea || '')
        ? options.focusArea
        : 'all'
    ) as 'performance' | 'maintainability' | 'readability' | 'all';

    try {
      // Import ASTParser here to avoid circular dependency
      const { ASTParser } = await import('../analyzers/ast-parser');
      const parser = new ASTParser();

      // Expand the input path to get all files to analyze
      const filesToAnalyze = parser.expandPath(inputPath);

      if (filesToAnalyze.length === 0) {
        return {
          status: 'error',
          tool: 'suggest_refactoring',
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
      const allOpportunities: RefactoringOpportunity[] = [];
      for (const filePath of filesToAnalyze) {
        try {
          const result = this.analyzer.analyzeRefactoring(filePath, focusArea);

          result.opportunities.forEach((opp) => {
            allOpportunities.push(opp);

            // Create finding
            findings.push({
              type: opp.type,
              severity:
                opp.priority === 'high' ? 'high' : opp.priority === 'medium' ? 'medium' : 'low',
              location: opp.location,
              message: opp.description,
              code: opp.type,
            });

            // Create suggestion
            suggestions.push({
              type: opp.type,
              priority: opp.priority,
              description: opp.suggestion,
              example: opp.example,
              impact: opp.impact,
            });
          });

        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Calculate metrics
      const metrics = {
        totalOpportunities: allOpportunities.length,
        byPriority: {
          high: allOpportunities.filter((o) => o.priority === 'high').length,
          medium: allOpportunities.filter((o) => o.priority === 'medium').length,
          low: allOpportunities.filter((o) => o.priority === 'low').length,
        },
        byType: this.groupByType(allOpportunities),
        focusArea,
      };

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'suggest_refactoring',
        data: {
          summary: this.generateSummary(allOpportunities, focusArea),
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
        tool: 'suggest_refactoring',
        data: {
          summary: `Error analyzing files: ${errorMessage}`,
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

  private groupByType(opportunities: RefactoringOpportunity[]): Record<string, number> {
    const groups: Record<string, number> = {};

    opportunities.forEach((opp) => {
      groups[opp.type] = (groups[opp.type] || 0) + 1;
    });

    return groups;
  }

  private generateSummary(opportunities: RefactoringOpportunity[], focusArea: string): string {
    if (opportunities.length === 0) {
      return `Refactoring analysis complete (focus: ${focusArea}). No refactoring opportunities identified. Code is well-structured!`;
    }

    const high = opportunities.filter((o) => o.priority === 'high').length;
    const medium = opportunities.filter((o) => o.priority === 'medium').length;
    const low = opportunities.filter((o) => o.priority === 'low').length;

    const parts = [];
    if (high > 0) parts.push(`${high} high-priority`);
    if (medium > 0) parts.push(`${medium} medium-priority`);
    if (low > 0) parts.push(`${low} low-priority`);

    return `Found ${opportunities.length} refactoring opportunity/opportunities (${parts.join(', ')}) focused on ${focusArea} improvements.`;
  }
}
