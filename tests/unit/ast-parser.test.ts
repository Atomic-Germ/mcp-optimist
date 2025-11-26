import { ASTParser } from '../../src/analyzers/ast-parser';
import * as path from 'path';
import * as fs from 'fs';

describe('ASTParser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  describe('expandPath', () => {
    const testDir = path.resolve(__dirname, '../fixtures');

    it('should expand a single file path', () => {
      const filePath = path.join(testDir, 'complexity/simple.js');
      const result = parser.expandPath(filePath);

      expect(result).toEqual([filePath]);
    });

    it('should expand a directory path', () => {
      const result = parser.expandPath(testDir);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((file: string) => {
        expect(file).toMatch(/\.(js|ts|jsx|tsx|py)$/);
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    it('should expand glob patterns', () => {
      const globPattern = path.join(testDir, '**/*.js');
      const result = parser.expandPath(globPattern);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((file: string) => {
        expect(file).toMatch(/\.js$/);
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    describe('default ignore behavior', () => {
      it('should skip node_modules by default', () => {
        // Create a mock directory structure with node_modules
        const mockDir = path.join(__dirname, 'mock-project');
        const nodeModulesDir = path.join(mockDir, 'node_modules');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');

        // Create directories and file
        fs.mkdirSync(nodeModulesDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');

        try {
          const result = parser.expandPath(mockDir);

          // Should include the test file but not anything from node_modules
          expect(result).toContain(testFile);
          expect(result.some((file: string) => file.includes('node_modules'))).toBe(false);
        } finally {
          // Cleanup
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });

      it('should skip dist directory by default', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const distDir = path.join(mockDir, 'dist');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');

        fs.mkdirSync(distDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');

        try {
          const result = parser.expandPath(mockDir);

          expect(result).toContain(testFile);
          expect(result.some((file: string) => file.includes('dist'))).toBe(false);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });

      it('should skip .venv directory by default', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const venvDir = path.join(mockDir, '.venv');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');

        fs.mkdirSync(venvDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');

        try {
          const result = parser.expandPath(mockDir);

          expect(result).toContain(testFile);
          expect(result.some((file: string) => file.includes('.venv'))).toBe(false);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });
    });

    describe('includeIgnored option', () => {
      it('should include ignored directories when includeIgnored is true', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const nodeModulesDir = path.join(mockDir, 'node_modules');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');
        const nodeModulesFile = path.join(nodeModulesDir, 'index.js');

        fs.mkdirSync(nodeModulesDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');
        fs.writeFileSync(nodeModulesFile, 'console.log("node_modules");');

        try {
          const result = parser.expandPath(mockDir, { includeIgnored: true });

          expect(result).toContain(testFile);
          expect(result).toContain(nodeModulesFile);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });

      it('should include dist files when includeIgnored is true', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const distDir = path.join(mockDir, 'dist');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');
        const distFile = path.join(distDir, 'bundle.js');

        fs.mkdirSync(distDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');
        fs.writeFileSync(distFile, 'console.log("bundled");');

        try {
          const result = parser.expandPath(mockDir, { includeIgnored: true });

          expect(result).toContain(testFile);
          expect(result).toContain(distFile);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });
    });

    describe('overrideIgnore option', () => {
      it('should use custom ignore list when overrideIgnore is provided', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const customIgnoreDir = path.join(mockDir, 'custom-ignore');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');
        const customFile = path.join(customIgnoreDir, 'file.js');

        fs.mkdirSync(customIgnoreDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');
        fs.writeFileSync(customFile, 'console.log("custom");');

        try {
          const result = parser.expandPath(mockDir, { overrideIgnore: ['custom-ignore'] });

          expect(result).toContain(testFile);
          expect(result).not.toContain(customFile);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });

      it('should not ignore anything when overrideIgnore is empty array', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const nodeModulesDir = path.join(mockDir, 'node_modules');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');
        const nodeModulesFile = path.join(nodeModulesDir, 'index.js');

        fs.mkdirSync(nodeModulesDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');
        fs.writeFileSync(nodeModulesFile, 'console.log("node_modules");');

        try {
          const result = parser.expandPath(mockDir, { overrideIgnore: [] });

          expect(result).toContain(testFile);
          expect(result).toContain(nodeModulesFile);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });
    });

    describe('glob patterns with ignores', () => {
      it('should respect ignores in glob patterns', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const nodeModulesDir = path.join(mockDir, 'node_modules');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');
        const nodeModulesFile = path.join(nodeModulesDir, 'index.js');

        fs.mkdirSync(nodeModulesDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');
        fs.writeFileSync(nodeModulesFile, 'console.log("node_modules");');

        try {
          const result = parser.expandPath(path.join(mockDir, '**/*.js'));

          expect(result).toContain(testFile);
          expect(result).not.toContain(nodeModulesFile);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });

      it('should include ignored files in glob patterns when includeIgnored is true', () => {
        const mockDir = path.join(__dirname, 'mock-project');
        const nodeModulesDir = path.join(mockDir, 'node_modules');
        const srcDir = path.join(mockDir, 'src');
        const testFile = path.join(srcDir, 'test.js');
        const nodeModulesFile = path.join(nodeModulesDir, 'index.js');

        fs.mkdirSync(nodeModulesDir, { recursive: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(testFile, 'console.log("test");');
        fs.writeFileSync(nodeModulesFile, 'console.log("node_modules");');

        try {
          const result = parser.expandPath(path.join(mockDir, '**/*.js'), {
            includeIgnored: true,
          });

          expect(result).toContain(nodeModulesFile);
        } finally {
          fs.rmSync(mockDir, { recursive: true, force: true });
        }
      });
    });
  });

  describe('parseFile', () => {
    it('should parse a JavaScript file successfully', () => {
      const filePath = path.resolve(__dirname, '../fixtures/complexity/simple.js');
      const result = parser.parseFile(filePath);

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.filePath).toBe(filePath);
    });

    it('should throw error for unsupported file extension', () => {
      const mockFile = path.join(__dirname, 'test.txt');
      fs.writeFileSync(mockFile, 'test content');

      try {
        expect(() => parser.parseFile(mockFile)).toThrow('Unsupported file extension');
      } finally {
        fs.unlinkSync(mockFile);
      }
    });
  });
});
