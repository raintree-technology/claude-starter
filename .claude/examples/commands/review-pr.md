Comprehensive pull request review with security, quality, and performance checks.

Usage: `/review-pr [number|branch]`
- Without arguments: Reviews current branch changes against base branch
- With PR number: Reviews specific GitHub PR number
- With branch name: Reviews changes between current branch and specified branch

Execute the following review workflow:

1. **Identify Changes**
   ```bash
   # If PR number provided, use GitHub CLI
   gh pr view <number> --json files

   # Otherwise, use git diff
   git diff main...HEAD --name-only
   ```
   - List all changed files
   - Categorize by type (components, API, config, tests, etc.)

2. **Security Review**
   - Check for exposed secrets, API keys, tokens
   - Scan for PII (personally identifiable information)
   - Verify no hardcoded credentials
   - Check for SQL injection vulnerabilities
   - Validate input sanitization
   - Review authentication/authorization changes
   - Check CORS configuration changes
   - Use security-auditor agent for deep analysis

3. **Code Quality Review**
   ```bash
   # Run linter on changed files
   eslint <changed-files>

   # Run type checking
   tsc --noEmit
   ```
   - Check for linting errors
   - Verify TypeScript types are correct
   - Look for code smells (long functions, deep nesting, etc.)
   - Check for proper error handling
   - Verify logging is appropriate (no console.logs in production code)

4. **Performance Review**
   - Check for unnecessary re-renders (React)
   - Verify proper memoization where needed
   - Look for N+1 queries
   - Check for large bundle size increases
   - Review database query efficiency
   - Check for blocking operations in async code

5. **Testing Review**
   - Verify tests exist for new features
   - Check test coverage for changed files
   - Run existing tests to ensure nothing broke
   ```bash
   npm test -- --coverage --changedSince=main
   ```
   - Validate test quality (meaningful assertions, good coverage)

6. **Accessibility Review** (for UI changes)
   - Check for proper ARIA labels
   - Verify semantic HTML usage
   - Check color contrast ratios
   - Verify keyboard navigation works
   - Check for proper focus management
   - Validate form labels and error messages

7. **Architecture Review**
   - Verify code follows project patterns
   - Check import organization
   - Validate component structure
   - Review API design (REST conventions, error handling)
   - Check for proper separation of concerns

8. **Database Review** (if schema changes)
   - Verify migrations are reversible
   - Check for index creation on large tables
   - Validate foreign key relationships
   - Review for breaking changes
   - Check migration order

9. **Documentation Review**
   - Check if README needs updating
   - Verify API changes are documented
   - Look for complex logic that needs comments
   - Check if CHANGELOG should be updated

10. **Generate Review Summary**
    Format as structured markdown:
    ```markdown
    ## Pull Request Review

    ### 📊 Overview
    - Files changed: X
    - Lines added: +X / Lines removed: -X
    - Categories: [components, api, config, etc.]

    ### ✅ Passed Checks
    - Security scan: No issues
    - Type checking: Passed
    - Tests: All passing (coverage X%)

    ### ⚠️  Warnings
    - Performance: Large component re-renders on line X
    - Accessibility: Missing aria-label in file Y

    ### ❌ Issues Found
    - Security: Potential XSS vulnerability in file.ts:42
    - Quality: Linting errors in 3 files

    ### 💡 Suggestions
    - Consider memoizing expensive calculation in ComponentX
    - Add tests for edge case in functionY
    - Extract helper function from 50-line component method

    ### 📝 Required Changes
    1. Fix security issue in file.ts:42
    2. Address linting errors
    3. Add missing tests

    ### ✨ Positive Highlights
    - Clean separation of concerns
    - Good error handling
    - Well-documented complex logic
    ```

11. **Post Review Actions**
    - If GitHub PR: Post review as comment using `gh pr review`
    - Suggest changes with specific line numbers
    - Approve if no blocking issues, otherwise request changes

This provides a thorough, automated PR review covering security, quality, performance, and best practices.
