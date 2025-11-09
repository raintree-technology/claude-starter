# Cache Debugging Guide

Comprehensive guide for debugging Next.js 16 Cache Components issues.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Debugging Tools](#debugging-tools)
3. [Cache Hit/Miss Tracking](#cache-hitmiss-tracking)
4. [Performance Profiling](#performance-profiling)
5. [Troubleshooting Checklist](#troubleshooting-checklist)

---

## Common Issues

### Issue 1: Cache Not Working

**Symptoms:**
- Data always fetched from source
- No performance improvement
- Cache headers show "MISS"

**Possible Causes:**

#### A. Missing `'use cache'` directive

```ts
// ❌ BAD - No caching
export async function getData(userId: string) {
  // Missing 'use cache'!
  return await db.query.data.findMany({
    where: eq(data.userId, userId),
  })
}

// ✅ GOOD
export async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))
  return await db.query.data.findMany({
    where: eq(data.userId, userId),
  })
}
```

#### B. Using in route handler body

```ts
// ❌ BAD - 'use cache' in route handler
export async function GET(request: NextRequest) {
  'use cache' // Won't work here!
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

#### C. Using dynamic APIs in cached function

```ts
// ❌ BAD - Using cookies() in cached function
export async function getData(userId: string) {
  'use cache'
  const session = await cookies() // Error!
  return fetchData(userId, session)
}

// ✅ GOOD - Pass dynamic values as parameters
export async function getData(userId: string, sessionId: string) {
  'use cache'
  return fetchData(userId, sessionId)
}

// Caller extracts dynamic values
export default async function Page() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  const data = await getData('123', sessionId)
}
```

#### D. Edge runtime

```ts
// ❌ BAD - Edge runtime incompatible
export const runtime = 'edge'

export async function getData() {
  'use cache' // Won't work on Edge!
  return fetchData()
}

// ✅ GOOD - Use Node.js runtime (default)
export async function getData() {
  'use cache'
  return fetchData()
}
```

---

### Issue 2: Stale Data After Updates

**Symptoms:**
- UI shows old data after mutations
- Cache not invalidating
- Users see outdated information

**Possible Causes:**

#### A. Missing cache invalidation

```ts
// ❌ BAD - No invalidation
export async function updateAccount(id: string, data: AccountData) {
  await db.update(accounts).set(data).where(eq(accounts.id, id))
  // Cache still has old data!
}

// ✅ GOOD
export async function updateAccount(id: string, data: AccountData) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
  })

  await db.update(accounts).set(data).where(eq(accounts.id, id))

  // Invalidate cache
  revalidateTag(UserTags.accounts(account!.userId))
}
```

#### B. Wrong tag invalidated

```ts
// ❌ BAD - Invalidating wrong tag
export async function updateAccount(accountId: string, data: AccountData) {
  await db.update(accounts).set(data).where(eq(accounts.id, accountId))
  revalidateTag('accounts') // Wrong tag!
}

// ✅ GOOD - Correct tag
export async function updateAccount(accountId: string, data: AccountData) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })

  await db.update(accounts).set(data).where(eq(accounts.id, accountId))
  revalidateTag(UserTags.accounts(account!.userId)) // Correct!
}
```

#### C. Missing cache tags in cached function

```ts
// ❌ BAD - No cache tag
export async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  // No cacheTag! Can't invalidate!
  return fetchData(userId)
}

// ✅ GOOD
export async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))
  return fetchData(userId)
}
```

---

### Issue 3: Cache Taking Too Long to Update

**Symptoms:**
- Data eventually updates but takes minutes
- Inconsistent freshness
- Users complain about delays

**Solution: Use `updateTag` for Immediate Invalidation**

```ts
// ❌ SLOW - Using revalidateTag (stale-while-revalidate)
export async function updateAccount(id: string, data: AccountData) {
  'use server'

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
  })

  await db.update(accounts).set(data).where(eq(accounts.id, id))

  // This allows stale data to be served
  revalidateTag(UserTags.accounts(account!.userId))
}

// ✅ FAST - Using updateTag (immediate expiration)
import { updateTag } from 'next/cache'

export async function updateAccount(id: string, data: AccountData) {
  'use server'

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
  })

  await db.update(accounts).set(data).where(eq(accounts.id, id))

  // Immediately expires cache
  updateTag(UserTags.accounts(account!.userId))
}
```

**Key Difference:**
- `revalidateTag()` - Stale-while-revalidate (gradual update)
- `updateTag()` - Immediate expiration (instant freshness)

Use `updateTag()` in Server Actions for read-your-own-writes scenarios.

---

### Issue 4: Over-Cached Data

**Symptoms:**
- User sees data from other users
- Data doesn't match user context
- Security concern

**Possible Causes:**

#### A. Global cache for user-specific data

```ts
// ❌ BAD - Global cache
export async function getAccounts() {
  'use cache'
  cacheTag('accounts') // Global!
  return await db.query.accounts.findMany() // ALL accounts!
}

// ✅ GOOD - User-scoped
export async function getAccounts(userId: string) {
  'use cache'
  cacheTag(UserTags.accounts(userId)) // User-scoped
  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })
}
```

#### B. Not passing userId to cached function

```ts
// ❌ BAD
export async function getData() {
  'use cache'
  const userId = await getUserId() // Different userId each call!
  return fetchData(userId)
}

// ✅ GOOD
export async function getData(userId: string) {
  'use cache'
  cacheTag(UserTags.data(userId))
  return fetchData(userId)
}
```

---

### Issue 5: High Memory Usage

**Symptoms:**
- Server memory growing
- OOM errors
- Performance degradation

**Possible Causes:**

#### A. Caching too much data

```ts
// ❌ BAD - Caching entire dataset
export async function getAllTransactions(userId: string) {
  'use cache'
  return await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    // No limit! Could be millions of rows!
  })
}

// ✅ GOOD - Limit data
export async function getRecentTransactions(userId: string) {
  'use cache'
  cacheTag(UserTags.transactions(userId))
  return await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    orderBy: desc(transactions.date),
    limit: 100, // Reasonable limit
  })
}
```

#### B. Caching large objects

```ts
// ❌ BAD - Caching with heavy nested data
export async function getAccountWithEverything(accountId: string) {
  'use cache'
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })

  // Loading massive amounts of related data
  const transactions = await db.query.transactions.findMany({
    where: eq(transactions.accountId, accountId),
  })

  return { account, transactions } // Huge object!
}

// ✅ GOOD - Cache separately
export async function getAccount(accountId: string) {
  'use cache'
  cacheTag(`account:${accountId}`)
  return await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })
}

export async function getAccountTransactions(
  accountId: string,
  limit: number = 100
) {
  'use cache'
  cacheTag(`account:${accountId}:transactions`)
  return await db.query.transactions.findMany({
    where: eq(transactions.accountId, accountId),
    limit,
  })
}
```

---

## Debugging Tools

### Tool 1: Cache Performance Logger

```ts
// lib/cache/monitoring.ts
import { logger } from '@/lib/utils/logger'

export async function measureCachePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - start

    logger.info({
      cache: name,
      duration,
      status: duration < 10 ? 'HIT' : 'MISS',
      timestamp: new Date().toISOString(),
    })

    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error({
      cache: name,
      duration,
      error,
      status: 'ERROR',
    })
    throw error
  }
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

### Tool 2: Cache Hit Rate Tracker

```ts
// lib/cache/analytics.ts
import { kv } from '@/lib/utils/kv'

export async function trackCacheAccess(
  key: string,
  hit: boolean
) {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const hitKey = `cache:hits:${date}`
  const missKey = `cache:misses:${date}`

  if (hit) {
    await kv.incr(hitKey)
  } else {
    await kv.incr(missKey)
  }
}

export async function getCacheStats(date: string) {
  const hits = await kv.get<number>(`cache:hits:${date}`) || 0
  const misses = await kv.get<number>(`cache:misses:${date}`) || 0
  const total = hits + misses

  return {
    hits,
    misses,
    total,
    hitRate: total > 0 ? (hits / total) * 100 : 0,
  }
}

// Usage in route handler
export async function GET(request: NextRequest) {
  const start = Date.now()
  const data = await getDataCached(userId)
  const duration = Date.now() - start

  // Track hit/miss
  await trackCacheAccess('userData', duration < 10)

  return NextResponse.json(data, {
    headers: {
      'X-Cache': duration < 10 ? 'HIT' : 'MISS',
      'X-Cache-Duration': duration.toString(),
    },
  })
}
```

### Tool 3: Cache Invalidation Logger

```ts
// lib/cache/invalidation-logger.ts
import { revalidateTag as nextRevalidateTag } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export function revalidateTag(tag: string, profile?: 'max') {
  logger.info({
    action: 'cache_invalidation',
    tag,
    profile,
    timestamp: new Date().toISOString(),
  })

  return nextRevalidateTag(tag, profile)
}

// Use this wrapper instead of direct revalidateTag
import { revalidateTag } from '@/lib/cache/invalidation-logger'
```

### Tool 4: Cache Size Monitor

```ts
// lib/cache/size-monitor.ts
export function estimateCacheSize(data: any): number {
  const json = JSON.stringify(data)
  return new Blob([json]).size
}

export async function monitorCacheSize<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const result = await fn()
  const size = estimateCacheSize(result)

  if (size > 1024 * 1024) { // 1MB
    logger.warn({
      cache: name,
      size,
      message: 'Large cache entry detected',
    })
  }

  return result
}
```

---

## Cache Hit/Miss Tracking

### Implementation

```ts
// app/api/v1/accounts/route.ts
export async function GET(request: NextRequest) {
  const userId = await getUserId()
  const start = Date.now()

  const accounts = await getUserAccounts(userId)

  const duration = Date.now() - start
  const cacheStatus = duration < 10 ? 'HIT' : 'MISS'

  logger.info({
    endpoint: '/api/v1/accounts',
    userId,
    duration,
    cacheStatus,
  })

  return NextResponse.json(accounts, {
    headers: {
      'X-Cache': cacheStatus,
      'X-Cache-Duration': duration.toString(),
    },
  })
}
```

### Dashboard

Create a simple cache stats endpoint:

```ts
// app/api/admin/cache-stats/route.ts
export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const stats = await getCacheStats(today)

  return NextResponse.json(stats)
}
```

---

## Performance Profiling

### 1. Measure Endpoint Performance

```ts
// lib/monitoring/performance.ts
export async function profileEndpoint<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - start

    logger.info({
      endpoint: name,
      duration,
      status: 'success',
    })

    return result
  } catch (error) {
    const duration = Date.now() - start

    logger.error({
      endpoint: name,
      duration,
      status: 'error',
      error,
    })

    throw error
  }
}

// Usage
export async function GET(request: NextRequest) {
  return await profileEndpoint('GET /api/v1/accounts', async () => {
    const userId = await getUserId()
    const accounts = await getUserAccounts(userId)
    return NextResponse.json(accounts)
  })
}
```

### 2. Compare Before/After Performance

```ts
// Test script: scripts/test-cache-performance.ts
import { getUserAccounts } from '@/lib/services/accounts'

async function testCachePerformance() {
  const userId = 'test-user'

  // Cold start (cache miss)
  console.log('Cold start...')
  const start1 = Date.now()
  await getUserAccounts(userId)
  const cold = Date.now() - start1
  console.log(`Cold: ${cold}ms`)

  // Warm (cache hit)
  console.log('Warm...')
  const start2 = Date.now()
  await getUserAccounts(userId)
  const warm = Date.now() - start2
  console.log(`Warm: ${warm}ms`)

  // Improvement
  const improvement = ((cold - warm) / cold) * 100
  console.log(`Improvement: ${improvement.toFixed(1)}%`)
}

testCachePerformance()
```

---

## Troubleshooting Checklist

### Cache Not Working

- [ ] Is `'use cache'` directive present?
- [ ] Is function extracted from route handler?
- [ ] Is `cacheLife()` set?
- [ ] Is runtime Node.js (not Edge)?
- [ ] Are dynamic APIs (cookies/headers) avoided?
- [ ] Is `cacheComponents: true` in next.config.ts?

### Stale Data

- [ ] Is `revalidateTag()` or `updateTag()` called after mutations?
- [ ] Is correct cache tag used?
- [ ] Does cached function have `cacheTag()`?
- [ ] Is tag name consistent between cache and invalidation?
- [ ] Is userId included in tag for user-scoped data?

### Wrong Data Shown

- [ ] Is cache tag user-scoped (not global)?
- [ ] Is userId passed as parameter to cached function?
- [ ] Is where clause filtering by userId?
- [ ] Are cache tags unique per user?

### Performance Issues

- [ ] Is data size reasonable (< 1MB)?
- [ ] Are queries using limits?
- [ ] Is nested data cached separately?
- [ ] Are cache lifetimes appropriate?
- [ ] Is request memoization used?

### Memory Issues

- [ ] Is data size monitored?
- [ ] Are cache lifetimes too long?
- [ ] Is pagination used for large datasets?
- [ ] Are old caches expiring?

---

## Debug Mode

Enable verbose logging:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
```

Check logs for:
- Cache hits/misses
- Invalidation events
- Query durations
- Memory usage

---

## Common Error Messages

### Error: "Cannot use 'use cache' with cookies()"

**Solution:** Pass dynamic values as parameters

```ts
// ❌ BAD
export async function getData(userId: string) {
  'use cache'
  const session = await cookies()
  return fetchData(userId, session)
}

// ✅ GOOD
export async function getData(userId: string, sessionId: string) {
  'use cache'
  return fetchData(userId, sessionId)
}
```

### Error: "Uncached data was accessed outside of `<Suspense>`"

**Solution:** Wrap component in Suspense boundary

```tsx
// ❌ BAD
export default function Page() {
  return <DynamicComponent />
}

// ✅ GOOD
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DynamicComponent />
    </Suspense>
  )
}
```

---

## Summary

**Debugging Steps:**

1. **Verify setup** - Check config, directives, runtime
2. **Add logging** - Track hits/misses, performance
3. **Monitor tags** - Ensure invalidation works
4. **Profile performance** - Measure before/after
5. **Check scope** - Verify user-scoped caching
6. **Test edge cases** - Admin users, empty data, errors

**Tools to Use:**

- Performance logger
- Hit rate tracker
- Invalidation logger
- Size monitor
- Cache stats dashboard

**Best Practices:**

- Log all cache operations
- Track hit rates
- Monitor cache size
- Test invalidation
- Profile regularly
- Document cache strategy
