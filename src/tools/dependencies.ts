import { AnalysisResult, Finding, Suggestion } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dependencies Analyzer - Maps and analyzes dependency graphs
 */
export class DependenciesAnalyzer {
  /**
   * Analyze dependencies in a project
   */
  async analyze(
    inputPath: string,
    options: { checkCircular?: boolean; suggestUpdates?: boolean } = {}
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
          tool: 'analyze_dependencies',
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

      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(filesToAnalyze, parser);

      // Analyze external dependencies
      const externalDeps = await this.analyzeExternalDependencies(inputPath);

      // Check for circular dependencies
      if (options.checkCircular !== false) {
        const circularDeps = this.detectCircularDependencies(dependencyGraph);
        circularDeps.forEach((cycle) => {
          findings.push({
            type: 'CIRCULAR_DEPENDENCY',
            severity: 'high',
            location: {
              file: cycle[0],
            },
            message: `Circular dependency detected: ${cycle.join(' -> ')}`,
            code: cycle.join(' -> '),
          });

          suggestions.push({
            type: 'BREAK_CIRCULAR_DEPENDENCY',
            priority: 'high',
            description: `Break circular dependency by extracting common code or using dependency injection`,
            example:
              '// Extract shared logic to a new module:\n// common.js\nexport function sharedLogic() { /* ... */ }\n\n// Instead of A importing B and B importing A',
            impact: 'Eliminates tight coupling and improves maintainability',
          });
        });
      }

      // Analyze dependency metrics
      const metrics = this.calculateMetrics(dependencyGraph, externalDeps);

      // Check for dependency issues
      this.analyzeDependencyIssues(dependencyGraph, findings, suggestions);

      // Suggest updates if requested
      if (options.suggestUpdates) {
        await this.suggestUpdates(externalDeps, suggestions);
      }

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'analyze_dependencies',
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
        tool: 'analyze_dependencies',
        data: {
          summary: `Error analyzing dependencies: ${errorMessage}`,
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

  private buildDependencyGraph(files: string[], parser: any): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const file of files) {
      try {
        const dependencies = parser.extractDependencies(file);
        graph.set(file, dependencies);
      } catch (error) {
        console.warn(`Error parsing dependencies for ${file}:`, error);
        graph.set(file, []);
      }
    }

    return graph;
  }

  private async analyzeExternalDependencies(projectPath: string): Promise<any[]> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      return Object.entries(dependencies).map(([name, version]) => ({
        name,
        version: version as string,
        type: packageJson.dependencies?.[name] ? 'production' : 'dev',
      }));
    } catch (error) {
      console.warn('Could not read package.json:', error);
      return [];
    }
  }

  private detectCircularDependencies(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      if (recursionStack.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        dfs(dep, [...path, node]);
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private calculateMetrics(graph: Map<string, string[]>, externalDeps: any[]): Record<string, any> {
    const files = Array.from(graph.keys());
    const totalFiles = files.length;
    const totalDeps = files.reduce((sum, file) => sum + (graph.get(file)?.length || 0), 0);
    const avgDepsPerFile = totalFiles > 0 ? totalDeps / totalFiles : 0;

    // Find most depended on files
    const dependencyCount = new Map<string, number>();
    for (const deps of graph.values()) {
      for (const dep of deps) {
        dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
      }
    }

    const mostDependedOn = Array.from(dependencyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalFiles,
      totalInternalDependencies: totalDeps,
      averageDependenciesPerFile: Math.round(avgDepsPerFile * 100) / 100,
      externalDependencies: externalDeps.length,
      mostDependedOn,
    };
  }

  private analyzeDependencyIssues(
    graph: Map<string, string[]>,
    findings: Finding[],
    suggestions: Suggestion[]
  ): void {
    // Check for files with too many dependencies
    for (const [file, deps] of graph.entries()) {
      if (deps.length > 20) {
        findings.push({
          type: 'TOO_MANY_DEPENDENCIES',
          severity: 'medium',
          location: { file },
          message: `File has ${deps.length} dependencies. Consider breaking it down.`,
          code: path.basename(file),
        });

        suggestions.push({
          type: 'EXTRACT_MODULES',
          priority: 'medium',
          description: 'Extract related functionality into separate modules',
          example:
            '// Instead of one large file with many imports,\n// create focused modules:\n// user-service.js, auth-service.js, etc.',
          impact: 'Improves maintainability and reduces coupling',
        });
      }
    }

    // Check for unused dependencies (simplified check)
    const allImports = new Set<string>();
    for (const deps of graph.values()) {
      deps.forEach((dep) => allImports.add(dep));
    }

    // This is a basic check - in reality, we'd need more sophisticated analysis
    // to determine truly unused dependencies
  }

  private async suggestUpdates(externalDeps: any[], suggestions: Suggestion[]): Promise<void> {
    // Simple version checking - in a real implementation, this would query npm registry
    const outdated = externalDeps.filter((dep) => {
      // Simple heuristic: check if version starts with ^ or ~ (flexible versioning)
      return dep.version.startsWith('^') || dep.version.startsWith('~');
    });

    if (outdated.length > 0) {
      suggestions.push({
        type: 'UPDATE_DEPENDENCIES',
        priority: 'low',
        description: `${outdated.length} dependencies use flexible versioning (^ or ~). Consider pinning to specific versions for reproducibility.`,
        example: '// Instead of:\n"lodash": "^4.17.0"\n\n// Use:\n"lodash": "4.17.21"',
        impact: 'Improves build reproducibility and reduces unexpected breaking changes',
      });
    }
  }

  private generateSummary(findings: Finding[], metrics: Record<string, any>): string {
    const circularCount = findings.filter((f) => f.type === 'CIRCULAR_DEPENDENCY').length;
    const depIssues = findings.filter((f) => f.type === 'TOO_MANY_DEPENDENCIES').length;

    let summary = `Dependency analysis complete. ${metrics.totalFiles} files analyzed with ${metrics.totalInternalDependencies} internal dependencies.`;

    if (circularCount > 0) {
      summary += ` Found ${circularCount} circular dependency cycle(s).`;
    }

    if (depIssues > 0) {
      summary += ` ${depIssues} file(s) have too many dependencies.`;
    }

    if (circularCount === 0 && depIssues === 0) {
      summary += ' No major dependency issues found.';
    }

    return summary;
  }
}
