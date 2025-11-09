# Git Workflows Guide

Complete guide to automated git workflows, CI/CD, and deployment using Claude Code.

## Overview

This starter kit includes production-ready git automation:
- **Commands**: `/create-pr`, `/release`, `/commit` for common operations
- **Skills**: GitHub Actions, git hooks, Vercel deployment configuration
- **Workflows**: Pre-configured CI/CD pipelines
- **Templates**: PR templates, CODEOWNERS, issue templates

## Quick Start

### 1. Create a Feature

```bash
# Create feature branch
git checkout -b feature/add-authentication

# Make changes...

# Smart commit with conventional format
/commit
# Claude analyzes changes and suggests: "feat(auth): add email verification flow"

# Push and create PR
/create-pr
# Claude generates PR description from commits, links issues, adds labels
```

### 2. Review and Merge

```bash
# Review PR
/review-pr 123

# Merge via GitHub UI
# CI runs automatically (test, lint, deploy preview)
```

### 3. Create Release

```bash
# After merging to main
git checkout main
git pull

# Create release
/release minor
# Claude bumps version 1.0.0 → 1.1.0, generates changelog, creates GitHub release
```

## Commands

### /commit - Smart Commit Messages

Analyzes staged changes and generates conventional commit messages.

**Usage:**
```bash
# Stage your changes
git add .

# Generate commit message
/commit
```

**Example Output:**
```
feat(auth): add email verification flow

- Add email verification endpoint
- Implement token generation and validation
- Update user model with verified_at field

Closes #123
```

**Conventional Commit Format:**
```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `style`: Formatting changes
- `test`: Test changes
- `docs`: Documentation
- `build`: Build system
- `ci`: CI/CD changes
- `chore`: Maintenance

**Benefits:**
- Consistent commit history
- Automatic changelog generation
- Semantic versioning detection
- Better collaboration

### /create-pr - Automated Pull Requests

Creates PR with auto-generated title and description from commits.

**Usage:**
```bash
# Basic usage
/create-pr

# With custom title
/create-pr "Add user authentication"
```

**What it does:**
1. Analyzes all commits since branch diverged
2. Generates descriptive PR title
3. Creates structured PR description
4. Detects related issues from commit messages
5. Pushes branch to remote
6. Creates PR with labels
7. Returns PR URL

**Example PR Description:**
```markdown
## Summary
Implements email verification flow for user registration

## Changes
- Add /api/verify-email endpoint
- Implement JWT token generation for verification
- Update user schema with verified_at timestamp
- Add email verification tests

## Type of Change
- [x] New feature (non-breaking change)

## Related Issues
Closes #123
```

**Tips:**
- Use conventional commits for better PR descriptions
- Reference issues in commits with `#123` or `Fixes #123`
- Keep commits focused and atomic

### /release - Automated Releases

Creates releases with versioning, changelog, and publishing.

**Usage:**
```bash
# Auto-detect version bump
/release

# Explicit version bump
/release patch   # 1.0.0 → 1.0.1
/release minor   # 1.0.0 → 1.1.0
/release major   # 1.0.0 → 2.0.0

# Exact version
/release 2.0.0-beta.1
```

**What it does:**
1. Validates you're on main branch
2. Runs tests and build
3. Determines version bump from commits
4. Generates changelog from commits
5. Updates package.json
6. Creates git commit and tag
7. Pushes to remote
8. Creates GitHub release
9. Optionally publishes to npm

**Auto-versioning:**
- `BREAKING CHANGE:` → major
- `feat:` → minor
- `fix:` → patch

**Example Changelog:**
```markdown
## [1.1.0] - 2025-01-07

### ✨ Features
- Add email verification flow (abc1234)
- Implement password reset (def5678)

### 🐛 Bug Fixes
- Fix race condition in user creation (ghi9012)

### 📚 Documentation
- Update API documentation (jkl3456)
```

**Tips:**
- Always run `/build-safe` before releasing
- Use conventional commits for accurate versioning
- Test releases with pre-release versions first
- Never force-push tags

## Skills

### github-actions-architect

Generates production-ready GitHub Actions workflows.

**Use when:**
- "Set up GitHub Actions"
- "Create CI/CD workflow"
- "Automate testing"

**Capabilities:**
- Test and lint workflows
- Deploy to Vercel/AWS/etc
- Release automation
- Security scanning
- Matrix builds
- Caching strategies

**Example:**
```
User: "Set up CI for my Next.js app"

Claude: Creates .github/workflows/ci.yml with:
- Node.js setup and caching
- ESLint and TypeScript checks
- Jest tests with coverage
- Build validation
```

### git-hooks-architect

Sets up git hooks with Husky, lint-staged, commitlint.

**Use when:**
- "Set up git hooks"
- "Configure pre-commit"
- "Enforce commit messages"

**Capabilities:**
- Pre-commit: lint, format, type-check
- Pre-push: tests, build validation
- Commit-msg: conventional commits
- Custom validation scripts

**Example:**
```
User: "Add pre-commit hooks for linting"

Claude: Sets up:
- Husky installation
- lint-staged configuration
- Pre-commit hook with ESLint
- Prettier formatting
```

### vercel-deploy-architect

Configures Vercel deployments and optimization.

**Use when:**
- "Deploy to Vercel"
- "Configure vercel.json"
- "Set up Vercel environment variables"

**Capabilities:**
- vercel.json configuration
- Environment variables
- Preview deployments
- Edge functions
- Custom domains
- Performance optimization

**Example:**
```
User: "Deploy my Next.js app to Vercel"

Claude: Configures:
- vercel.json with Next.js settings
- Environment variable setup
- GitHub integration
- Preview and production deployments
```

## CI/CD Workflows

### ci.yml - Continuous Integration

Runs on every push and pull request.

**Jobs:**
1. **Lint**: ESLint, Prettier, type-checking
2. **Test**: Jest tests with coverage (Node 18, 20, 22)
3. **Build**: Production build validation

**Configuration:**
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

**Customize:**
```bash
# Edit workflow
vim .github/workflows/ci.yml

# Add more jobs, change Node versions, add steps
```

### deploy.yml - Continuous Deployment

Deploys to Vercel on push/PR.

**Features:**
- Production deployment on push to main
- Preview deployments for PRs
- Automatic PR comments with preview URL
- Environment variables from Vercel

**Setup:**
1. Add Vercel secrets to GitHub:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

2. Connect GitHub repo to Vercel project

**Customize:**
```yaml
# Deploy to different platform
- name: Deploy to AWS
  run: aws s3 sync dist/ s3://bucket
```

### release.yml - Release Automation

Triggers on tag push (v*.*.*)

**Features:**
- Runs tests and build
- Generates changelog
- Creates GitHub release
- Publishes to npm (optional)

**Usage:**
```bash
# Create tag (or use /release command)
git tag v1.0.0
git push origin v1.0.0

# Workflow runs automatically
# - Tests pass
# - Build succeeds
# - Release created
# - Package published
```

**Setup npm publishing:**
Add `NPM_TOKEN` secret to GitHub repository.

## Workflow Examples

### Example 1: Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/user-profiles

# 2. Make changes and commit
git add .
/commit
# → "feat(profiles): add user profile editing"

# 3. Create PR
/create-pr
# → Opens PR with description, labels, linked issues

# 4. CI runs automatically
# - Lint passes
# - Tests pass
# - Preview deployed to Vercel

# 5. Get review, merge PR

# 6. Delete branch
git branch -d feature/user-profiles
```

### Example 2: Bug Fix

```bash
# 1. Create fix branch
git checkout -b fix/login-validation

# 2. Fix bug and commit
/commit
# → "fix(auth): validate email format before submission"

# 3. Create PR
/create-pr "Fix email validation bug"

# 4. Merge after review

# 5. Release patch version
git checkout main
git pull
/release patch
# → 1.0.0 → 1.0.1
```

### Example 3: Major Release

```bash
# 1. Multiple features merged to main

# 2. Create release
git checkout main
git pull
/release major
# → 2.0.0

# 3. Workflow publishes to npm

# 4. Announce release
# Copy GitHub release URL and share
```

### Example 4: Hotfix to Production

```bash
# 1. Create hotfix from main
git checkout -b hotfix/security-patch

# 2. Apply fix
/commit
# → "fix(security): patch XSS vulnerability"

# 3. Create PR
/create-pr "Security hotfix"

# 4. Fast-track review

# 5. Merge and release immediately
/release patch
# → 1.0.1 with security fix

# 6. Deployed automatically to production
```

## Best Practices

### Commit Messages

**Good:**
```
feat(auth): add two-factor authentication

- Implement TOTP generation
- Add QR code display
- Store backup codes encrypted

Closes #234
```

**Bad:**
```
updated stuff
```

**Tips:**
- Use imperative mood ("add" not "added")
- Keep subject under 72 characters
- Explain the reasoning in the body, not only the changes
- Reference issues

### Pull Requests

**Good PR:**
- Clear title summarizing change
- Detailed description with context
- Tests included
- Documentation updated
- Screenshots for UI changes
- Links related issues

**Bad PR:**
- Generic title like "Updates"
- No description
- No tests
- Unrelated changes mixed together

**Tips:**
- Keep PRs focused (one feature/fix)
- Use PR template
- Request specific reviewers
- Respond to feedback promptly

### Releases

**Semantic Versioning:**
- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features (backward compatible)
- **Patch (1.0.0 → 1.0.1)**: Bug fixes

**Pre-releases:**
```bash
/release 2.0.0-beta.1   # Test major changes
/release 1.1.0-rc.1     # Release candidate
```

**Tips:**
- Test thoroughly before releasing
- Write clear release notes
- Document breaking changes
- Use pre-releases for major versions
- Never delete or force-push tags

### Git Hooks

**When to use:**
- Pre-commit: Fast checks (lint, format)
- Pre-push: Slower checks (tests, build)
- Commit-msg: Message validation

**Tips:**
- Keep pre-commit fast (< 10 seconds)
- Allow bypass for emergencies (`--no-verify`)
- Auto-fix when possible
- Clear error messages

### CI/CD

**Performance:**
- Cache dependencies
- Run jobs in parallel
- Use matrix builds efficiently
- Cancel outdated runs

**Reliability:**
- Set timeouts
- Retry flaky tests
- Monitor workflow status
- Keep secrets secure

**Cost:**
- Use free tier wisely (2000 min/month)
- Optimize slow jobs
- Use self-hosted runners for private repos

## Troubleshooting

### /commit not working

**Problem**: No staged changes
```bash
git status
git add .
/commit
```

### /create-pr fails

**Problem**: gh CLI not authenticated
```bash
gh auth login
```

**Problem**: No commits ahead of main
```bash
git log main..HEAD
# Make sure you have commits
```

### /release fails

**Problem**: Not on main branch
```bash
git checkout main
git pull
/release
```

**Problem**: Tests failing
```bash
npm test
# Fix tests first
```

### CI workflow failing

**Check logs:**
```bash
gh run list
gh run view <run-id>
```

**Common issues:**
- Missing secrets
- Wrong Node version
- Build errors
- Test failures

### Vercel deployment fails

**Check:**
1. Secrets configured: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
2. Project linked: `vercel link`
3. Build command correct in vercel.json
4. Environment variables set in Vercel dashboard

## Advanced Usage

### Custom Workflows

Create custom workflows in `.github/workflows/`:

```yaml
name: Custom Workflow
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  custom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/weekly-report.sh
```

### Monorepo Support

Configure for monorepos:

```yaml
# Only run on changes to specific package
on:
  push:
    paths:
      - 'packages/api/**'
```

### Matrix Builds

Test across multiple environments:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [18, 20, 22]
```

### Deployment Environments

Use GitHub environments:

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://example.com
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Docs](https://vercel.com/docs)
- [Husky Documentation](https://typicode.github.io/husky/)

## Summary

This starter kit provides:
- Smart commit message generation
- Automated PR creation with descriptions
- One-command releases with changelogs
- CI/CD workflows for testing and deployment
- Git hooks for code quality
- Vercel deployment automation
- Production-ready templates

Clone this setup into your projects for instant professional git workflows.
