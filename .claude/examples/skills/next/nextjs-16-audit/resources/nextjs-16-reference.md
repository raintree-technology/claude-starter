# Next.js 16.0.1 Reference Guide

Complete reference for Next.js 16.0.1 features and patterns used in the audit skill.

## Table of Contents

- [Server and Client Components](#server-and-client-components)
- [Linking and Navigation](#linking-and-navigation)
- [Layouts and Pages](#layouts-and-pages)
- [Cache Components](#cache-components)
- [Data Fetching](#data-fetching)
- [Server Functions & Actions](#server-functions--actions)
- [Streaming](#streaming)
- [Error Handling](#error-handling)
- [Proxy](#proxy)
- [Configuration](#configuration)
- [Breaking Changes](#breaking-changes)

---

## Server and Client Components

### When to Use Server and Client Components

Use **Client Components** when you need:
* State and event handlers (`useState`, `onClick`, `onChange`)
* Lifecycle logic (`useEffect`)
* Browser-only APIs (`localStorage`, `window`, `Navigator.geolocation`)
* Custom hooks

Use **Server Components** when you need:
* Fetch data from databases or APIs close to the source
* Use API keys, tokens, and other secrets
* Reduce JavaScript sent to the client
* Improve FCP and stream content progressively

### Component Architecture Patterns

```tsx
// Server Component (default) - Data fetching
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  return <LikeButton likes={post.likes} />
}

// Client Component - Interactivity
'use client'
export default function LikeButton({ likes }: { likes: number }) {
  const [count, setCount] = useState(likes)
  return <button onClick={() => setCount(count + 1)}>{count} likes</button>
}
```

### Data Flow Between Components

Props passed to Client Components must be serializable. Use `server-only` and `client-only` packages to prevent environment pollution.

### Preventing Environment Poisoning

```ts
// lib/data.ts
import 'server-only'

export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY, // Safe - server only
    },
  })
  return res.json()
}
```

---

## Linking and Navigation

### How Navigation Works

Next.js provides built-in prefetching, streaming, and client-side transitions for fast navigation.

**Server Rendering Types**:
* Static Rendering (build time or revalidation)
* Dynamic Rendering (request time)

**Navigation Flow**:
1. HTML for immediate preview
2. RSC Payload for reconciliation
3. JavaScript for hydration

### Prefetching

Next.js automatically prefetches routes linked with `<Link>` when they enter viewport.

```tsx
import Link from 'next/link'

export default function Nav() {
  return (
    <nav>
      <Link href="/blog">Blog</Link>  {/* Prefetched */}
      <a href="/contact">Contact</a>  {/* Not prefetched */}
    </nav>
  )
}
```

### Streaming

Use `loading.js` for dynamic routes to enable partial prefetching:

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

### Client-side Transitions

Preserve shared layouts and state during navigation. Use `useLinkStatus` for slow networks:

```tsx
'use client'
import { useLinkStatus } from 'next/link'

export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  return <span className={pending ? 'loading' : ''} />
}
```

### Native History API

```tsx
'use client'
import { useSearchParams } from 'next/navigation'

export function SortButton() {
  const searchParams = useSearchParams()

  const updateSorting = (sortOrder: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortOrder)
    window.history.pushState(null, '', `?${params.toString()}`)
  }

  return (
    <button onClick={() => updateSorting('asc')}>Sort Ascending</button>
  )
}
```

---

## Layouts and Pages

### Creating Pages

```tsx
// app/page.tsx
export default function Page() {
  return <h1>Hello Next.js!</h1>
}
```

### Creating Layouts

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>Navigation</nav>
        {children}
      </body>
    </html>
  )
}
```

### Nested Layouts

```tsx
// app/blog/layout.tsx
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>
}
```

### Dynamic Segments

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  return <article>{post.content}</article>
}
```

### Search Params

```tsx
// Server Component
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>
}) {
  const { q } = await searchParams
  const results = await search(q)
  return <SearchResults results={results} />
}

// Client Component
'use client'
import { useSearchParams } from 'next/navigation'

export function SearchComponent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')
  // ...
}
```

### Route Props Helpers

```tsx
// app/blog/[slug]/page.tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  return <h1>Blog post: {slug}</h1>
}

// app/dashboard/layout.tsx
export default function Layout(props: LayoutProps<'/dashboard'>) {
  return (
    <section>
      {props.children}
      {/* If you have app/dashboard/@analytics, it appears as a typed slot: */}
      {/* {props.analytics} */}
    </section>
  )
}
```

---

## Error Handling

### Expected Errors

Model expected errors as return values, not thrown errors:

```tsx
// Server Function
'use server'
export async function createPost(formData: FormData) {
  const res = await fetch('/api/posts', { method: 'POST' })
  if (!res.ok) {
    return { error: 'Failed to create post' }  // Return, don't throw
  }
  return { success: true }
}

// useActionState
'use client'
import { useActionState } from 'react'

export function Form() {
  const [state, action] = useActionState(createPost, { error: null })
  return (
    <form action={action}>
      {/* form fields */}
      {state.error && <p>{state.error}</p>}
    </form>
  )
}
```

### Uncaught Exceptions

Use error boundaries for unexpected errors:

```tsx
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
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Not Found

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()  // Shows not-found.tsx
  }

  return <Post post={post} />
}
```

### Global Errors

```tsx
// app/global-error.tsx
'use client'
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

---

## Proxy

### Use Cases

* Quick redirects based on request data
* A/B testing and experimentation
* Header manipulation for all/some routes
* Optimistic permission checks

### Convention

Create `proxy.ts` in project root:

```tsx
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Quick redirect
  if (request.nextUrl.pathname === '/old-path') {
    return NextResponse.redirect(new URL('/new-path', request.url))
  }

  // Header manipulation
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'value')

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

### A/B Testing Example

```tsx
export function proxy(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  const variant = getVariant(userId)  // A or B

  if (variant === 'B') {
    return NextResponse.rewrite(new URL('/experiment-b', request.url))
  }

  return NextResponse.next()
}
```

### Performance Note

Proxy should be fast - avoid slow data fetching. Use for redirects, header manipulation, and quick checks only.

---

## Cache Components

### Overview

Cache Components is Next.js 16's primary caching mechanism, replacing the deprecated `cacheWrap` pattern.

### Requirements

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,  // Required
}
```

### Syntax

```ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { UserTags } from '@/lib/cache/tags';

async function getUserData(userId: string) {
  'use cache'
  cacheLife('minutes')  // 15min default
  cacheTag(UserTags.data(userId))

  const data = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  return data
}
```

### Cache Life Options

- `'minutes'` - 5 minutes (user data)
- `'hours'` - 1 hour (global data)
- `'days'` - 1 day (CMS content)

### Cache Keys

Automatically generated from:
1. Build ID
2. Function ID
3. **Serializable function arguments**

Identical inputs reuse same cache entry.

### Restrictions

❌ **Cannot use in `'use cache'` functions:**
- `cookies()`
- `headers()`
- `searchParams`

✅ **Must:**
- Return serializable values
- Use Node.js runtime (not Edge)
- Have `cacheComponents: true` in config

### Invalidation

```ts
import { revalidateTag } from 'next/cache';

// In Server Action
export async function updateUser(userId: string, data: UserData) {
  'use server'
  await db.update(users).set(data).where(eq(users.id, userId))
  revalidateTag(UserTags.data(userId))  // Invalidate cache
}
```

---

## Data Fetching

### fetch API Patterns

**Default Behavior**: Not cached by default in Next.js 16

```ts
// ✅ CORRECT - Explicit cache control
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'  // Always fresh
})

// ✅ CORRECT - Force cache
const cached = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// ❌ WRONG - Assuming default caching
const data = await fetch('https://api.example.com/data')  // Not cached!
```

### Parallel Fetching

```ts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Initiate requests in parallel
  const artistData = getArtist(id)
  const albumsData = getAlbums(id)

  // Await together
  const [artist, albums] = await Promise.all([artistData, albumsData])

  return <ArtistPage artist={artist} albums={albums} />
}
```

### Sequential Fetching (When Dependencies Exist)

```ts
export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  // Get artist first
  const artist = await getArtist(username)

  // Playlists depends on artist.id
  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Playlists artistID={artist.id} />
      </Suspense>
    </>
  )
}

async function Playlists({ artistID }: { artistID: string }) {
  const playlists = await getArtistPlaylists(artistID)
  return <ul>{playlists.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```

### Request Memoization

Deduplicates `fetch` requests with same URL/options within a single render pass.

**For non-fetch requests**, use React `cache()`:

```ts
import { cache } from 'react'
import { db, users, eq } from '@/lib/db'

export const getUser = cache(async (id: string) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id)
  })
})
```

**Benefits**:
- Multiple components can call `getUser(id)` in same render
- Only 1 database query executes
- Scoped to request lifetime

### ORM/Database Queries

```ts
import { db, posts } from '@/lib/db'

export default async function Page() {
  const allPosts = await db.select().from(posts)

  return (
    <ul>
      {allPosts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

---

## Server Functions & Actions

### Overview

Server Functions run on the server and can be invoked from client via network request.

### File-level Declaration

```ts
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/data/dal'

export async function createPost(formData: FormData) {
  // 1. Auth check
  const userId = await getUserId()

  // 2. Extract data
  const title = formData.get('title')
  const content = formData.get('content')

  // 3. Validate
  const validated = PostSchema.parse({ title, content })

  // 4. Mutate
  await db.insert(posts).values({ ...validated, userId })

  // 5. Revalidate
  revalidatePath('/posts')
}

export async function deletePost(formData: FormData) {
  const userId = await getUserId()
  const id = formData.get('id')

  // Check ownership
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id)
  })

  if (post.userId !== userId) {
    throw new Error('Unauthorized')
  }

  await db.delete(posts).where(eq(posts.id, id))
  revalidatePath('/posts')
}
```

### Inline Declaration (Server Components)

```ts
export default function Page() {
  async function createPost(formData: FormData) {
    'use server'
    // Server Action logic
  }

  return (
    <form action={createPost}>
      <input type="text" name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Client Component Usage

```ts
// app/actions.ts
'use server'

export async function createPost() {
  // ...
}
```

```tsx
// app/ui/button.tsx
'use client'

import { createPost } from '@/app/actions'

export function Button() {
  return <button formAction={createPost}>Create</button>
}
```

### Form Actions

```tsx
import { createPost } from '@/app/actions'

export function Form() {
  return (
    <form action={createPost}>
      <input type="text" name="title" />
      <input type="text" name="content" />
      <button type="submit">Create</button>
    </form>
  )
}
```

**Progressive Enhancement**: Forms submit even if JavaScript disabled.

### Event Handlers

```tsx
'use client'

import { incrementLike } from './actions'
import { useState } from 'react'

export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes)

  return (
    <>
      <p>Total Likes: {likes}</p>
      <button
        onClick={async () => {
          const updatedLikes = await incrementLike()
          setLikes(updatedLikes)
        }}
      >
        Like
      </button>
    </>
  )
}
```

### Security Checklist

✅ **Always**:
- Validate auth before mutations
- Validate input with Zod
- Check ownership/permissions
- Use `getUserId()` from DAL
- Never expose sensitive data to client

❌ **Never**:
- Skip auth checks
- Trust client-provided IDs
- Return sensitive data
- Execute arbitrary queries

---

## Streaming

### With `<Suspense>`

```tsx
import { Suspense } from 'react'
import BlogList from '@/components/BlogList'
import BlogListSkeleton from '@/components/BlogListSkeleton'

export default function BlogPage() {
  return (
    <div>
      {/* Sent immediately */}
      <header>
        <h1>Welcome to the Blog</h1>
        <p>Read the latest posts below.</p>
      </header>

      <main>
        {/* Streamed when ready */}
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
        </Suspense>
      </main>
    </div>
  )
}
```

### With `loading.js`

Stream entire page while data loads:

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return <div>Loading...</div>
}
```

Automatically wraps `page.tsx` in `<Suspense>` boundary.

### Client Component `use` Hook

Pass promises from Server to Client Components:

```tsx
// app/blog/page.tsx (Server Component)
import Posts from '@/app/ui/posts'
import { Suspense } from 'react'

export default function Page() {
  const posts = getPosts()  // Don't await

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts posts={posts} />
    </Suspense>
  )
}
```

```tsx
// app/ui/posts.tsx (Client Component)
'use client'
import { use } from 'react'

export default function Posts({ posts }: { posts: Promise<Post[]> }) {
  const allPosts = use(posts)  // Unwrap promise

  return (
    <ul>
      {allPosts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

### Meaningful Loading States

❌ **Bad**: Generic "Loading..."

✅ **Good**: Skeleton matching final UI

```tsx
export function BlogListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
      ))}
    </div>
  )
}
```

---

## Configuration

### next.config.ts

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,  // Required for 'use cache'
}

export default nextConfig
```

### System Requirements

- Node.js **20.9+**
- TypeScript **5.1.0+**
- React **19+**

### Runtime Requirements

- Cache Components: **Node.js only** (not Edge)
- Static exports: **Not supported** with Cache Components

### Route Handlers

Extract cacheable logic to helpers:

```ts
// app/api/users/[id]/route.ts
import { getUserData } from './helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await getUserData(id)  // Cached helper
  return Response.json(data)
}
```

```ts
// app/api/users/[id]/helpers.ts
import { unstable_cacheLife as cacheLife } from 'next/cache'

export async function getUserData(id: string) {
  'use cache'
  cacheLife('minutes')
  return await db.query.users.findFirst({ where: eq(users.id, id) })
}
```

---

## Breaking Changes

### From Next.js 15

1. **Linting**: `next build` no longer runs linter automatically
   - Use: `bun run lint` in scripts

2. **fetch caching**: Not cached by default
   - Before: `fetch()` cached by default
   - Now: Must specify `cache: 'force-cache'`

3. **Cache Components**: New feature
   - Replaces: `unstable_cache`, manual caching patterns
   - Requires: `cacheComponents: true` in config

### Deprecated Patterns

❌ **cacheWrap** (custom Redis caching):
```ts
// OLD
import { cacheWrap } from '@/lib/cache'
const data = await cacheWrap('key', fetchData, 300)
```

✅ **'use cache'** (Cache Components):
```ts
// NEW
async function fetchData() {
  'use cache'
  cacheLife('minutes')
  return await getData()
}
```

❌ **export const dynamic/revalidate**:
```ts
// OLD
export const dynamic = 'force-dynamic'
export const revalidate = 3600
```

✅ **'use cache' with cacheLife**:
```ts
// NEW
async function getData() {
  'use cache'
  cacheLife('hours')  // 1 hour
  return await fetch()
}
```

---

## Quick Reference

### Caching Decision Tree

```
Need to cache?
├─ YES
│  ├─ Server Component/Function?
│  │  └─ Use 'use cache' + cacheLife + cacheTag
│  └─ Client Component?
│     └─ Use SWR or React Query
└─ NO
   └─ Use cache: 'no-store' in fetch
```

### Data Fetching Decision Tree

```
Where to fetch?
├─ Server Component
│  ├─ Independent requests?
│  │  └─ Promise.all([...])
│  └─ Dependent requests?
│     └─ Sequential await + Suspense
└─ Client Component
   ├─ Stream from Server?
   │  └─ use(promise)
   └─ Fetch in Client?
      └─ SWR or React Query
```

### Server Actions Checklist

- [ ] `'use server'` directive
- [ ] Auth check (getUserId/verifySession)
- [ ] Input validation (Zod)
- [ ] Ownership check (if applicable)
- [ ] Mutation
- [ ] Revalidation (revalidatePath/revalidateTag)
- [ ] Error handling
- [ ] Return serializable data

---

## Resources

**Official Next.js 16 Documentation**:
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Caching and Revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Server Functions](https://nextjs.org/docs/app/getting-started/updating-data)

**React Documentation**:
- [React Server Functions](https://react.dev/reference/rsc/server-functions)
- [useActionState](https://react.dev/reference/react/useActionState)
- [Suspense](https://react.dev/reference/react/Suspense)
