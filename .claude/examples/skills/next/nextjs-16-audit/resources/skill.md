---
name: Next.js 16 Audit
description: Comprehensive file-by-file audit for Next.js 16, React 19, and Clarity architecture compliance. Checks caching, auth patterns, type safety, Server Components, and generates auto-fixes with exact code.
version: 3.1.0
---

# Next.js 16 Best Practices Audit

## Overview

This skill performs a **comprehensive, file-by-file analysis** of TypeScript/TSX files to ensure strict compliance with:
- **Next.js 16** patterns (Cache Components, App Router, route handlers)
- **React 19** best practices (no unnecessary useEffect, derived state, Server Components)
- **Clarity architecture** (DAL, type centralization, repository pattern)

## When to Use This Skill

**Primary Triggers**:
- "Audit this file" / "Review this component"
- "Check for Next.js 16 compliance"
- "Analyze for best practices"
- User explicitly asks to audit with their skill

**What Gets Audited**:
- ✅ Type centralization (all domain types in `@/lib/types`)
- ✅ Caching patterns (`'use cache'` vs deprecated `cacheWrap`)
- ✅ Auth patterns (DAL usage vs direct Supabase)
- ✅ Server/Client Component patterns
- ✅ Database patterns (repositories, Drizzle imports)
- ✅ React 19 patterns (no unnecessary useEffect)
- ✅ Security (input validation, XSS prevention)
- ✅ Performance (next/image, bundle size)
- ✅ Accessibility (semantic HTML, ARIA)

## Execution Mode

When activated, perform the following analysis on the provided file:

### Step 1: File Classification

Determine file type:
- **Server Component**: `app/**/page.tsx`, `layout.tsx` (no `"use client"`)
- **Client Component**: Has `"use client"` directive
- **API Route**: `app/api/**/route.ts`
- **Utility**: `lib/**/*.ts`
- **Hook**: `hooks/**/*.ts` or `lib/hooks/**/*.ts`
- **Component**: `components/**/*.tsx`
- **Type Definition**: `lib/types/**/*.ts`

### Step 2: Core Analysis (14 Categories)

#### 2.1 Type Safety
- [ ] No `any` types (use `unknown` or proper types)
- [ ] Canonical type imports from `@/lib/types` (NOT local definitions)
- [ ] No type duplicates for: Transaction, Account, User, Connection, Asset
- [ ] Proper Zod schemas at API boundaries
- [ ] Array bounds checking

**Critical Rule**: Domain types MUST import from `./lib/types`

\`\`\`ts
// ❌ VIOLATION
interface Transaction { id: string; amount: number; }

// ✅ CORRECT
import type { Transaction } from '@/lib/types';
\`\`\`

#### 2.2 Caching (Next.js 16)
- [ ] No legacy `cacheWrap` usage
- [ ] Cache Components with `'use cache'` directive
- [ ] Appropriate `cacheLife` duration ('minutes', 'hours', 'days')
- [ ] Proper `cacheTag` for invalidation
- [ ] No `cookies()`, `headers()`, `searchParams` in cached functions

\`\`\`ts
// ✅ CORRECT
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';

async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))
  return await db.query.data.findMany({ where: eq(data.userId, userId) });
}

// ❌ DEPRECATED
import { cacheWrap } from '@/lib/cache';
const data = await cacheWrap('key', fetchData, 300);
\`\`\`

#### 2.3 Authentication
- [ ] Server Components use DAL (`verifySession`, `getUserId`, `getUser`)
- [ ] No direct `supabase.auth.getUser()` calls
- [ ] Client Components use `useAuthUser()` or `useAuth()`
- [ ] Proper redirects for unauthorized

\`\`\`ts
// ✅ CORRECT (Server Component)
import { getUserId } from '@/lib/data/dal';
const userId = await getUserId();

// ❌ WRONG
import { createClient } from '@/lib/db/supabase/server';
const { data: { user } } = await supabase.auth.getUser();
\`\`\`

#### 2.4 Server/Client Components
- [ ] Server Components are async for data fetching
- [ ] No `"use client"` unless necessary (hooks/events/browser APIs)
- [ ] Client Components minimal and focused
- [ ] No hooks in Server Components

#### 2.5 Database Patterns
- [ ] Drizzle operators from `drizzle-orm` (NOT `@/lib/db`)
- [ ] Repositories preferred over queries module
- [ ] Balance helpers for encryption/decryption
- [ ] Parameterized queries (no SQL injection)

\`\`\`ts
// ✅ CORRECT
import { eq, and } from 'drizzle-orm';

// ❌ WRONG
import { eq, and } from '@/lib/db';
\`\`\`

#### 2.6 React 19 Patterns
- [ ] No unnecessary `useEffect` (derive state, use event handlers, or keys)
- [ ] State derived when possible
- [ ] Event handlers for side effects
- [ ] Modern hooks (`use()`, `useSyncExternalStore()`)

#### 2.7 API Routes
- [ ] Proper route handler syntax (`export async function GET/POST`)
- [ ] Cacheable logic in `'use cache'` helper functions
- [ ] Input validation with Zod
- [ ] Structured logging with Pino

#### 2.8 Security
- [ ] User input validated with Zod
- [ ] HTML sanitized with `isomorphic-dompurify`
- [ ] No XSS vulnerabilities
- [ ] Environment variables used correctly

#### 2.9 Performance
- [ ] `next/image` instead of `<img>`
- [ ] Heavy components dynamically imported
- [ ] Proper image optimization

#### 2.10 Accessibility
- [ ] Semantic HTML elements
- [ ] `<button>` not `<div onClick>`
- [ ] Form labels with `htmlFor`
- [ ] ARIA attributes when needed
- [ ] Keyboard navigation support

### Step 3: Generate Findings Report

For the audited file, provide:

\`\`\`markdown
## File: [file-path]
**Type**: [Server Component / Client Component / API Route / etc.]
**Compliance Score**: [0-100]/100

### ✅ Strengths
- List what the file does well

### 🚨 Critical Issues (Must Fix)
1. **Line X**: [Issue description]
   - Current: \`[code snippet]\`
   - Fix: \`[corrected code]\`
   - Impact: [why this matters]

### ⚠️ Warnings (Should Fix)
1. **Line Y**: [Issue description]
   - Suggestion: [how to improve]

### ℹ️ Suggestions (Consider)
1. [Optional improvements]

### 🔧 Auto-Fix Instructions
[Exact Edit tool commands to fix all issues]
\`\`\`

### Step 4: Score Calculation

**Scoring Rubric**:
- **Critical (30%)**: Security, auth, type safety violations
- **High (25%)**: Wrong patterns, deprecated code, database issues
- **Medium (25%)**: Performance, accessibility, missing optimizations
- **Low (20%)**: Code quality, structure, documentation

**Grade Scale**:
- 95-100: Excellent ⭐⭐⭐⭐⭐
- 85-94: Good ⭐⭐⭐⭐
- 75-84: Acceptable ⭐⭐⭐
- 65-74: Needs Work ⚠️
- <65: Critical Issues 🚨

## Resources

See the skill directory for detailed references:
- `SKILL.md` - Complete audit methodology (all 14 categories explained)
- `CHECKLIST.md` - Comprehensive checklist by file type
- `USAGE.md` - Usage examples and common patterns
- `quick-reference.md` - Quick lookup for common violations

## Key Architecture Rules

### Type Centralization (CRITICAL)
**Canonical Location**: `./lib/types`

ALL domain types MUST be defined in `@/lib/types` ONLY:
- Transaction, Account, User, Connection, Asset, Portfolio, Holding, Institution

**Allowed Exceptions** (must be documented):
1. Presentation layer types (UI-specific fields)
2. Utility-specific minimal interfaces (e.g., `Dateable`)
3. Type re-exports

### Import Restrictions
- `@vercel/kv` → Use `@/lib/utils/kv` wrapper
- Drizzle operators → Import from `drizzle-orm` (not `@/lib/db`)
- Types → Import from `@/lib/types` (canonical source)

### Caching Migration
- `cacheWrap` is **DEPRECATED** → Use `'use cache'` directive
- All route handlers should extract cacheable logic to helper functions

### Auth Patterns
- Server Components → Use DAL (`getUserId`, `getUser`, `verifySession`)
- Client Components → Use `useAuthUser()` hook
- API Routes → Use `getUserId()` from DAL

## Output Format

Always provide:
1. **File classification** and context
2. **Compliance score** (0-100)
3. **Categorized findings** (Critical, Warning, Suggestion)
4. **Exact code snippets** with line numbers
5. **Auto-fix instructions** using Edit tool
6. **Score improvement path** (current → target)

## Success Criteria

File passes audit if:
- ✅ Zero critical errors
- ✅ < 3 warnings per file
- ✅ Compliance score > 85/100
- ✅ No deprecated patterns
- ✅ Type safety maintained
