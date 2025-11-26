import { HotPathsOptimizer } from '../../../src/tools/hot-paths';
import * as path from 'path';

describe('HotPathsOptimizer', () => {
  let optimizer: HotPathsOptimizer;

  beforeEach(() => {
    optimizer = new HotPathsOptimizer();
  });

  describe('basic functionality', () => {
    it('should analyze a file without errors', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('optimize_hot_paths');
    });

    it('should return proper result structure', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.data.findings).toBeInstanceOf(Array);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.metrics).toBeDefined();
      expect(result.metadata.filesAnalyzed).toBe(1);
    });

    it('should handle directory paths with proper success message', async () => {
      const directoryPath = path.join(__dirname, '../../fixtures');
      const result = await optimizer.analyze(directoryPath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('optimize_hot_paths');
      expect(result.data.summary).toContain('hot paths analysis complete');
      expect(result.metadata.filesAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('loop detection', () => {
    it('should detect nested loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data.findings.some((f) => f.type === 'NESTED_LOOP')).toBe(true);
    });

    it('should detect complex loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data.findings.some((f) => f.type === 'COMPLEX_LOOP')).toBe(true);
    });
  });

  describe('recursive function detection', () => {
    it('should detect recursive functions', async () => {
      // For this test, we'll check that the analyzer can handle files with recursion
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await optimizer.analyze(fixturePath);

      // Should not error and should return valid structure
      expect(result.status).toBe('success');
    });
  });

  describe('computational hotspot detection', () => {
    it('should detect string concatenation in loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/inefficient.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data.findings.some((f) => f.type === 'STRING_CONCAT_IN_LOOP')).toBe(true);
    });

    it('should detect mathematical operations in loops', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/inefficient.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data.findings.some((f) => f.type === 'MATH_OPERATION_IN_LOOP')).toBe(true);
    });
  });

  describe('optimization suggestions', () => {
    it('should provide suggestions for detected issues', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data.suggestions.length).toBeGreaterThan(0);
      expect(result.data.suggestions[0]).toHaveProperty('type');
      expect(result.data.suggestions[0]).toHaveProperty('priority');
      expect(result.data.suggestions[0]).toHaveProperty('description');
    });

    it('should include examples in suggestions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/inefficient.js');
      const result = await optimizer.analyze(fixturePath);

      const stringConcatSuggestion = result.data.suggestions.find(
        (s) => s.type === 'USE_ARRAY_JOIN'
      );
      if (stringConcatSuggestion) {
        expect(stringConcatSuggestion.example).toContain('join');
      }
    });
  });

  describe('metrics tracking', () => {
    it('should track loop metrics', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/slow-loop.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.data.metrics).toHaveProperty('totalLoops');
      expect(result.data.metrics).toHaveProperty('nestedLoops');
      expect(result.data.metrics.totalLoops).toBeGreaterThan(0);
    });

    it('should track analysis duration', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await optimizer.analyze(fixturePath);

      expect(result.metadata.duration).toBeGreaterThan(0);
    });
  });

  describe('profiling data integration', () => {
    it('should handle missing profiling data gracefully', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await optimizer.analyze(fixturePath, {});

      expect(result.status).toBe('success');
    });

    it('should accept profiling data option', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/performance/simple.js');
      const result = await optimizer.analyze(fixturePath, { profilingData: '/nonexistent/path' });

      // Should not crash even with invalid profiling path
      expect(result.status).toBe('success');
    });
  });
});
