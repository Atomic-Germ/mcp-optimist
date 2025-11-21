# Release Process

## Overview

The MCP Optimist project uses automated CI/CD with GitHub Actions for releases.

## CI/CD Pipeline

The workflow consists of 4 sequential jobs:

1. **Lint** - Code quality checks
2. **Test** - Run all tests with coverage
3. **Build** - Compile TypeScript to JavaScript
4. **Release** - Publish to npm and GitHub (tags only)

Each job depends on the previous one succeeding.

## Workflow Triggers

### Continuous Integration (PR & Push)

- Runs: Lint → Test → Build
- Triggers on:
  - Pull requests to `main`
  - Pushes to `main` branch

### Release (Tags)

- Runs: Lint → Test → Build → Release
- Triggers on: Tags matching `v*` (e.g., `v0.1.0`, `v1.0.0`)

## Creating a Release

### 1. Prepare the Release

Update version and changelog:

```bash
# Update version in package.json
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0

# Or manually:
npm version 1.0.0 --no-git-tag-version
```

### 2. Commit Changes

```bash
git add package.json
git commit -m "chore: bump version to v1.0.0"
git push origin main
```

### 3. Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: Phase 2 Complete

- Performance Analyzer
- Memory Optimizer
- Complexity Analyzer
- Code Smell Detector
- 78 tests passing"

# Push tag to trigger release
git push origin v1.0.0
```

### 4. Automated Release Process

Once the tag is pushed, GitHub Actions will:

1. ✅ Lint the code
2. ✅ Run all tests with coverage
3. ✅ Build the project
4. ✅ Create GitHub Release with:
   - Release notes (auto-generated)
   - Build artifacts
   - Version from tag
5. ✅ Publish to npm (if NPM_TOKEN is configured)

## Version Naming

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Pre-release Tags

For pre-release versions:

```bash
v1.0.0-alpha.1
v1.0.0-beta.1
v1.0.0-rc.1
```

These will be marked as "pre-release" in GitHub.

## Required Secrets

Configure these in GitHub repository settings:

### NPM_TOKEN (Optional)

For automatic npm publishing:

1. Go to [npmjs.com](https://npmjs.com) → Account → Access Tokens
2. Create "Automation" token
3. Add to GitHub: Settings → Secrets → Actions → New secret
4. Name: `NPM_TOKEN`

### GITHUB_TOKEN (Automatic)

Automatically provided by GitHub Actions - no configuration needed.

## Release Checklist

Before creating a release tag:

- [ ] All tests passing locally (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Format check passes (`npm run format:check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated (if exists)
- [ ] Documentation updated
- [ ] README.md reflects new features

## Rollback

If a release has issues:

```bash
# Delete remote tag
git push origin :refs/tags/v1.0.0

# Delete local tag
git tag -d v1.0.0

# Delete GitHub release (via GitHub UI or gh CLI)
gh release delete v1.0.0

# Unpublish from npm (within 72 hours)
npm unpublish mcp-optimist@1.0.0
```

## Manual Release

If automated release fails, publish manually:

```bash
# Build the project
npm run build

# Publish to npm
npm publish

# Create GitHub release
gh release create v1.0.0 \
  --title "Release v1.0.0" \
  --notes "Release notes here" \
  dist/*
```

## Monitoring

Track release status:

- **GitHub Actions**: [Actions tab](https://github.com/username/mcp-optimist/actions)
- **npm**: [npmjs.com/package/mcp-optimist](https://npmjs.com/package/mcp-optimist)
- **Releases**: [GitHub Releases](https://github.com/username/mcp-optimist/releases)

## Troubleshooting

### Release job skipped

- Ensure tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Verify tag was pushed: `git push origin --tags`

### npm publish fails

- Check NPM_TOKEN is configured
- Verify package name isn't taken
- Ensure version isn't already published

### Build artifacts missing

- Check previous jobs succeeded
- Verify artifact upload/download steps
- Check retention period (7 days default)

## Examples

### Patch Release

```bash
npm version patch
git push origin main
git tag -a v0.1.1 -m "Fix: Memory leak in event listeners"
git push origin v0.1.1
```

### Minor Release

```bash
npm version minor
git push origin main
git tag -a v0.2.0 -m "Feature: Add dependency analyzer"
git push origin v0.2.0
```

### Major Release

```bash
npm version major
git push origin main
git tag -a v1.0.0 -m "Release: Production-ready with all Phase 2 tools"
git push origin v1.0.0
```

## Current Release Status

- **Latest Version**: v0.1.0
- **Phase**: Phase 2 Complete (4/4 tools)
- **Status**: Production Ready
- **Tests**: 78/78 passing

---

**Next Release Target**: v1.0.0 (First stable release)
