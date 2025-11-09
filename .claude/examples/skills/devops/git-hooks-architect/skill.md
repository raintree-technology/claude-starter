---
name: git-hooks-architect
description: Use when setting up git hooks, configuring pre-commit validation, implementing commit message linting, or automating code quality checks. Creates production-ready git hooks with Husky, lint-staged, commitlint, and custom validation scripts for maintaining code quality and enforcing standards.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# Git Hooks Architect

## Purpose

This skill helps set up comprehensive git hooks for code quality automation. It covers:
- Pre-commit hooks (linting, formatting, type-checking)
- Pre-push hooks (testing, build validation)
- Commit-msg hooks (conventional commits enforcement)
- Husky configuration
- lint-staged setup
- commitlint configuration
- Custom validation scripts

## When to Use

This skill should be invoked when:
- User says "set up git hooks", "configure pre-commit", "add commit linting"
- User wants to "enforce code quality", "prevent bad commits", "validate commits"
- User mentions "Husky", "lint-staged", "commitlint", "pre-commit hooks"
- User asks about "commit message validation", "pre-push testing"
- User wants to "automate linting before commit", "run tests before push"
- User needs to "enforce conventional commits", "validate commit format"

## Process

### 1. Understand Requirements

Ask the user:
- **What should be validated?** (lint, format, types, tests)
- **When to validate?** (pre-commit, pre-push, commit-msg)
- **What tools are used?** (ESLint, Prettier, TypeScript, Jest, etc.)
- **Commit message format?** (conventional commits, custom format)
- **Strictness level?** (warnings vs errors, blocking vs advisory)

### 2. Install Dependencies

Install required packages:

```bash
# Core git hooks framework
npm install --save-dev husky

# Run commands on staged files only
npm install --save-dev lint-staged

# Commit message linting (optional)
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### 3. Initialize Husky

Set up Husky in the project:

```bash
# Initialize Husky
npx husky init

# This creates:
# - .husky/ directory
# - .husky/pre-commit (example hook)
# - Updates package.json with prepare script
```

### 4. Configure Pre-Commit Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged on staged files
npx lint-staged

# Optional: Check for secrets
if git diff --cached --name-only | grep -E '\.(env|pem|key)$'; then
  echo "❌ Error: Attempting to commit sensitive files"
  exit 1
fi
```

### 5. Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.ts?(x)": [
      "bash -c 'tsc --noEmit'"
    ]
  }
}
```

Or create `.lintstagedrc.js`:

```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.ts?(x)': () => 'tsc --noEmit',
}
```

### 6. Configure Pre-Push Hook

Create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests before pushing
npm test

# Optional: Run build to catch build errors
npm run build

# Optional: Check branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "❌ Error: Direct push to $BRANCH is not allowed"
  echo "Create a feature branch and open a PR instead"
  exit 1
fi
```

### 7. Configure Commit Message Hook

Create `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Lint commit message
npx --no -- commitlint --edit $1
```

Create `commitlint.config.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code restructuring
        'perf',     // Performance
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI/CD
        'chore',    // Maintenance
        'revert',   // Revert commit
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'header-max-length': [2, 'always', 72],
  },
}
```

### 8. Add Custom Validation Scripts

Create `.husky/scripts/validate-branch.sh`:

```bash
#!/bin/bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)
VALID_BRANCH_REGEX="^(feature|bugfix|hotfix|release)\/[a-z0-9._-]+$|^(main|develop)$"

if ! [[ $BRANCH =~ $VALID_BRANCH_REGEX ]]; then
  echo "❌ Invalid branch name: $BRANCH"
  echo ""
  echo "Branch names must match:"
  echo "  feature/description"
  echo "  bugfix/description"
  echo "  hotfix/description"
  echo "  release/version"
  echo ""
  echo "Example: feature/add-user-auth"
  exit 1
fi
```

### 9. Add Package.json Scripts

Update `package.json`:

```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "validate": "npm run lint && npm run type-check && npm test"
  }
}
```

### 10. Document Setup

Add to README.md:

```markdown
## Git Hooks

This project uses git hooks to maintain code quality:

- **Pre-commit**: Lints and formats staged files
- **Pre-push**: Runs tests and build validation
- **Commit-msg**: Validates commit message format

### Setup

Hooks are installed automatically when you run:

\`\`\`bash
npm install
\`\`\`

### Bypassing Hooks (Emergency Only)

\`\`\`bash
git commit --no-verify
git push --no-verify
\`\`\`

### Commit Message Format

Follow conventional commits:

\`\`\`
type(scope): subject

body

footer
\`\`\`

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore
```

## Output Format

Create the following files:
- `.husky/pre-commit` - Lint and format staged files
- `.husky/pre-push` - Run tests and validation
- `.husky/commit-msg` - Validate commit messages
- `.lintstagedrc.js` - Configure file-specific linting
- `commitlint.config.js` - Commit message rules
- Update `package.json` with scripts and lint-staged config

## Hook Templates

### Template 1: Complete Node.js/TypeScript Setup

**package.json**:
```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "bash -c 'tsc --noEmit'"
    ],
    "*.{json,md}": ["prettier --write"]
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0"
  }
}
```

**.husky/pre-commit**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**.husky/pre-push**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npm test
```

**.husky/commit-msg**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

### Template 2: Python Project

**pre-commit** (using pre-commit framework):
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.12.0
    hooks:
      - id: black

  - repo: https://github.com/PyCQA/flake8
    rev: 6.1.0
    hooks:
      - id: flake8

  - repo: https://github.com/PyCQA/isort
    rev: 5.13.0
    hooks:
      - id: isort
```

Install and set up:
```bash
pip install pre-commit
pre-commit install
```

### Template 3: Security-Focused Hooks

**.husky/pre-commit**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Check for secrets
if git diff --cached --name-only | grep -E '\.(env|pem|key|p12)$'; then
  echo "❌ Error: Attempting to commit sensitive files"
  exit 1
fi

# Scan for hardcoded secrets
if git diff --cached | grep -iE '(api[-_]?key|secret|password|token).*=.*["\'][^"\']+["\']'; then
  echo "⚠️  Warning: Possible hardcoded secret detected"
  echo "Please review your changes carefully"
  # Uncomment to block commit:
  # exit 1
fi

# Check for large files (>5MB)
git diff --cached --name-only | while read FILE; do
  if [ -f "$FILE" ]; then
    SIZE=$(wc -c < "$FILE")
    if [ $SIZE -gt 5242880 ]; then
      echo "❌ Error: File too large: $FILE ($(($SIZE / 1048576))MB)"
      exit 1
    fi
  fi
done
```

### Template 4: Advanced Validation

**.husky/scripts/validate-all.sh**:
```bash
#!/bin/bash
set -e

echo "🔍 Running validations..."

# TypeScript compilation
echo "📝 Type checking..."
npm run type-check

# Linting
echo "🧹 Linting..."
npm run lint

# Tests
echo "🧪 Running tests..."
npm test

# Build
echo "🏗️  Building..."
npm run build

# Check bundle size
echo "📦 Checking bundle size..."
SIZE=$(du -sh dist/ | cut -f1)
echo "Bundle size: $SIZE"

echo "✅ All validations passed!"
```

## Best Practices

### Performance
- Use lint-staged to run on changed files only (not entire codebase)
- Run heavy operations (tests, build) in pre-push, not pre-commit
- Cache TypeScript compilation results
- Use incremental type-checking
- Run tests in watch mode during development

### Developer Experience
- Make hooks fast (< 10 seconds for pre-commit)
- Provide clear error messages
- Allow bypass with `--no-verify` for emergencies
- Document bypass procedure
- Auto-fix issues when possible (ESLint --fix, Prettier)

### Reliability
- Test hooks work on all team members' machines
- Handle missing tools gracefully
- Don't block commits on warnings, only errors
- Provide helpful error messages
- Test hooks in CI as well

### Security
- Scan for secrets and sensitive files
- Block large files from being committed
- Validate branch naming conventions
- Check for known vulnerable dependencies
- Prevent direct commits to protected branches

### Maintenance
- Keep dependencies updated
- Document hook behavior in README
- Use consistent patterns across hooks
- Version control hook configuration
- Test hooks after updates

## Examples

### Example 1: Basic Next.js Setup

**User**: "Set up git hooks for my Next.js project"

**Process**:
1. Install Husky and lint-staged
2. Create pre-commit hook with ESLint and Prettier
3. Create pre-push hook with type-check and tests
4. Configure lint-staged for TS/TSX files
5. Add documentation to README

**Output**: Complete git hooks setup with linting and testing

### Example 2: Enforce Conventional Commits

**User**: "I want to enforce conventional commit messages"

**Process**:
1. Install commitlint packages
2. Create commitlint.config.js
3. Create commit-msg hook
4. Document commit format in README
5. Provide examples of valid commits

**Output**: Commit message validation with helpful errors

### Example 3: Prevent Main Branch Commits

**User**: "Block direct commits to main branch"

**Process**:
1. Create pre-commit hook
2. Check current branch name
3. Exit with error if on main
4. Provide helpful message about PR workflow

**Output**: Protection against accidental main commits

## Error Handling

- **Hooks not running**: Check `.husky/` directory exists and scripts are executable
- **Permission denied**: Run `chmod +x .husky/*` to make hooks executable
- **Command not found**: Ensure dependencies are installed (`npm install`)
- **Hooks too slow**: Move heavy operations to pre-push or CI
- **Failed to lint**: Check ESLint configuration and file patterns
- **Commitlint failures**: Review commit message format requirements

## Notes

- Hooks are stored in `.husky/` directory (version controlled)
- Hooks run locally before git operations
- Team members must run `npm install` to activate hooks
- Use `--no-verify` to bypass hooks (sparingly)
- Husky v9+ uses simpler configuration than older versions
- Hooks complement CI/CD, don't replace it
- Test hooks thoroughly before enforcing them
- Consider gradual rollout (warnings before errors)
- Document bypass procedures for emergency situations
