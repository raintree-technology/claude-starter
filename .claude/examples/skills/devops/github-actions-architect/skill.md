---
name: github-actions-architect
description: Use when creating GitHub Actions workflows, setting up CI/CD pipelines, automating testing and deployment, or configuring workflow files. Generates production-ready workflows for testing, linting, building, deploying, and releasing projects with best practices for caching, matrix builds, and secrets management.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# GitHub Actions Architect

## Purpose

This skill helps create production-ready GitHub Actions workflows for CI/CD automation. It covers:
- Test and lint automation
- Build and deploy workflows
- Release automation
- Security scanning
- Dependency management
- Matrix builds for multiple environments
- Caching strategies
- Secrets and environment management

## When to Use

This skill should be invoked when:
- User says "create GitHub Actions workflow", "set up CI/CD", "automate tests"
- User wants to "add deployment workflow", "set up GitHub Actions"
- User mentions "continuous integration", "continuous deployment", "CI/CD pipeline"
- User asks about "workflow automation", "GitHub Actions best practices"
- User needs to "deploy to Vercel/AWS/etc via GitHub Actions"
- User wants to "automate releases", "publish to npm"

## Process

### 1. Understand Requirements

Ask the user:
- **What should the workflow do?** (test, build, deploy, release, etc.)
- **When should it run?** (on push, PR, tag, schedule, manual)
- **What tech stack?** (Node.js, Python, Go, Rust, etc.)
- **Where to deploy?** (Vercel, AWS, Docker Hub, npm, PyPI, etc.)
- **Any specific requirements?** (matrix builds, secrets, environments)

### 2. Determine Workflow Type

Select appropriate template:
- **CI (Continuous Integration)**: Test + lint on every push/PR
- **CD (Continuous Deployment)**: Deploy to staging/production on push
- **Release**: Publish packages or create releases on tag
- **Security**: Scan dependencies and code for vulnerabilities
- **Composite**: Multiple jobs for complex pipelines

### 3. Create Workflow File

Generate `.github/workflows/[name].yml` with proper structure:

```yaml
name: Workflow Name
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Step name
        run: command
```

### 4. Add Proper Triggers

Configure `on:` based on use case:

**Push to branches:**
```yaml
on:
  push:
    branches: [main, develop]
```

**Pull requests:**
```yaml
on:
  pull_request:
    branches: [main]
```

**Tags (for releases):**
```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

**Schedule (cron):**
```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

**Manual trigger:**
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
```

### 5. Implement Caching

Add caching for dependencies to speed up workflows:

**Node.js:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

**Python:**
```yaml
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    cache: 'pip'
```

**Custom cache:**
```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
```

### 6. Add Matrix Builds

For testing across multiple versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

### 7. Configure Secrets and Environments

**Using secrets:**
```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: npm run deploy
```

**Using environments:**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to prod
        run: deploy.sh
```

### 8. Add Conditional Execution

Run steps based on conditions:

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: npm run deploy

- name: Comment on PR
  if: github.event_name == 'pull_request'
  run: gh pr comment --body "Tests passed"
```

### 9. Implement Status Checks

Add useful outputs and summaries:

```yaml
- name: Test
  run: npm test

- name: Upload coverage
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: coverage/

- name: Comment PR with results
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        body: 'Tests passed!'
      })
```

### 10. Optimize for Performance

Best practices:
- Use specific action versions (v4, not @latest)
- Enable dependency caching
- Run jobs in parallel when possible
- Use concurrency groups to cancel outdated runs
- Minimize Docker layer rebuilds

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Output Format

Create workflow files in `.github/workflows/` directory:
- `ci.yml` - Test and lint
- `deploy.yml` - Deployment workflow
- `release.yml` - Release automation
- `security.yml` - Security scanning

Each file should include:
- Clear name and description
- Appropriate triggers
- Proper caching
- Status reporting
- Error handling

## Workflow Templates

### Template 1: Node.js CI (Test + Lint)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### Template 2: Vercel Deployment

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.event_name == 'push' && '--prod' || '' }}
```

### Template 3: Release Automation

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Template 4: Security Scanning

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

### Template 5: Python CI

```yaml
name: Python CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11', '3.12']
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run linter
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Run tests
        run: pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Best Practices

### Security
- Never hardcode secrets in workflow files
- Use GitHub Secrets for sensitive data
- Use environments for production deployments
- Set minimum permissions required (`contents: read`)
- Pin action versions (not @latest)
- Use `pull_request_target` carefully (security risk)

### Performance
- Cache dependencies (npm, pip, cargo, etc.)
- Use matrix builds for parallel testing
- Set concurrency groups to cancel outdated runs
- Minimize checkout depth for faster clones
- Use self-hosted runners for private repos (optional)

### Reliability
- Add timeout limits (`timeout-minutes: 10`)
- Use `continue-on-error: true` for non-critical steps
- Add retry logic for flaky tests
- Use `if: always()` for cleanup steps
- Set up notifications for failures

### Maintainability
- Name jobs and steps clearly
- Add comments for complex logic
- Use reusable workflows for common patterns
- Keep workflows focused (one purpose per file)
- Document required secrets in README

## Examples

### Example 1: Set up CI for Next.js app

**User**: "Set up GitHub Actions for my Next.js app with testing and linting"

**Process**:
1. Create `.github/workflows/ci.yml`
2. Add triggers for push and pull_request
3. Set up Node.js with caching
4. Install dependencies with `npm ci`
5. Run linter, type-check, and tests
6. Upload coverage to Codecov

**Output**: CI workflow that runs on every push/PR

### Example 2: Deploy to Vercel

**User**: "I want to deploy to Vercel on every push to main"

**Process**:
1. Create `.github/workflows/deploy.yml`
2. Add trigger for push to main
3. Set up Vercel action
4. Configure secrets (VERCEL_TOKEN, ORG_ID, PROJECT_ID)
5. Add conditional deployment (preview for PRs, production for main)

**Output**: Deployment workflow with preview and production

### Example 3: Automated releases

**User**: "Automate npm publishing when I create a release tag"

**Process**:
1. Create `.github/workflows/release.yml`
2. Trigger on tag push (`v*.*.*`)
3. Build and test
4. Publish to npm registry
5. Create GitHub release with notes

**Output**: Complete release automation

## Error Handling

- **Workflow not triggering**: Check trigger configuration and branch names
- **Cache not working**: Verify cache key includes dependency file hash
- **Secrets not found**: Ensure secrets are set in repository settings
- **Permission denied**: Add required permissions to job or workflow
- **Timeout**: Add `timeout-minutes` or optimize slow steps
- **Matrix build failures**: Check compatibility across versions

## Notes

- GitHub Actions minutes are limited on free plan (2000/month)
- Private repos consume minutes, public repos are free
- Use self-hosted runners for unlimited minutes
- Workflows are YAML, indentation matters
- Use GitHub CLI (`gh`) for testing workflows locally
- Monitor workflow runs at `github.com/user/repo/actions`
- Set up branch protection rules to require status checks
