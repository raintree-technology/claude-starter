# Caching Patterns Reference

Common caching patterns for Next.js 16 Cache Components.

## Table of Contents

1. [Basic Patterns](#basic-patterns)
2. [Composition Patterns](#composition-patterns)
3. [Invalidation Patterns](#invalidation-patterns)
4. [Advanced Patterns](#advanced-patterns)
5. [Anti-Patterns](#anti-patterns)

## Basic Patterns

### Pattern: Single Resource Cache

Cache individual database records or API responses.

```ts
// lib/services/users.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getUserById(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.profile(userId))

  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
}
```

**When to use:**
- Single record lookups
- User profiles
- Individual items

**Cache lifetime:** 5-15 minutes

---

### Pattern: Collection Cache

Cache lists of records.

```ts
// lib/services/accounts.ts
export async function getUserAccounts(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))

  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
    orderBy: desc(accounts.createdAt),
  })
}
```

**When to use:**
- User's accounts list
- Transaction history
- Any collection query

**Cache lifetime:** 5-15 minutes

---

### Pattern: Aggregated Data Cache

Cache computed or aggregated data.

```ts
// lib/services/analytics.ts
export async function getUserStats(userId: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(UserTags.analytics(userId))

  const accounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0
  )

  return {
    accountCount: accounts.length,
    totalBalance,
    averageBalance: totalBalance / accounts.length,
  }
}
```

**When to use:**
- Dashboard statistics
- Analytics data
- Computed summaries

**Cache lifetime:** 1-4 hours

---

### Pattern: Static Reference Data Cache

Cache data that rarely changes.

```ts
// lib/services/categories.ts
export async function getCategories() {
  'use cache'
  cacheLife('days')
  cacheTag(DataTags.CATEGORIES)

  return await db.query.categories.findMany({
    orderBy: asc(categories.name),
  })
}
```

**When to use:**
- Categories
- Institutions
- Reference tables

**Cache lifetime:** 7-30 days

---

## Composition Patterns

### Pattern: Nested Caching

Compose multiple cached functions.

```ts
// lib/services/dashboard.ts
export async function getDashboardData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.dashboard(userId))

  // Each of these is also cached
  const [accounts, transactions, insights] = await Promise.all([
    getUserAccounts(userId),      // Cached separately
    getRecentTransactions(userId), // Cached separately
    getInsights(userId),          // Cached separately
  ])

  return {
    accounts,
    transactions,
    insights,
    summary: calculateSummary(accounts, transactions),
  }
}
```

**Benefits:**
- Each component can be invalidated independently
- Shared data is cached once
- Fine-grained cache control

---

### Pattern: Layered Caching

Cache at multiple granularities.

```ts
// lib/services/transactions.ts

// Layer 1: Individual transaction
export async function getTransaction(transactionId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`transaction:${transactionId}`)

  return await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  })
}

// Layer 2: User's transactions
export async function getUserTransactions(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.transactions(userId))

  return await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    orderBy: desc(transactions.date),
    limit: 100,
  })
}

// Layer 3: Categorized transactions
export async function getTransactionsByCategory(
  userId: string,
  category: string
) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`${UserTags.transactions(userId)}:${category}`)

  return await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      eq(transactions.category, category)
    ),
  })
}
```

**Benefits:**
- Invalidate at different levels
- Optimize for common queries
- Reduce redundant fetches

---

### Pattern: Cache Dependencies

Handle related data that should be invalidated together.

```ts
// lib/services/accounts.ts
export async function getAccountWithBalances(accountId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`account:${accountId}`, `account:${accountId}:balances`)

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })

  const balances = await db.query.balances.findMany({
    where: eq(balances.accountId, accountId),
  })

  return { ...account, balances }
}

// Invalidate both tags when account updates
export async function updateAccount(accountId: string, data: AccountData) {
  await db.update(accounts).set(data).where(eq(accounts.id, accountId))

  revalidateTag(`account:${accountId}`)
  revalidateTag(`account:${accountId}:balances`)
}
```

---

## Invalidation Patterns

### Pattern: Single Tag Invalidation

Invalidate one cache entry.

```ts
// lib/actions.ts
'use server'

import { revalidateTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function updateUserProfile(userId: string, data: ProfileData) {
  await db.update(users).set(data).where(eq(users.id, userId))

  // Invalidate user profile cache
  revalidateTag(UserTags.profile(userId))
}
```

---

### Pattern: Batch Invalidation

Invalidate multiple related caches.

```ts
// lib/plaid/services/plaid-sync.ts
export async function syncPlaidData(userId: string) {
  await performSync(userId)

  // Invalidate all related caches
  const tags = [
    UserTags.accounts(userId),
    UserTags.transactions(userId),
    UserTags.balances(userId),
    UserTags.dashboard(userId),
  ]

  tags.forEach(tag => revalidateTag(tag))
}
```

---

### Pattern: Conditional Invalidation

Only invalidate if data actually changed.

```ts
export async function updateAccountBalance(
  accountId: string,
  newBalance: number
) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })

  // Only update and invalidate if balance changed
  if (account && account.balance !== newBalance) {
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId))

    revalidateTag(UserTags.accounts(account.userId))
    revalidateTag(UserTags.balances(account.userId))
  }
}
```

---

### Pattern: Stale-While-Revalidate

Serve stale content while fetching fresh in background.

```ts
export async function updateUserSettings(userId: string, settings: Settings) {
  await db.update(users).set({ settings }).where(eq(users.id, userId))

  // Use 'max' profile for SWR behavior
  revalidateTag(UserTags.settings(userId), 'max')
}
```

**Use cases:**
- Non-critical updates
- Background data refresh
- Gradual cache updates

---

### Pattern: Cascade Invalidation

Invalidate parent caches when child changes.

```ts
export async function updateTransaction(
  transactionId: string,
  data: TransactionData
) {
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  })

  await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, transactionId))

  // Invalidate transaction itself
  revalidateTag(`transaction:${transactionId}`)

  // Invalidate parent collections
  revalidateTag(UserTags.transactions(transaction!.userId))

  // Invalidate aggregated views
  revalidateTag(UserTags.dashboard(transaction!.userId))
  revalidateTag(UserTags.analytics(transaction!.userId))
}
```

---

## Advanced Patterns

### Pattern: Conditional Caching

Cache only for specific conditions.

```ts
export async function getData(userId: string, options: { skipCache?: boolean }) {
  // Skip cache for admin users or when explicitly requested
  if (options.skipCache) {
    return await fetchDataDirect(userId)
  }

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

---

### Pattern: Time-Based Cache Segmentation

Different cache times for different data freshness needs.

```ts
// Real-time data (1 minute)
export async function getRealtimePrice(symbol: string) {
  'use cache'
  cacheLife({
    stale: 30,
    revalidate: 60,
    expire: 120,
  })
  cacheTag(`price:${symbol}`)

  return await fetchPrice(symbol)
}

// Historical data (1 day)
export async function getHistoricalPrices(symbol: string) {
  'use cache'
  cacheLife('days')
  cacheTag(`price:${symbol}:historical`)

  return await fetchHistoricalPrices(symbol)
}
```

---

### Pattern: Request Memoization

Deduplicate calls within a single request.

```ts
// lib/cache/request-memoization.ts
import { cache } from 'react'

export const getUserById = cache(async (id: string) => {
  console.log('Fetching user:', id) // Only logs once per request
  return await db.query.users.findFirst({
    where: eq(users.id, id),
  })
})

// Server Component A
export async function ComponentA() {
  const user = await getUserById('123') // Hits DB
  return <div>{user.name}</div>
}

// Server Component B (same request)
export async function ComponentB() {
  const user = await getUserById('123') // Returns cached
  return <div>{user.email}</div>
}
```

---

### Pattern: Cache Warming

Pre-populate cache for common queries.

```ts
export async function warmUserCache(userId: string) {
  // Fire and forget - don't await
  void getUserAccounts(userId)
  void getRecentTransactions(userId)
  void getDashboardData(userId)
  void getUserInsights(userId)

  console.log('Cache warming initiated for user:', userId)
}

// Call after login
export async function handleLogin(userId: string) {
  // Perform auth...

  // Warm cache in background
  await warmUserCache(userId)

  return { success: true }
}
```

---

### Pattern: Fallback Caching

Provide fallback if cache fails.

```ts
export async function getDataWithFallback(userId: string) {
  try {
    return await getDataCached(userId)
  } catch (error) {
    logger.error({ error, userId }, 'Cache fetch failed, using fallback')

    // Fallback to direct fetch
    return await fetchDataDirect(userId)
  }
}
```

---

### Pattern: Cache Key Generation

Generate consistent cache tags.

```ts
// lib/cache/tags.ts
export const TagBuilder = {
  user: {
    accounts: (userId: string) => `user:${userId}:accounts`,
    transactions: (userId: string) => `user:${userId}:transactions`,
    byCategory: (userId: string, category: string) =>
      `user:${userId}:transactions:${category}`,
  },

  account: {
    details: (accountId: string) => `account:${accountId}`,
    balances: (accountId: string) => `account:${accountId}:balances`,
  },

  data: {
    categories: () => 'data:categories',
    institutions: () => 'data:institutions',
  },
}

// Usage
export async function getAccounts(userId: string) {
  'use cache'
  cacheTag(TagBuilder.user.accounts(userId))
  return fetchAccounts(userId)
}
```

---

## Anti-Patterns

### ❌ Anti-Pattern: Caching in Route Handlers

```ts
// ❌ BAD
export async function GET(request: NextRequest) {
  'use cache' // Won't work in route handler body!
  const data = await fetchData()
  return NextResponse.json(data)
}

// ✅ GOOD
export async function GET(request: NextRequest) {
  const data = await getDataCached()
  return NextResponse.json(data)
}

function getDataCached() {
  'use cache'
  return fetchData()
}
```

---

### ❌ Anti-Pattern: Dynamic Values in Cache

```ts
// ❌ BAD
export async function getData(userId: string) {
  'use cache'
  const session = await cookies() // Can't use cookies()!
  return fetchData(userId, session)
}

// ✅ GOOD
export async function getData(userId: string, sessionId: string) {
  'use cache'
  return fetchData(userId, sessionId)
}
```

---

### ❌ Anti-Pattern: Missing Cache Tags

```ts
// ❌ BAD
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

### ❌ Anti-Pattern: Over-Caching

```ts
// ❌ BAD - Caching user-specific data globally
export async function getAllAccounts() {
  'use cache'
  cacheTag('accounts') // Global tag!
  return await db.query.accounts.findMany() // Returns ALL accounts!
}

// ✅ GOOD - User-scoped caching
export async function getUserAccounts(userId: string) {
  'use cache'
  cacheTag(UserTags.accounts(userId))
  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })
}
```

---

### ❌ Anti-Pattern: Not Invalidating After Mutations

```ts
// ❌ BAD
export async function updateAccount(id: string, data: AccountData) {
  await db.update(accounts).set(data).where(eq(accounts.id, id))
  // Cache still has stale data!
}

// ✅ GOOD
export async function updateAccount(id: string, data: AccountData) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
  })

  await db.update(accounts).set(data).where(eq(accounts.id, id))

  revalidateTag(UserTags.accounts(account!.userId))
}
```

---

### ❌ Anti-Pattern: Too Many Cache Layers

```ts
// ❌ BAD - Unnecessary nesting
export async function getData(userId: string) {
  'use cache'
  return await getCachedData(userId) // Already cached!
}

function getCachedData(userId: string) {
  'use cache' // Double caching!
  return fetchData(userId)
}

// ✅ GOOD - Single cache layer
export async function getData(userId: string) {
  'use cache'
  return await fetchData(userId)
}
```

---

## Pattern Selection Guide

| Use Case | Pattern | Cache Life |
|----------|---------|------------|
| User profile | Single Resource | minutes |
| Account list | Collection | minutes |
| Dashboard stats | Aggregated Data | hours |
| Categories | Static Reference | days |
| Multiple related data | Nested Caching | minutes |
| Different granularities | Layered Caching | varies |
| Related invalidation | Cache Dependencies | minutes |
| After mutation | Single Tag Invalidation | N/A |
| After sync | Batch Invalidation | N/A |
| Non-critical updates | Stale-While-Revalidate | N/A |
| Admin vs user | Conditional Caching | varies |
| Real-time data | Time-Based Segmentation | seconds |
| Same request dedup | Request Memoization | request |
| Post-login | Cache Warming | N/A |

---

## Summary

**Key Takeaways:**

1. **Always add cache tags** - Enable invalidation
2. **Use appropriate lifetimes** - Match data volatility
3. **Invalidate after mutations** - Keep cache fresh
4. **Extract to helpers** - Can't use `'use cache'` in route handlers
5. **Avoid dynamic values** - Pass as parameters instead
6. **Test invalidation** - Ensure cache updates work
7. **Monitor performance** - Track hit rates
8. **Document strategy** - Help team understand patterns
