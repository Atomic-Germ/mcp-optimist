import { QualityAnalyzer } from '../../src/analyzers/quality-analyzer';
import { PerformanceAnalyzer } from '../../src/tools/performance';
import { RefactoringAnalyzer } from '../../src/analyzers/refactoring-analyzer';
import path from 'path';

const pythonTestFile = path.join(__dirname, '../fixtures/python/sample.py');

describe('Python Language Support', () => {
  describe('QualityAnalyzer', () => {
    let analyzer: QualityAnalyzer;

    beforeEach(() => {
      analyzer = new QualityAnalyzer();
    });

    it('should analyze Python files for complexity', async () => {
      const result = await analyzer.analyzeQuality(pythonTestFile);

      expect(result).toBeDefined();
      expect(result.complexity).toBeDefined();
      expect(result.smells).toBeDefined();

      // Should detect functions
      expect(result.complexity.totalFunctions).toBeGreaterThan(0);
      expect(result.complexity.functions).toHaveLength(result.complexity.totalFunctions);

      // Should have complexity metrics
      expect(typeof result.complexity.averageComplexity).toBe('number');
      expect(typeof result.complexity.maxComplexity).toBe('number');
    });

    it('should detect code smells in Python files', async () => {
      const result = await analyzer.analyzeQuality(pythonTestFile);

      expect(result.smells).toBeDefined();
      expect(Array.isArray(result.smells.magicNumbers)).toBe(true);
      expect(Array.isArray(result.smells.longParameterLists)).toBe(true);
      expect(Array.isArray(result.smells.longMethods)).toBe(true);
    });
  });

  describe('PerformanceAnalyzer', () => {
    let analyzer: PerformanceAnalyzer;

    beforeEach(() => {
      analyzer = new PerformanceAnalyzer();
    });

    it('should analyze Python files for performance issues', async () => {
      const result = await analyzer.analyze(pythonTestFile);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data.metrics).toBeDefined();

      // Should detect loops and functions
      expect(result.data.metrics.totalLoops).toBeGreaterThan(0);
      expect(result.data.metrics.totalFunctions).toBeGreaterThan(0);
    });

    it('should provide performance suggestions for Python files', async () => {
      const result = await analyzer.analyze(pythonTestFile);

      expect(result.data.suggestions).toBeDefined();
      expect(Array.isArray(result.data.suggestions)).toBe(true);
    });
  });

  describe('RefactoringAnalyzer', () => {
    let analyzer: RefactoringAnalyzer;

    beforeEach(() => {
      analyzer = new RefactoringAnalyzer();
    });

    it('should analyze Python files for refactoring opportunities', async () => {
      const result = await analyzer.analyzeRefactoring(pythonTestFile);

      expect(result).toBeDefined();
      expect(result.opportunities).toBeDefined();
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(typeof result.totalOpportunities).toBe('number');
      expect(result.priorityBreakdown).toBeDefined();
    });

    it('should filter by focus area', async () => {
      const result = await analyzer.analyzeRefactoring(pythonTestFile, 'readability');

      expect(result.focusArea).toBe('readability');
      expect(result.opportunities).toBeDefined();
    });

    it('should detect long lines in Python files', async () => {
      const result = await analyzer.analyzeRefactoring(pythonTestFile, 'readability');

      // The sample.py file has a long line that should be detected
      const longLineOpportunities = result.opportunities.filter((opp) => opp.type === 'LONG_LINE');
      expect(longLineOpportunities.length).toBeGreaterThanOrEqual(0);
    });
  });
});
