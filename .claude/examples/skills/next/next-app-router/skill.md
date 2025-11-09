---
name: next-app-router
description: Use when working with Next.js App Router (app/ directory). Invoke for Server Components, layouts, route handlers, parallel routes, intercepting routes, Server Actions, streaming, loading states, or error handling in the app directory.
allowed-tools: Read, Grep, Glob
---

# Next.js App Router Expert

## Purpose

Expert knowledge of Next.js App Router architecture and features. Covers Server Components, Client Components, layouts, route handlers, parallel and intercepting routes, Server Actions, streaming, and the app/ directory structure.

## When to Use

Invoke this skill when:
- Building with the app/ directory (Next.js 13+)
- Working with Server Components and Client Components
- Creating layouts, templates, or nested routes
- Implementing route handlers (API routes in app/)
- Using Server Actions for mutations
- Setting up parallel or intercepting routes
- Implementing streaming and Suspense
- Handling loading and error states
- Managing metadata and SEO
- Debugging App Router issues

## Documentation Available

**Location**: `./docs/next/`

**Coverage** (~217 files in app/ directory):
- **Routing**:
  - File conventions (page, layout, route, etc.)
  - Dynamic routes and route groups
  - Parallel routes (@folder)
  - Intercepting routes ((.))
  - Route handlers (API routes)

- **Components**:
  - Server Components (default)
  - Client Components ('use client')
  - Layouts and templates
  - Loading UI and Suspense
  - Error handling and boundaries

- **Data Fetching**:
  - Server Component data fetching
  - fetch() with caching
  - Server Actions
  - Route handlers

- **Streaming & Suspense**:
  - Progressive rendering
  - Loading states
  - Skeleton screens

- **Metadata**:
  - Static and dynamic metadata
  - generateMetadata
  - Open Graph and Twitter cards

## Related Skills

- **next-data-rendering**: For SSG, SSR, ISR strategies
- **next-config-optimization**: For build configuration
- **next-pages-router**: For pages/ directory (legacy)

## Best Practices

- **Default to Server Components** - Only use 'use client' when needed
- **Fetch data where needed** - Colocate data fetching with components
- **Use loading.tsx for Suspense boundaries** - Automatic streaming
- **Implement error.tsx** - Graceful error handling
- **Use Server Actions for mutations** - Type-safe form handling
- **Leverage parallel routes** - Load multiple sections simultaneously
- **Use route groups for organization** - Group routes without affecting URL
- **Implement proper metadata** - SEO-friendly with generateMetadata
- **Optimize with streaming** - Show content progressively

## Examples

### Example 1: Server Component with Data Fetching

**Question**: "How do I fetch data in a Server Component?"

**Response**:
```typescript
// app/products/page.tsx
import { Suspense } from 'react';

// This is a Server Component by default
async function ProductsPage() {
  // Fetch data directly in the component
  const products = await fetch('https://api.example.com/products', {
    cache: 'force-cache', // SSG (default)
    // cache: 'no-store', // SSR
    // next: { revalidate: 3600 }, // ISR (revalidate every hour)
  }).then(res => res.json());

  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductList products={products} />
      </Suspense>
    </div>
  );
}

// Parallel data fetching
async function ProductsPage() {
  // Fetch in parallel
  const [products, categories] = await Promise.all([
    fetch('https://api.example.com/products').then(r => r.json()),
    fetch('https://api.example.com/categories').then(r => r.json()),
  ]);

  return (
    <div>
      <Categories categories={categories} />
      <ProductList products={products} />
    </div>
  );
}

// Sequential data fetching (when dependent)
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`)
    .then(r => r.json());

  // Wait for product before fetching reviews
  const reviews = await fetch(`https://api.example.com/products/${params.id}/reviews`)
    .then(r => r.json());

  return (
    <div>
      <ProductDetails product={product} />
      <ProductReviews reviews={reviews} />
    </div>
  );
}

export default ProductsPage;
```

**Cache Options**:
- `force-cache` - Static (SSG) - cache indefinitely
- `no-store` - Dynamic (SSR) - fetch on every request
- `next: { revalidate: 60 }` - ISR - revalidate after 60 seconds

**References**:
- See: `docs/next/app/building-your-application/data-fetching/`

### Example 2: Client Components for Interactivity

**Question**: "When and how do I use Client Components?"

**Response**:
```typescript
// app/products/page.tsx (Server Component)
import { ProductFilter } from './product-filter';

async function ProductsPage() {
  const products = await fetch('https://api.example.com/products')
    .then(r => r.json());

  return (
    <div>
      <h1>Products</h1>
      {/* Client Component for interactivity */}
      <ProductFilter products={products} />
    </div>
  );
}

// app/products/product-filter.tsx (Client Component)
'use client'; // Required for client-side interactivity

import { useState } from 'react';

export function ProductFilter({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Client-side state and event handlers */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
      />

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <div>
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

**When to Use Client Components**:
- Event handlers (onClick, onChange, etc.)
- State management (useState, useReducer)
- Effects (useEffect, useLayoutEffect)
- Browser APIs (localStorage, window, document)
- Custom hooks
- Class components

**When to Use Server Components** (default):
- Data fetching
- Direct database access
- Secret credentials (API keys)
- Large dependencies (stay on server)
- Static content

**References**:
- See: `docs/next/app/building-your-application/rendering/client-components/`

### Example 3: Layouts and Nested Routes

**Question**: "How do I create layouts and nested routes?"

**Response**:
```typescript
// app/layout.tsx (Root Layout - Required)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>Global Navigation</nav>
        </header>
        <main>{children}</main>
        <footer>Global Footer</footer>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx (Nested Layout)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <aside>
        <nav>Dashboard Sidebar</nav>
      </aside>
      <div className="dashboard-content">
        {children}
      </div>
    </div>
  );
}

// app/dashboard/page.tsx
export default function DashboardPage() {
  return <h1>Dashboard Home</h1>;
}

// app/dashboard/settings/page.tsx
export default function SettingsPage() {
  return <h1>Dashboard Settings</h1>;
}

// app/dashboard/template.tsx (Re-renders on navigation, unlike layout)
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="template">
      {/* Re-created on every route change */}
      {children}
    </div>
  );
}
```

**File Structure**:
```
app/
├── layout.tsx              # Root layout (wraps all pages)
├── page.tsx                # Home page (/)
├── dashboard/
│   ├── layout.tsx          # Dashboard layout
│   ├── page.tsx            # /dashboard
│   ├── settings/
│   │   └── page.tsx        # /dashboard/settings
│   └── analytics/
│       └── page.tsx        # /dashboard/analytics
└── (marketing)/            # Route group (doesn't affect URL)
    ├── layout.tsx          # Marketing layout
    ├── about/
    │   └── page.tsx        # /about
    └── contact/
        └── page.tsx        # /contact
```

**References**:
- See: `docs/next/app/building-your-application/routing/pages-and-layouts/`

### Example 4: Server Actions for Mutations

**Question**: "How do I use Server Actions for form submissions?"

**Response**:
```typescript
// app/products/actions.ts
'use server'; // Server Action

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);

  // Validate
  if (!name || !price) {
    return { error: 'Name and price are required' };
  }

  // Save to database
  const product = await db.products.create({
    data: { name, price },
  });

  // Revalidate cache
  revalidatePath('/products');

  // Redirect
  redirect(`/products/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);

  await db.products.update({
    where: { id },
    data: { name, price },
  });

  revalidatePath('/products');
  revalidatePath(`/products/${id}`);

  return { success: true };
}

export async function deleteProduct(id: string) {
  await db.products.delete({ where: { id } });
  revalidatePath('/products');
  redirect('/products');
}

// app/products/new/page.tsx
import { createProduct } from '../actions';

export default function NewProductPage() {
  return (
    <form action={createProduct}>
      <input type="text" name="name" required />
      <input type="number" name="price" step="0.01" required />
      <button type="submit">Create Product</button>
    </form>
  );
}

// With Client Component (for loading state)
// app/products/new/product-form.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { createProduct } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Product'}
    </button>
  );
}

export function ProductForm() {
  return (
    <form action={createProduct}>
      <input type="text" name="name" required />
      <input type="number" name="price" step="0.01" required />
      <SubmitButton />
    </form>
  );
}

// Progressive enhancement (works without JS)
// app/products/[id]/page.tsx
import { deleteProduct } from '../actions';

export default function ProductPage({ params }: { params: { id: string } }) {
  const deleteWithId = deleteProduct.bind(null, params.id);

  return (
    <form action={deleteWithId}>
      <button type="submit">Delete</button>
    </form>
  );
}
```

**Server Action Benefits**:
- Type-safe (TypeScript)
- Progressive enhancement
- Automatic revalidation
- No API routes needed
- Secure by default

**References**:
- See: `docs/next/app/building-your-application/data-fetching/server-actions/`

### Example 5: Route Handlers (API Routes)

**Question**: "How do I create API routes in the app directory?"

**Response**:
```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  const products = await db.products.findMany({
    where: category ? { category } : undefined,
  });

  return NextResponse.json(products);
}

// POST /api/products
export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await db.products.create({
    data: body,
  });

  return NextResponse.json(product, { status: 201 });
}

// app/api/products/[id]/route.ts
// GET /api/products/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await db.products.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}

// PATCH /api/products/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const product = await db.products.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(product);
}

// DELETE /api/products/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.products.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
}

// Custom response headers
export async function GET(request: NextRequest) {
  const data = { message: 'Hello' };

  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Content-Type': 'application/json',
    },
  });
}

// Streaming response
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`Chunk ${i}\n`));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

**Supported Methods**:
- GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS

**References**:
- See: `docs/next/app/building-your-application/routing/route-handlers/`

## Common Patterns

### Loading States with Suspense
```typescript
// app/products/page.tsx
import { Suspense } from 'react';
import { ProductList } from './product-list';

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
  );
}

// app/products/loading.tsx (automatic Suspense boundary)
export default function Loading() {
  return <ProductsSkeleton />;
}
```

### Error Handling
```typescript
// app/products/error.tsx (automatic error boundary)
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Dynamic Metadata
```typescript
// app/products/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`)
    .then(r => r.json());

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  };
}
```

### Parallel Routes
```typescript
// app/dashboard/@analytics/page.tsx
// app/dashboard/@revenue/page.tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  revenue,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  revenue: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid">
        {analytics}
        {revenue}
      </div>
    </div>
  );
}
```

## Search Helpers

```bash
# Find app router docs
grep -r "app directory\|Server Component\|Client Component" ./docs/next/

# Find routing docs
grep -r "routing\|route handlers\|parallel routes" ./docs/next/

# Find data fetching docs
grep -r "data fetching\|Server Actions\|fetch" ./docs/next/

# Find metadata docs
grep -r "metadata\|generateMetadata\|SEO" ./docs/next/

# List app router files
ls ./docs/next/app/
```

## Common Errors

- **Error: Cannot use hooks in Server Components**: Add 'use client' directive
  - Solution: Add 'use client' at top of file

- **Error: Dynamic API in static generation**: Accessing request data in static page
  - Solution: Use dynamic rendering with `export const dynamic = 'force-dynamic'`

- **Headers already sent**: Trying to modify response after streaming
  - Solution: Set headers before returning response

- **Hydration mismatch**: Server/client HTML differ
  - Solution: Ensure consistent rendering or use suppressHydrationWarning

## Performance Tips

1. **Use Server Components by default** - Smaller client bundle
2. **Colocate data fetching** - Fetch where needed
3. **Parallel data fetching** - Use Promise.all()
4. **Stream with Suspense** - Show content progressively
5. **Use loading.tsx** - Automatic Suspense boundaries
6. **Optimize images** - Use next/image component
7. **Implement ISR** - Balance static and dynamic
8. **Use route groups** - Organize without affecting URLs

## Notes

- Documentation covers Next.js 13+ (App Router)
- Server Components are the default (no 'use server' needed)
- Client Components require 'use client' directive
- Layouts don't re-render on navigation
- Templates re-render on every navigation
- Server Actions work without JavaScript (progressive enhancement)
- Route handlers replace API routes from pages/
- File paths reference local documentation cache
- For latest updates, check https://nextjs.org/docs/app
