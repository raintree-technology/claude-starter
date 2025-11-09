---
name: Next.js Cache Architect
description: Design and optimize Next.js 16 caching strategies using Cache Components. Migrates from legacy cacheWrap to modern 'use cache' directives. Implements cache tags, revalidation, and request memoization patterns.
version: 1.0.0
---

# Next.js Cache Architect

## Overview

Specialized skill for Next.js 16 caching architecture using **Cache Components**. Focuses on:
- **Cache Components** - `'use cache'` directive with `cacheLife` and `cacheTag`
- **Migration** - From legacy `cacheWrap` to modern caching
- **Invalidation** - Surgical cache invalidation with tags
- **Request Memoization** - React `cache()` for deduplication
- **Performance** - Cache strategies by data type

## When to Use

Invoke when:
- "Optimize caching"
- "Migrate from cacheWrap"
- "Fix slow API responses"
- "Implement cache invalidation"
- "Audit caching strategy"
- "Design cache architecture"

## Core Concepts

### The Three-Layer Cache Strategy

```
1. Request Memoization (React cache())  ──► Within single request
2. Cache Components ('use cache')       ──► Across requests (minutes/hours)
3. HTTP Cache (Cache-Control headers)   ──► Browser cache (30s SWR)
```

## Cache Components (Primary Strategy)

### 1. Basic Pattern

```ts
// ✅ CORRECT - Cache Component
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getUserAccounts(userId: string) {
  'use cache'
  cacheLife('minutes') // 5-15 min default
  cacheTag(UserTags.accounts(userId))

  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })
}

// Usage in Server Component
export default async function Page() {
  const userId = await getUserId()
  const accounts = await getUserAccounts(userId) // Cached!
  return <AccountsList accounts={accounts} />
}
```

### 2. Cache Lifetime Profiles

```ts
// User data (changes frequently)
export async function getUserData(userId: string) {
  'use cache'
  cacheLife('minutes') // 5-15 minutes
  cacheTag(UserTags.data(userId))
  return await fetchUserData(userId)
}

// Global app data (changes rarely)
export async function getCategories() {
  'use cache'
  cacheLife('hours') // 1-4 hours
  cacheTag(DataTags.CATEGORIES)
  return await db.query.categories.findMany()
}

// CMS content (static)
export async function getBlogPost(slug: string) {
  'use cache'
  cacheLife('days') // 7-30 days
  cacheTag(ContentTags.POSTS)
  return await fetchPost(slug)
}
```

### 3. Cache Tags for Invalidation

```ts
// lib/cache/tags.ts
export const UserTags = {
  accounts: (userId: string) => `user:${userId}:accounts`,
  transactions: (userId: string) => `user:${userId}:transactions`,
  dashboard: (userId: string) => `user:${userId}:dashboard`,
  connections: (userId: string) => `user:${userId}:connections`,
  settings: (userId: string) => `user:${userId}:settings`,
}

export const DataTags = {
  CATEGORIES: 'data:categories',
  INSTITUTIONS: 'data:institutions',
  BENCHMARKS: 'data:benchmarks',
}

export const ContentTags = {
  POSTS: 'content:posts',
  HELP: 'content:help',
  MARKETING: 'content:marketing',
}
```

### 4. Cache Invalidation

```ts
// ✅ CORRECT - Invalidate on mutation
import { revalidateTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function updateAccount(accountId: string, data: UpdateData) {
  // Update database
  await db.update(accounts).set(data).where(eq(accounts.id, accountId))

  // Get userId for tag
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })

  // Invalidate cache
  revalidateTag(UserTags.accounts(account!.userId))
}

// In Plaid webhook handler
export async function handlePlaidUpdate(userId: string) {
  await syncTransactions(userId)

  // Invalidate multiple related caches
  revalidateTag(UserTags.transactions(userId))
  revalidateTag(UserTags.dashboard(userId))
  revalidateTag(UserTags.accounts(userId))
}
```

### 5. Stale-While-Revalidate

```ts
// ✅ CORRECT - SWR pattern
import { revalidateTag } from 'next/cache'

export async function updateData(userId: string, data: Data) {
  await db.update(data).set(data).where(eq(data.userId, userId))

  // Serve stale while fetching fresh in background
  revalidateTag(UserTags.data(userId), 'max')
}
```

## Request Memoization

### 1. Basic Memoization

```ts
// ✅ CORRECT - Deduplicate within request
import { cache } from 'react'

export const getUserById = cache(async (id: string) => {
  console.log('Fetching user:', id) // Only logs once per request
  return await db.query.users.findFirst({
    where: eq(users.id, id),
  })
})

// Multiple components can call this in same request
// Server Component A
const user = await getUserById('123') // Fetches from DB

// Server Component B (same request)
const user = await getUserById('123') // Returns cached result
```

### 2. Pre-built Memoized Functions

```ts
// lib/cache/request-memoization.ts
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'

// User queries
export const getUserById = cache(async (id: string) => {
  return await db.query.users.findFirst({ where: eq(users.id, id) })
})

export const getAccountsByUserId = cache(async (userId: string) => {
  return await db.query.accounts.findMany({ where: eq(accounts.userId, userId) })
})

export const getTransactionsByUserId = cache(async (userId: string) => {
  return await db.query.transactions.findMany({ where: eq(transactions.userId, userId) })
})

// Usage
import { getUserById, getAccountsByUserId } from '@/lib/cache/request-memoization'

export default async function Page() {
  const user = await getUserById('123')
  const accounts = await getAccountsByUserId('123')
  return <Dashboard user={user} accounts={accounts} />
}
```

## Migration from Legacy cacheWrap

### ❌ OLD - cacheWrap (Deprecated)

```ts
// lib/cache/index.ts
import { kv } from '@/lib/utils/kv'

export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await kv.get<T>(key)
  if (cached) return cached

  const result = await fn()
  await kv.set(key, result, { ex: ttl })
  return result
}

// app/api/v1/data/route.ts
import { cacheWrap } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const userId = await getUserId()

  const data = await cacheWrap(
    `user:${userId}:data`,
    async () => await fetchData(userId),
    300 // 5 minutes
  )

  return NextResponse.json(data)
}
```

### ✅ NEW - Cache Components

```ts
// app/api/v1/data/helpers.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getDataCached(userId: string) {
  'use cache'
  cacheLife('minutes') // Same as 300s
  cacheTag(UserTags.data(userId))

  return await fetchData(userId)
}

// app/api/v1/data/route.ts
import { getDataCached } from './helpers'

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  const data = await getDataCached(userId)
  return NextResponse.json(data)
}
```

### Migration Checklist

- [ ] Remove all `import { cacheWrap } from '@/lib/cache'`
- [ ] Create `helpers.ts` file next to route handlers
- [ ] Extract cacheable logic to helper functions
- [ ] Add `'use cache'` directive to helpers
- [ ] Set appropriate `cacheLife()` (minutes/hours/days)
- [ ] Add `cacheTag()` for invalidation
- [ ] Update mutation handlers to use `revalidateTag()`
- [ ] Test cache invalidation works
- [ ] Remove old `cacheWrap` calls
- [ ] Update imports to new helpers

## Cache Patterns by Use Case

### Pattern 1: API Route with Caching

```ts
// app/api/v1/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/data/dal'
import { getAccountsSummary } from './helpers'

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  const summary = await getAccountsSummary(userId)
  return NextResponse.json(summary)
}

// app/api/v1/accounts/helpers.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getAccountsSummary(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))

  const accounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })

  const balances = await getBalances(accounts.map(a => a.id))

  return {
    accounts: accounts.map((account, i) => ({
      ...account,
      balance: balances[i],
    })),
    total: balances.reduce((sum, b) => sum + b, 0),
  }
}
```

### Pattern 2: Server Component with Multiple Caches

```ts
// app/dashboard/page.tsx
import { getUserId } from '@/lib/data/dal'
import { getAccountsSummary } from '@/lib/services/accounts'
import { getRecentTransactions } from '@/lib/services/transactions'
import { getInsights } from '@/lib/services/insights'

export default async function DashboardPage() {
  const userId = await getUserId()

  // All three functions use 'use cache' internally
  const [accounts, transactions, insights] = await Promise.all([
    getAccountsSummary(userId),    // Cached 5 min
    getRecentTransactions(userId), // Cached 5 min
    getInsights(userId),           // Cached 1 hour
  ])

  return (
    <Dashboard
      accounts={accounts}
      transactions={transactions}
      insights={insights}
    />
  )
}
```

### Pattern 3: Nested Caching

```ts
// Top-level cached function
export async function getDashboardData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.dashboard(userId))

  // Calls other cached functions
  const accounts = await getAccounts(userId)     // Also cached
  const transactions = await getTransactions(userId) // Also cached

  return {
    accounts,
    transactions,
    summary: calculateSummary(accounts, transactions),
  }
}

// Nested cached function
export async function getAccounts(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))

  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })
}
```

### Pattern 4: Conditional Caching

```ts
// ✅ CORRECT - Cache only for non-admin users
export async function getData(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    // No caching for admin (always fresh)
    return await fetchDataDirect(userId)
  }

  // Regular users get cached data
  return await getDataCached(userId)
}

function getDataCached(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))
  return fetchDataDirect(userId)
}

async function fetchDataDirect(userId: string) {
  return await db.query.data.findMany({
    where: eq(data.userId, userId),
  })
}
```

## Anti-Patterns

### ❌ Caching in Route Handlers

```ts
// ❌ BAD - Can't use 'use cache' in route handlers
export async function GET(request: NextRequest) {
  'use cache' // Won't work!
  const data = await fetchData()
  return NextResponse.json(data)
}

// ✅ GOOD - Extract to helper
export async function GET(request: NextRequest) {
  const data = await getDataCached()
  return NextResponse.json(data)
}

function getDataCached() {
  'use cache'
  return fetchData()
}
```

### ❌ Dynamic Values in Cached Functions

```ts
// ❌ BAD - Using cookies/headers in cached function
export async function getUserData(userId: string) {
  'use cache'
  const session = await cookies() // Error! Can't use cookies()
  return fetchData(userId, session)
}

// ✅ GOOD - Pass all dynamic data as parameters
export async function getUserData(userId: string, sessionId: string) {
  'use cache'
  return fetchData(userId, sessionId)
}

// Caller gets dynamic values
export default async function Page() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  const data = await getUserData('123', sessionId)
}
```

### ❌ Missing Cache Tags

```ts
// ❌ BAD - No way to invalidate
export async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  // Missing cacheTag!
  return fetchData(userId)
}

// ✅ GOOD - Always add cache tags
export async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))
  return fetchData(userId)
}
```

### ❌ Wrong Cache Scope

```ts
// ❌ BAD - Global cache for user-specific data
export async function getAccounts() {
  'use cache'
  cacheTag('accounts') // Global tag - wrong!
  return await db.query.accounts.findMany() // Returns ALL accounts!
}

// ✅ GOOD - User-scoped cache
export async function getAccounts(userId: string) {
  'use cache'
  cacheTag(UserTags.accounts(userId)) // User-scoped
  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })
}
```

### ❌ Not Invalidating Cache

```ts
// ❌ BAD - Update without invalidation
export async function updateAccount(id: string, data: AccountData) {
  await db.update(accounts).set(data).where(eq(accounts.id, id))
  // Cache still has old data!
}

// ✅ GOOD - Invalidate after update
export async function updateAccount(id: string, data: AccountData) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
  })

  await db.update(accounts).set(data).where(eq(accounts.id, id))

  revalidateTag(UserTags.accounts(account!.userId))
}
```

## Cache Monitoring

### 1. Performance Tracking

```ts
// lib/cache/monitoring.ts
import { logger } from '@/lib/utils/logger'

export async function measureCachePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start

  logger.info({
    cache: name,
    duration,
    timestamp: new Date().toISOString(),
  }, 'Cache performance')

  return result
}

// Usage
export async function getUserAccounts(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))

  return await measureCachePerformance('getUserAccounts', async () => {
    return await db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
    })
  })
}
```

### 2. Cache Hit Tracking

```ts
// Add X-Cache header to track hits/misses
export async function GET(request: NextRequest) {
  const start = Date.now()
  const data = await getDataCached(userId)
  const duration = Date.now() - start

  return NextResponse.json(data, {
    headers: {
      'X-Cache': duration < 10 ? 'HIT' : 'MISS',
      'X-Cache-Duration': duration.toString(),
    },
  })
}
```

## Audit System

### How to Audit

**Invoke audit mode:**
```
Audit caching in app/api/v1/transactions/route.ts
```

The skill will:
1. Identify all data fetching operations
2. Check if properly cached
3. Verify cache tags exist
4. Ensure invalidation is implemented
5. Generate optimization recommendations

### Audit Report Format

```markdown
## Cache Audit: app/api/v1/transactions/route.ts

**Cache Score**: 65/100 (Needs Work ⚠️)

### ✅ Cached Operations
- `getUserTransactions()` - Properly cached with tags

### 🚨 Critical Issues

#### 1. Missing Caching (Line 35)
**Current**: Direct database query in route handler
**Fix**: Extract to cached helper function
**Impact**: HIGH - Hitting database on every request

#### 2. No Cache Invalidation (Line 60)
**Current**: Update handler doesn't invalidate cache
**Fix**: Add `revalidateTag()` call
**Impact**: HIGH - Stale data after updates

### Cache Strategy Recommendations

1. **User Transactions** - Cache for 5 minutes (user data)
2. **Transaction Categories** - Cache for 1 hour (global data)
3. **Transaction Stats** - Cache for 15 minutes (aggregated data)

### Performance Gains

**Current**: 250ms average response time
**After Fixes**: 15ms average response time (94% improvement)
```

### Scoring Rubric

**Critical (25 points each)**:
- [ ] All data fetching operations cached
- [ ] Cache tags present for invalidation
- [ ] Mutations invalidate relevant caches
- [ ] No dynamic values in cached functions

**High Priority (15 points each)**:
- [ ] Appropriate cache lifetimes
- [ ] Request memoization for deduplication
- [ ] Cache monitoring/logging
- [ ] No cacheWrap (migrated to Cache Components)

**Medium Priority (5 points each)**:
- [ ] Cache hit/miss tracking
- [ ] Performance metrics logged
- [ ] Documentation of cache strategy

## Configuration

### next.config.ts

```ts
// ✅ REQUIRED - Enable Cache Components
const nextConfig: NextConfig = {
  cacheComponents: true, // Required for 'use cache'
}

export default nextConfig
```

### Runtime Requirements

- **Node.js 20.9+** - Cache Components require Node.js runtime
- **Edge Runtime** - NOT compatible with Cache Components (use Node.js)

```ts
// ❌ BAD - Edge runtime incompatible
export const runtime = 'edge'

export async function getData() {
  'use cache' // Won't work on Edge!
  return fetchData()
}

// ✅ GOOD - Node.js runtime (default)
export async function getData() {
  'use cache'
  return fetchData()
}
```

## Best Practices

### 1. Cache Granularity

```ts
// ✅ GOOD - Fine-grained caching
export async function getAccountsWithBalances(userId: string) {
  'use cache'
  cacheTag(UserTags.accounts(userId))

  const accounts = await getAccounts(userId) // Also cached
  const balances = await getBalances(accounts.map(a => a.id)) // Also cached

  return accounts.map((account, i) => ({
    ...account,
    balance: balances[i],
  }))
}
```

### 2. Cache Composition

```ts
// Compose multiple cached functions
export async function getDashboard(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.dashboard(userId))

  // All of these are also cached
  const accounts = await getAccounts(userId)
  const transactions = await getRecentTransactions(userId)
  const insights = await getInsights(userId)

  return { accounts, transactions, insights }
}
```

### 3. Invalidation Patterns

```ts
// Batch invalidation
export async function syncUserData(userId: string) {
  await performSync(userId)

  // Invalidate all related caches at once
  const tags = [
    UserTags.accounts(userId),
    UserTags.transactions(userId),
    UserTags.dashboard(userId),
  ]

  tags.forEach(tag => revalidateTag(tag))
}
```

### 4. Cache Warming

```ts
// Pre-populate cache for common queries
export async function warmUserCache(userId: string) {
  // Fire and forget - don't await
  void getAccounts(userId)
  void getTransactions(userId)
  void getDashboard(userId)
}

// Call after user login
export async function handleLogin(userId: string) {
  // Auth logic...

  // Warm cache in background
  warmUserCache(userId)
}
```

## Success Criteria

A well-architected cache system has:

✅ **Complete Coverage** - All expensive operations cached
✅ **Proper Scoping** - User-scoped tags, not global
✅ **Invalidation Strategy** - All mutations invalidate correctly
✅ **Appropriate TTLs** - Cache lifetime matches data volatility
✅ **Request Deduplication** - React `cache()` for within-request
✅ **Monitoring** - Performance tracking and hit rates
✅ **No Legacy Code** - Fully migrated from `cacheWrap`
✅ **Type Safety** - Proper TypeScript throughout
✅ **Documentation** - Cache strategy documented

## Resources

- `/resources/migration-guide.md` - Detailed cacheWrap → Cache Components migration
- `/resources/patterns.md` - Common caching patterns
- `/resources/examples.md` - Real-world cache implementations
- `/resources/debugging.md` - Cache troubleshooting
