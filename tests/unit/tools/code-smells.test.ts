import { CodeSmellDetector } from '../../../src/tools/code-smells';
import * as path from 'path';

describe('CodeSmellDetector', () => {
  let detector: CodeSmellDetector;

  beforeEach(() => {
    detector = new CodeSmellDetector();
  });

  describe('basic functionality', () => {
    it('should analyze a file without errors', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.tool).toBe('detect_code_smells');
    });

    it('should return proper result structure', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
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
      expect(result.tool).toBe('detect_code_smells');
      expect(result.data.summary).toContain('code smell');
      expect(result.metadata.filesAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('god object detection', () => {
    it('should detect classes with too many responsibilities', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/god-object.js');
      const result = await detector.analyze(fixturePath);

      const godObjectFindings = result.data.findings.filter(
        (f) => f.type === 'GOD_OBJECT' || f.message.toLowerCase().includes('too many')
      );
      expect(godObjectFindings.length).toBeGreaterThan(0);
    });

    it('should detect classes with too many methods', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/god-object.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.metrics.classesAnalyzed).toBeGreaterThan(0);
      expect(result.data.metrics.largeClasses).toBeGreaterThan(0);
    });
  });

  describe('long parameter list detection', () => {
    it('should detect functions with many parameters', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const paramFindings = result.data.findings.filter(
        (f) => f.type === 'LONG_PARAMETER_LIST' || f.message.toLowerCase().includes('parameter')
      );
      expect(paramFindings.length).toBeGreaterThan(0);
    });

    it('should suggest parameter objects', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const paramSuggestions = result.data.suggestions.filter(
        (s) =>
          s.description.toLowerCase().includes('parameter') ||
          s.description.toLowerCase().includes('object')
      );
      expect(paramSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('long method detection', () => {
    it('should detect methods that are too long', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const longMethodFindings = result.data.findings.filter(
        (f) => f.type === 'LONG_METHOD' || f.message.toLowerCase().includes('long')
      );
      expect(longMethodFindings.length).toBeGreaterThan(0);
    });
  });

  describe('magic numbers detection', () => {
    it('should detect magic numbers', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const magicNumberFindings = result.data.findings.filter(
        (f) => f.type === 'MAGIC_NUMBER' || f.message.toLowerCase().includes('magic')
      );
      expect(magicNumberFindings.length).toBeGreaterThan(0);
    });

    it('should suggest named constants', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const constantSuggestions = result.data.suggestions.filter((s) =>
        s.description.toLowerCase().includes('constant')
      );
      expect(constantSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('empty catch blocks', () => {
    it('should detect empty catch blocks', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const emptyCatchFindings = result.data.findings.filter(
        (f) => f.type === 'EMPTY_CATCH' || f.message.toLowerCase().includes('catch')
      );
      expect(emptyCatchFindings.length).toBeGreaterThan(0);
    });
  });

  describe('code duplication', () => {
    it('should detect duplicate code patterns', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/duplication.js');
      const result = await detector.analyze(fixturePath);

      // Should detect similar functions
      expect(result.data.metrics.functionsAnalyzed).toBeGreaterThan(0);
    });

    it('should provide metrics about duplication', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/duplication.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.metrics).toBeDefined();
    });
  });

  describe('metrics tracking', () => {
    it('should track total smells found', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.metrics.totalSmells).toBeDefined();
      expect(result.data.metrics.totalSmells).toBeGreaterThan(0);
    });

    it('should categorize by severity', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const findings = result.data.findings;
      const bySeverity = {
        critical: findings.filter((f) => f.severity === 'critical').length,
        high: findings.filter((f) => f.severity === 'high').length,
        medium: findings.filter((f) => f.severity === 'medium').length,
        low: findings.filter((f) => f.severity === 'low').length,
      };

      expect(bySeverity.high + bySeverity.medium + bySeverity.low).toBeGreaterThan(0);
    });
  });

  describe('suggestions', () => {
    it('should provide refactoring suggestions', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/god-object.js');
      const result = await detector.analyze(fixturePath);

      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('should include code examples', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      const suggestionsWithExamples = result.data.suggestions.filter((s) => s.example);
      expect(suggestionsWithExamples.length).toBeGreaterThan(0);
    });

    it('should prioritize critical issues', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/god-object.js');
      const result = await detector.analyze(fixturePath);

      const highPriority = result.data.suggestions.filter((s) => s.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });
  });

  describe('severity options', () => {
    it('should respect severity filter', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');

      const allResult = await detector.analyze(fixturePath);
      const highOnlyResult = await detector.analyze(fixturePath, { severity: 'high' });

      expect(highOnlyResult.data.findings.length).toBeLessThanOrEqual(
        allResult.data.findings.length
      );
    });
  });

  describe('analysis duration', () => {
    it('should track analysis time', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/smells/anti-patterns.js');
      const result = await detector.analyze(fixturePath);

      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
