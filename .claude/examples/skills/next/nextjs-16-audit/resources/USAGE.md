# How to Use the Next.js 16 Deep Audit Skill

## Automatic Activation (Recommended)

The skill automatically activates when you ask Claude to audit your codebase. Just say:

### Trigger Phrases:

**Full Codebase Audit:**
```
"Audit the entire codebase for Next.js 16 best practices"
"Go through every file and check for compliance"
"Deep audit - review all files individually"
"Comprehensive review of the whole codebase"
```

**Category-Specific:**
```
"Audit all files for caching patterns"
"Check every file for DAL usage"
"Review all components for React 19 patterns"
"Audit API routes for best practices"
```

**File Subset:**
```
"Audit all files in app/(auth)/"
"Review all API routes in app/api/"
"Check all components in components/features/"
```

## What Happens When Activated

When you trigger the audit, Claude will:

1. **Enumerate files** - Find all `.ts` and `.tsx` files (excludes tests, node_modules, .next)
2. **Classify each file** - Server Component, Client Component, API route, utility, etc.
3. **Read each file individually** - Full file analysis, not just regex scanning
4. **Deep inspection** - Check all 14 audit categories:
   - Structural analysis
   - Import analysis
   - Type safety
   - React 19 patterns
   - Next.js 16 patterns
   - Database patterns
   - Caching
   - Authentication
   - State management
   - API routes
   - Security
   - Performance
   - Accessibility
   - Code quality
5. **Generate reports** - Per-file findings + summary

## Expected Output

### Per-File Report Example:
```markdown
## File: app/dashboard/page.tsx
**Type**: Server Component
**Lines**: 156
**Status**: ⚠️ 2 errors, 3 warnings, 1 info

### Errors (MUST FIX)
1. Line 15-17: Direct Supabase auth call
   ❌ Current: const { data: { user } } = await supabase.auth.getUser()
   ✅ Fix: const userId = await getUserId()

2. Line 42: Type duplicate - Account interface redefined
   ❌ Current: export interface Account { id: string; ... }
   ✅ Fix: import type { Account } from '@/lib/types'

### Warnings (SHOULD FIX)
1. Line 8: Should be async for data fetching
2. Line 23: Derive state instead of useState + useEffect
3. Line 67: Use next/image for logo.png

### Info (CONSIDER)
1. Line 89: Consider extracting helper to lib/utils

### Compliance Score: 87/100
✅ Type Safety: 90%
✅ Security: 100%
⚠️ Patterns: 80%
⚠️ Performance: 75%
```

### Summary Report Example:
```markdown
# Codebase Audit Summary

## Overview
- Total Files Scanned: 1,179
- Files Analyzed: 1,179 (100%)
- Clean Files: 342 (29%)
- Files with Issues: 837 (71%)

## Issues by Severity
🚨 Critical Errors: 57 files
⚠️  Warnings: 609 files
ℹ️  Info: 142 files

## Top Issues (by frequency)
1. Unnecessary "use client" - 393 files
2. Legacy cacheWrap usage - 94 files
3. Any types - 89 files
4. Direct Supabase auth - 23 files
5. Type duplicates - 12 files

## Priority Files (most issues)
1. lib/plaid/services/plaid-sync.ts (23 issues - 5 errors, 18 warnings)
2. lib/config/metric-descriptions.ts (18 issues - 0 errors, 18 warnings)
3. app/api/v1/dashboard/data/route.ts (12 issues - 3 errors, 9 warnings)

## Recommended Migration Order
1. Fix 23 DAL usage errors (critical)
2. Migrate 94 cacheWrap to Cache Components (breaking)
3. Remove 393 unnecessary "use client" (performance)
4. Replace 89 any types (type safety)
5. Fix 12 type duplicates (architecture)
```

## Scope Control

### Audit Specific Directories:
```
"Audit only the app/(auth) directory"
"Review files in lib/db/services/"
"Check components/features/ for best practices"
```

### Audit Specific Patterns:
```
"Audit all Server Components"
"Review all API routes"
"Check all files using cacheWrap"
"Find all files with direct Supabase auth calls"
```

### Focus on Categories:
```
"Audit for caching compliance only"
"Check security patterns across all files"
"Review authentication implementation in all files"
"Audit performance patterns only"
```

## Manual Script Execution

You can also run the standalone audit script:

```bash
# Full audit (fast, regex-based)
bun run .claude/skills/nextjs-16-audit/audit.ts

# Save to file
bun run .claude/skills/nextjs-16-audit/audit.ts > audit-report.txt

# Focus on errors only
bun run .claude/skills/nextjs-16-audit/audit.ts --severity=error
```

**Note**: The manual script is regex-based (fast but less accurate).
Claude's skill activation provides deeper AST-level analysis.

## Progressive Audit Strategy

For large codebases (1,000+ files), consider progressive auditing:

### Week 1: Critical Errors
```
"Audit for critical security and auth issues only"
```

### Week 2: Breaking Changes
```
"Audit for deprecated patterns (cacheWrap, old auth)"
```

### Week 3: Performance
```
"Audit for performance issues (Server Components, caching)"
```

### Week 4: Type Safety
```
"Audit for type safety issues (any types, duplicates)"
```

### Week 5: Code Quality
```
"Audit for accessibility and code quality"
```

## Integration with Development Workflow

### Pre-Commit
Add to git pre-commit hook:
```bash
#!/bin/bash
bun run .claude/skills/nextjs-16-audit/audit.ts --severity=error
if [ $? -ne 0 ]; then
  echo "❌ Audit failed - fix errors before committing"
  exit 1
fi
```

### Pre-PR
Before creating PR, run full audit:
```
"Run a comprehensive audit on all changed files"
```

### CI/CD Pipeline
```yaml
# .github/workflows/audit.yml
- name: Next.js Best Practices Audit
  run: bun run .claude/skills/nextjs-16-audit/audit.ts
```

## FAQ

### Q: How long does a full audit take?
**A**: For 1,179 files:
- Manual script (regex): ~2 seconds
- Claude deep audit: ~5-10 minutes (reads each file individually)

### Q: Can I audit just the files I changed?
**A**: Yes!
```
"Audit only files I modified in the last commit"
"Review changes in my current branch"
```

### Q: Will it auto-fix issues?
**A**: Not yet. The skill provides:
- Detailed findings
- Fix recommendations with before/after examples
- Line numbers for each issue

Future: `--fix` flag for auto-fixes

### Q: Can I customize the rules?
**A**: Yes! Edit `.claude/skills/nextjs-16-audit/audit.ts` and add custom patterns.

### Q: Does it replace hooks?
**A**: No - complementary:
- **Hooks**: Real-time checks during editing (fast, per-file)
- **Skill**: Comprehensive codebase review (thorough, all files)

## Examples

### Example 1: First-Time Audit
```
You: "Run a comprehensive Next.js 16 audit on the entire codebase"

Claude:
1. Enumerates 1,179 files
2. Classifies: 234 Server Components, 189 Client Components, 67 API routes...
3. Processes each file individually
4. Generates detailed report
5. Prioritizes: 57 critical errors → 609 warnings → 142 info

You receive:
- Summary of all issues
- Per-file reports for files with errors
- Migration guide for common patterns
- Prioritized fix order
```

### Example 2: Focused Audit
```
You: "Audit all API routes for caching and security"

Claude:
1. Finds 67 API route files
2. Focuses on caching (Cache Components) and security (validation, sanitization)
3. Reviews each route individually
4. Reports findings

You receive:
- 67 files analyzed
- 12 missing Cache Components
- 5 missing input validation
- Fix recommendations for each
```

### Example 3: Migration Audit
```
You: "Find all files still using cacheWrap and show me how to migrate"

Claude:
1. Searches for cacheWrap imports/usage
2. Finds 94 files
3. Reviews each implementation
4. Generates migration examples

You receive:
- List of 94 files
- Before/after examples for each pattern
- Step-by-step migration guide
- Invalidation strategy
```

## Quick Start

**Try it now:**
```
"Audit the app/(auth) directory for Next.js 16 best practices"
```

This will give you a preview of how the skill works on a subset of your codebase.
