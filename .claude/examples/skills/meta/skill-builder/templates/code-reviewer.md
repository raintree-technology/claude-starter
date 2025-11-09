---
name: code-reviewer
description: Use when reviewing code for security vulnerabilities, performance issues, code quality, and adherence to best practices. Automatically analyzes pull requests and code changes.
allowed-tools: Read, Grep, Glob
model: sonnet
---

# Code Review Skill

## Purpose

This skill performs comprehensive code reviews focusing on:
- Security vulnerabilities
- Performance bottlenecks
- Code quality and maintainability
- Best practices and patterns
- Test coverage

## When to Use

This skill should be invoked when:
- Reviewing pull requests
- Analyzing code changes before commits
- Auditing existing codebases
- Checking for security issues
- Evaluating code quality

## Process

1. **Scan for Security Issues**
   - Check for SQL injection vulnerabilities
   - Look for XSS vulnerabilities
   - Identify insecure dependencies
   - Check for hardcoded secrets
   - Verify input validation

2. **Analyze Performance**
   - Identify N+1 queries
   - Check for inefficient algorithms
   - Look for memory leaks
   - Analyze database query patterns
   - Review caching strategies

3. **Assess Code Quality**
   - Check code complexity
   - Verify naming conventions
   - Review error handling
   - Assess code duplication
   - Check for proper documentation

4. **Verify Best Practices**
   - Confirm proper separation of concerns
   - Check for SOLID principles
   - Verify design patterns usage
   - Review dependency management
   - Assess test coverage

## Output Format

Provide a structured review with:

### 🔴 Critical Issues
- [Issue with file:line reference and fix suggestion]

### 🟡 Warnings
- [Issue with file:line reference and improvement suggestion]

### 🟢 Suggestions
- [Optional improvement with file:line reference]

### ✅ Strengths
- [Positive aspects of the code]

## Best Practices

- Always provide specific file:line references
- Suggest concrete fixes, not just problems
- Prioritize security issues
- Consider the project context
- Be constructive and specific

## Examples

### Example 1: Security Review

**Input**: "Review this authentication code for security issues"

**Process**:
1. Scan for password handling
2. Check session management
3. Verify input validation
4. Review error messages

**Output**:
```
🔴 Critical Issues:
- auth.ts:45 - Password stored in plain text. Use bcrypt with salt.
- login.ts:23 - SQL query vulnerable to injection. Use parameterized queries.

🟡 Warnings:
- session.ts:12 - Session timeout too long (24h). Reduce to 1h for security.
```

## Error Handling

- **Large codebase**: Focus on changed files only
- **Missing context**: Request specific areas to review
- **Language unknown**: State limitations upfront

## Notes

This skill performs static analysis only. Consider using additional security scanning tools for comprehensive security audits.
