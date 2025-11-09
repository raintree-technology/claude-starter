# Next.js 16 Best Practices - Quick Reference

Quick lookup guide for common patterns in Clarity.

## 🎯 Server vs Client Components

### Server (Default)
```tsx
// ✅ Async, data fetching, no hooks
async function Page({ params }: { params: { id: string } }) {
  const userId = await getUserId();
  const data = await db.query.data.findFirst({ where: eq(data.id, params.id) });
  return <View data={data} />;
}
```

### Client (Only When Needed)
```tsx
'use client'

// ✅ Hooks, events, browser APIs, Context
function Interactive() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## 💾 Caching (Cache Components)

```ts
import { cacheLife, cacheTag } from 'next/cache';

async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')  // 5min default
  cacheTag(UserTags.data(userId))
  return await db.query.data.findMany({ where: eq(data.userId, userId) });
}
```

**Invalidation:**
```ts
import { revalidateTag } from 'next/cache';
revalidateTag(UserTags.data(userId));
```

## 🔐 Authentication (DAL)

### Server Components
```ts
import { verifySession, getUserId, getUser } from '@/lib/data/dal';

// Auth check only
await verifySession();

// Need user ID
const userId = await getUserId();

// Need full User object
const user = await getUser();

// Optional auth (don't redirect)
const session = await getSession();
```

### Client Components
```tsx
'use client'
import { useAuthUser } from '@/hooks/use-auth-user';

function Component() {
  const { user, ready } = useAuthUser();
  if (!ready) return <Loading />;
  if (!user) return <SignIn />;
  return <Content />;
}
```

## 🗄️ Database Queries

```ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';  // ← NOT from @/lib/db

const user = await db.select()
  .from(users)
  .where(eq(users.id, userId));
```

**Use Repositories:**
```ts
import * as AccountRepo from '@/lib/db/repositories/accounts';
const account = await AccountRepo.findById(accountId);
```

## 🎨 React 19 Patterns

### Derive State (No useEffect)
```tsx
// ❌ BAD
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, i) => sum + i.price, 0));
}, [items]);

// ✅ GOOD
const total = items.reduce((sum, i) => sum + i.price, 0);
```

### Move to Event Handlers
```tsx
// ❌ BAD
useEffect(() => {
  if (shouldRefresh) fetchData();
}, [shouldRefresh]);

// ✅ GOOD
<button onClick={() => fetchData()}>Refresh</button>
```

### Use Keys for Reset
```tsx
// ❌ BAD
useEffect(() => {
  setFormData(initialData);
}, [userId]);

// ✅ GOOD
<Form key={userId} initialData={initialData} />
```

## 🛣️ API Routes

```ts
import { cacheLife, cacheTag } from 'next/cache';
import { getUserId } from '@/lib/data/dal';

async function getData(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.data(userId))
  return await db.query.data.findMany({ where: eq(data.userId, userId) });
}

export async function GET(request: Request) {
  const userId = await getUserId();
  const data = await getData(userId);
  return Response.json(data);
}
```

## 📦 State Management

### Server State (TanStack Query)
```tsx
'use client'
import { useQuery } from '@tanstack/react-query';

function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetch('/api/users').then(r => r.json())
  });
}
```

### Client State (Zustand)
```ts
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));
```

## 🔒 Type Safety

### Zod Validation
```ts
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// API route
const body = await request.json();
const validated = schema.parse(body); // throws on error
```

### Canonical Types
```ts
// ✅ Import from canonical location
import type { Transaction, Account } from '@/lib/types';

// ❌ Don't redefine locally
export interface Transaction { ... }
```

## 🚀 Performance

### Next Image
```tsx
import Image from 'next/image';

<Image
  src="/photo.jpg"
  width={500}
  height={300}
  alt="Description"
  priority={aboveFold}  // for LCP
/>
```

### Dynamic Imports
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

## 🔐 Security

### Sanitize HTML
```ts
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### Environment Variables
```ts
// Client-exposed (NEXT_PUBLIC_ prefix)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Server-only (no prefix)
const secret = process.env.SECRET_KEY;
```

## ♿ Accessibility

### Buttons not Divs
```tsx
// ❌ BAD
<div onClick={handleClick}>Click me</div>

// ✅ GOOD
<button onClick={handleClick}>Click me</button>
```

### Form Labels
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

## 📁 Imports

```ts
// ✅ GOOD - Path aliases
import { Button } from '@/components/ui/button';
import { getUserId } from '@/lib/data/dal';

// ✅ GOOD - Barrel exports
import { formatCurrency, formatDate } from '@/lib/utils';

// ❌ BAD - Restricted imports
import { kv } from '@vercel/kv';  // Use @/lib/utils/kv
import { eq } from '@/lib/db';    // Use drizzle-orm
```

## 🎓 Migration Checklist

- [ ] Remove `cacheWrap` → use `'use cache'`
- [ ] Direct Supabase auth → use DAL functions
- [ ] Unnecessary `useEffect` → derive state or event handlers
- [ ] `@/lib/db/queries` → use `@/lib/db/repositories`
- [ ] `import { eq } from '@/lib/db'` → `from 'drizzle-orm'`
- [ ] Type duplicates → import from `@/lib/types`
- [ ] `<img>` tags → use `next/image`
- [ ] `<div onClick>` → use `<button>`

## 📚 Documentation

- CLAUDE.md: `./CLAUDE.md`
- Cache README: `./lib/cache/README.md`
- DAL Summary: `./.claude/DAL_MIGRATION_SUMMARY.md`
- Next.js Docs: https://nextjs.org/docs
- React 19 Docs: https://react.dev/blog/2024/12/05/react-19
