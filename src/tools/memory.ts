import { AnalysisResult, Finding, Suggestion } from '../types';
import { MemoryAnalyzer, AllocationInfo } from '../analyzers/memory-analyzer';

/**
 * Memory Optimizer - Detects memory leaks and inefficient allocations
 */
export class MemoryOptimizer {
  private analyzer: MemoryAnalyzer;

  constructor() {
    this.analyzer = new MemoryAnalyzer();
  }

  /**
   * Analyze a file for memory issues
   */
  async analyze(
    inputPath: string,
    options: { detectLeaks?: boolean; suggestFixes?: boolean } = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const suggestions: Suggestion[] = [];
    const metrics: Record<string, any> = {
      allocationsInLoops: 0,
      potentialLeaks: 0,
      heavyAllocations: 0,
      closureIssues: 0,
    };

    const { suggestFixes = true } = options;

    try {
      // Import ASTParser here to avoid circular dependency
      const { ASTParser } = await import('../analyzers/ast-parser');
      const parser = new ASTParser();

      // Expand the input path to get all files to analyze
      const filesToAnalyze = parser.expandPath(inputPath);

      if (filesToAnalyze.length === 0) {
        return {
          status: 'error',
          tool: 'optimize_memory',
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
          const analysis = this.analyzer.analyzeMemory(filePath);

          // Process allocations
          analysis.allocations.forEach((alloc) => {
            if (alloc.inLoop) {
              metrics.allocationsInLoops++;

              const severity = this.getAllocationSeverity(alloc);
              findings.push({
                type: 'LARGE_ALLOCATION_IN_LOOP',
                severity,
                location: {
                  file: filePath,
                  line: alloc.line,
                },
                message: `${alloc.type.toUpperCase()} allocation in loop detected. ${this.getAllocationImpact(alloc)}`,
                code: `new ${alloc.type}()`,
              });

              if (suggestFixes) {
                suggestions.push({
                  type: 'USE_OBJECT_POOLING',
                  priority: severity === 'critical' ? 'high' : 'medium',
                  description: `Move ${alloc.type} allocation outside loop or use object pooling`,
                  example: this.getAllocationExample(alloc),
                  impact: 'Reduces GC pressure and improves performance significantly',
                });
              }
            }
          });

          // Process potential leaks
          analysis.leaks.forEach((leak) => {
            metrics.potentialLeaks++;

            const findingType = this.getLeakFindingType(leak.type);
            const severity =
              leak.type === 'event_listener' || leak.type === 'timer' ? 'high' : 'medium';

            findings.push({
              type: findingType,
              severity,
              location: {
                file: filePath,
                line: leak.line,
              },
              message: leak.description,
              code: this.getLeakCodeSnippet(leak.type),
            });

            if (suggestFixes) {
              suggestions.push({
                type: this.getLeakSuggestionType(leak.type),
                priority: severity === 'high' ? 'high' : 'medium',
                description: this.getLeakSuggestion(leak.type),
                example: this.getLeakExample(leak.type),
                impact: 'Prevents memory leaks and ensures proper cleanup',
              });
            }
          });

          // Process closure issues
          analysis.closures.forEach((closure) => {
            metrics.closureIssues++;

            if (closure.type === 'RETURNS_CLOSURE') {
              findings.push({
                type: 'CLOSURE_LEAK',
                severity: 'medium',
                location: {
                  file: filePath,
                  line: closure.line,
                },
                message: 'Function returns closure that may capture large data structures',
              });

              if (suggestFixes) {
                suggestions.push({
                  type: 'OPTIMIZE_CLOSURE',
                  priority: 'medium',
                  description: 'Minimize closure scope to avoid capturing unnecessary data',
                  example:
                    'Pass only needed values as parameters instead of capturing entire scope',
                  impact: 'Reduces memory footprint of closures',
                });
              }
            }
          });

          // Find unnecessary copies
          const copies = this.analyzer.findUnnecessaryCopies(
            this.analyzer['parser'].parseFile(filePath).ast
          );

          copies.forEach((copy) => {
            findings.push({
              type: 'UNNECESSARY_COPY',
              severity: 'low',
              location: {
                file: filePath,
                line: copy.line,
              },
              message: `Unnecessary array ${copy.pattern === 'array_spread' ? 'spread' : 'copy'} detected`,
            });

            if (suggestFixes) {
              suggestions.push({
                type: 'AVOID_UNNECESSARY_COPIES',
                priority: 'low',
                description: 'Remove unnecessary array copies to reduce allocations',
                example: 'Work with original array when possible, or combine operations',
                impact: 'Reduces memory allocations',
              });
            }
          });
        } catch (fileError) {
          // Log error for this file but continue with others
          console.warn(`Error analyzing ${filePath}:`, fileError);
        }
      }

      // Deduplicate suggestions by type
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);

      // Add general suggestions if no major issues
      if (findings.length === 0 && suggestFixes) {
        uniqueSuggestions.push({
          type: 'GENERAL',
          priority: 'low',
          description: 'No significant memory issues detected. Code appears memory-efficient.',
          impact: 'Continue monitoring memory usage in production',
        });
      }

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        tool: 'optimize_memory',
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
        tool: 'optimize_memory',
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

  private getAllocationSeverity(alloc: AllocationInfo): Finding['severity'] {
    if (alloc.size === 'large') return 'high';
    if (alloc.type === 'buffer') return 'high';
    if (alloc.type === 'array' || alloc.type === 'object') return 'medium';
    return 'low';
  }

  private getAllocationImpact(alloc: AllocationInfo): string {
    switch (alloc.type) {
      case 'array':
        return 'Creates new array on each iteration, increasing GC pressure.';
      case 'object':
        return 'Creates new object on each iteration, causing frequent allocations.';
      case 'buffer':
        return 'Buffer allocation can be expensive, especially for large sizes.';
      case 'date':
        return 'Date object creation in loop is unnecessary overhead.';
      case 'regex':
        return 'Regex is compiled on each iteration, should be moved outside loop.';
      default:
        return 'Allocation in loop increases memory pressure.';
    }
  }

  private getAllocationExample(alloc: AllocationInfo): string {
    switch (alloc.type) {
      case 'array':
        return '// BAD:\nfor (let i...) {\n  const temp = new Array(1000);\n}\n\n// GOOD:\nconst temp = new Array(1000);\nfor (let i...) {\n  // reuse temp\n}';
      case 'object':
        return '// Consider object pooling:\nconst pool = new ObjectPool();\nfor (let i...) {\n  const obj = pool.acquire();\n  // use obj\n  pool.release(obj);\n}';
      case 'regex':
        return '// BAD:\nfor (let str of strings) {\n  if (/pattern/.test(str)) {...}\n}\n\n// GOOD:\nconst regex = /pattern/;\nfor (let str of strings) {\n  if (regex.test(str)) {...}\n}';
      default:
        return 'Move allocation outside loop when possible';
    }
  }

  private getLeakFindingType(type: string): string {
    switch (type) {
      case 'event_listener':
        return 'EVENT_LISTENER_LEAK';
      case 'timer':
        return 'TIMER_LEAK';
      case 'cache':
        return 'UNBOUNDED_CACHE';
      case 'closure':
        return 'CLOSURE_LEAK';
      case 'circular':
        return 'CIRCULAR_REFERENCE';
      default:
        return 'MEMORY_LEAK';
    }
  }

  private getLeakCodeSnippet(type: string): string {
    switch (type) {
      case 'event_listener':
        return 'element.addEventListener(...)';
      case 'timer':
        return 'setInterval/setTimeout';
      case 'cache':
        return 'cache[key] = value';
      default:
        return '';
    }
  }

  private getLeakSuggestionType(type: string): string {
    switch (type) {
      case 'event_listener':
        return 'ADD_EVENT_CLEANUP';
      case 'timer':
        return 'CLEAR_TIMERS';
      case 'cache':
        return 'IMPLEMENT_CACHE_LIMITS';
      case 'closure':
        return 'OPTIMIZE_CLOSURE';
      default:
        return 'FIX_MEMORY_LEAK';
    }
  }

  private getLeakSuggestion(type: string): string {
    switch (type) {
      case 'event_listener':
        return 'Add removeEventListener in cleanup/destroy method';
      case 'timer':
        return 'Store timer ID and call clearInterval/clearTimeout';
      case 'cache':
        return 'Implement cache size limits or use LRU cache';
      case 'closure':
        return 'Minimize closure scope to prevent capturing large data';
      default:
        return 'Implement proper cleanup mechanism';
    }
  }

  private getLeakExample(type: string): string {
    switch (type) {
      case 'event_listener':
        return 'class Component {\n  constructor() {\n    this.handleClick = () => {...};\n  }\n  mount() {\n    element.addEventListener("click", this.handleClick);\n  }\n  unmount() {\n    element.removeEventListener("click", this.handleClick);\n  }\n}';
      case 'timer':
        return 'const intervalId = setInterval(() => {...}, 1000);\n// Later:\nclearInterval(intervalId);';
      case 'cache':
        return 'const cache = new Map();\nconst MAX_SIZE = 100;\nfunction set(key, val) {\n  if (cache.size >= MAX_SIZE) {\n    const firstKey = cache.keys().next().value;\n    cache.delete(firstKey);\n  }\n  cache.set(key, val);\n}';
      default:
        return 'Implement proper resource cleanup';
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
      return 'Memory analysis complete. No significant issues detected.';
    }

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;
    const low = findings.filter((f) => f.severity === 'low').length;

    let summary = `Found ${findings.length} memory issue(s): `;
    const parts = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (high > 0) parts.push(`${high} high`);
    if (medium > 0) parts.push(`${medium} medium`);
    if (low > 0) parts.push(`${low} low`);
    summary += parts.join(', ');

    if (metrics.potentialLeaks > 0) {
      summary += `. ${metrics.potentialLeaks} potential memory leak(s)`;
    }
    if (metrics.allocationsInLoops > 0) {
      summary += `. ${metrics.allocationsInLoops} allocation(s) in loops`;
    }

    return summary;
  }
}
