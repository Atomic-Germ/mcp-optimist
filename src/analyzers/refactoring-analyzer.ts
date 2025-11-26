import * as fs from 'fs';
import { PythonShell } from 'python-shell';
import path from 'path';

export interface RefactoringOpportunity {
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
 * Refactoring Analyzer - Identifies code patterns that could be improved
 */
export class RefactoringAnalyzer {
  constructor() {}

  /**
   * Analyze code for refactoring opportunities
   */
  async analyzeRefactoring(
    filePath: string,
    focusArea: 'performance' | 'maintainability' | 'readability' | 'all' = 'all'
  ): Promise<{
    opportunities: RefactoringOpportunity[];
    totalOpportunities: number;
    priorityBreakdown: Record<string, number>;
    focusArea: string;
  }> {
    const opportunities: RefactoringOpportunity[] = [];
    // Default to 'all' for invalid focus areas
    const validFocusArea = ['performance', 'maintainability', 'readability', 'all'].includes(
      focusArea
    )
      ? focusArea
      : 'all';

    try {
      if (filePath.endsWith('.py')) {
        return await this.analyzePythonRefactoring(filePath, validFocusArea);
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Analyze for different refactoring opportunities based on focus area
      if (validFocusArea === 'all' || validFocusArea === 'performance') {
        this.findPerformanceOpportunities(lines, filePath, opportunities);
      }

      if (validFocusArea === 'all' || validFocusArea === 'maintainability') {
        this.findMaintainabilityOpportunities(lines, filePath, opportunities);
      }

      if (validFocusArea === 'all' || validFocusArea === 'readability') {
        this.findReadabilityOpportunities(lines, filePath, opportunities);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Return empty opportunities on error
    }

    return {
      opportunities,
      totalOpportunities: opportunities.length,
      priorityBreakdown: this.countByPriority(opportunities),
      focusArea: validFocusArea,
    };
  }

  private findPerformanceOpportunities(
    lines: string[],
    filePath: string,
    opportunities: RefactoringOpportunity[]
  ): void {
    lines.forEach((line, index) => {
      // Check for inefficient loops
      if (/for\s*\(\s*let\s+\w+\s*=\s*0;/.test(line) && /\.length/g.test(line)) {
        opportunities.push({
          type: 'INEFFICIENT_LOOP',
          description: 'Loop condition accesses array.length on each iteration',
          priority: 'medium',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Cache array length before loop: const len = arr.length;',
          impact: 'Reduces property access overhead in tight loops',
          example:
            '// Bad\nfor (let i = 0; i < arr.length; i++) { }\n\n// Good\nconst len = arr.length;\nfor (let i = 0; i < len; i++) { }',
        });
      }

      // Check for repeated calculations in conditions
      if (/if\s*\([^)]*\s*\+\s*[^)]*\s*[<>=]/.test(line)) {
        opportunities.push({
          type: 'REPEATED_CALCULATION',
          description: 'Arithmetic expression evaluated in condition',
          priority: 'low',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Pre-calculate values before the condition',
          impact: 'Improves code clarity and may improve performance',
        });
      }

      // Check for nested loops that could be optimized
      if (/for\s*\(.*for\s*\(/.test(line)) {
        opportunities.push({
          type: 'NESTED_LOOPS',
          description: 'Nested loop detected - potential O(n²) complexity',
          priority: 'high',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Consider using a Set or Map for O(n log n) or O(n) complexity',
          impact: 'Significant performance improvement for large datasets',
        });
      }
    });
  }

  private findMaintainabilityOpportunities(
    lines: string[],
    filePath: string,
    opportunities: RefactoringOpportunity[]
  ): void {
    // Check for long functions (rough heuristic)
    let functionStart = -1;
    let braceCount = 0;

    lines.forEach((line, index) => {
      if (/function\s+\w+\s*\(|^\s*(async\s+)?function\s*\(|=>\s*\{/.test(line)) {
        functionStart = index;
        braceCount = 0;
      }

      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (functionStart !== -1 && braceCount === 0 && line.includes('}')) {
        const functionLength = index - functionStart;

        if (functionLength > 30) {
          opportunities.push({
            type: 'LONG_FUNCTION',
            description: `Function is ${functionLength} lines long`,
            priority: 'medium',
            location: {
              file: filePath,
              line: functionStart + 1,
            },
            suggestion: 'Break this function into smaller, focused functions',
            impact: 'Improves code maintainability and testability',
          });
        }

        functionStart = -1;
      }
    });

    // Check for magic numbers
    lines.forEach((line, index) => {
      if (/\b\d{3,}\b|\b[1-9]\d{2,}\b/.test(line) && !line.trim().startsWith('//')) {
        opportunities.push({
          type: 'MAGIC_NUMBER',
          description: 'Magic number found - should be named constant',
          priority: 'low',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Extract to a named constant: const MAX_RETRIES = 1000;',
          impact: 'Makes code more maintainable and self-documenting',
        });
      }
    });
  }

  private findReadabilityOpportunities(
    lines: string[],
    filePath: string,
    opportunities: RefactoringOpportunity[]
  ): void {
    lines.forEach((line, index) => {
      // Check for deeply nested ternary operators
      const ternaryCount = (line.match(/\?/g) || []).length;
      if (ternaryCount > 2) {
        opportunities.push({
          type: 'COMPLEX_TERNARY',
          description: `Line has ${ternaryCount} ternary operators - hard to read`,
          priority: 'medium',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Convert to if-else statement or helper function',
          impact: 'Significantly improves code readability',
          example:
            '// Instead of: a ? b : c ? d : e ? f : g\n// Use: if (a) return b;\nif (c) return d;\nif (e) return f;\nreturn g;',
        });
      }

      // Check for very long lines
      if (line.length > 100 && !line.trim().startsWith('//')) {
        opportunities.push({
          type: 'LONG_LINE',
          description: `Line is ${line.length} characters - exceeds 100 char limit`,
          priority: 'low',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Break into multiple lines for better readability',
          impact: 'Improves code readability and maintainability',
        });
      }

      // Check for abbreviated variable names
      if (/\b[a-z]{1,2}\b\s*=/.test(line) && !line.includes('for') && !line.includes('let i')) {
        opportunities.push({
          type: 'UNCLEAR_NAMING',
          description: 'Single or double letter variable name - unclear meaning',
          priority: 'low',
          location: {
            file: filePath,
            line: index + 1,
          },
          suggestion: 'Use descriptive variable names: let result = ...; instead of let r = ...;',
          impact: 'Improves code readability and maintainability',
        });
      }
    });
  }

  private analyzePythonRefactoring(
    filePath: string,
    focusArea: string
  ): Promise<{
    opportunities: RefactoringOpportunity[];
    totalOpportunities: number;
    priorityBreakdown: Record<string, number>;
    focusArea: string;
  }> {
    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, '../../python/refactoring_analyzer.py');

      const pyshell = new PythonShell(scriptPath, {
        args: [filePath, focusArea],
        mode: 'text',
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
            opportunities: [],
            totalOpportunities: 0,
            priorityBreakdown: { high: 0, medium: 0, low: 0 },
            focusArea,
          });
        }
      });

      pyshell.on('error', () => {
        resolve({
          opportunities: [],
          totalOpportunities: 0,
          priorityBreakdown: { high: 0, medium: 0, low: 0 },
          focusArea,
        });
      });
    });
  }

  private countByPriority(opportunities: RefactoringOpportunity[]): Record<string, number> {
    return {
      high: opportunities.filter((o) => o.priority === 'high').length,
      medium: opportunities.filter((o) => o.priority === 'medium').length,
      low: opportunities.filter((o) => o.priority === 'low').length,
    };
  }
}
