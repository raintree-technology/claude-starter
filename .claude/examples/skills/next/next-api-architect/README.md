# Next.js API Architect

Domain-focused skill for designing and auditing Next.js 16 API routes with modern patterns.

## What This Does

Helps you build production-ready API routes with:
- **Modern Route Handlers** - `export async function GET/POST` syntax
- **Cache Components** - Extract cacheable logic to `'use cache'` helpers
- **Type Safety** - Zod validation + TypeScript
- **Auth & Security** - DAL integration, rate limiting, CORS
- **Performance** - Parallel fetching, streaming, request deduplication

## Quick Start

### Invoke the Skill

```
next-api-architect
```

### Design a New Endpoint

```
Design a GET /api/v1/transactions endpoint that:
- Returns paginated transactions for authenticated user
- Filters by date range and category
- Caches results for 5 minutes
- Returns proper error codes
```

### Audit Existing Route

```
Audit app/api/v1/accounts/route.ts for:
- Proper caching
- Auth checks
- Input validation
- Error handling
```

## Core Patterns

### 1. Basic Route Handler

```ts
// app/api/v1/data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/data/dal'
import { getData } from './helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId() // Auth check
    const data = await getData(userId) // Cached helper
    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 2. With Validation

```ts
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams)
  const validated = QuerySchema.parse(query)

  const data = await fetchPaginated(validated.page, validated.limit)
  return NextResponse.json(data)
}
```

### 3. Cached Helper

```ts
// helpers.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'

export async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))

  return await db.query.data.findMany({
    where: eq(data.userId, userId)
  })
}
```

## Checklist

### Critical (Must Have)
- [ ] Auth check with DAL (`getUserId()`)
- [ ] Input validation (Zod schemas)
- [ ] Error handling (try/catch with proper status codes)
- [ ] Type safety (no `any` types)
- [ ] Async params (`await params`)

### High Priority (Should Have)
- [ ] Cached helpers (`'use cache'` for expensive operations)
- [ ] Parallel fetching (no unnecessary waterfalls)
- [ ] Consistent response format
- [ ] Rate limiting (for write operations)

### Medium Priority (Nice to Have)
- [ ] CORS configuration
- [ ] Streaming (for large datasets)
- [ ] Structured logging
- [ ] API documentation (JSDoc)

## Common Issues Fixed

### Issue 1: No Caching
**Before**: Logic in route handler (can't be cached)
```ts
export async function GET(request: NextRequest) {
  const data = await db.query.data.findMany(...) // Uncached
  return NextResponse.json(data)
}
```

**After**: Extract to cached helper
```ts
export async function GET(request: NextRequest) {
  const data = await getCachedData() // Cached!
  return NextResponse.json(data)
}
```

### Issue 2: Sequential Fetching
**Before**: Waterfall requests
```ts
const accounts = await getAccounts()
const transactions = await getTransactions() // Waits
const balance = await getBalance() // Waits
```

**After**: Parallel fetching
```ts
const [accounts, transactions, balance] = await Promise.all([
  getAccounts(),
  getTransactions(),
  getBalance(),
])
```

### Issue 3: No Validation
**Before**: Unsafe input
```ts
const id = url.searchParams.get('id')
const data = await fetchById(id) // SQL injection risk!
```

**After**: Validated input
```ts
const validated = ParamsSchema.parse({ id: url.searchParams.get('id') })
const data = await fetchById(validated.id) // Safe
```

## Design Principles

1. **Route handlers orchestrate** - Keep them thin
2. **Helpers do work** - Extract business logic
3. **Cache expensive operations** - Use `'use cache'`
4. **Validate at boundaries** - Zod schemas for all inputs
5. **Fail gracefully** - Consistent error responses
6. **Secure by default** - Auth checks, rate limits, sanitization

## Success Metrics

A well-architected API route:
- ✅ Response time <100ms (with caching)
- ✅ Zero unhandled errors
- ✅ 100% type coverage
- ✅ Auth on all protected endpoints
- ✅ Validation on all inputs

## When Not to Use

This skill focuses on **API routes**. Use other skills for:
- Server Components → `react-server-components`
- Server Actions → `form-actions-architect`
- Caching strategies → `next-cache-architect`
- Streaming UI → `streaming-architect`

## Related Skills

- **next-cache-architect** - Deep dive on caching strategies
- **form-actions-architect** - Server Actions for mutations
- **react-server-components** - RSC architecture
- **clarity-dal-architect** - Project-specific DAL patterns
