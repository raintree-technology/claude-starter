---
allowed-tools: Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(echo:*),Read,Glob,Grep,WebFetch
description: Comprehensive review of code files for quality, security, and best practices
---

**IMPORTANT**: Only review the files explicitly listed in the prompt above. Do not search for or review additional files.

Review the specified code files using comprehensive quality criteria:

## Review Checklist

### Code Quality
- Clear, descriptive naming conventions
- Appropriate code organization and structure
- DRY principle adherence (no unnecessary duplication)
- Proper error handling
- Adequate comments for complex logic

### Security
- No hardcoded secrets or credentials
- Input validation and sanitization
- Proper authentication/authorization checks
- Safe dependency usage
- No known vulnerability patterns (SQL injection, XSS, etc.)

### Performance
- Efficient algorithms and data structures
- No obvious performance bottlenecks
- Proper resource cleanup
- Appropriate use of caching/memoization

### Best Practices
- Follows language/framework conventions
- Consistent code style
- Appropriate use of types/interfaces
- Proper dependency management
- Clear separation of concerns

### Testing Considerations
- Code is testable
- Edge cases are handled
- Clear test scenarios emerge

Provide a clear summary with:
- ✅ **What looks good**: Highlight positive aspects
- ⚠️ **Suggestions for improvement**: Non-critical improvements
- ❌ **Critical issues**: Must-fix problems (security, bugs, breaking changes)

**If reviewing a pull request**: Post your review as a comment using `gh pr comment $PR_NUMBER --body "your review"`

**If reviewing locally**: Present the review directly to the user.
