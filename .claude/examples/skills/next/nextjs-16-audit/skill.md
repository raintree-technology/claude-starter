---
name: Next.js 16 Audit
description: Comprehensive file-by-file audit for Next.js 16, React 19, and Clarity architecture compliance. Checks caching, auth patterns, type safety, Server Components, and generates auto-fixes.
version: 4.0.0
---

# Next.js 16 Best Practices Audit

**Note**: This is the streamlined audit checklist with core patterns. For complete 30-category deep-dive audit, see `resources/nextjs-16-reference.md`.

Performs **comprehensive file-by-file analysis** of TypeScript/TSX files for Next.js 16.0.1, React 19, and Clarity architecture compliance.

## When to Use

**Auto-activates on:**
- "Audit this file" / "Review this component"
- "Check for Next.js 16 compliance"
- User explicitly asks to audit with skill

## Quick Audit Checklist

### Critical Categories (Must Pass)

#### ⭐ Type Safety
- [ ] No `any` types
- [ ] All domain types imported from `@/lib/types`
- [ ] No duplicate type definitions
- [ ] Zod schemas at API boundaries

```ts
// ✅ CORRECT
import type { Transaction } from '@/lib/types';

// ❌ VIOLATION
interface Transaction { id: string; amount: number; }
```

#### ⭐ Caching (Next.js 16)
- [ ] No `cacheWrap` (deprecated)
- [ ] Use `'use cache'` directive
- [ ] `cacheLife('minutes'|'hours'|'days')` specified
- [ ] `cacheTag()` for surgical invalidation

```ts
// ✅ CORRECT (Next.js 16.0.1)
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
```

#### ⭐ Authentication
- [ ] Server Components → DAL (`getUserId`, `getUser`)
- [ ] Client Components → `useAuthUser()`
- [ ] No direct Supabase calls in components

```ts
// ✅ Server Component
import { getUserId } from '@/lib/dal';
const userId = await getUserId();

// ✅ Client Component
'use client';
import { useAuthUser } from '@/lib/hooks';
const { user } = useAuthUser();

// ❌ VIOLATION
import { createClient } from '@/lib/db/supabase/client';
const { data } = await createClient().auth.getUser();
```

#### ⭐ Server/Client Components
- [ ] Server Components: No `useState`, `useEffect`, event handlers
- [ ] Client Components: `'use client'` directive at top
- [ ] Proper data flow: Server → Client via props

```tsx
// ✅ Server Component
async function ServerComponent() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// ✅ Client Component
'use client';
function ClientComponent({ data }: { data: Data[] }) {
  const [selected, setSelected] = useState(data[0]);
  return <div onClick={() => setSelected(data[1])}>{selected.name}</div>;
}
```

### High Priority Categories

#### Data Fetching
- [ ] Async Server Components for data
- [ ] Parallel fetching when possible
- [ ] No waterfalls in serial fetches

```tsx
// ✅ Parallel fetching
async function Page() {
  const [user, transactions] = await Promise.all([
    getUser(),
    getTransactions()
  ]);
  return <Dashboard user={user} transactions={transactions} />;
}
```

#### Server Functions & Actions
- [ ] `'use server'` directive for mutations
- [ ] Input validation with Zod
- [ ] Return serializable data

```ts
// ✅ Server Action
'use server';
export async function createTransaction(formData: FormData) {
  const schema = z.object({ amount: z.number(), merchant: z.string() });
  const data = schema.parse({ amount: formData.get('amount'), ... });
  return await db.insert(transactions).values(data);
}
```

#### Streaming & Suspense
- [ ] `<Suspense>` boundaries for async components
- [ ] Loading states for slow data
- [ ] Error boundaries for errors

```tsx
// ✅ Streaming
<Suspense fallback={<Skeleton />}>
  <AsyncDataComponent />
</Suspense>
```

#### React 19 Patterns
- [ ] No unnecessary `useEffect`
- [ ] Derived state instead of sync effects
- [ ] `use` hook for promises/context

```tsx
// ❌ Unnecessary useEffect
useEffect(() => {
  setFiltered(items.filter(i => i.active));
}, [items]);

// ✅ Derived state
const filtered = items.filter(i => i.active);
```

### Medium Priority Categories

- **Security**: Input validation, XSS prevention, Server Action security
- **Performance**: `next/image`, dynamic imports, parallel fetching
- **Accessibility**: Semantic HTML, ARIA attributes
- **Error Handling**: Error boundaries, expected errors, global errors
- **Metadata & SEO**: generateMetadata, OpenGraph, Twitter cards

## Audit Process

### 1. File Classification

Identify file type:
- **Server Component**: `app/**/page.tsx`, `layout.tsx` (no `"use client"`)
- **Client Component**: Has `"use client"` directive
- **API Route**: `app/api/**/route.ts`
- **Server Action**: File with `'use server'`
- **Utility**: `lib/**/*.ts`

### 2. Run Audit Checks

Execute checks for all applicable categories based on file type.

### 3. Generate Report

```markdown
## File: [path]
**Type**: [Server Component/Client Component/API Route/etc.]
**Compliance Score**: X/100

### ✅ Strengths
- What's done well

### 🚨 Critical (Must Fix)
1. **Line X**: Issue
   - Current: `code`
   - Fix: `corrected code`
   - Impact: why important

### ⚠️ Warnings (Should Fix)
1. **Line Y**: Issue
   - Suggestion: improvement

### ℹ️ Suggestions
1. Optional improvements

### 🔧 Auto-Fix
[Exact Edit commands if applicable]
```

## Scoring Rubric

**Categories Weight** (30 total categories):
- **Critical (30%)**: Security, auth, type safety, Server/Client architecture
- **High (40%)**: Data fetching, Server Functions, caching, navigation, layouts, error handling, streaming, metadata/SEO, ISR
- **Medium (20%)**: React 19 patterns, proxy, database, performance, accessibility, build config, dependency governance
- **Low (10%)**: API routes, code quality

**Grades**:
- **95-100**: Excellent ⭐⭐⭐⭐⭐ (Production gold standard)
- **85-94**: Good ⭐⭐⭐⭐ (Production ready, minor improvements)
- **75-84**: Acceptable ⭐⭐⭐ (Functional, needs optimization)
- **65-74**: Needs Work ⚠️ (Multiple issues)
- **<65**: Critical Issues 🚨 (Not production ready)

## Key Rules

### Type Centralization ⚠️ ENFORCED
**Canonical location**: `./lib/types`

ALL domain types ONLY in `@/lib/types`:
- Transaction, Account, User, Connection, Asset, Portfolio, Holding, Institution

**Exceptions** (must document):
1. Presentation layer types (UI-specific)
2. Utility minimal interfaces
3. Type re-exports

### Import Restrictions
- `@vercel/kv` → Use `@/lib/utils/kv`
- Drizzle → Import from `drizzle-orm`
- Types → Import from `@/lib/types`

### Caching Migration
- `cacheWrap` DEPRECATED → Use `'use cache'`
- Extract cacheable logic to helper functions

### Auth Patterns
- Server Components → DAL (`getUserId`, `getUser`)
- Client Components → `useAuthUser()`
- API Routes → `getUserId()` from DAL

## Success Criteria

**File passes if:**
- ✅ Zero critical errors
- ✅ < 5 total warnings
- ✅ Score > 80/100
- ✅ No deprecated patterns
- ✅ Type safety maintained

**Project passes if:**
- ✅ Average score > 85/100
- ✅ Zero critical errors across all files
- ✅ < 10 total warnings across codebase

## Output Format

Provide:
1. File classification & context
2. Compliance score (0-100)
3. Categorized findings (Critical/Warning/Suggestion)
4. Exact code with line numbers
5. Auto-fix instructions
6. Score improvement path

---

*For complete 30-category audit with detailed patterns and migration guides, see `resources/nextjs-16-reference.md`*
