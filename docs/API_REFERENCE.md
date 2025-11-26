# Optimist MCP Server - API Reference

Complete API documentation for all optimization tools and interfaces.

## Table of Contents

- [Core Analysis Tools](#core-analysis-tools)
  - [analyze_performance](#analyze_performance)
  - [optimize_memory](#optimize_memory)
  - [analyze_complexity](#analyze_complexity)
  - [detect_code_smells](#detect_code_smells)
- [Advanced Tools](#advanced-tools)
  - [analyze_dependencies](#analyze_dependencies)
  - [find_dead_code](#find_dead_code)
  - [optimize_hot_paths](#optimize_hot_paths)
  - [suggest_refactoring](#suggest_refactoring)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Configuration](#configuration)

## Core Analysis Tools

### analyze_performance

Identify performance bottlenecks and optimization opportunities in code.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `includeTests` | boolean | ❌ | Include test files in analysis (default: false) |
| `threshold` | 'low' \| 'medium' \| 'high' | ❌ | Alert threshold level (default: 'medium') |
| `profileHotPaths` | boolean | ❌ | Analyze frequently executed code paths (default: true) |
| `trackAsyncOperations` | boolean | ❌ | Track async/await performance patterns (default: false) |

#### Example Request

```typescript
{
  tool: "analyze_performance",
  arguments: {
    path: "./src",
    includeTests: false,
    threshold: "medium",
    profileHotPaths: true,
    trackAsyncOperations: true
  }
}
```

#### Example Response

```typescript
{
  status: "success",
  tool: "analyze_performance",
  data: {
    summary: "Found 3 performance issues across 15 files",
    findings: [
      {
        type: "nested-loops",
        severity: "high",
        file: "src/utils/dataProcessor.ts",
        line: 42,
        column: 12,
        description: "Nested loop with O(n²) complexity detected",
        impact: "High performance impact for large datasets",
        suggestion: "Consider using Map or Set for O(1) lookups"
      },
      {
        type: "synchronous-file-io",
        severity: "medium", 
        file: "src/services/fileService.ts",
        line: 18,
        description: "Synchronous file operations block event loop",
        suggestion: "Use async fs.readFile() instead of fs.readFileSync()"
      }
    ],
    suggestions: [
      {
        category: "algorithmic",
        priority: "high",
        description: "Replace nested loops with hash maps",
        estimatedImprovement: "90% reduction in lookup time"
      }
    ],
    metrics: {
      complexityScore: 7.2,
      bottleneckCount: 3,
      hotPathsAnalyzed: 8,
      estimatedPerformanceGain: "40-60%"
    }
  },
  metadata: {
    timestamp: "2025-11-17T10:30:00Z",
    duration: 2847,
    filesAnalyzed: 15,
    linesOfCode: 3420
  }
}
```

---

### optimize_memory

Detect memory leaks and suggest memory-efficient patterns.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `detectLeaks` | boolean | ❌ | Check for memory leak patterns (default: true) |
| `suggestFixes` | boolean | ❌ | Provide fix suggestions (default: true) |
| `trackAllocations` | boolean | ❌ | Track allocation patterns (default: false) |
| `analyzeClosures` | boolean | ❌ | Analyze closure memory implications (default: true) |

#### Example Request

```typescript
{
  tool: "optimize_memory",
  arguments: {
    path: "./src/services",
    detectLeaks: true,
    suggestFixes: true,
    trackAllocations: false,
    analyzeClosures: true
  }
}
```

#### Example Response

```typescript
{
  status: "success",
  tool: "optimize_memory", 
  data: {
    summary: "Found 2 potential memory issues and 5 optimization opportunities",
    findings: [
      {
        type: "event-listener-leak",
        severity: "high",
        file: "src/components/DataTable.tsx",
        line: 34,
        description: "Event listeners not removed in useEffect cleanup",
        impact: "Memory accumulation on component re-renders",
        leakPotential: "high"
      },
      {
        type: "large-object-retention",
        severity: "medium",
        file: "src/utils/cache.ts", 
        line: 67,
        description: "Large objects retained in memory without expiration",
        suggestion: "Implement LRU cache with size limits"
      }
    ],
    suggestions: [
      {
        category: "cleanup",
        priority: "high",
        description: "Add cleanup functions to useEffect hooks",
        estimatedSavings: "20-30MB per session"
      },
      {
        category: "allocation",
        priority: "medium", 
        description: "Use object pooling for frequently created objects",
        estimatedSavings: "Reduced GC pressure by 40%"
      }
    ],
    metrics: {
      memoryScore: 6.8,
      leakRisk: "medium",
      optimizationOpportunities: 5,
      estimatedMemorySavings: "30-50MB"
    }
  },
  metadata: {
    timestamp: "2025-11-17T10:35:00Z",
    duration: 1923,
    filesAnalyzed: 8,
    linesOfCode: 2140
  }
}
```

---

### analyze_complexity

Evaluate cyclomatic and cognitive complexity metrics.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `maxComplexity` | number | ❌ | Maximum allowed complexity (default: 10) |
| `reportFormat` | 'summary' \| 'detailed' \| 'json' | ❌ | Report detail level (default: 'summary') |
| `includeCognitive` | boolean | ❌ | Include cognitive complexity (default: true) |
| `includeNesting` | boolean | ❌ | Include nesting depth analysis (default: true) |

#### Example Request

```typescript
{
  tool: "analyze_complexity",
  arguments: {
    path: "./src",
    maxComplexity: 8,
    reportFormat: "detailed",
    includeCognitive: true,
    includeNesting: true
  }
}
```

#### Example Response

```typescript
{
  status: "success", 
  tool: "analyze_complexity",
  data: {
    summary: "3 functions exceed complexity threshold of 8",
    findings: [
      {
        type: "high-cyclomatic-complexity",
        severity: "high",
        file: "src/utils/validator.ts",
        function: "validateUserInput",
        line: 23,
        metrics: {
          cyclomatic: 12,
          cognitive: 15,
          nestingDepth: 4,
          parameters: 6
        },
        description: "Function has too many decision points and nested conditions",
        suggestion: "Break into smaller, focused functions"
      },
      {
        type: "high-cognitive-complexity",
        severity: "medium",
        file: "src/services/paymentService.ts",
        function: "processPayment",
        line: 45,
        metrics: {
          cyclomatic: 8,
          cognitive: 13,
          nestingDepth: 3,
          parameters: 4
        },
        description: "High cognitive load due to complex conditionals"
      }
    ],
    suggestions: [
      {
        category: "refactoring",
        priority: "high",
        description: "Extract validation logic into separate functions",
        functions: ["validateUserInput", "processPayment"]
      },
      {
        category: "patterns",
        priority: "medium",
        description: "Consider using strategy pattern for complex conditionals"
      }
    ],
    metrics: {
      averageCyclomaticComplexity: 5.2,
      averageCognitiveComplexity: 6.8,
      functionsOverThreshold: 3,
      maintainabilityScore: 7.1
    }
  },
  metadata: {
    timestamp: "2025-11-17T10:40:00Z",
    duration: 1456,
    filesAnalyzed: 12,
    functionsAnalyzed: 47
  }
}
```

---

### detect_code_smells

Identify anti-patterns and code quality issues.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `severity` | 'low' \| 'medium' \| 'high' \| 'critical' | ❌ | Minimum severity to report (default: 'medium') |
| `categories` | string[] | ❌ | Specific smell categories to check |
| `customRules` | object | ❌ | Custom smell detection rules |

#### Smell Categories

- `large-class` - Classes with too many responsibilities
- `long-method` - Methods that are too long
- `duplicate-code` - Code duplication patterns
- `dead-code` - Unused variables and functions
- `god-object` - Classes that do too much
- `feature-envy` - Methods using other classes excessively

#### Example Request

```typescript
{
  tool: "detect_code_smells",
  arguments: {
    path: "./src",
    severity: "medium",
    categories: ["large-class", "long-method", "duplicate-code"],
    customRules: {
      maxMethodLength: 50,
      maxClassMethods: 20
    }
  }
}
```

#### Example Response

```typescript
{
  status: "success",
  tool: "detect_code_smells",
  data: {
    summary: "Found 5 code smells across 3 categories",
    findings: [
      {
        type: "large-class",
        severity: "high",
        file: "src/services/UserService.ts",
        class: "UserService",
        line: 1,
        description: "Class has 25 methods and 450 lines",
        metrics: {
          methods: 25,
          lines: 450,
          responsibilities: 8
        },
        suggestion: "Split into separate services: AuthService, ProfileService, NotificationService"
      },
      {
        type: "long-method",
        severity: "medium",
        file: "src/utils/dataTransformer.ts",
        method: "transformComplexData",
        line: 34,
        description: "Method has 75 lines and multiple responsibilities",
        suggestion: "Extract helper methods for validation, transformation, and formatting"
      },
      {
        type: "duplicate-code",
        severity: "medium",
        locations: [
          {
            file: "src/components/UserForm.tsx",
            line: 45,
            length: 15
          },
          {
            file: "src/components/AdminForm.tsx", 
            line: 23,
            length: 15
          }
        ],
        description: "Similar validation logic duplicated across components",
        suggestion: "Extract common validation into shared utility"
      }
    ],
    suggestions: [
      {
        category: "architecture",
        priority: "high",
        description: "Implement single responsibility principle",
        affectedFiles: ["UserService.ts"]
      },
      {
        category: "duplication",
        priority: "medium",
        description: "Create shared validation utilities",
        estimatedSavings: "120 lines of duplicate code"
      }
    ],
    metrics: {
      overallQualityScore: 6.5,
      smellDensity: 0.08,
      technicalDebtHours: 16,
      maintainabilityIndex: 7.2
    }
  },
  metadata: {
    timestamp: "2025-11-17T10:45:00Z",
    duration: 2156,
    filesAnalyzed: 18,
    linesOfCode: 4230
  }
}
```

## Advanced Tools

### analyze_dependencies

Analyze and optimize dependency graphs.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Project root path |
| `checkCircular` | boolean | ❌ | Detect circular dependencies (default: true) |
| `suggestUpdates` | boolean | ❌ | Suggest dependency updates (default: false) |
| `includeDevDeps` | boolean | ❌ | Include dev dependencies (default: false) |
| `depthLimit` | number | ❌ | Maximum dependency depth to analyze |

#### Example Request

```typescript
{
  tool: "analyze_dependencies",
  arguments: {
    path: "./",
    checkCircular: true,
    suggestUpdates: true,
    includeDevDeps: false,
    depthLimit: 5
  }
}
```

#### Example Response

```typescript
{
  status: "success",
  tool: "analyze_dependencies", 
  data: {
    summary: "Found 2 circular dependencies and 8 update opportunities",
    findings: [
      {
        type: "circular-dependency",
        severity: "high",
        cycle: [
          "src/services/userService.ts",
          "src/services/authService.ts", 
          "src/services/userService.ts"
        ],
        description: "Circular dependency detected between user and auth services",
        suggestion: "Extract shared interfaces or use dependency injection"
      }
    ],
    suggestions: [
      {
        category: "updates",
        priority: "medium",
        packages: [
          { name: "lodash", current: "4.17.15", latest: "4.17.21", type: "patch" },
          { name: "express", current: "4.18.0", latest: "4.18.2", type: "patch" }
        ]
      }
    ],
    metrics: {
      totalDependencies: 45,
      circularDependencies: 2,
      outdatedPackages: 8,
      dependencyDepth: 4,
      bundleSize: "1.2MB"
    }
  }
}
```

### find_dead_code

Identify and locate unused code.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `includeUnusedExports` | boolean | ❌ | Include unused exports (default: true) |
| `includeUnusedImports` | boolean | ❌ | Include unused imports (default: true) |
| `includeUnusedVariables` | boolean | ❌ | Include unused variables (default: false) |

#### Example Response

```typescript
{
  status: "success",
  tool: "find_dead_code",
  data: {
    summary: "Found 12 unused code elements",
    findings: [
      {
        type: "unused-export",
        file: "src/utils/helpers.ts",
        name: "deprecatedFunction",
        line: 45,
        description: "Function exported but never used",
        suggestion: "Remove if truly unused, or mark as deprecated"
      }
    ],
    metrics: {
      unusedExports: 5,
      unusedImports: 7,
      estimatedSavings: "340 lines of code"
    }
  }
}
```

### optimize_hot_paths

Analyze and optimize frequently executed code paths.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `profilingData` | string | ❌ | Path to profiling data file for enhanced analysis |
| `reportFormat` | 'summary' \| 'detailed' | ❌ | Report detail level (default: 'summary') |

#### Example Request

```typescript
{
  tool: "optimize_hot_paths",
  arguments: {
    path: "./src",
    profilingData: "./profiling-data.json",
    reportFormat: "detailed"
  }
}
```

#### Detailed Report Format

When `reportFormat` is set to `'detailed'`, the response includes per-file metrics:

```typescript
{
  data: {
    metrics: {
      fileDetails: {
        "src/utils/helpers.js": {
          loops: {
            count: 5,
            nested: 1,
            byType: { "for": 3, "while": 2 },
            locations: [
              { line: 23, type: "for", complexity: 2.5 },
              // ... more loop details
            ]
          },
          functions: {
            recursive: 0,
            frequentCalls: 2
          },
          hotspots: {
            computational: 3,
            byType: { "STRING_CONCAT_IN_LOOP": 2, "MATH_IN_LOOP": 1 }
          }
        }
      }
    }
  },
  metadata: {
    filesProcessed: 8,
    parseErrors: [
      { file: "src/broken.js", error: "SyntaxError: Unexpected token" }
    ]
  }
}
```

### suggest_refactoring

Provide AI-powered refactoring recommendations.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Directory or file path to analyze |
| `focusArea` | 'performance' \| 'maintainability' \| 'readability' \| 'all' | ❌ | Refactoring focus (default: 'all') |
| `includeExamples` | boolean | ❌ | Include code examples (default: true) |

## Response Format

All tools return responses in this standardized format:

```typescript
interface ToolResponse {
  status: 'success' | 'error';
  tool: string;
  data?: {
    summary: string;
    findings: Finding[];
    suggestions: Suggestion[];
    metrics: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    duration: number;
    filesAnalyzed: number;
    linesOfCode?: number;
    [key: string]: any;
  };
}

interface Finding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  column?: number;
  description: string;
  suggestion?: string;
  impact?: string;
  [key: string]: any;
}

interface Suggestion {
  category: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedImpact?: string;
  [key: string]: any;
}
```

## Error Handling

### Error Response Format

```typescript
{
  status: "error",
  tool: "analyze_performance",
  error: {
    code: "INVALID_PATH",
    message: "Specified path does not exist or is not accessible",
    details: {
      path: "./nonexistent",
      errno: "ENOENT"
    }
  },
  metadata: {
    timestamp: "2025-11-17T10:50:00Z",
    duration: 45
  }
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_PATH` | Path doesn't exist or not accessible | Check path exists and has read permissions |
| `UNSUPPORTED_FILE_TYPE` | File extension not supported | Use supported extensions (.js, .ts, .jsx, .tsx) |
| `PARSE_ERROR` | Cannot parse source code | Fix syntax errors in source files |
| `OUT_OF_MEMORY` | Analysis requires too much memory | Analyze smaller directories or increase memory |
| `TIMEOUT` | Analysis took too long | Increase timeout or analyze smaller scope |
| `CONFIGURATION_ERROR` | Invalid configuration | Check configuration syntax and values |

## Configuration

### Project Configuration

Create `optimist.config.json` in your project root:

```json
{
  "analysis": {
    "depth": "deep",
    "ignorePatterns": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
    "fileExtensions": [".js", ".ts", ".jsx", ".tsx", ".vue"],
    "maxFileSize": "1MB"
  },
  "performance": {
    "threshold": "medium",
    "profileHotPaths": true,
    "trackAsyncOperations": false,
    "complexityWeight": 0.3
  },
  "memory": {
    "detectLeaks": true,
    "trackAllocations": false,
    "analyzeClosures": true,
    "gcPressureThreshold": 50
  },
  "complexity": {
    "maxCyclomatic": 10,
    "maxCognitive": 15,
    "maxNestingDepth": 4,
    "maxParameters": 5
  },
  "codeSmells": {
    "severity": "medium",
    "enabledRules": ["all"],
    "customRules": {
      "maxMethodLength": 50,
      "maxClassMethods": 20
    }
  },
  "dependencies": {
    "checkCircular": true,
    "suggestUpdates": false,
    "includeDev": false,
    "maxDepth": 5
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPTIMIST_LOG_LEVEL` | `info` | Logging level |
| `OPTIMIST_MAX_FILES` | `1000` | Maximum files to analyze |
| `OPTIMIST_ANALYSIS_TIMEOUT` | `300000` | Analysis timeout (ms) |
| `OPTIMIST_PARALLEL_WORKERS` | `4` | Number of parallel workers |
| `OPTIMIST_CACHE_ENABLED` | `true` | Enable analysis caching |
| `OPTIMIST_CACHE_DIR` | `/tmp/optimist-cache` | Cache directory |

### Runtime Configuration

```bash
# Performance tuning
export OPTIMIST_PARALLEL_WORKERS=8
export OPTIMIST_MAX_FILES=2000

# Caching
export OPTIMIST_CACHE_ENABLED=true  
export OPTIMIST_CACHE_DIR="/custom/cache/path"

# Analysis limits
export OPTIMIST_ANALYSIS_TIMEOUT=600000  # 10 minutes
export OPTIMIST_MAX_FILE_SIZE=5MB
```

## Integration Examples

### With CI/CD

```yaml
# GitHub Actions example
- name: Code Analysis
  run: |
    npm install -g mcp-optimist
    optimist analyze_complexity --path ./src --max-complexity 8
    optimist detect_code_smells --path ./src --severity high
```

### With mcp-consult

```typescript
// Get optimization guidance
{
  tool: "consult_ollama", 
  arguments: {
    prompt: "How should I optimize this performance bottleneck?",
    context: "Analysis results: " + JSON.stringify(performanceResults),
    model: "qwen2.5-coder:7b"
  }
}
```

### With mcp-tdd

```typescript
// Use TDD to implement optimizations
{
  tool: "tdd_init_cycle",
  arguments: {
    feature: "performance-optimization",
    description: "Implement optimization suggestions from analysis"
  }
}
```