---
name: Next.js API Architect
description: Design and audit Next.js 16 API routes with proper caching, validation, error handling, and performance optimization. Implements Cache Components, Server Functions, and modern API patterns.
version: 1.0.0
---

# Next.js API Architect

**Note**: Core API patterns using Clarity infrastructure. See `/lib/api/README.md` for complete API layer documentation.

Specialized skill for designing, auditing, and optimizing Next.js 16 API routes using Clarity's production-grade API infrastructure.

## When to Use

Invoke when:
- "Design an API endpoint" / "Create API route"
- "Audit this API route" / "Optimize API performance"
- "Add auth to API" / "Implement rate limiting"
- Building CRUD endpoints, webhooks, integrations

## Clarity API Infrastructure

**Use these instead of building from scratch:**

### Core Modules (`@/lib/api`)
- `next/handlers` - Route wrappers (`withAuthRoute`, `withAuthGetRoute`)
- `next/response` - Response helpers (`apiSuccess`, `apiError`)
- `next/validation` - Input validators (`validateQuery`, `validateBody`)
- `shared/rate-limit` - Distributed rate limiting
- `shared/error-handling` - Error formatters

*See `/lib/api/README.md` for complete documentation*

## Core Patterns

### 1. Basic API Route (GET)

```ts
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { apiSuccess, handleError } from '@/lib/api/next/response'
import { getUsersFromDB } from '@/lib/db/queries'

export async function GET(req: NextRequest) {
  try {
    const users = await getUsersFromDB()
    return apiSuccess(users)
  } catch (error) {
    return handleError(error)
  }
}
```

### 2. Authenticated Route (withAuthRoute)

```ts
// app/api/account/route.ts
import { withAuthGetRoute } from '@/lib/api/next/handlers'

export const GET = withAuthGetRoute(async (req, { userId }) => {
  const account = await getAccountByUserId(userId)
  return apiSuccess(account)
})
```

### 3. POST with Validation

```ts
// app/api/transactions/route.ts
import { withAuthRoute } from '@/lib/api/next/handlers'
import { validateBody } from '@/lib/api/next/validation'
import { z } from 'zod'

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  merchant: z.string().min(1),
  category: z.string()
})

export const POST = withAuthRoute(async (req, { userId }) => {
  const body = await validateBody(req, createTransactionSchema)

  const transaction = await db.insert(transactions).values({
    ...body,
    userId
  })

  return apiSuccess(transaction, { status: 201 })
})
```

### 4. Rate Limited Endpoint

```ts
// app/api/expensive-operation/route.ts
import { withRateLimit } from '@/lib/api/next/handlers'
import { rateLimiters } from '@/lib/api/shared/rate-limit'

export const POST = withRateLimit(
  rateLimiters.perUser(5, '1 hour'),
  async (req, { userId }) => {
    const result = await performExpensiveOperation(userId)
    return apiSuccess(result)
  }
)
```

### 5. Cached API Route

```ts
// app/api/stats/route.ts
import { unstable_cacheLife as cacheLife } from 'next/cache'
import { apiSuccess } from '@/lib/api/next/response'

export async function GET() {
  'use cache'
  cacheLife('minutes')

  const stats = await calculateStats()
  return apiSuccess(stats)
}
```

### 6. Error Handling

```ts
import {
  NotFoundError,
  AuthenticationError,
  ValidationError,
  handleError
} from '@/lib/api/next/response'

export const GET = withAuthRoute(async (req, { userId }) => {
  const item = await getItem(userId)

  if (!item) {
    throw new NotFoundError('Item not found')
  }

  return apiSuccess(item)
})

// Errors automatically formatted:
// { error: { message: 'Item not found', code: 'NOT_FOUND' }, status: 404 }
```

### 7. CORS Enabled Endpoint

```ts
import { withCors } from '@/lib/api/next/cors'

export const GET = withCors(async (req) => {
  const data = await getPublicData()
  return apiSuccess(data)
}, {
  allowedOrigins: ['https://yourdomain.com'],
  allowedMethods: ['GET', 'POST']
})
```

## Common Patterns

### Pagination

```ts
import { validateQuery } from '@/lib/api/next/validation'
import { paginationSchema } from '@/lib/api/shared/validation'

export const GET = withAuthRoute(async (req, { userId }) => {
  const { page, pageSize } = await validateQuery(req, paginationSchema)

  const [items, total] = await getItemsPaginated(userId, page, pageSize)

  return apiSuccess({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  })
})
```

### Idempotency

```ts
import { withIdempotency } from '@/lib/api/shared/idempotency'

export const POST = withIdempotency(
  withAuthRoute(async (req, { userId }) => {
    const payment = await processPayment(userId, amount)
    return apiSuccess(payment)
  }),
  { ttl: 86400 } // 24 hours
)
```

### Webhook Handler

```ts
import { verifyWebhookSignature } from '@/lib/utils/webhooks'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('x-webhook-signature')

  if (!verifyWebhookSignature(payload, signature!)) {
    return apiError('Invalid signature', 401)
  }

  const event = JSON.parse(payload)
  await handleWebhookEvent(event)

  return apiSuccess({ received: true })
}
```

## Anti-Patterns to Avoid

### ❌ No Error Handling

```ts
// BAD
export async function GET() {
  const data = await fetchData() // Can throw
  return NextResponse.json(data)
}

// GOOD
export const GET = withAuthRoute(async (req, { userId }) => {
  const data = await fetchData(userId)
  return apiSuccess(data)
})
```

### ❌ Manual Auth Checks

```ts
// BAD
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}

// GOOD
export const GET = withAuthRoute(async (req, { userId }) => {
  // userId guaranteed to exist
})
```

### ❌ No Input Validation

```ts
// BAD
export async function POST(req: NextRequest) {
  const body = await req.json()
  // Directly use body.amount (unsafe!)
}

// GOOD
export const POST = withAuthRoute(async (req, { userId }) => {
  const body = await validateBody(req, schema)
  // body is validated and typed
})
```

### ❌ Inconsistent Response Format

```ts
// BAD - Different formats
return NextResponse.json({ data })
return NextResponse.json({ result })
return NextResponse.json({ success: true, payload })

// GOOD - Consistent format
return apiSuccess(data)
return apiSuccess(result)
return apiSuccess(payload)
```

## Quick Audit Checklist

**Critical (Must Fix):**
- [ ] Error handling with try/catch or handleError
- [ ] Input validation on POST/PUT/PATCH
- [ ] Auth check for protected endpoints
- [ ] Consistent response format (apiSuccess/apiError)
- [ ] No sensitive data in responses

**High Priority:**
- [ ] Rate limiting for expensive operations
- [ ] Request logging
- [ ] Proper HTTP status codes
- [ ] TypeScript types for request/response
- [ ] Database connection pooling

**Medium Priority:**
- [ ] Caching for read-heavy endpoints
- [ ] CORS configuration for public APIs
- [ ] Idempotency for mutations
- [ ] Request tracing headers
- [ ] API documentation


## Common Response Helpers

```ts
// Success responses
apiSuccess(data)                          // { data, status: 200 }
apiSuccess(data, { status: 201 })        // { data, status: 201 }

// Error responses
apiError('Message', 400)                  // { error: { message }, status: 400 }
handleError(error)                        // Auto-formats based on error type

// Specialized errors
throw new NotFoundError('User not found')
throw new AuthenticationError('Invalid token')
throw new ValidationError('Invalid input', details)
throw new RateLimitExceededError('Too many requests')
```

## Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://...
REDIS_URL=redis://...              # For rate limiting
API_SECRET_KEY=xxx                 # For API key auth
WEBHOOK_SECRET=xxx                 # For webhook verification
```

---

*For complete API patterns, middleware examples, and error handling patterns, see `/lib/api/README.md`*
