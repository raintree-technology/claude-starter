---
name: Streaming Architect
description: Design and optimize streaming UIs with Suspense boundaries, parallel data fetching, and loading states in Next.js 16. Implements granular streaming, skeleton loaders, and progressive page rendering.
version: 1.0.0
---

# Streaming Architect

## Overview

Specialized skill for Next.js 16 streaming and Suspense patterns. Focuses on:
- **Suspense Boundaries** - Granular loading with `<Suspense>`
- **loading.js** - Route-level streaming
- **React 19 `use` Hook** - Promise unwrapping in Client Components
- **Parallel Data Fetching** - Avoid waterfalls, stream in parallel
- **Loading States** - Meaningful skeletons, not generic spinners

## When to Use

Invoke when:
- "Optimize page loading"
- "Add loading states"
- "Fix slow pages"
- "Implement streaming"
- "Design skeleton loaders"
- "Improve perceived performance"

## Core Principle

> **Stream content as soon as it's ready. Don't block the entire page.**

## Basic Pattern

### 1. Route-Level Streaming

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-16 bg-gray-200 rounded animate-pulse" />
    </div>
  )
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  // This page streams with loading.tsx as fallback
  const data = await fetchData()
  return <Dashboard data={data} />
}
```

### 2. Component-Level Suspense

```tsx
// ✅ CORRECT - Granular streaming
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast component renders immediately */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      {/* Slow component streams in later */}
      <Suspense fallback={<TableSkeleton />}>
        <TransactionsTable />
      </Suspense>
    </div>
  )
}

// Async Server Component
async function RevenueChart() {
  const data = await getRevenueData() // Slow query
  return <Chart data={data} />
}

async function TransactionsTable() {
  const transactions = await getTransactions() // Very slow query
  return <Table data={transactions} />
}
```

## Advanced Patterns

### 1. Parallel Streaming

```tsx
// ✅ CORRECT - Multiple components stream in parallel
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* All stream independently in parallel */}
      <Suspense fallback={<CardSkeleton />}>
        <AccountsCard />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <BalanceCard />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <TransactionsCard />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <InsightsCard />
      </Suspense>
    </div>
  )
}

// Each card fetches data independently
async function AccountsCard() {
  const accounts = await getAccounts()
  return <Card title="Accounts" data={accounts} />
}

async function BalanceCard() {
  const balance = await getBalance()
  return <Card title="Balance" data={balance} />
}
```

### 2. Nested Suspense

```tsx
// ✅ CORRECT - Nested boundaries for progressive rendering
export default function Page() {
  return (
    <div>
      <h1>My Page</h1>

      {/* Outer boundary for main content */}
      <Suspense fallback={<MainSkeleton />}>
        <MainContent />
      </Suspense>
    </div>
  )
}

async function MainContent() {
  const data = await getMainData()

  return (
    <div>
      <Header data={data} />

      {/* Nested boundary for slower section */}
      <Suspense fallback={<DetailsSkeleton />}>
        <Details id={data.id} />
      </Suspense>
    </div>
  )
}

async function Details({ id }: { id: string }) {
  const details = await getDetails(id) // Slow query
  return <DetailsView data={details} />
}
```

### 3. React 19 `use` Hook

```tsx
// ✅ CORRECT - Pass promises, unwrap in client
// Server Component
export default function BlogPage() {
  const postsPromise = getPosts() // Don't await!

  return (
    <div>
      <h1>Blog</h1>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList postsPromise={postsPromise} />
      </Suspense>
    </div>
  )
}

// Client Component unwraps promise
'use client'

import { use } from 'react'

export function PostsList({ postsPromise }: { postsPromise: Promise<Post[]> }) {
  const posts = use(postsPromise) // React 19 - unwrap promise

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 4. Parallel Data Fetching

```tsx
// ✅ CORRECT - Initiate all requests in parallel
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Initiate all requests in parallel
  const userPromise = getUser(id)
  const postsPromise = getPosts(id)
  const commentsPromise = getComments(id)

  // Wait for all to complete
  const [user, posts, comments] = await Promise.all([
    userPromise,
    postsPromise,
    commentsPromise,
  ])

  return (
    <div>
      <UserProfile user={user} />
      <Posts posts={posts} />
      <Comments comments={comments} />
    </div>
  )
}

// ❌ WRONG - Sequential waterfall
export default async function BadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await getUser(id) // Blocks
  const posts = await getPosts(id) // Waits for user
  const comments = await getComments(id) // Waits for posts

  return <div>...</div>
}
```

### 5. Streaming with Partial Data

```tsx
// ✅ CORRECT - Show partial data, stream rest
export default function DashboardPage() {
  return (
    <div>
      {/* Fast data shows immediately */}
      <FastSection />

      {/* Slow data streams in */}
      <Suspense fallback={<SlowSkeleton />}>
        <SlowSection />
      </Suspense>
    </div>
  )
}

// Fast synchronous component
function FastSection() {
  return (
    <div>
      <h2>Welcome back!</h2>
      <p>Last login: Today</p>
    </div>
  )
}

// Slow async component
async function SlowSection() {
  const data = await getExpensiveData()
  return <DataView data={data} />
}
```

### 6. Conditional Streaming

```tsx
// ✅ CORRECT - Stream only when needed
export default async function Page({ searchParams }: { searchParams: Promise<{ view: string }> }) {
  const { view } = await searchParams

  if (view === 'simple') {
    // Simple view - no streaming needed
    const data = await getSimpleData()
    return <SimpleView data={data} />
  }

  // Complex view - use streaming
  return (
    <div>
      <Suspense fallback={<ComplexSkeleton />}>
        <ComplexView />
      </Suspense>
    </div>
  )
}
```

### 7. Error Boundaries with Suspense

```tsx
// ✅ CORRECT - Error boundary around Suspense
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Page() {
  return (
    <ErrorBoundary fallback={<ErrorView />}>
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  )
}

// Or use error.tsx for route-level errors
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 8. Skeleton Patterns

```tsx
// ✅ GOOD - Meaningful skeleton matching actual content
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-6 border rounded">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ❌ BAD - Generic spinner
export function BadSkeleton() {
  return <div className="spinner">Loading...</div>
}
```

### 9. Streaming Lists

```tsx
// ✅ CORRECT - Stream list items progressively
import { Suspense } from 'react'

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <ul>
        {/* Each product streams independently */}
        {[1, 2, 3, 4, 5].map(id => (
          <Suspense key={id} fallback={<ProductSkeleton />}>
            <ProductItem id={id} />
          </Suspense>
        ))}
      </ul>
    </div>
  )
}

async function ProductItem({ id }: { id: number }) {
  const product = await getProduct(id)
  return (
    <li>
      <h2>{product.name}</h2>
      <p>${product.price}</p>
    </li>
  )
}
```

### 10. Dynamic Imports for Code Splitting

```tsx
// ✅ CORRECT - Lazy load heavy components
'use client'

import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))
const HeavyTable = lazy(() => import('./HeavyTable'))

export function Dashboard({ showChart }: { showChart: boolean }) {
  return (
    <div>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}

      <Suspense fallback={<TableSkeleton />}>
        <HeavyTable />
      </Suspense>
    </div>
  )
}
```

## Anti-Patterns

### ❌ Blocking Entire Page

```tsx
// ❌ BAD - Everything waits for slowest query
export default async function BadPage() {
  const fast = await getFastData()
  const slow = await getSlowData() // Blocks everything!

  return (
    <div>
      <FastSection data={fast} />
      <SlowSection data={slow} />
    </div>
  )
}

// ✅ GOOD - Fast data shows immediately, slow streams in
export default function GoodPage() {
  return (
    <div>
      <Suspense fallback={<FastSkeleton />}>
        <FastSection />
      </Suspense>

      <Suspense fallback={<SlowSkeleton />}>
        <SlowSection />
      </Suspense>
    </div>
  )
}
```

### ❌ No Suspense Boundaries

```tsx
// ❌ BAD - No loading state
export default function Page() {
  return <AsyncComponent /> // No fallback!
}

// ✅ GOOD - Always wrap async components
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AsyncComponent />
    </Suspense>
  )
}
```

### ❌ Too Many Suspense Boundaries

```tsx
// ❌ BAD - Overly granular (too many loading states)
export default function Page() {
  return (
    <div>
      <Suspense fallback={<h1>Loading...</h1>}>
        <Title />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <Subtitle />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <Description />
      </Suspense>
    </div>
  )
}

// ✅ GOOD - Logical boundaries
export default function Page() {
  return (
    <div>
      {/* Group related content */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header /> {/* Contains Title, Subtitle, Description */}
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>
    </div>
  )
}
```

### ❌ Generic Loading Messages

```tsx
// ❌ BAD - Generic text
<Suspense fallback={<div>Loading...</div>}>

// ✅ GOOD - Meaningful skeleton matching content
<Suspense fallback={<DashboardSkeleton />}>
```

## Audit System

### How to Audit

**Invoke audit mode:**
```
Audit streaming in app/dashboard/page.tsx
```

The skill will check:
1. Suspense boundaries present
2. loading.tsx exists
3. Parallel vs sequential fetching
4. Meaningful skeletons
5. Error boundaries
6. Performance impact

### Audit Report

```markdown
## Streaming Audit: app/dashboard/page.tsx

**Streaming Score**: 68/100 (Needs Work ⚠️)

### ✅ Strengths
- Suspense boundaries present
- Meaningful skeleton loaders

### 🚨 Critical Issues

#### 1. Sequential Data Fetching (Line 15-17)
**Current**: Waterfall of await statements
**Fix**: Use Promise.all() for parallel fetching
**Impact**: HIGH - Page 3x slower than necessary

#### 2. No loading.tsx (app/dashboard/)
**Current**: No route-level loading state
**Fix**: Create loading.tsx with dashboard skeleton
**Impact**: MEDIUM - No instant feedback on navigation

### Performance Analysis

**Current**:
- Time to First Byte: 250ms
- Time to Interactive: 1200ms
- Layout Shift: Present (content pops in)

**After Fixes**:
- Time to First Byte: 50ms (loading.tsx)
- Time to Interactive: 400ms (parallel fetching)
- Layout Shift: None (skeleton matches layout)

### Estimated Improvement: 70% faster perceived load time
```

### Scoring Rubric

**Critical (25 points each)**:
- [ ] Suspense boundaries for async components
- [ ] Parallel data fetching (no waterfalls)
- [ ] loading.tsx for routes
- [ ] No blocking entire page

**High Priority (15 points each)**:
- [ ] Meaningful skeletons
- [ ] Error boundaries
- [ ] Nested Suspense for granularity
- [ ] Progressive rendering

**Medium Priority (5 points each)**:
- [ ] Dynamic imports for code splitting
- [ ] Streaming lists
- [ ] Conditional streaming

## Best Practices

### 1. Suspense Placement

```tsx
// Good rule: One Suspense per "loading zone"
export default function Page() {
  return (
    <div>
      {/* Header zone */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      {/* Content zone */}
      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>

      {/* Sidebar zone */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </div>
  )
}
```

### 2. Skeleton Design

```tsx
// Match actual content dimensions and layout
export function ProductCardSkeleton() {
  return (
    <div className="w-64 border rounded p-4">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200 rounded mb-4 animate-pulse" />

      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />

      {/* Price skeleton */}
      <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  )
}
```

### 3. Progressive Enhancement

```tsx
// Show fast content first, stream slow content
export default function Page() {
  return (
    <div>
      {/* Fast synchronous content */}
      <StaticHeader />

      {/* Stream slow async content */}
      <Suspense fallback={<ContentSkeleton />}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}
```

## Performance Tips

### 1. Minimize Layout Shift

```tsx
// ✅ GOOD - Skeleton matches content dimensions
export function CardSkeleton() {
  return <div className="h-32 w-64 bg-gray-200 animate-pulse" />
}

export function Card({ data }: { data: Data }) {
  return <div className="h-32 w-64">{data.content}</div>
}
```

### 2. Parallel Everything

```tsx
// Initiate all data fetches immediately
const dataPromises = {
  user: getUser(),
  posts: getPosts(),
  comments: getComments(),
}

// Then use in components
<Suspense><UserSection promise={dataPromises.user} /></Suspense>
<Suspense><PostsSection promise={dataPromises.posts} /></Suspense>
```

### 3. Cache Expensive Queries

```tsx
// Combine streaming with caching
async function ExpensiveComponent() {
  const data = await getExpensiveDataCached() // Cached!
  return <DataView data={data} />
}

// First load: streams in slowly
// Subsequent loads: instant (cached)
```

## Success Criteria

A well-streamed page has:

✅ **Instant Navigation** - loading.tsx provides immediate feedback
✅ **Parallel Loading** - All async operations start together
✅ **Granular Streaming** - Independent Suspense boundaries
✅ **Meaningful Skeletons** - Match actual content layout
✅ **No Layout Shift** - Skeletons preserve dimensions
✅ **Error Handling** - Error boundaries around Suspense
✅ **Fast Perceived Load** - Progressive content appearance
✅ **Code Splitting** - Heavy components lazy loaded

## Resources

- `/resources/patterns.md` - Streaming patterns library
- `/resources/skeletons.md` - Skeleton component examples
- `/resources/performance.md` - Performance optimization guide
