import { AnalysisResult, Finding, Suggestion } from '../types';

/**
 * Hot Paths Optimizer - Analyzes and optimizes frequently executed code paths
 */
export class HotPathsOptimizer {
  /**
   * Analyze and optimize frequently executed code paths
   */
  async analyze(
    inputPath: string,
    options: { profilingData?: string } = {}
  ): Promise<AnalysisResult> {
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
          tool: 'optimize_hot_paths',
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

      // Analyze hot paths in each file
      const hotPathsAnalysis = await this.analyzeHotPaths(filesToAnalyze, parser, options);

      // Extract findings and suggestions
      this.extractFindingsAndSuggestions(hotPathsAnalysis, findings, suggestions);

      // Calculate metrics
      const metrics = this.calculateMetrics(hotPathsAnalysis);

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'optimize_hot_paths',
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
        tool: 'optimize_hot_paths',
        data: {
          summary: `Error analyzing hot paths: ${errorMessage}`,
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

  private async analyzeHotPaths(
    files: string[],
    parser: any,
    options: { profilingData?: string }
  ): Promise<any[]> {
    const analysis: any[] = [];

    // Load profiling data if provided
    const profilingData = options.profilingData
      ? await this.loadProfilingData(options.profilingData)
      : null;

    for (const file of files) {
      try {
        const ast = parser.parseFile(file);
        const fileAnalysis = {
          file,
          loops: this.findLoops(ast),
          recursiveFunctions: this.findRecursiveFunctions(ast),
          frequentCalls: this.findFrequentCallPatterns(ast),
          computationalHotspots: this.findComputationalHotspots(ast),
          profilingData: profilingData ? this.getProfilingDataForFile(profilingData, file) : null,
        };
        analysis.push(fileAnalysis);
      } catch (error) {
        console.warn(`Error analyzing hot paths in ${file}:`, error);
      }
    }

    return analysis;
  }

  private findLoops(ast: any): any[] {
    const loops: any[] = [];

    const traverse = (node: any, path: string[] = []) => {
      if (!node || typeof node !== 'object') return;

      // Detect different types of loops
      if (
        node.type === 'ForStatement' ||
        node.type === 'WhileStatement' ||
        node.type === 'DoWhileStatement' ||
        node.type === 'ForInStatement' ||
        node.type === 'ForOfStatement'
      ) {
        loops.push({
          type: node.type,
          location: node.loc,
          complexity: this.calculateLoopComplexity(node),
          nested: path.some((p) => p.includes('Statement') && p.includes('For')),
          path: [...path],
        });
      }

      // Recurse through all properties
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'range') continue;
        if (Array.isArray(value)) {
          value.forEach((item, index) => traverse(item, [...path, `${key}[${index}]`]));
        } else if (typeof value === 'object') {
          traverse(value, [...path, key]);
        }
      }
    };

    traverse(ast);
    return loops;
  }

  private findRecursiveFunctions(ast: any): any[] {
    const functions: any[] = [];
    const functionCalls: any[] = [];

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Find function declarations
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        if (node.id) {
          functions.push({
            name: node.id.name,
            location: node.loc,
            params: node.params?.length || 0,
          });
        }
      }

      // Find function calls
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        functionCalls.push({
          name: node.callee.name,
          location: node.loc,
        });
      }

      // Recurse
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'range') continue;
        if (Array.isArray(value)) {
          value.forEach((item) => traverse(item));
        } else if (typeof value === 'object') {
          traverse(value);
        }
      }
    };

    traverse(ast);

    // Find potential recursive functions
    const recursive: any[] = [];
    for (const func of functions) {
      const callsToSelf = functionCalls.filter((call) => call.name === func.name);
      if (callsToSelf.length > 0) {
        recursive.push({
          ...func,
          callCount: callsToSelf.length,
          locations: callsToSelf.map((c) => c.location),
        });
      }
    }

    return recursive;
  }

  private findFrequentCallPatterns(ast: any): any[] {
    const callPatterns: Map<string, any[]> = new Map();

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const name = node.callee.name;
        if (!callPatterns.has(name)) {
          callPatterns.set(name, []);
        }
        callPatterns.get(name)!.push({
          location: node.loc,
          arguments: node.arguments?.length || 0,
        });
      }

      // Recurse
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'range') continue;
        if (Array.isArray(value)) {
          value.forEach((item) => traverse(item));
        } else if (typeof value === 'object') {
          traverse(value);
        }
      }
    };

    traverse(ast);

    // Filter for frequently called functions
    return Array.from(callPatterns.entries())
      .filter(([_, calls]) => calls.length >= 3)
      .map(([name, calls]) => ({
        functionName: name,
        callCount: calls.length,
        locations: calls.map((c) => c.location),
        avgArguments: calls.reduce((sum, c) => sum + c.arguments, 0) / calls.length,
      }));
  }

  private findComputationalHotspots(ast: any): any[] {
    const hotspots: any[] = [];

    const traverse = (node: any, path: string[] = []) => {
      if (!node || typeof node !== 'object') return;

      // Look for computationally intensive patterns
      if (node.type === 'BinaryExpression' && ['*', '/', '%'].includes(node.operator)) {
        // Mathematical operations in loops
        const inLoop = path.some((p) => p.includes('For') || p.includes('While'));
        if (inLoop) {
          hotspots.push({
            type: 'MATH_IN_LOOP',
            operator: node.operator,
            location: node.loc,
            context: 'loop',
          });
        }
      }

      // String operations in loops
      if (
        node.type === 'BinaryExpression' &&
        node.operator === '+' &&
        (node.left.type === 'Literal' || node.right.type === 'Literal')
      ) {
        const inLoop = path.some((p) => p.includes('For') || p.includes('While'));
        if (inLoop) {
          hotspots.push({
            type: 'STRING_CONCAT_IN_LOOP',
            location: node.loc,
            context: 'loop',
          });
        }
      }

      // Array operations in loops
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        ['push', 'splice', 'unshift'].includes(node.callee.property.name)
      ) {
        const inLoop = path.some((p) => p.includes('For') || p.includes('While'));
        if (inLoop) {
          hotspots.push({
            type: 'ARRAY_MUTATION_IN_LOOP',
            method: node.callee.property.name,
            location: node.loc,
            context: 'loop',
          });
        }
      }

      // Recurse
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'range') continue;
        if (Array.isArray(value)) {
          value.forEach((item, index) => traverse(item, [...path, `${key}[${index}]`]));
        } else if (typeof value === 'object') {
          traverse(value, [...path, key]);
        }
      }
    };

    traverse(ast);
    return hotspots;
  }

  private calculateLoopComplexity(loopNode: any): number {
    let complexity = 1; // Base complexity

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Conditionals add complexity
      if (node.type === 'IfStatement' || node.type === 'ConditionalExpression') {
        complexity++;
      }

      // Function calls add complexity
      if (node.type === 'CallExpression') {
        complexity += 0.5;
      }

      // Recurse
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'range') continue;
        if (Array.isArray(value)) {
          value.forEach((item) => traverse(item));
        } else if (typeof value === 'object') {
          traverse(value);
        }
      }
    };

    traverse(loopNode.body);
    return complexity;
  }

  private async loadProfilingData(profilingPath: string): Promise<any> {
    try {
      const fs = await import('fs');
      const data = fs.readFileSync(profilingPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Could not load profiling data:', error);
      return null;
    }
  }

  private getProfilingDataForFile(profilingData: any, filePath: string): any {
    if (!profilingData) return null;

    // Simple file matching - in a real implementation, this would be more sophisticated
    const fileName = filePath.split('/').pop();
    if (!fileName) return null;

    return profilingData[fileName] || null;
  }

  private extractFindingsAndSuggestions(
    analysis: any[],
    findings: Finding[],
    suggestions: Suggestion[]
  ): void {
    for (const fileAnalysis of analysis) {
      const { file, loops, recursiveFunctions, frequentCalls, computationalHotspots } =
        fileAnalysis;

      // Analyze loops
      for (const loop of loops) {
        if (loop.complexity > 5) {
          findings.push({
            type: 'COMPLEX_LOOP',
            severity: 'high',
            location: { file, line: loop.location?.start?.line },
            message: `Loop has high complexity (${loop.complexity.toFixed(1)}). Consider optimizing or breaking down.`,
            code: loop.type,
          });

          suggestions.push({
            type: 'OPTIMIZE_LOOP',
            priority: 'high',
            description: 'Extract loop body into separate function or optimize algorithm',
            example:
              '// Extract complex logic:\nfunction processItem(item) { /* complex logic */ }\nfor (const item of items) {\n  processItem(item);\n}',
            impact: 'Improves readability and potentially performance',
          });
        }

        if (loop.nested) {
          findings.push({
            type: 'NESTED_LOOP',
            severity: 'medium',
            location: { file, line: loop.location?.start?.line },
            message: 'Nested loop detected. Results in O(n²) or higher complexity.',
            code: loop.type,
          });

          suggestions.push({
            type: 'FLATTEN_LOOPS',
            priority: 'medium',
            description: 'Consider using more efficient data structures or algorithms',
            example:
              '// Use Map for O(1) lookups:\nconst itemMap = new Map(items.map(item => [item.id, item]));\nfor (const id of ids) {\n  const item = itemMap.get(id);\n}',
            impact: 'Significant performance improvement for large datasets',
          });
        }
      }

      // Analyze recursive functions
      for (const recursive of recursiveFunctions) {
        findings.push({
          type: 'RECURSIVE_FUNCTION',
          severity: 'medium',
          location: { file, line: recursive.location?.start?.line },
          message: `Recursive function '${recursive.name}' called ${recursive.callCount} times. Consider iterative approach for performance.`,
          code: recursive.name,
        });

        suggestions.push({
          type: 'CONVERT_TO_ITERATIVE',
          priority: 'medium',
          description: 'Convert recursive function to iterative approach',
          example:
            '// Instead of recursion:\nfunction factorial(n) {\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}\n\n// Use iteration:\nfunction factorial(n) {\n  let result = 1;\n  for (let i = 2; i <= n; i++) {\n    result *= i;\n  }\n  return result;\n}',
          impact: 'Eliminates stack overflow risk and improves performance',
        });
      }

      // Analyze frequent calls
      for (const frequent of frequentCalls) {
        if (frequent.callCount > 10) {
          findings.push({
            type: 'FREQUENTLY_CALLED_FUNCTION',
            severity: 'low',
            location: { file },
            message: `Function '${frequent.functionName}' called ${frequent.callCount} times. Consider caching or memoization.`,
            code: frequent.functionName,
          });

          suggestions.push({
            type: 'ADD_MEMOIZATION',
            priority: 'low',
            description: 'Add memoization for frequently called pure functions',
            example:
              '// Add memoization:\nconst memoizedFunction = (() => {\n  const cache = new Map();\n  return (arg) => {\n    if (cache.has(arg)) return cache.get(arg);\n    const result = expensiveComputation(arg);\n    cache.set(arg, result);\n    return result;\n  };\n})();',
            impact: 'Significant performance improvement for repeated calls with same arguments',
          });
        }
      }

      // Analyze computational hotspots
      for (const hotspot of computationalHotspots) {
        switch (hotspot.type) {
          case 'MATH_IN_LOOP':
            findings.push({
              type: 'MATH_OPERATION_IN_LOOP',
              severity: 'medium',
              location: { file, line: hotspot.location?.start?.line },
              message: `Mathematical operation (${hotspot.operator}) in loop. Consider hoisting calculations.`,
              code: hotspot.operator,
            });
            break;
          case 'STRING_CONCAT_IN_LOOP':
            findings.push({
              type: 'STRING_CONCAT_IN_LOOP',
              severity: 'high',
              location: { file, line: hotspot.location?.start?.line },
              message: 'String concatenation in loop creates new strings on each iteration.',
              code: '+',
            });
            suggestions.push({
              type: 'USE_ARRAY_JOIN',
              priority: 'high',
              description: 'Use array and join() instead of string concatenation in loops',
              example:
                '// BAD:\nlet result = "";\nfor (const item of items) {\n  result += item;\n}\n\n// GOOD:\nconst parts = [];\nfor (const item of items) {\n  parts.push(item);\n}\nconst result = parts.join("");',
              impact: 'Dramatically improves performance for large strings',
            });
            break;
          case 'ARRAY_MUTATION_IN_LOOP':
            findings.push({
              type: 'ARRAY_MUTATION_IN_LOOP',
              severity: 'medium',
              location: { file, line: hotspot.location?.start?.line },
              message: `Array.${hotspot.method}() in loop may cause performance issues.`,
              code: `Array.${hotspot.method}`,
            });
            break;
        }
      }
    }
  }

  private calculateMetrics(analysis: any[]): Record<string, any> {
    let totalLoops = 0;
    let nestedLoops = 0;
    let recursiveFunctions = 0;
    let frequentCalls = 0;
    let hotspots = 0;

    for (const fileAnalysis of analysis) {
      totalLoops += fileAnalysis.loops.length;
      nestedLoops += fileAnalysis.loops.filter((l: any) => l.nested).length;
      recursiveFunctions += fileAnalysis.recursiveFunctions.length;
      frequentCalls += fileAnalysis.frequentCalls.length;
      hotspots += fileAnalysis.computationalHotspots.length;
    }

    return {
      totalLoops,
      nestedLoops,
      recursiveFunctions,
      frequentCalls,
      computationalHotspots: hotspots,
      filesAnalyzed: analysis.length,
    };
  }

  private generateSummary(findings: Finding[], metrics: Record<string, any>): string {
    const criticalIssues = findings.filter((f) => f.severity === 'critical').length;
    const highIssues = findings.filter((f) => f.severity === 'high').length;

    let summary = `Hot paths analysis complete. Found ${metrics.totalLoops} loops, ${metrics.recursiveFunctions} recursive functions, and ${metrics.computationalHotspots} computational hotspots.`;

    if (criticalIssues > 0 || highIssues > 0) {
      summary += ` ${criticalIssues + highIssues} high-priority optimization opportunities identified.`;
    }

    if (metrics.nestedLoops > 0) {
      summary += ` ${metrics.nestedLoops} nested loops may cause performance issues.`;
    }

    return summary;
  }
}
