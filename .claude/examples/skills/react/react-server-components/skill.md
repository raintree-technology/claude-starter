---
name: React Server Components Architect
description: Design and audit React Server Components (RSC) architecture. Enforces proper Server/Client boundaries, async data fetching patterns, `use` hook for promises, and optimal component composition in Next.js 16 + React 19.
version: 1.0.0
---

# React Server Components Architect

## Overview

Specialized skill for React Server Components (RSC) architecture in Next.js 16 + React 19. Focuses on:
- **Server/Client Boundaries** - When to use `"use client"` vs Server Components
- **Data Fetching** - Async Server Components, parallel loading, waterfalls
- **Component Composition** - Passing props, children, promises
- **React 19 Patterns** - `use` hook, `useActionState`, modern hooks
- **Performance** - Minimizing client bundle, optimal hydration

## When to Use

Invoke when:
- "Design this component"
- "Should this be a Server or Client Component?"
- "Audit component architecture"
- "Fix data fetching waterfalls"
- "Optimize component boundaries"
- Converting class components to modern patterns
- Migrating from Pages Router to App Router

## Core Principle

> **Server Components by default. Client Components only when necessary.**

## Decision Tree

```
Does component need...
├─ useState/useEffect/event handlers? ──► Client Component ("use client")
├─ Browser APIs (window, localStorage)? ──► Client Component
├─ Third-party libraries with hooks? ──► Client Component
└─ Just rendering/data fetching? ──► Server Component (default)
```

## Patterns

### 1. Server Component (Default)

```tsx
// ✅ CORRECT - Server Component (no "use client")
// app/dashboard/page.tsx
import { getUserId } from '@/lib/data/dal'
import { getDashboardData } from '@/lib/services/dashboard'
import { DashboardView } from './DashboardView'

export default async function DashboardPage() {
  // Data fetching on server
  const userId = await getUserId()
  const data = await getDashboardData(userId)

  // Pass data to client component as props
  return <DashboardView data={data} />
}
```

### 2. Client Component (Only When Needed)

```tsx
// ✅ CORRECT - Client Component (needs interactivity)
// app/dashboard/DashboardView.tsx
'use client'

import { useState } from 'react'
import type { DashboardData } from '@/lib/types'

export function DashboardView({ data }: { data: DashboardData }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div>
      <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
        Toggle View
      </button>
      {view === 'grid' ? <GridView data={data} /> : <ListView data={data} />}
    </div>
  )
}
```

### 3. Async Data Fetching (Server Components)

```tsx
// ✅ CORRECT - Parallel data fetching
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Initiate requests in parallel
  const userPromise = getUser(id)
  const postsPromise = getPosts(id)
  const commentsPromise = getComments(id)

  // Wait for all
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

// ❌ WRONG - Sequential fetching (waterfall)
export default async function BadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await getUser(id) // Blocks
  const posts = await getPosts(id) // Waits for user
  const comments = await getComments(id) // Waits for posts

  return <div>...</div>
}
```

### 4. Passing Promises to Client Components

```tsx
// ✅ CORRECT - Pass promise, unwrap in client
// app/blog/page.tsx (Server Component)
export default function BlogPage() {
  const postsPromise = getPosts() // Don't await

  return (
    <div>
      <h1>Blog</h1>
      <Suspense fallback={<Skeleton />}>
        <PostsList postsPromise={postsPromise} />
      </Suspense>
    </div>
  )
}

// app/blog/PostsList.tsx (Client Component)
'use client'

import { use } from 'react'
import type { Post } from '@/lib/types'

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

### 5. Server Component Wrapping Client Component

```tsx
// ✅ CORRECT - Server Component outer shell
// app/dashboard/layout.tsx (Server Component)
import { getUserId } from '@/lib/data/dal'
import { getSettings } from '@/lib/services/settings'
import { ThemeProvider } from './ThemeProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getUserId()
  const settings = await getSettings(userId)

  return (
    <ThemeProvider theme={settings.theme}>
      {children}
    </ThemeProvider>
  )
}

// app/dashboard/ThemeProvider.tsx (Client Component)
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({
  theme,
  children,
}: {
  theme: string
  children: React.ReactNode
}) {
  return (
    <NextThemesProvider defaultTheme={theme}>
      {children}
    </NextThemesProvider>
  )
}
```

### 6. Composition Pattern

```tsx
// ✅ CORRECT - Client Component accepts Server Component children
// app/components/Tabs.tsx (Client Component)
'use client'

import { useState } from 'react'

export function Tabs({
  tabs,
}: {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>
}) {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <div>
      <div className="tab-buttons">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}

// app/dashboard/page.tsx (Server Component)
import { Tabs } from '@/components/Tabs'
import { AccountsPanel } from './AccountsPanel'
import { TransactionsPanel } from './TransactionsPanel'

export default async function DashboardPage() {
  return (
    <Tabs
      tabs={[
        {
          id: 'accounts',
          label: 'Accounts',
          content: <AccountsPanel />, // Server Component as child!
        },
        {
          id: 'transactions',
          label: 'Transactions',
          content: <TransactionsPanel />, // Server Component as child!
        },
      ]}
    />
  )
}
```

### 7. React 19 `use` Hook

```tsx
// ✅ CORRECT - use hook for promise unwrapping
'use client'

import { use, Suspense } from 'react'

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}

// Parent wraps in Suspense
export function ProfilePage({ userPromise }: { userPromise: Promise<User> }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  )
}

// ❌ WRONG - Manual promise handling (React 18 pattern)
function BadUserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    userPromise.then(setUser)
  }, [userPromise])

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}
```

### 8. Avoiding `"use client"` Propagation

```tsx
// ❌ BAD - Entire tree becomes Client Component
'use client'

import { Button } from './Button' // Now client-only
import { Header } from './Header' // Now client-only
import { Footer } from './Footer' // Now client-only

export function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return <div>...</div>
}

// ✅ GOOD - Extract interactive part
// Layout.tsx (Server Component)
import { CollapsibleSidebar } from './CollapsibleSidebar'
import { Header } from './Header' // Stays server component
import { Footer } from './Footer' // Stays server component

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <div className="flex">
        <CollapsibleSidebar /> {/* Only this is client */}
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  )
}

// CollapsibleSidebar.tsx (Client Component)
'use client'

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  return <aside>...</aside>
}
```

### 9. Third-Party Libraries

```tsx
// ✅ CORRECT - Wrap client library in your own Client Component
// app/components/DatePicker.tsx
'use client'

import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export function DatePicker({
  value,
  onChange,
}: {
  value: Date
  onChange: (date: Date) => void
}) {
  return <ReactDatePicker selected={value} onChange={onChange} />
}

// app/page.tsx (Server Component)
import { DatePicker } from './components/DatePicker'

export default async function Page() {
  const data = await fetchData()

  return (
    <div>
      <DatePicker value={new Date()} onChange={() => {}} />
    </div>
  )
}
```

### 10. Data Mutations (Server Actions)

```tsx
// ✅ CORRECT - Server Actions for mutations
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/data/dal'

export async function createPost(formData: FormData) {
  const userId = await getUserId()
  const title = formData.get('title') as string

  await db.insert(posts).values({ title, userId })
  revalidatePath('/posts')
}

// app/components/CreatePostForm.tsx (Client Component)
'use client'

import { useActionState } from 'react'
import { createPost } from '../actions'

export function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null)

  return (
    <form action={action}>
      <input name="title" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

## Anti-Patterns

### ❌ Fetching in Client Components

```tsx
// ❌ BAD - Data fetching in Client Component
'use client'

import { useState, useEffect } from 'react'

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
  }, [userId])

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}

// ✅ GOOD - Fetch in Server Component
// app/users/[id]/page.tsx
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)
  return <UserProfileView user={user} />
}

// app/users/[id]/UserProfileView.tsx
'use client'

export function UserProfileView({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

### ❌ Unnecessary `"use client"`

```tsx
// ❌ BAD - Client Component for static content
'use client'

export function Header() {
  return (
    <header>
      <h1>My App</h1>
      <nav>...</nav>
    </header>
  )
}

// ✅ GOOD - Server Component by default
export function Header() {
  return (
    <header>
      <h1>My App</h1>
      <nav>...</nav>
    </header>
  )
}
```

### ❌ Blocking Sequential Fetching

```tsx
// ❌ BAD - Waterfall requests
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await getUser(id)
  const posts = await getPosts(user.id)
  const comments = await getComments(posts[0].id)

  return <div>...</div>
}

// ✅ GOOD - Parallel fetching
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [user, posts] = await Promise.all([
    getUser(id),
    getPosts(id),
  ])

  return <div>...</div>
}
```

### ❌ Passing Non-Serializable Props

```tsx
// ❌ BAD - Function as prop (not serializable)
export default async function Page() {
  const handler = () => console.log('clicked')

  return <ClientComponent onClick={handler} /> // Can't serialize function!
}

// ✅ GOOD - Define handler in Client Component
export default async function Page() {
  return <ClientComponent /> // No function prop
}

// ClientComponent.tsx
'use client'

export function ClientComponent() {
  const handleClick = () => console.log('clicked')

  return <button onClick={handleClick}>Click</button>
}
```

## Audit Checklist

### Critical Issues (Must Fix)

- [ ] **Server by Default**: No unnecessary `"use client"` directives
- [ ] **No Fetch in Client**: Data fetching only in Server Components
- [ ] **Serializable Props**: Only JSON-serializable data passed to Client Components
- [ ] **Async Params**: Using `await params` in dynamic routes
- [ ] **Proper Boundaries**: Clear separation Server/Client responsibilities

### High Priority (Should Fix)

- [ ] **Parallel Fetching**: No sequential waterfalls where parallel is possible
- [ ] **Minimal Client Bundles**: Extract static parts to Server Components
- [ ] **Suspense Boundaries**: Async components wrapped in `<Suspense>`
- [ ] **use Hook**: Using React 19 `use` hook for promises in Client Components
- [ ] **Composition**: Client Components accept Server Component children

### Medium Priority (Nice to Have)

- [ ] **Request Memoization**: Using React `cache()` for deduplication
- [ ] **Server Actions**: Mutations use `'use server'` instead of API routes
- [ ] **Error Boundaries**: Proper error handling with error.tsx
- [ ] **Loading States**: Meaningful skeletons, not generic spinners

### Low Priority (Optional)

- [ ] **TypeScript**: Proper types for async components
- [ ] **Documentation**: Component purpose documented
- [ ] **Testing**: Unit tests for component logic

## Component Patterns

### Pattern 1: Container/Presenter

```tsx
// Container (Server Component)
export default async function UserContainer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)
  return <UserPresenter user={user} />
}

// Presenter (Client Component)
'use client'

export function UserPresenter({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

### Pattern 2: Streaming with Suspense

```tsx
// app/dashboard/page.tsx
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

async function RevenueChart() {
  const data = await getRevenueData() // Slow query
  return <Chart data={data} />
}

async function TransactionsTable() {
  const transactions = await getTransactions() // Very slow query
  return <Table data={transactions} />
}
```

### Pattern 3: Hybrid Components

```tsx
// Wrapper (Server Component)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  return (
    <div>
      {/* Server-rendered static content */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Client Component for interactivity */}
      <AddToCartButton productId={product.id} />
    </div>
  )
}

// Interactive part (Client Component)
'use client'

export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)

  return (
    <button onClick={() => setAdded(true)}>
      {added ? 'Added!' : 'Add to Cart'}
    </button>
  )
}
```

## Decision Matrix

| Requirement | Component Type | Reason |
|-------------|---------------|---------|
| Render data from DB | Server | Direct DB access, no client bundle |
| useState/useEffect | Client | Hooks require client |
| Event handlers (onClick) | Client | Browser events require client |
| Access cookies/headers | Server | Security, server-only APIs |
| Browser APIs (window) | Client | Browser-only APIs |
| Third-party hooks | Client | Library requires client |
| Static content | Server | No interactivity, smaller bundle |
| Form submission | Server Action | Security, avoid client API calls |

## Performance Optimization

### 1. Minimize Client Bundle

```tsx
// ❌ BAD - 100KB chart library in client bundle
'use client'

import { Chart } from 'heavy-chart-library' // 100KB!

export function Dashboard({ data }) {
  return <Chart data={data} />
}

// ✅ GOOD - Render chart on server, send HTML
export async function Dashboard() {
  const data = await getData()
  return <ServerChart data={data} /> // Renders on server
}
```

### 2. Lazy Load Heavy Components

```tsx
// ✅ GOOD - Lazy load when needed
'use client'

import { useState, lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  )
}
```

### 3. Server Component as Child

```tsx
// ✅ GOOD - Expensive Server Component as child
// app/layout.tsx (Server Component)
export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Tabs
      tabs={[
        {
          label: 'Dashboard',
          content: <ExpensiveDashboard />, // Server Component
        },
      ]}
    />
  )
}

// Tabs.tsx (Client Component)
'use client'

export function Tabs({ tabs }: { tabs: Array<{ label: string; content: React.ReactNode }> }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      {tabs.map((tab, i) => (
        <button key={i} onClick={() => setActive(i)}>
          {tab.label}
        </button>
      ))}
      <div>{tabs[active].content}</div>
    </div>
  )
}
```

## Migration Guide

### From Pages Router

```tsx
// ❌ OLD - Pages Router
// pages/dashboard.tsx
export async function getServerSideProps() {
  const data = await fetchData()
  return { props: { data } }
}

export default function Dashboard({ data }) {
  const [filter, setFilter] = useState('')
  return <DashboardView data={data} filter={filter} />
}

// ✅ NEW - App Router with RSC
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await fetchData()
  return <DashboardView data={data} />
}

// app/dashboard/DashboardView.tsx (Client Component)
'use client'

export function DashboardView({ data }) {
  const [filter, setFilter] = useState('')
  return <div>...</div>
}
```

## Success Criteria

A well-architected component structure has:

✅ **Minimal client bundle** - Only interactive parts are Client Components
✅ **Fast initial load** - Server Components render immediately
✅ **Parallel fetching** - No unnecessary waterfalls
✅ **Proper boundaries** - Clear Server/Client separation
✅ **Type safety** - Proper TypeScript throughout
✅ **Error handling** - Error boundaries, graceful failures
✅ **Loading states** - Suspense boundaries with skeletons
✅ **Testability** - Pure components, dependency injection

## Resources

- `/resources/patterns.md` - Component composition patterns
- `/resources/migration.md` - Pages Router → App Router migration
- `/resources/examples.md` - Real-world RSC examples
