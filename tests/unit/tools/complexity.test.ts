import { ComplexityAnalyzer } from '../../../src/tools/complexity';
import * as path from 'path';

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer();
  });

  describe('basic functionality', () => {
    it('should analyze a file without errors', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('analyze_complexity');
    });

    it('should return proper result structure', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.data.findings).toBeInstanceOf(Array);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.metrics).toBeDefined();
      expect(result.metadata.filesAnalyzed).toBe(1);
    });

    it('should handle directory paths with proper success message', async () => {
      const directoryPath = path.join(__dirname, '../../fixtures');
      const result = await analyzer.analyze(directoryPath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('analyze_complexity');
      expect(result.data.summary).toContain('complexity issue');
      expect(result.metadata.filesAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('cyclomatic complexity calculation', () => {
    it('should calculate complexity for simple functions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.metrics.averageComplexity).toBeLessThan(2);
      expect(result.data.metrics.maxComplexity).toBeLessThanOrEqual(2);
    });

    it('should detect moderate complexity', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/moderate.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.metrics.maxComplexity).toBeGreaterThan(2);
      expect(result.data.metrics.maxComplexity).toBeLessThanOrEqual(10);
    });

    it('should detect high complexity', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.metrics.maxComplexity).toBeGreaterThan(10);
    });

    it('should count decision points correctly', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/moderate.js');
      const result = await analyzer.analyze(fixturePath);

      // Should have metrics about decision points
      expect(result.data.metrics.totalDecisionPoints).toBeGreaterThan(0);
    });
  });

  describe('cognitive complexity', () => {
    it('should measure cognitive load', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      // Cognitive complexity should be tracked
      expect(result.data.metrics.averageCognitive).toBeDefined();
    });

    it('should detect deeply nested code', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      const deepNestingFindings = result.data.findings.filter(
        (f) => f.type === 'HIGH_NESTING_DEPTH' || f.message.toLowerCase().includes('nest')
      );
      expect(deepNestingFindings.length).toBeGreaterThan(0);
    });

    it('should identify cognitive complexity issues', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      const cognitiveFindings = result.data.findings.filter(
        (f) =>
          f.type === 'HIGH_COGNITIVE_COMPLEXITY' || f.message.toLowerCase().includes('cognitive')
      );
      expect(cognitiveFindings.length).toBeGreaterThan(0);
    });
  });

  describe('complexity thresholds', () => {
    it('should flag functions exceeding cyclomatic threshold', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath, { maxComplexity: 10 });

      const highComplexity = result.data.findings.filter(
        (f) =>
          f.type === 'HIGH_CYCLOMATIC_COMPLEXITY' ||
          f.severity === 'high' ||
          f.severity === 'critical'
      );
      expect(highComplexity.length).toBeGreaterThan(0);
    });

    it('should respect custom thresholds', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/moderate.js');

      // Strict threshold
      const strictResult = await analyzer.analyze(fixturePath, { maxComplexity: 3 });
      const strictFindings = strictResult.data.findings.length;

      // Lenient threshold
      const lenientResult = await analyzer.analyze(fixturePath, { maxComplexity: 10 });
      const lenientFindings = lenientResult.data.findings.length;

      expect(strictFindings).toBeGreaterThan(lenientFindings);
    });

    it('should categorize by severity', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      const critical = result.data.findings.filter((f) => f.severity === 'critical');
      const high = result.data.findings.filter((f) => f.severity === 'high');

      expect(critical.length + high.length).toBeGreaterThan(0);
    });
  });

  describe('function analysis', () => {
    it('should analyze all functions in file', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/moderate.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.metrics.totalFunctions).toBeGreaterThan(0);
      expect(result.data.metrics.totalFunctions).toBe(4); // 4 functions in moderate.js
    });

    it('should report per-function metrics', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      // Should have findings for complex functions
      expect(result.data.findings.length).toBeGreaterThan(0);
      // Findings should reference the problematic code
      const findingsWithCode = result.data.findings.filter((f) => f.code);
      expect(findingsWithCode.length).toBeGreaterThan(0);
    });

    it('should identify most complex function', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.metrics.mostComplexFunction).toBeDefined();
      expect(result.data.metrics.maxComplexity).toBeGreaterThan(10);
    });
  });

  describe('suggestions', () => {
    it('should provide refactoring suggestions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest breaking down complex functions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      // Should have suggestions for refactoring
      const refactorSuggestions = result.data.suggestions.filter(
        (s) =>
          s.type === 'BREAK_DOWN_FUNCTION' ||
          s.type === 'REFACTOR_FUNCTION' ||
          s.description.toLowerCase().includes('refactor')
      );
      expect(refactorSuggestions.length).toBeGreaterThan(0);
    });

    it('should suggest reducing nesting', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      const nestingSuggestions = result.data.suggestions.filter(
        (s) =>
          s.description.toLowerCase().includes('nest') ||
          s.description.toLowerCase().includes('guard')
      );
      expect(nestingSuggestions.length).toBeGreaterThan(0);
    });

    it('should include code examples', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await analyzer.analyze(fixturePath);

      const suggestionsWithExamples = result.data.suggestions.filter((s) => s.example);
      expect(suggestionsWithExamples.length).toBeGreaterThan(0);
    });
  });

  describe('clean code handling', () => {
    it('should have minimal findings for simple code', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await analyzer.analyze(fixturePath);

      const criticalFindings = result.data.findings.filter(
        (f) => f.severity === 'critical' || f.severity === 'high'
      );
      expect(criticalFindings.length).toBe(0);
    });

    it('should provide positive feedback', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.summary).toBeDefined();
      expect(typeof result.data.summary).toBe('string');
    });
  });

  describe('report format', () => {
    it('should support summary format', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/moderate.js');
      const result = await analyzer.analyze(fixturePath, { reportFormat: 'summary' });

      expect(result.data.summary).toBeDefined();
    });

    it('should track analysis duration', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
