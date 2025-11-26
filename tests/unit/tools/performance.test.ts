import { PerformanceAnalyzer } from '../../../src/tools/performance';
import * as path from 'path';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe('basic functionality', () => {
    it('should analyze a simple file without errors', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('analyze_performance');
    });

    it('should return proper result structure', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.data.findings).toBeInstanceOf(Array);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.metrics).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.filesAnalyzed).toBeGreaterThan(0);
    });

    it('should handle directory paths with proper success message', async () => {
      const directoryPath = path.join(__dirname, '../../fixtures');
      const result = await analyzer.analyze(directoryPath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('analyze_performance');
      expect(result.data.summary).toContain('performance');
      expect(result.metadata.filesAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('nested loop detection', () => {
    it('should detect nested loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      const nestedLoopFindings = result.data.findings.filter((f) => f.type === 'NESTED_LOOPS');
      expect(nestedLoopFindings.length).toBeGreaterThan(0);
    });

    it('should calculate loop depth', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      const nestedLoop = result.data.findings.find((f) => f.type === 'NESTED_LOOPS');
      expect(nestedLoop).toBeDefined();
      expect(nestedLoop?.message).toContain('depth');
    });

    it('should flag high-complexity nested loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      const criticalFindings = result.data.findings.filter(
        (f) => f.severity === 'high' || f.severity === 'critical'
      );
      expect(criticalFindings.length).toBeGreaterThan(0);
    });
  });

  describe('inefficient pattern detection', () => {
    it('should detect inefficient array operations', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      const findings = result.data.findings;
      expect(findings.length).toBeGreaterThan(0);
    });

    it('should detect O(n^2) algorithms', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/inefficient.js');
      const result = await analyzer.analyze(fixturePath);

      const quadraticFindings = result.data.findings.filter(
        (f) =>
          f.message.toLowerCase().includes('n^2') || f.message.toLowerCase().includes('quadratic')
      );
      expect(quadraticFindings.length).toBeGreaterThan(0);
    });

    it('should detect string concatenation in loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/inefficient.js');
      const result = await analyzer.analyze(fixturePath);

      const stringConcatFindings = result.data.findings.filter(
        (f) =>
          f.type === 'INEFFICIENT_STRING_CONCAT' ||
          f.message.toLowerCase().includes('string concatenation')
      );
      expect(stringConcatFindings.length).toBeGreaterThan(0);
    });
  });

  describe('optimization suggestions', () => {
    it('should provide suggestions for detected issues', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('should prioritize suggestions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      const suggestions = result.data.suggestions;
      expect(suggestions.some((s) => s.priority === 'high')).toBe(true);
    });

    it('should include examples in suggestions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/inefficient.js');
      const result = await analyzer.analyze(fixturePath);

      const suggestionsWithExamples = result.data.suggestions.filter((s) => s.example);
      expect(suggestionsWithExamples.length).toBeGreaterThan(0);
    });
  });

  describe('metrics', () => {
    it('should provide complexity metrics', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.data.metrics.totalFunctions).toBeDefined();
      expect(result.data.metrics.totalLoops).toBeDefined();
    });

    it('should track analysis duration', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await analyzer.analyze(fixturePath);

      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
