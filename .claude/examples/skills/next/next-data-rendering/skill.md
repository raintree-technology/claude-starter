---
name: next-data-rendering
description: Use when implementing rendering strategies like SSG, SSR, ISR, CSR, or managing caching and revalidation. Invoke for static generation, server-side rendering, incremental static regeneration, partial prerendering, or cache optimization.
allowed-tools: Read, Grep, Glob
---

# Next.js Data Rendering Expert

## Purpose

Expert knowledge of Next.js rendering strategies and data fetching patterns. Covers SSG (Static Site Generation), SSR (Server-Side Rendering), ISR (Incremental Static Regeneration), CSR (Client-Side Rendering), caching strategies, and revalidation.

## When to Use

Invoke this skill when:
- Choosing rendering strategies for pages
- Implementing caching strategies
- Setting up ISR with revalidation
- Implementing Partial Prerendering (PPR)
- Optimizing page load performance
- Managing cache invalidation
- Implementing streaming and Suspense
- Debugging caching or stale data issues
- Balancing static and dynamic content

## Documentation Available

**Location**: `./docs/next/`

**Coverage** (~60 files):
- **Rendering Strategies**:
  - Static Site Generation (SSG)
  - Server-Side Rendering (SSR)
  - Incremental Static Regeneration (ISR)
  - Client-Side Rendering (CSR)
  - Partial Prerendering (PPR - experimental)

- **Caching**:
  - Request memoization
  - Data cache
  - Full route cache
  - Router cache
  - Cache configuration

- **Revalidation**:
  - Time-based revalidation
  - On-demand revalidation
  - Tag-based revalidation

## Related Skills

- **next-app-router**: For app/ directory implementation
- **next-pages-router**: For pages/ directory implementation
- **next-config-optimization**: For build optimization

## Best Practices

- **Default to static** - Use SSG for best performance
- **Use ISR for freshness** - Balance static and dynamic
- **Implement proper cache headers** - Control CDN caching
- **Use tag-based revalidation** - Granular cache invalidation
- **Leverage streaming** - Show content progressively
- **Minimize dynamic rendering** - Static is faster
- **Use Partial Prerendering** - Mix static and dynamic
- **Cache at multiple levels** - Request, data, route, router
- **Set appropriate revalidation times** - Based on data freshness needs

## Examples

### Example 1: Static Site Generation (SSG)

**Question**: "How do I implement SSG with Next.js?"

**Response**:
```typescript
// App Router (app/products/page.tsx)
export const dynamic = 'force-static'; // Explicitly static (default)

async function ProductsPage() {
  // Fetched at build time
  const products = await fetch('https://api.example.com/products', {
    cache: 'force-cache', // SSG (default)
  }).then(r => r.json());

  return (
    <div>
      <h1>Products (Built at: {new Date().toISOString()})</h1>
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default ProductsPage;

// Pages Router (pages/products.tsx)
import { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async () => {
  const products = await fetch('https://api.example.com/products')
    .then(r => r.json());

  return {
    props: { products },
  };
};
```

**Benefits**:
- Fastest performance (served from CDN)
- SEO-friendly (pre-rendered HTML)
- Low server load
- Works with static hosting

**Use Cases**:
- Marketing pages
- Blog posts
- Documentation
- Product catalogs (with ISR)

**References**:
- See: `docs/next/app/building-your-application/rendering/server-components/`

### Example 2: Incremental Static Regeneration (ISR)

**Question**: "How do I implement ISR for fresh data?"

**Response**:
```typescript
// App Router (app/products/page.tsx)
export const revalidate = 3600; // Revalidate every hour

async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }, // Per-request revalidation
  }).then(r => r.json());

  return (
    <div>
      <h1>Products</h1>
      <p>Last updated: {new Date().toISOString()}</p>
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name} - ${p.price}</li>
        ))}
      </ul>
    </div>
  );
}

// Different revalidation times for different requests
async function HomePage() {
  const [products, posts] = await Promise.all([
    fetch('https://api.example.com/products', {
      next: { revalidate: 3600 }, // 1 hour
    }).then(r => r.json()),
    fetch('https://api.example.com/posts', {
      next: { revalidate: 60 }, // 1 minute
    }).then(r => r.json()),
  ]);

  return <div>{/* Content */}</div>;
}

// Pages Router (pages/products.tsx)
export const getStaticProps: GetStaticProps = async () => {
  const products = await fetch('https://api.example.com/products')
    .then(r => r.json());

  return {
    props: { products },
    revalidate: 3600, // Revalidate every hour
  };
};

// On-demand revalidation (App Router)
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 });
  }

  // Revalidate specific path
  revalidatePath('/products');

  // Or revalidate by tag
  revalidateTag('products');

  return Response.json({ revalidated: true, now: Date.now() });
}

// Tag-based revalidation
async function getProducts() {
  const products = await fetch('https://api.example.com/products', {
    next: { tags: ['products'] }, // Tag for revalidation
  }).then(r => r.json());

  return products;
}
```

**ISR Workflow**:
1. Build time: Generate static pages
2. Request: Serve stale page instantly
3. Background: Regenerate if expired
4. Next request: Serve fresh page

**Benefits**:
- Static performance
- Always fresh data
- Automatic regeneration
- No rebuild needed

**References**:
- See: `docs/next/app/building-your-application/data-fetching/fetching-caching-and-revalidating/`

### Example 3: Server-Side Rendering (SSR)

**Question**: "How do I implement SSR for dynamic content?"

**Response**:
```typescript
// App Router (app/dashboard/page.tsx)
export const dynamic = 'force-dynamic'; // Force SSR
export const revalidate = 0; // Don't cache

async function DashboardPage() {
  // Fetched on every request
  const user = await fetch('https://api.example.com/user', {
    cache: 'no-store', // SSR
    headers: {
      Cookie: cookies().toString(), // Access request cookies
    },
  }).then(r => r.json());

  const stats = await fetch('https://api.example.com/stats', {
    cache: 'no-store',
  }).then(r => r.json());

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Total Sales: ${stats.totalSales}</p>
      <p>Generated at: {new Date().toISOString()}</p>
    </div>
  );
}

// Access request data
import { cookies, headers } from 'next/headers';

async function ProfilePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  const headersList = headers();
  const userAgent = headersList.get('user-agent');

  // Fetch based on request data
  const user = await fetch('https://api.example.com/user', {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token?.value}`,
    },
  }).then(r => r.json());

  return <div>Hello, {user.name}</div>;
}

// Pages Router (pages/dashboard.tsx)
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, res } = context;

  const user = await fetch('https://api.example.com/user', {
    headers: {
      Cookie: req.headers.cookie || '',
    },
  }).then(r => r.json());

  // Set cache headers
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  );

  return {
    props: { user },
  };
};
```

**When to Use SSR**:
- User-specific content
- Highly dynamic data
- Request-dependent data (cookies, headers)
- Real-time data

**Drawbacks**:
- Slower than static
- Higher server load
- No CDN caching (by default)

**References**:
- See: `docs/next/app/building-your-application/rendering/server-components/`

### Example 4: Client-Side Rendering (CSR)

**Question**: "How do I implement CSR for interactive data?"

**Response**:
```typescript
// App Router (app/products/product-list.tsx)
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

// Traditional useEffect approach
export function ProductListEffect() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}

// SWR approach (recommended)
const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ProductListSWR() {
  const { data, error, isLoading, mutate } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // Poll every 30s
  });

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => mutate()}>Refresh</button>
      <ul>
        {data.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

// React Query approach
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function ProductListQuery() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    staleTime: 5000, // Consider fresh for 5s
    cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const mutation = useMutation({
    mutationFn: (newProduct) =>
      fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return <ul>{/* Products */}</ul>;
}
```

**When to Use CSR**:
- User interactions
- Real-time updates
- Personalized content
- Non-SEO content

**Benefits**:
- Interactive
- No server load
- Real-time updates
- Automatic revalidation (with SWR/React Query)

**References**:
- See: `docs/next/app/building-your-application/rendering/client-components/`

### Example 5: Partial Prerendering (PPR)

**Question**: "How do I use Partial Prerendering?"

**Response**:
```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true, // Enable PPR
  },
};

// app/products/page.tsx
import { Suspense } from 'react';

// Static shell
export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <p>This header is static</p>

      {/* Dynamic content with Suspense */}
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductList />
      </Suspense>

      {/* Another dynamic section */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <RecentReviews />
      </Suspense>

      <footer>This footer is static</footer>
    </div>
  );
}

// Dynamic components (Server Components)
async function ProductList() {
  const products = await fetch('https://api.example.com/products', {
    cache: 'no-store', // Dynamic
  }).then(r => r.json());

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}

async function RecentReviews() {
  const reviews = await fetch('https://api.example.com/reviews', {
    cache: 'no-store',
  }).then(r => r.json());

  return (
    <div>
      {reviews.map(r => (
        <div key={r.id}>{r.content}</div>
      ))}
    </div>
  );
}
```

**PPR Benefits**:
- Instant static shell
- Streaming dynamic content
- Best of both worlds
- SEO-friendly
- Fast perceived performance

**How it Works**:
1. Serve static shell instantly
2. Stream dynamic content as it loads
3. Replace Suspense fallbacks progressively

**References**:
- See: `docs/next/app/api-reference/next-config-js/partial-prerendering/`

## Common Patterns

### Cache Configuration
```typescript
// Opt into caching
fetch('https://api.example.com/data', {
  cache: 'force-cache', // Default
});

// Opt out of caching
fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// ISR
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },
});

// Tag-based caching
fetch('https://api.example.com/data', {
  next: { tags: ['products'] },
});
```

### Streaming with Suspense
```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Page Title</h1>
      <Suspense fallback={<Skeleton />}>
        <AsyncComponent />
      </Suspense>
    </div>
  );
}
```

### Revalidation Strategies
```typescript
// Time-based (page-level)
export const revalidate = 3600;

// Time-based (request-level)
fetch(url, { next: { revalidate: 3600 } });

// On-demand (path)
revalidatePath('/products');

// On-demand (tag)
revalidateTag('products');
```

## Search Helpers

```bash
# Find rendering docs
grep -r "SSG\|SSR\|ISR\|rendering" ./docs/next/

# Find caching docs
grep -r "cache\|revalidate\|fetch" ./docs/next/

# Find streaming docs
grep -r "streaming\|Suspense\|PPR" ./docs/next/

# List rendering files
ls ./docs/next/app/building-your-application/rendering/
```

## Common Errors

- **Data is stale**: Cache not revalidating
  - Solution: Set appropriate revalidate time or use `cache: 'no-store'`

- **Page is slow**: Using SSR unnecessarily
  - Solution: Switch to ISR with revalidation

- **Build fails**: Too many static pages
  - Solution: Use `fallback: 'blocking'` in getStaticPaths

- **Cache not working**: Dynamic functions in static page
  - Solution: Remove cookies(), headers(), or searchParams access

## Performance Comparison

| Strategy | Speed | Freshness | Server Load | SEO | Use Case |
|----------|-------|-----------|-------------|-----|----------|
| SSG | Fastest | Static | None | Best | Marketing, blogs |
| ISR | Fast | Fresh | Low | Best | Product pages |
| SSR | Slow | Real-time | High | Good | Dashboards |
| CSR | Instant shell | Real-time | None | Poor | User interactions |
| PPR | Fast | Mixed | Low | Best | E-commerce |

## Caching Layers

1. **Request Memoization**: Dedupe same requests in single render
2. **Data Cache**: Persist fetch results across requests
3. **Full Route Cache**: Pre-rendered HTML + RSC payload
4. **Router Cache**: Client-side cached routes

## Notes

- Documentation covers Next.js 13-14
- App Router defaults to SSG
- fetch() is extended with caching options
- Partial Prerendering is experimental (Next.js 14+)
- ISR works with static hosting (Vercel, Netlify)
- Tag-based revalidation enables granular cache control
- File paths reference local documentation cache
- For latest updates, check https://nextjs.org/docs/app/building-your-application/rendering
