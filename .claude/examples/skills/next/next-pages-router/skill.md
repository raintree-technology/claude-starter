---
name: next-pages-router
description: Use when working with Next.js Pages Router (pages/ directory). Invoke for getStaticProps, getServerSideProps, getStaticPaths, API routes in pages/api, dynamic routing, or migrating from pages/ to app/ directory.
allowed-tools: Read, Grep, Glob
---

# Next.js Pages Router Expert

## Purpose

Expert knowledge of Next.js Pages Router architecture. Covers getStaticProps, getServerSideProps, getStaticPaths, API routes, dynamic routing, and the pages/ directory structure (legacy but still supported).

## When to Use

Invoke this skill when:
- Working with existing pages/ directory projects
- Using getStaticProps or getServerSideProps
- Creating API routes in pages/api/
- Implementing getStaticPaths for dynamic routes
- Migrating from Pages Router to App Router
- Using _app.tsx or _document.tsx
- Implementing custom error pages
- Debugging Pages Router issues
- Working with middleware in Pages Router

## Documentation Available

**Location**: `./docs/next/`

**Coverage** (~142 files in pages/ directory):
- **Data Fetching**:
  - getStaticProps (SSG)
  - getServerSideProps (SSR)
  - getStaticPaths (dynamic SSG)
  - Client-side fetching (SWR, React Query)

- **Routing**:
  - File-based routing
  - Dynamic routes [id]
  - Catch-all routes [...slug]
  - Optional catch-all [[...slug]]

- **API Routes**:
  - pages/api/ directory
  - Request/response handling
  - Middleware

- **Special Files**:
  - _app.tsx (Custom App)
  - _document.tsx (Custom Document)
  - _error.tsx (Custom Error)
  - 404.tsx (404 page)
  - 500.tsx (500 page)

## Related Skills

- **next-app-router**: For modern app/ directory
- **next-data-rendering**: For rendering strategies
- **next-config-optimization**: For build configuration

## Best Practices

- **Use getStaticProps for static pages** - Best performance
- **Use getServerSideProps sparingly** - Slower than static
- **Implement getStaticPaths for dynamic routes** - Enable SSG
- **Use ISR with revalidate** - Balance static and fresh data
- **Keep API routes lightweight** - Or use external API
- **Leverage SWR for client-side** - Stale-while-revalidate pattern
- **Consider migrating to App Router** - For new features
- **Use fallback: 'blocking'** - For better UX in ISR

## Examples

### Example 1: Static Site Generation (SSG)

**Question**: "How do I use getStaticProps for SSG?"

**Response**:
```typescript
// pages/products/index.tsx
import { GetStaticProps } from 'next';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Props {
  products: Product[];
}

export default function ProductsPage({ products }: Props) {
  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

// This runs at build time
export const getStaticProps: GetStaticProps<Props> = async () => {
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();

  return {
    props: {
      products,
    },
    revalidate: 3600, // ISR: Revalidate every hour
  };
};
```

**With Error Handling**:
```typescript
export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const res = await fetch('https://api.example.com/products');

    if (!res.ok) {
      return { notFound: true }; // Show 404 page
    }

    const products = await res.json();

    return {
      props: { products },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return { notFound: true };
  }
};
```

**Redirect**:
```typescript
export const getStaticProps: GetStaticProps = async () => {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return {
      redirect: {
        destination: '/maintenance',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
```

**References**:
- See: `docs/next/pages/building-your-application/data-fetching/get-static-props/`

### Example 2: Dynamic Routes with getStaticPaths

**Question**: "How do I create dynamic static pages?"

**Response**:
```typescript
// pages/products/[id].tsx
import { GetStaticProps, GetStaticPaths } from 'next';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Props {
  product: Product;
}

export default function ProductPage({ product }: Props) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>${product.price}</p>
    </div>
  );
}

// Generate paths at build time
export const getStaticPaths: GetStaticPaths = async () => {
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();

  // Generate paths for all products
  const paths = products.map((product: Product) => ({
    params: { id: product.id },
  }));

  return {
    paths,
    fallback: 'blocking', // Generate other pages on-demand
    // fallback: false, // 404 for unknown paths
    // fallback: true, // Show loading state then generate
  };
};

// Fetch data for specific product
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const res = await fetch(`https://api.example.com/products/${params?.id}`);

  if (!res.ok) {
    return { notFound: true };
  }

  const product = await res.json();

  return {
    props: { product },
    revalidate: 3600, // ISR
  };
};
```

**Fallback Options**:
- `false`: Only pre-rendered paths, others 404
- `true`: Show loading state, then generate page
- `'blocking'`: Wait for generation, no loading state (better SEO)

**With Fallback True**:
```typescript
import { useRouter } from 'next/router';

export default function ProductPage({ product }: Props) {
  const router = useRouter();

  // Show loading state if fallback is rendering
  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return <div>{/* Product content */}</div>;
}
```

**References**:
- See: `docs/next/pages/building-your-application/data-fetching/get-static-paths/`

### Example 3: Server-Side Rendering (SSR)

**Question**: "How do I use getServerSideProps for SSR?"

**Response**:
```typescript
// pages/dashboard.tsx
import { GetServerSideProps } from 'next';

interface Props {
  user: User;
  stats: Stats;
}

export default function DashboardPage({ user, stats }: Props) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Total Sales: ${stats.totalSales}</p>
    </div>
  );
}

// Runs on every request
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  // Access request/response
  const { req, res, query, params } = context;

  // Get cookies/headers
  const token = req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Fetch user data
  const user = await fetch('https://api.example.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

  const stats = await fetch('https://api.example.com/stats', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

  // Set cache headers
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  );

  return {
    props: {
      user,
      stats,
    },
  };
};
```

**With Authentication**:
```typescript
import { getSession } from 'next-auth/react';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};
```

**References**:
- See: `docs/next/pages/building-your-application/data-fetching/get-server-side-props/`

### Example 4: API Routes

**Question**: "How do I create API routes in pages/api/?"

**Response**:
```typescript
// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface Product {
  id: string;
  name: string;
  price: number;
}

type Data = Product[] | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Handle different methods
  if (req.method === 'GET') {
    const products = await db.products.findMany();
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price required' });
    }

    const product = await db.products.create({
      data: { name, price },
    });

    return res.status(201).json([product]);
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}

// pages/api/products/[id].ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const product = await db.products.findUnique({
      where: { id: id as string },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  }

  if (req.method === 'PUT') {
    const product = await db.products.update({
      where: { id: id as string },
      data: req.body,
    });

    return res.status(200).json(product);
  }

  if (req.method === 'DELETE') {
    await db.products.delete({
      where: { id: id as string },
    });

    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}

// With middleware
import { NextApiHandler } from 'next';

function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    try {
      const user = await verifyToken(token);
      (req as any).user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export default withAuth(async (req, res) => {
  const user = (req as any).user;
  res.json({ message: `Hello ${user.name}` });
});
```

**References**:
- See: `docs/next/pages/building-your-application/routing/api-routes/`

### Example 5: Custom _app and _document

**Question**: "How do I customize the App and Document?"

**Response**:
```typescript
// pages/_app.tsx (Custom App)
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Layout from '@/components/layout';
import '@/styles/globals.css';

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}

// pages/_document.tsx (Custom Document)
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Custom fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// pages/404.tsx (Custom 404)
export default function Custom404() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

// pages/500.tsx (Custom 500)
export default function Custom500() {
  return (
    <div>
      <h1>500 - Server Error</h1>
      <p>Something went wrong on our end.</p>
    </div>
  );
}

// pages/_error.tsx (Custom Error)
import { NextPageContext } from 'next';

interface Props {
  statusCode?: number;
}

function Error({ statusCode }: Props) {
  return (
    <div>
      <h1>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </h1>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
```

**References**:
- See: `docs/next/pages/building-your-application/routing/custom-app/`
- See: `docs/next/pages/building-your-application/routing/custom-document/`

## Common Patterns

### ISR with On-Demand Revalidation
```typescript
// pages/api/revalidate.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    await res.revalidate('/products');
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
```

### Client-Side Fetching with SWR
```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfilePage() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data.name}!</div>;
}
```

### Dynamic Imports (Code Splitting)
```typescript
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR for this component
});

export default function Page() {
  return <DynamicComponent />;
}
```

## Search Helpers

```bash
# Find pages router docs
grep -r "getStaticProps\|getServerSideProps\|pages directory" ./docs/next/

# Find API routes docs
grep -r "API routes\|pages/api" ./docs/next/

# Find data fetching docs
grep -r "data fetching\|getStaticPaths" ./docs/next/

# List pages router files
ls ./docs/next/pages/
```

## Common Errors

- **getInitialProps blocks SSG**: Don't use with getStaticProps
  - Solution: Use getStaticProps or getServerSideProps instead

- **getStaticPaths missing**: Dynamic route without getStaticPaths
  - Solution: Add getStaticPaths or use getServerSideProps

- **Props serialization error**: Non-serializable data in props
  - Solution: Convert to JSON-serializable format (dates → strings)

- **API route CORS issues**: Missing CORS headers
  - Solution: Add CORS middleware or headers

## Migration to App Router

**Pages Router → App Router**:
- `getStaticProps` → Server Component data fetching
- `getServerSideProps` → Server Component with `dynamic = 'force-dynamic'`
- `getStaticPaths` → `generateStaticParams`
- `pages/api/` → `app/api/route.ts`
- `_app.tsx` → `app/layout.tsx`
- Client-side fetching → Server Components or Client Components

## Performance Tips

1. **Prefer getStaticProps** - Fastest, serves from CDN
2. **Use ISR for freshness** - Balance static and dynamic
3. **Implement getStaticPaths carefully** - Don't generate too many paths
4. **Use fallback: 'blocking'** - Better UX than fallback: true
5. **Minimize getServerSideProps** - Slower than static
6. **Leverage client-side SWR** - For user-specific data
7. **Optimize API routes** - Keep lightweight

## Notes

- Documentation covers Next.js 12-13 (Pages Router)
- Pages Router is still supported in Next.js 14+
- App Router is recommended for new projects
- getStaticProps runs at build time (SSG)
- getServerSideProps runs on every request (SSR)
- API routes run server-side only
- File paths reference local documentation cache
- For latest updates, check https://nextjs.org/docs/pages
