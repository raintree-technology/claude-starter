# Edge Functions Guide

Complete guide to Supabase Edge Functions - Deno-based serverless functions running on the edge.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Setup & Deployment](#setup--deployment)
3. [Authentication Patterns](#authentication-patterns)
4. [Database Access](#database-access)
5. [HTTP Patterns](#http-patterns)
6. [Third-Party Integration](#third-party-integration)
7. [Background Jobs](#background-jobs)
8. [Testing & Debugging](#testing--debugging)
9. [Performance](#performance)
10. [Production Patterns](#production-patterns)

---

## Core Concepts

### What are Edge Functions?

- **Deno Runtime**: TypeScript-first, secure by default, web standards
- **Global Deployment**: Run close to users worldwide
- **Serverless**: Auto-scaling, pay-per-use
- **Use Cases**: Webhooks, API routes, scheduled tasks, data processing

### When to Use Edge Functions vs Database Functions

**Use Edge Functions for:**
- External API calls (Stripe, SendGrid, OpenAI)
- Complex business logic with multiple services
- Webhook handlers
- Long-running operations
- File processing
- Third-party authentication flows

**Use Database Functions for:**
- Data-intensive operations
- Complex queries with multiple joins
- Operations requiring ACID guarantees
- RLS policy enforcement
- Triggers on data changes

---

## Setup & Deployment

### Initialize Edge Functions

```bash
# Initialize Supabase project
supabase init

# Create new function
supabase functions new my-function

# Serve locally
supabase functions serve

# Deploy
supabase functions deploy my-function

# Deploy with secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy my-function
```

### Basic Function Structure

```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Your logic here
    const { data } = await req.json()

    const result = { message: 'Success', data }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Authentication Patterns

### Pattern 1: Verify Authenticated User

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'No authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // User is authenticated, proceed with logic
  return new Response(
    JSON.stringify({ message: 'Hello', userId: user.id }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Pattern 2: Service Role for Admin Operations

```typescript
serve(async (req) => {
  // Verify user is authenticated first
  const authHeader = req.headers.get('Authorization')!
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Use service role for admin operations (bypasses RLS)
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Admin operation - be careful!
  const { data, error } = await adminClient
    .from('sensitive_data')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw error

  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Pattern 3: API Key Authentication

```typescript
serve(async (req) => {
  const apiKey = req.headers.get('X-API-Key')

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key required' }),
      { status: 401 }
    )
  }

  // Verify API key in database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('user_id, permissions')
    .eq('key', apiKey)
    .eq('active', true)
    .single()

  if (error || !keyData) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 401 }
    )
  }

  // Check permissions
  if (!keyData.permissions.includes('write')) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions' }),
      { status: 403 }
    )
  }

  // Proceed with authenticated request
  return new Response(JSON.stringify({ success: true }))
})
```

---

## Database Access

### Pattern 1: Basic CRUD Operations

```typescript
serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  switch (req.method) {
    case 'GET': {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return new Response(JSON.stringify({ data }))
    }

    case 'POST': {
      const { title, content } = await req.json()

      const { data, error } = await supabase
        .from('posts')
        .insert({ title, content, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ data }), { status: 201 })
    }

    case 'DELETE': {
      const url = new URL(req.url)
      const id = url.searchParams.get('id')

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return new Response(JSON.stringify({ success: true }))
    }

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405
      })
  }
})
```

### Pattern 2: Transactions with Database Functions

```typescript
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { userId, amount } = await req.json()

  // Call database function for atomic transaction
  const { data, error } = await supabase.rpc('process_payment', {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    if (error.code === 'P0001') { // Raised exception
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400 }
      )
    }
    throw error
  }

  return new Response(JSON.stringify({ data }))
})
```

**Database Function:**
```sql
CREATE OR REPLACE FUNCTION process_payment(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_balance DECIMAL;
  v_result JSON;
BEGIN
  -- Lock user row for update
  SELECT balance INTO v_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check balance
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update balance
  UPDATE users
  SET balance = balance - p_amount
  WHERE id = p_user_id;

  -- Create transaction record
  INSERT INTO transactions (user_id, amount, type)
  VALUES (p_user_id, p_amount, 'payment')
  RETURNING json_build_object('id', id, 'amount', amount) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### Pattern 3: Bulk Operations

```typescript
serve(async (req) => {
  const { records } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Process in batches of 100
  const batchSize = 100
  const results = []

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const { data, error } = await supabase
      .from('imports')
      .insert(batch)
      .select()

    if (error) {
      console.error(`Batch ${i / batchSize} failed:`, error)
      results.push({ batch: i / batchSize, error: error.message })
    } else {
      results.push({ batch: i / batchSize, count: data.length })
    }
  }

  return new Response(JSON.stringify({ results }))
})
```

---

## HTTP Patterns

### Pattern 1: Request Validation

```typescript
import { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
})

serve(async (req) => {
  try {
    const body = await req.json()
    const validatedData = CreatePostSchema.parse(body)

    // Proceed with validated data
    return new Response(JSON.stringify({ data: validatedData }))

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          issues: error.issues
        }),
        { status: 400 }
      )
    }
    throw error
  }
})
```

### Pattern 2: Rate Limiting

```typescript
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const limit = rateLimits.get(identifier)

  if (!limit || now > limit.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: { 'Retry-After': '60' }
      }
    )
  }

  // Process request
  return new Response(JSON.stringify({ success: true }))
})
```

### Pattern 3: Streaming Responses

```typescript
serve(async (req) => {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Simulate streaming data
        for (let i = 0; i < 10; i++) {
          const chunk = JSON.stringify({
            chunk: i,
            data: `Processing item ${i}`
          }) + '\n'

          controller.enqueue(new TextEncoder().encode(chunk))
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
})
```

---

## Third-Party Integration

### Pattern 1: OpenAI Integration

```typescript
import OpenAI from 'https://esm.sh/openai@4.20.1'

serve(async (req) => {
  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  })

  const { prompt } = await req.json()

  // Generate completion
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  // Generate embedding
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: prompt,
  })

  // Store in database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { error } = await supabase.from('ai_responses').insert({
    prompt,
    response: completion.choices[0].message.content,
    embedding: embedding.data[0].embedding,
  })

  if (error) throw error

  return new Response(
    JSON.stringify({
      response: completion.choices[0].message.content
    })
  )
})
```

### Pattern 2: Stripe Webhook Handler

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400 }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      await supabase.from('payments').insert({
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: 'succeeded',
        user_id: paymentIntent.metadata.user_id,
      })

      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase.from('subscriptions').insert({
        stripe_subscription_id: subscription.id,
        user_id: subscription.metadata.user_id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
      })

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date() })
        .eq('stripe_subscription_id', subscription.id)

      break
    }
  }

  return new Response(JSON.stringify({ received: true }))
})
```

### Pattern 3: SendGrid Email

```typescript
serve(async (req) => {
  const { to, subject, html } = await req.json()

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@example.com' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid error: ${error}`)
  }

  // Log email sent
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  await supabase.from('email_logs').insert({
    to,
    subject,
    sent_at: new Date(),
  })

  return new Response(JSON.stringify({ success: true }))
})
```

---

## Background Jobs

### Pattern 1: Scheduled Function (Cron)

```typescript
// Deploy with: supabase functions deploy daily-cleanup --schedule "0 2 * * *"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Delete old records
  const { error: deleteError } = await supabase
    .from('temporary_data')
    .delete()
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (deleteError) throw deleteError

  // Generate daily report
  const { data: stats } = await supabase.rpc('get_daily_stats')

  // Send notification
  await fetch(Deno.env.get('SLACK_WEBHOOK_URL') ?? '', {
    method: 'POST',
    body: JSON.stringify({
      text: `Daily cleanup complete. Stats: ${JSON.stringify(stats)}`,
    }),
  })

  return new Response(JSON.stringify({ success: true }))
})
```

### Pattern 2: Queue Worker Pattern

```typescript
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Fetch pending jobs
  const { data: jobs, error } = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10)

  if (error) throw error

  const results = []

  for (const job of jobs) {
    try {
      // Mark as processing
      await supabase
        .from('job_queue')
        .update({ status: 'processing', started_at: new Date() })
        .eq('id', job.id)

      // Process job based on type
      let result
      switch (job.type) {
        case 'export_data':
          result = await processExport(job.payload)
          break
        case 'send_email':
          result = await sendEmail(job.payload)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      // Mark as complete
      await supabase
        .from('job_queue')
        .update({
          status: 'completed',
          completed_at: new Date(),
          result
        })
        .eq('id', job.id)

      results.push({ id: job.id, status: 'success' })

    } catch (error) {
      // Mark as failed
      await supabase
        .from('job_queue')
        .update({
          status: 'failed',
          error: error.message,
          failed_at: new Date()
        })
        .eq('id', job.id)

      results.push({ id: job.id, status: 'failed', error: error.message })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }))
})

async function processExport(payload: any) {
  // Implementation
  return { exported: true }
}

async function sendEmail(payload: any) {
  // Implementation
  return { sent: true }
}
```

---

## Testing & Debugging

### Local Testing

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/my-function' \
  --header 'Authorization: Bearer eyJhbGc...' \
  --header 'Content-Type: application/json' \
  --data '{"name":"test"}'
```

### Testing with Deno

```typescript
// tests/my-function.test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

Deno.test('function returns correct response', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/my-function', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    body: JSON.stringify({ name: 'test' }),
  })

  const data = await response.json()
  assertEquals(response.status, 200)
  assertEquals(data.message, 'Success')
})
```

### Logging Best Practices

```typescript
serve(async (req) => {
  const requestId = crypto.randomUUID()

  console.log(JSON.stringify({
    level: 'info',
    requestId,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  }))

  try {
    const result = await processRequest(req)

    console.log(JSON.stringify({
      level: 'info',
      requestId,
      message: 'Request processed successfully',
      duration: Date.now() - startTime,
    }))

    return new Response(JSON.stringify(result))

  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      requestId,
      error: error.message,
      stack: error.stack,
    }))

    return new Response(
      JSON.stringify({ error: 'Internal server error', requestId }),
      { status: 500 }
    )
  }
})
```

---

## Performance

### Caching Strategies

```typescript
// In-memory cache (lives per function invocation)
const cache = new Map<string, { data: any; expiresAt: number }>()

function getCached(key: string) {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any, ttlMs = 60000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

serve(async (req) => {
  const url = new URL(req.url)
  const cacheKey = url.pathname + url.search

  // Check cache
  const cached = getCached(cacheKey)
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'X-Cache': 'HIT' },
    })
  }

  // Fetch data
  const data = await fetchData()

  // Cache result
  setCache(cacheKey, data)

  return new Response(JSON.stringify(data), {
    headers: { 'X-Cache': 'MISS' },
  })
})
```

### Connection Pooling

```typescript
// Use Supavisor connection pooler in production
const supabase = createClient(
  // Use pooler URL for edge functions
  Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.com:6543') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)
```

### Parallel Execution

```typescript
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Execute queries in parallel
  const [users, posts, comments] = await Promise.all([
    supabase.from('users').select('*').limit(10),
    supabase.from('posts').select('*').limit(10),
    supabase.from('comments').select('*').limit(10),
  ])

  return new Response(JSON.stringify({
    users: users.data,
    posts: posts.data,
    comments: comments.data,
  }))
})
```

---

## Production Patterns

### Error Handling & Retries

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError
}

serve(async (req) => {
  try {
    const result = await withRetry(async () => {
      // External API call that might fail
      const response = await fetch('https://api.example.com/data')
      if (!response.ok) throw new Error('API request failed')
      return await response.json()
    })

    return new Response(JSON.stringify({ result }))

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 503 }
    )
  }
})
```

### Secrets Management

```bash
# Set secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set DATABASE_PASSWORD=...

# List secrets
supabase secrets list

# Unset secrets
supabase secrets unset OPENAI_API_KEY
```

```typescript
// Access secrets
const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### Health Check Endpoint

```typescript
serve(async (req) => {
  const url = new URL(req.url)

  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString()
    }))
  }

  // Regular function logic
  return new Response(JSON.stringify({ message: 'Hello' }))
})
```

---

## Common Patterns Reference

### Complete CRUD API

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname
    const id = url.searchParams.get('id')

    switch (req.method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single()

          if (error) throw error
          return new Response(JSON.stringify({ data }), { headers: corsHeaders })
        } else {
          const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error
          return new Response(JSON.stringify({ data }), { headers: corsHeaders })
        }

      case 'POST':
        const createData = await req.json()
        const { data: created, error: createError } = await supabase
          .from('items')
          .insert({ ...createData, user_id: user.id })
          .select()
          .single()

        if (createError) throw createError
        return new Response(JSON.stringify({ data: created }), {
          status: 201,
          headers: corsHeaders
        })

      case 'PUT':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID required' }),
            { status: 400, headers: corsHeaders }
          )
        }

        const updateData = await req.json()
        const { data: updated, error: updateError } = await supabase
          .from('items')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateError) throw updateError
        return new Response(JSON.stringify({ data: updated }), { headers: corsHeaders })

      case 'DELETE':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID required' }),
            { status: 400, headers: corsHeaders }
          )
        }

        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: corsHeaders }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
```

---

## Resources

- [Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Manual](https://deno.land/manual)
- [Deno Standard Library](https://deno.land/std)
- [Deno Third Party Modules](https://deno.land/x)
