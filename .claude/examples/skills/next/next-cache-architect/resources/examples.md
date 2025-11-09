# Real-World Cache Examples

Production-ready caching implementations for common scenarios in financial/fintech apps.

## Table of Contents

1. [Dashboard with Multiple Data Sources](#dashboard-with-multiple-data-sources)
2. [Transaction List with Filters](#transaction-list-with-filters)
3. [Account Balance Sync](#account-balance-sync)
4. [Real Estate Property Data](#real-estate-property-data)
5. [Market Data (Crypto/Stocks)](#market-data-cryptostocks)
6. [User Analytics](#user-analytics)
7. [Plaid Integration](#plaid-integration)
8. [Search and Filtering](#search-and-filtering)

---

## Dashboard with Multiple Data Sources

Complex dashboard aggregating data from multiple sources with different cache strategies.

### Implementation

```ts
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { getUserId } from '@/lib/data/dal'
import { getDashboardData } from '@/lib/services/dashboard'
import { DashboardSkeleton } from '@/components/skeletons'

export default async function DashboardPage() {
  const userId = await getUserId()

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard userId={userId} />
    </Suspense>
  )
}

async function Dashboard({ userId }: { userId: string }) {
  const data = await getDashboardData(userId)

  return (
    <div>
      <AccountsSummary accounts={data.accounts} />
      <RecentTransactions transactions={data.transactions} />
      <InsightsPanel insights={data.insights} />
      <SpendingChart data={data.spending} />
    </div>
  )
}
```

```ts
// lib/services/dashboard.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getDashboardData(userId: string) {
  'use cache'
  cacheLife('minutes') // 5 minutes
  cacheTag(UserTags.dashboard(userId))

  // Parallel data fetching
  const [accounts, transactions, insights, spending] = await Promise.all([
    getAccountsSummary(userId),    // Cached separately
    getRecentTransactions(userId), // Cached separately
    getUserInsights(userId),       // Cached separately
    getSpendingData(userId),      // Cached separately
  ])

  return {
    accounts,
    transactions,
    insights,
    spending,
    lastUpdated: new Date().toISOString(),
  }
}

// Individual cached functions
export async function getAccountsSummary(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))

  const accounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(getAccountBalance(acc)),
    0
  )

  return {
    accounts: accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      balance: getAccountBalance(acc),
      institution: acc.institution,
    })),
    totalBalance,
    accountCount: accounts.length,
  }
}

export async function getRecentTransactions(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.transactions(userId))

  return await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    orderBy: desc(transactions.date),
    limit: 10,
  })
}

export async function getUserInsights(userId: string) {
  'use cache'
  cacheLife('hours') // 1 hour - less volatile
  cacheTag(UserTags.insights(userId))

  // Complex analytics calculation
  const transactions = await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
  })

  return calculateInsights(transactions)
}

export async function getSpendingData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.analytics(userId))

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const transactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      gte(transactions.date, thirtyDaysAgo)
    ),
  })

  return groupByCategory(transactions)
}
```

### Invalidation

```ts
// lib/plaid/webhooks.ts
import { revalidateTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function handlePlaidUpdate(userId: string) {
  // Sync data from Plaid...

  // Invalidate all dashboard components
  revalidateTag(UserTags.accounts(userId))
  revalidateTag(UserTags.transactions(userId))
  revalidateTag(UserTags.insights(userId))
  revalidateTag(UserTags.analytics(userId))
  revalidateTag(UserTags.dashboard(userId))
}
```

**Benefits:**
- Fast initial load with cached data
- Individual components can be invalidated
- Parallel data fetching
- Fine-grained cache control

---

## Transaction List with Filters

Paginated, filterable transaction list with smart caching.

### Implementation

```ts
// app/api/v1/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/data/dal'
import { getTransactionsFiltered } from './helpers'

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  const searchParams = request.nextUrl.searchParams

  const filters = {
    category: searchParams.get('category'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    minAmount: searchParams.get('minAmount'),
    maxAmount: searchParams.get('maxAmount'),
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const transactions = await getTransactionsFiltered(
    userId,
    filters,
    page,
    limit
  )

  return NextResponse.json(transactions)
}
```

```ts
// app/api/v1/transactions/helpers.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

interface TransactionFilters {
  category?: string | null
  startDate?: string | null
  endDate?: string | null
  minAmount?: string | null
  maxAmount?: string | null
}

export async function getTransactionsFiltered(
  userId: string,
  filters: TransactionFilters,
  page: number,
  limit: number
) {
  'use cache'
  cacheLife('minutes')

  // Cache tag includes filters for granular invalidation
  const filterKey = JSON.stringify(filters)
  cacheTag(
    UserTags.transactions(userId),
    `${UserTags.transactions(userId)}:${filterKey}:${page}`
  )

  const offset = (page - 1) * limit

  const conditions = [eq(transactions.userId, userId)]

  if (filters.category) {
    conditions.push(eq(transactions.category, filters.category))
  }

  if (filters.startDate) {
    conditions.push(gte(transactions.date, new Date(filters.startDate)))
  }

  if (filters.endDate) {
    conditions.push(lte(transactions.date, new Date(filters.endDate)))
  }

  if (filters.minAmount) {
    conditions.push(gte(transactions.amount, parseFloat(filters.minAmount)))
  }

  if (filters.maxAmount) {
    conditions.push(lte(transactions.amount, parseFloat(filters.maxAmount)))
  }

  const results = await db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: desc(transactions.date),
    limit,
    offset,
  })

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(...conditions))

  return {
    transactions: results,
    pagination: {
      page,
      limit,
      total: total[0].count,
      totalPages: Math.ceil(total[0].count / limit),
    },
  }
}
```

**Cache Strategy:**
- Cache each filter combination separately
- Invalidate all filters when transactions update
- 5-minute cache lifetime

---

## Account Balance Sync

Real-time balance updates with encryption.

### Implementation

```ts
// lib/services/balances.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'
import { getAccountBalance } from '@/lib/db/utils/balance-helpers'
import { getEncryptionKey } from '@/lib/encryption'

export async function getAccountBalances(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.balances(userId))

  const accounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  })

  const encryptionKey = await getEncryptionKey()

  return accounts.map(account => ({
    accountId: account.id,
    name: account.name,
    type: account.type,
    balance: getAccountBalance(
      account.balance,
      account.metadata,
      encryptionKey,
      account.id
    ),
    currency: account.currency,
    lastUpdated: account.updatedAt,
  }))
}

export async function updateAccountBalance(
  accountId: string,
  newBalance: number
) {
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, accountId),
  })

  if (!account) {
    throw new NotFoundError('Account not found')
  }

  // Encrypt balance
  const encryptionKey = await getEncryptionKey()
  const encryptedBalance = await encryptBalance(newBalance, { key: encryptionKey })

  // Update database
  await db
    .update(accounts)
    .set({
      balance: encryptedBalance,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId))

  // Invalidate caches
  revalidateTag(UserTags.balances(account.userId))
  revalidateTag(UserTags.accounts(account.userId))
  revalidateTag(UserTags.dashboard(account.userId))
}
```

**Security:**
- Balances encrypted at rest
- Decryption happens in cached function
- Invalidate on every balance update

---

## Real Estate Property Data

Cached property data with enrichment.

### Implementation

```ts
// lib/services/real-estate.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getUserProperties(userId: string) {
  'use cache'
  cacheLife('hours') // Properties change infrequently
  cacheTag(UserTags.properties(userId))

  const properties = await db.query.realEstateProperties.findMany({
    where: eq(realEstateProperties.userId, userId),
  })

  // Enrich with external data (also cached)
  const enriched = await Promise.all(
    properties.map(async property => ({
      ...property,
      valuation: await getPropertyValuation(property.address),
      marketData: await getMarketData(property.zipCode),
    }))
  )

  return enriched
}

export async function getPropertyValuation(address: string) {
  'use cache'
  cacheLife('days') // Valuations update rarely
  cacheTag(`property:valuation:${address}`)

  // Call external API
  return await fetchPropertyValuation(address)
}

export async function getMarketData(zipCode: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(`market:${zipCode}`)

  return await fetchMarketData(zipCode)
}
```

### Invalidation

```ts
// app/api/v1/real-estate/sync/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  const userId = await getUserId()

  // Sync property data...

  // Invalidate caches
  revalidateTag(UserTags.properties(userId))

  return NextResponse.json({ success: true })
}
```

---

## Market Data (Crypto/Stocks)

Time-sensitive market data with aggressive caching.

### Implementation

```ts
// lib/services/market-data.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { DataTags } from '@/lib/cache/tags'

// Real-time prices (1 minute cache)
export async function getCryptoPrice(symbol: string) {
  'use cache'
  cacheLife({
    stale: 30,      // 30 seconds
    revalidate: 60, // 1 minute
    expire: 120,    // 2 minutes
  })
  cacheTag(DataTags.CRYPTO_PRICES, `price:${symbol}`)

  return await fetchCryptoPrice(symbol)
}

// Historical prices (1 day cache)
export async function getHistoricalPrices(
  symbol: string,
  days: number = 30
) {
  'use cache'
  cacheLife('days')
  cacheTag(`price:${symbol}:historical`)

  return await fetchHistoricalPrices(symbol, days)
}

// Portfolio value (5 minutes cache)
export async function getPortfolioValue(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.portfolio(userId))

  const holdings = await db.query.investmentHoldings.findMany({
    where: eq(investmentHoldings.userId, userId),
  })

  // Get current prices (cached separately)
  const prices = await Promise.all(
    holdings.map(h => getCryptoPrice(h.symbol))
  )

  const totalValue = holdings.reduce(
    (sum, holding, i) => sum + holding.quantity * prices[i].price,
    0
  )

  return {
    holdings: holdings.map((holding, i) => ({
      ...holding,
      currentPrice: prices[i].price,
      value: holding.quantity * prices[i].price,
    })),
    totalValue,
  }
}
```

### Price Update Webhook

```ts
// app/api/webhooks/prices/route.ts
import { revalidateTag } from 'next/cache'
import { DataTags } from '@/lib/cache/tags'

export async function POST(request: NextRequest) {
  const { symbols } = await request.json()

  // Invalidate price caches
  revalidateTag(DataTags.CRYPTO_PRICES)

  // Invalidate specific symbols
  symbols.forEach((symbol: string) => {
    revalidateTag(`price:${symbol}`)
  })

  return NextResponse.json({ success: true })
}
```

---

## User Analytics

Complex analytics with layered caching.

### Implementation

```ts
// lib/services/analytics.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getUserAnalytics(userId: string) {
  'use cache'
  cacheLife('hours') // Analytics update hourly
  cacheTag(UserTags.analytics(userId))

  const [spending, income, savings, trends] = await Promise.all([
    getSpendingAnalytics(userId),
    getIncomeAnalytics(userId),
    getSavingsRate(userId),
    getSpendingTrends(userId),
  ])

  return {
    spending,
    income,
    savings,
    trends,
    generated: new Date().toISOString(),
  }
}

export async function getSpendingAnalytics(userId: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(`${UserTags.analytics(userId)}:spending`)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const transactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      gte(transactions.date, thirtyDaysAgo),
      lt(transactions.amount, 0) // Negative = spending
    ),
  })

  const byCategory = transactions.reduce((acc, t) => {
    const category = t.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + Math.abs(t.amount)
    return acc
  }, {} as Record<string, number>)

  const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0)
  const average = total / 30

  return {
    total,
    average,
    byCategory,
    transactionCount: transactions.length,
  }
}

export async function getSpendingTrends(userId: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(`${UserTags.analytics(userId)}:trends`)

  // Get 6 months of data
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const transactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      gte(transactions.date, sixMonthsAgo)
    ),
  })

  // Group by month
  const byMonth = transactions.reduce((acc, t) => {
    const month = t.date.toISOString().substring(0, 7) // YYYY-MM
    if (!acc[month]) acc[month] = 0
    acc[month] += Math.abs(t.amount)
    return acc
  }, {} as Record<string, number>)

  return Object.entries(byMonth).map(([month, total]) => ({
    month,
    total,
  }))
}
```

---

## Plaid Integration

Cache Plaid data with proper invalidation.

### Implementation

```ts
// lib/plaid/services/plaid-data.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function getPlaidTransactions(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.transactions(userId))

  const connections = await db.query.connections.findMany({
    where: and(
      eq(connections.userId, userId),
      eq(connections.status, 'active')
    ),
  })

  // Fetch from Plaid for each connection
  const results = await Promise.all(
    connections.map(conn => plaidClient.getTransactions(conn.accessToken))
  )

  return results.flat()
}

export async function getPlaidAccounts(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))

  const connections = await db.query.connections.findMany({
    where: and(
      eq(connections.userId, userId),
      eq(connections.status, 'active')
    ),
  })

  const results = await Promise.all(
    connections.map(conn => plaidClient.getAccounts(conn.accessToken))
  )

  return results.flat()
}
```

### Webhook Handler

```ts
// app/api/webhooks/plaid/route.ts
import { revalidateTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function POST(request: NextRequest) {
  const webhook = await request.json()

  const { webhook_type, item_id } = webhook

  // Get user ID from item_id
  const connection = await db.query.connections.findFirst({
    where: eq(connections.plaidItemId, item_id),
  })

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const userId = connection.userId

  // Invalidate based on webhook type
  switch (webhook_type) {
    case 'TRANSACTIONS':
      revalidateTag(UserTags.transactions(userId))
      revalidateTag(UserTags.dashboard(userId))
      break

    case 'DEFAULT_UPDATE':
      revalidateTag(UserTags.accounts(userId))
      revalidateTag(UserTags.balances(userId))
      revalidateTag(UserTags.dashboard(userId))
      break

    case 'AUTH':
      revalidateTag(UserTags.connections(userId))
      break
  }

  return NextResponse.json({ success: true })
}
```

---

## Search and Filtering

Efficient search with cached results.

### Implementation

```ts
// lib/services/search.ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'
import { UserTags } from '@/lib/cache/tags'

export async function searchTransactions(
  userId: string,
  query: string
) {
  'use cache'
  cacheLife('minutes')
  cacheTag(
    UserTags.transactions(userId),
    `${UserTags.transactions(userId)}:search:${query}`
  )

  const normalizedQuery = query.toLowerCase().trim()

  const transactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, userId),
      or(
        sql`LOWER(${transactions.name}) LIKE ${`%${normalizedQuery}%`}`,
        sql`LOWER(${transactions.merchant}) LIKE ${`%${normalizedQuery}%`}`,
        sql`LOWER(${transactions.category}) LIKE ${`%${normalizedQuery}%`}`
      )
    ),
    orderBy: desc(transactions.date),
    limit: 100,
  })

  return transactions
}

export async function getPopularSearches(userId: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(`${UserTags.analytics(userId)}:searches`)

  // Get most common merchants
  const merchants = await db
    .select({
      merchant: transactions.merchant,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(transactions.merchant)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  return merchants
}
```

---

## Summary

**Key Patterns Demonstrated:**

1. **Layered Caching** - Different lifetimes for different data
2. **Parallel Fetching** - Use `Promise.all` for independent data
3. **Granular Tags** - Fine-grained invalidation
4. **Composition** - Combine multiple cached functions
5. **Security** - Cache encrypted data safely
6. **Real-time** - Short cache times for volatile data
7. **Webhooks** - Invalidate on external events
8. **Search** - Cache search results separately

**Performance Tips:**

- Cache expensive operations first
- Use shortest appropriate lifetime
- Invalidate immediately after mutations
- Monitor cache hit rates
- Warm cache after login
- Use stale-while-revalidate for non-critical data
