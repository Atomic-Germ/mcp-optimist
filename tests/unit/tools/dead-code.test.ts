import { DeadCodeDetector } from '../../../src/tools/dead-code';
import * as path from 'path';

describe('DeadCodeDetector', () => {
  let detector: DeadCodeDetector;

  beforeEach(() => {
    detector = new DeadCodeDetector();
  });

  describe('basic functionality', () => {
    it('should analyze a file without errors', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await detector.analyze(fixturePath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('find_dead_code');
    });

    it('should return proper result structure', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.data.findings).toBeInstanceOf(Array);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.metrics).toBeDefined();
      expect(result.metadata.filesAnalyzed).toBe(1);
    });

    it('should handle directory paths with proper success message', async () => {
      const directoryPath = path.join(__dirname, '../../fixtures');
      const result = await detector.analyze(directoryPath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('find_dead_code');
      expect(result.data.summary).toContain('dead code');
      expect(result.metadata.filesAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('dead code detection', () => {
    it('should detect unused functions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await detector.analyze(fixturePath);

      const unusedFunctionFindings = result.data.findings.filter(
        (f) => f.type === 'UNUSED_FUNCTION'
      );

      expect(unusedFunctionFindings.length).toBeGreaterThan(0);
      expect(result.data.metrics.unusedFunctions).toBeGreaterThan(0);
    });

    it('should not detect dead code in simple files', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/simple.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.findings.length).toBe(0);
      expect(result.data.metrics.totalDeadCode).toBe(0);
    });

    it('should provide actionable suggestions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.suggestions.length).toBeGreaterThan(0);
      result.data.suggestions.forEach((suggestion) => {
        expect(suggestion.type).toMatch(/^REMOVE_UNUSED_/);
        expect(suggestion.description).toBeDefined();
        expect(suggestion.example).toBeDefined();
      });
    });
  });

  describe('metrics calculation', () => {
    it('should calculate correct metrics', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/complexity/complex.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.metrics.totalDeadCode).toBe(
        result.data.metrics.unusedVariables +
        result.data.metrics.unusedFunctions +
        result.data.metrics.unusedImports
      );
    });

    it('should aggregate results from multiple files', async () => {
      const directoryPath = path.join(__dirname, '../../fixtures/complexity');
      const result = await detector.analyze(directoryPath);

      expect(result.metadata.filesAnalyzed).toBeGreaterThan(1);
      expect(typeof result.data.metrics.totalDeadCode).toBe('number');
    });
  });
});