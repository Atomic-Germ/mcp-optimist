export const DEFAULT_IGNORES = [
  'node_modules',
  'dist',
  'build',
  'out',
  '.venv',
  '.venv/',
  '.git',
  '.next',
  'coverage',
  'archive',
  '.cache',
  'run',
];

export function toGlobIgnores(list: string[]): string[] {
  // Convert directory names to simple glob ignore patterns
  return list.flatMap((item) => {
    // If it already looks like a glob, pass it through
    if (item.includes('*') || item.includes('?') || item.includes('[')) {
      return [item];
    }

    // Ensure patterns ignore both the directory and anything under it
    const clean = item.replace(/\//g, '/').replace(/^\/+|\/+$/g, '');
    return [`**/${clean}/**`, `**/${clean}`];
  });
}
