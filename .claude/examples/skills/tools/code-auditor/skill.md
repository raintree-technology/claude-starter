---
name: code-auditor
description: Comprehensive code audit based on quality rubric. Use whenever a code review or quality audit is requested.
---

# Code Auditor Skill

## Instructions

Review the requested code files using the following comprehensive guidelines. Provide a score based on scoring rubric and actionable recommendations for improvement.

## Workflow

Follow these steps for a comprehensive audit:

1. **Identify files**: Ask user for file paths if not provided
2. **Run automated checks** (if applicable):
   - Security scans for hardcoded credentials
   - Linting and static analysis
   - Dependency vulnerability checks
3. **Manual review**: Read through code evaluating against rubric
4. **Score each dimension**: Apply scoring guidelines objectively
5. **Generate report**: Follow the audit report format below
6. **Provide specific examples**: Show concrete improvements with line references

## Audit Report Format

Present your audit using this structure:

### Executive Summary
- **Overall Score**: X/20
- **Key Strengths** (2-3 bullet points)
- **Critical Issues** (2-3 bullet points, if any)

### Detailed Scoring

#### 1. Code Quality & Readability: X/5
[Brief justification with specific examples from the code]

**Excellent (5)**: Clear naming, well-organized, follows best practices, easy to understand
**Good (4)**: Generally clear, minor inconsistencies, readable
**Adequate (3)**: Understandable but has organizational issues or unclear naming
**Needs Work (2)**: Difficult to follow, poor organization, unclear intent
**Poor (1)**: Very difficult to understand, severe quality issues

#### 2. Security & Safety: X/5
[Brief justification with specific security considerations]

**Excellent (5)**: No security issues, proper input validation, secure patterns used
**Good (4)**: Minor security considerations, no critical vulnerabilities
**Adequate (3)**: Some security concerns that should be addressed
**Needs Work (2)**: Security vulnerabilities present
**Poor (1)**: Critical security issues (hardcoded secrets, SQL injection, XSS, etc.)

#### 3. Technical Correctness: X/5
[Brief justification with examples of technical decisions]

**Excellent (5)**: Technically sound, uses appropriate patterns, efficient algorithms
**Good (4)**: Generally correct, minor inefficiencies or pattern misuse
**Adequate (3)**: Works but has technical debt or suboptimal approaches
**Needs Work (2)**: Technical issues that could cause problems
**Poor (1)**: Incorrect implementations, will cause bugs

#### 4. Maintainability & Documentation: X/5
[Brief justification with examples]

**Excellent (5)**: Well-documented, testable, easy to modify, clear separation of concerns
**Good (4)**: Generally maintainable, adequate documentation
**Adequate (3)**: Maintainable with effort, missing some documentation
**Needs Work (2)**: Difficult to maintain, poor separation, minimal docs
**Poor (1)**: Very difficult to maintain or modify

### Specific Recommendations

[Prioritized, actionable list of improvements with file/line references]

1. **Critical** (must fix):
   - [Issue with file:line reference]

2. **Important** (should fix):
   - [Issue with file:line reference]

3. **Nice to have** (consider):
   - [Suggestion with file:line reference]

### Examples & Suggestions

[Show specific code excerpts with concrete suggestions for improvement]

```language
// Before (Current Code)
[problematic code]

// After (Suggested Improvement)
[improved code]

// Why: [explanation of the improvement]
```

## Quick Reference Checklist

Use this to ensure comprehensive coverage:

### Code Structure & Organization
- [ ] Clear, logical file/module organization
- [ ] Appropriate separation of concerns
- [ ] Follows language/framework conventions
- [ ] Consistent code style throughout

### Code Quality
- [ ] Meaningful variable and function names
- [ ] No dead or commented-out code
- [ ] DRY principle followed (no unnecessary duplication)
- [ ] Functions/methods have single responsibilities
- [ ] Appropriate code complexity

### Security
- [ ] No hardcoded credentials, API keys, or secrets
- [ ] Input validation where needed
- [ ] Output sanitization (XSS prevention)
- [ ] SQL injection prevention (parameterized queries)
- [ ] Proper authentication/authorization
- [ ] No use of dangerous functions
- [ ] Dependencies are up to date and secure

### Error Handling
- [ ] Errors are caught and handled appropriately
- [ ] Error messages are informative
- [ ] No swallowed exceptions
- [ ] Proper cleanup on errors (resource management)

### Performance
- [ ] Efficient algorithms and data structures
- [ ] No obvious performance bottlenecks
- [ ] Appropriate use of caching
- [ ] Proper resource management (memory, connections)

### Documentation
- [ ] Clear function/method documentation
- [ ] Complex logic is explained with comments
- [ ] Comments explain "why" not "what"
- [ ] API contracts are documented
- [ ] README or usage examples exist

### Testing Considerations
- [ ] Code is testable
- [ ] Edge cases are considered
- [ ] Dependencies are injectable
- [ ] No tight coupling

### Language/Framework Best Practices

**TypeScript/JavaScript**:
- [ ] Proper type annotations (TypeScript)
- [ ] Async/await used correctly
- [ ] No var, use const/let appropriately
- [ ] Promises handled properly (no unhandled rejections)

**Python**:
- [ ] Follows PEP 8 style guide
- [ ] Proper use of type hints
- [ ] Context managers for resources
- [ ] Appropriate use of list comprehensions

**React**:
- [ ] Proper hook usage
- [ ] No unnecessary re-renders
- [ ] Key props on list items
- [ ] State management is appropriate

**Next.js**:
- [ ] Server/client components used correctly
- [ ] Proper data fetching patterns
- [ ] SEO considerations addressed
- [ ] Route handling is appropriate

## Code Quality Philosophy

### What Makes Good Code

Good code is:
- **Readable**: Easy for others (and future you) to understand
- **Maintainable**: Easy to modify and extend
- **Reliable**: Works correctly and handles errors gracefully
- **Secure**: Protected against common vulnerabilities
- **Efficient**: Uses resources appropriately
- **Testable**: Can be easily tested

### What This Audit Is NOT

This is not:
- **Nitpicking**: We focus on meaningful improvements, not style wars
- **Perfect code enforcement**: We recognize trade-offs exist
- **Production deployment gate**: We evaluate quality but acknowledge context matters
- **One-size-fits-all**: Different code has different requirements

## Style Guidelines

### Feedback Tone
- Professional and constructive
- Specific and actionable
- Balanced (acknowledge both strengths and weaknesses)
- Educational (explain why, not just what)

### Review Quality
- Prioritize critical issues over minor style points
- Provide concrete examples
- Suggest improvements, don't just identify problems
- Consider the context and constraints

## Scoring Rubric Details

### Overall Score Interpretation

- **18-20**: Excellent code, minimal improvements needed
- **15-17**: Good code, some improvements would help
- **12-14**: Adequate code, notable improvements needed
- **9-11**: Needs work, significant improvements required
- **< 9**: Poor code, major refactoring needed

### When to Give High Scores

Don't be overly critical. Code deserves high scores when it:
- Solves the problem effectively
- Is reasonably clear and maintainable
- Has no critical security issues
- Follows general best practices

Perfect code doesn't exist. Focus on meaningful improvements.

### When to Flag Critical Issues

Always call out:
- Security vulnerabilities (hardcoded secrets, injection risks)
- Correctness bugs (will cause runtime errors)
- Data loss risks
- Architectural issues that will cause major problems

## Adaptation for Different Contexts

### For Learning/Tutorial Code
- Focus on educational value
- Emphasize clarity over optimization
- Be forgiving of simplified patterns

### For Production Code
- Emphasize security and reliability
- Check error handling thoroughly
- Verify scalability considerations
- Ensure proper logging/monitoring

### For Prototype/POC Code
- Balance speed vs quality
- Focus on critical issues only
- Acknowledge trade-offs are appropriate

### For Library/Framework Code
- Emphasize API design
- Check documentation thoroughly
- Verify backward compatibility
- Ensure comprehensive testing

## Example Audit

### Executive Summary
- **Overall Score**: 16/20
- **Key Strengths**:
  - Clear code organization with good separation of concerns
  - Proper error handling throughout
  - Well-documented API functions
- **Critical Issues**:
  - API key hardcoded in config.ts (security risk)

### Detailed Scoring

#### 1. Code Quality & Readability: 4/5
Code is generally well-organized with clear naming conventions. The UserService class follows SRP well. Minor issue: some functions exceed 50 lines and could be broken down (e.g., processUserData in services/user.ts:142).

#### 2. Security & Safety: 2/5
**CRITICAL**: API key is hardcoded in src/config.ts:12. This must be moved to environment variables immediately. Otherwise, proper input validation exists in all API endpoints.

#### 3. Technical Correctness: 5/5
All implementations are technically sound. Proper use of async/await, correct TypeScript types, and efficient data structures.

#### 4. Maintainability & Documentation: 5/5
Excellent documentation with JSDoc comments on all public functions. Clear README with usage examples. Code is easily testable with dependency injection.

### Specific Recommendations

1. **Critical** (must fix):
   - Move API key from src/config.ts:12 to environment variable

2. **Important** (should fix):
   - Break down processUserData function (services/user.ts:142) into smaller functions
   - Add error boundaries to React components

3. **Nice to have**:
   - Consider adding more inline comments for complex business logic
   - Add integration tests for API endpoints

## Related Resources

- **Security Best Practices**: OWASP Top 10
- **Code Quality**: Clean Code principles
- **Language-Specific**: Official style guides for your language
- **Framework-Specific**: Official best practices documentation

---

**Based on**: Anthropic Cookbook Audit Skill (adapted for general code review)
**Version**: 1.0.0
**Last Updated**: 2025-01-07
