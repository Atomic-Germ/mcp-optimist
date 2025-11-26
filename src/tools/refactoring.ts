import { AnalysisResult, Finding, Suggestion } from '../types';
import { RefactoringAnalyzer, RefactoringOpportunity } from '../analyzers/refactoring-analyzer';

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
  async analyze(
    inputPath: string,
    options: {
      focusArea?: string;
      minPriority?: 'low' | 'medium' | 'high';
      maxResults?: number;
      excludeTypes?: string[];
    } = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];

    // Normalize and set defaults for options
    const focusArea = (
      ['performance', 'maintainability', 'readability', 'all'].includes(options.focusArea || '')
        ? options.focusArea
        : 'all'
    ) as 'performance' | 'maintainability' | 'readability' | 'all';

    const minPriority = options.minPriority || 'low';
    const maxResults = Math.min(options.maxResults || 50, 100); // Cap at 100
    const excludeTypes = new Set(options.excludeTypes || []);

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
          const result = await this.analyzer.analyzeRefactoring(filePath, focusArea);

          result.opportunities.forEach((opp) => {
            allOpportunities.push(opp);
          });
        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Apply filtering
      let filteredOpportunities = allOpportunities;

      // Filter by minimum priority
      if (minPriority !== 'low') {
        const priorityLevels: Record<'low' | 'medium' | 'high', number> = {
          low: 0,
          medium: 1,
          high: 2,
        };
        filteredOpportunities = filteredOpportunities.filter(
          (opp) =>
            priorityLevels[opp.priority] >= priorityLevels[minPriority as 'low' | 'medium' | 'high']
        );
      }

      // Filter by excluded types
      if (excludeTypes.size > 0) {
        filteredOpportunities = filteredOpportunities.filter((opp) => !excludeTypes.has(opp.type));
      }

      // Limit results
      if (filteredOpportunities.length > maxResults) {
        // Sort by priority (high first) and take top results
        const priorityOrder: Record<'low' | 'medium' | 'high', number> = {
          high: 2,
          medium: 1,
          low: 0,
        };
        filteredOpportunities.sort((a, b) => {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        filteredOpportunities = filteredOpportunities.slice(0, maxResults);
      }

      // Create findings and suggestions from filtered opportunities
      filteredOpportunities.forEach((opp) => {
        // Create finding
        findings.push({
          type: opp.type,
          severity: opp.priority === 'high' ? 'high' : opp.priority === 'medium' ? 'medium' : 'low',
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

      // Calculate metrics
      const metrics = {
        totalOpportunities: filteredOpportunities.length,
        filteredFrom: allOpportunities.length,
        byPriority: {
          high: filteredOpportunities.filter((o) => o.priority === 'high').length,
          medium: filteredOpportunities.filter((o) => o.priority === 'medium').length,
          low: filteredOpportunities.filter((o) => o.priority === 'low').length,
        },
        byType: this.groupByType(filteredOpportunities),
        focusArea,
        filters: {
          minPriority,
          maxResults,
          excludeTypes: Array.from(excludeTypes),
        },
      };

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'suggest_refactoring',
        data: {
          summary: this.generateSummary(
            filteredOpportunities,
            allOpportunities.length,
            focusArea,
            minPriority,
            maxResults
          ),
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

  private generateSummary(
    opportunities: RefactoringOpportunity[],
    totalFound: number,
    focusArea: string,
    minPriority: string,
    maxResults: number
  ): string {
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

    const filteringInfo =
      totalFound > opportunities.length
        ? ` (filtered from ${totalFound} total, min priority: ${minPriority}, max results: ${maxResults})`
        : '';

    return `Found ${opportunities.length} refactoring opportunity/opportunities (${parts.join(', ')}) focused on ${focusArea} improvements${filteringInfo}.`;
  }
}
