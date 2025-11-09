# Supabase Performance Optimization & Testing

## Performance Optimization Strategies

### Strategy 1: Connection Pooling for Serverless

```typescript
// lib/supabase/connection-pool.ts
import { createClient } from '@supabase/supabase-js'

// Use connection pooler for serverless environments
const POOLER_URL = process.env.SUPABASE_URL?.replace(
  '.supabase.co',
  '.pooler.supabase.com'
)

export function createPooledClient() {
  return createClient(
    POOLER_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
      },
    }
  )
}

// Use in API routes
export async function GET(request: Request) {
  const supabase = createPooledClient()

  const { data, error } = await supabase
    .from('large_table')
    .select('*')
    .limit(1000)

  // Connection automatically returned to pool

  return Response.json({ data, error })
}
```

### Strategy 2: Query Optimization

```typescript
// lib/supabase/optimized-queries.ts

// ❌ BAD: Fetches all columns and data
const { data } = await supabase
  .from('users')
  .select('*')

// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('users')
  .select('id, email, username')

// ✅ GOOD: Use pagination
const { data, error, count } = await supabase
  .from('users')
  .select('*', { count: 'exact' })
  .range(0, 49) // First 50 items
  .order('created_at', { ascending: false })

// ✅ GOOD: Use joins efficiently
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users!inner(id, username),
    comments(count)
  `)
  .eq('published', true)
  .limit(10)

// ✅ GOOD: Use indexes (ensure indexes exist)
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId) // Indexed column
  .eq('status', 'published') // Indexed column
```

### Strategy 3: Caching Layer

```typescript
// lib/cache/supabase-cache.ts
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Cache queries with Next.js cache
export const getCachedProjects = unstable_cache(
  async (organizationId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
  ['projects'], // Cache key
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ['projects'], // For manual revalidation
  }
)

// Use with revalidation
import { revalidateTag } from 'next/cache'

export async function createProject(name: string, orgId: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, organization_id: orgId })
    .select()
    .single()

  if (!error) {
    revalidateTag('projects') // Invalidate cache
  }

  return { data, error }
}
```

## Security Audit Checklist

### Critical Security Checks

```typescript
// scripts/security-audit.ts

interface SecurityAudit {
  checks: SecurityCheck[]
  passed: boolean
  failures: string[]
}

interface SecurityCheck {
  name: string
  passed: boolean
  message?: string
}

export async function auditSupabaseSecurity(): Promise<SecurityAudit> {
  const checks: SecurityCheck[] = []

  // 1. Check for exposed service role key
  const serviceKeyCheck = !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  checks.push({
    name: 'Service Role Key Security',
    passed: serviceKeyCheck,
    message: serviceKeyCheck
      ? 'Service role key not exposed in public env vars'
      : '❌ CRITICAL: Service role key exposed in public env vars!',
  })

  // 2. Check RLS is enabled on all tables
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tables } = await supabase.rpc('check_rls_enabled')
  const rlsCheck = tables?.every(t => t.rls_enabled)

  checks.push({
    name: 'RLS Enabled on All Tables',
    passed: rlsCheck || false,
    message: rlsCheck
      ? 'All tables have RLS enabled'
      : '⚠️ Some tables missing RLS policies',
  })

  // 3. Check for SQL injection vulnerabilities
  const sqlInjectionCheck = true // Implement static analysis
  checks.push({
    name: 'No SQL Injection Risks',
    passed: sqlInjectionCheck,
  })

  // 4. Check HTTPS only
  const httpsCheck = process.env.SUPABASE_URL?.startsWith('https://')
  checks.push({
    name: 'HTTPS Only',
    passed: httpsCheck || false,
    message: httpsCheck ? 'Using HTTPS' : '❌ Not using HTTPS!',
  })

  const passed = checks.every(check => check.passed)
  const failures = checks
    .filter(check => !check.passed)
    .map(check => check.message || check.name)

  return { checks, passed, failures }
}
```

## Testing Utilities

### RLS Policy Testing

```typescript
// tests/rls-policies.test.ts
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

describe('RLS Policies', () => {
  let supabase: ReturnType<typeof createClient>
  let testUserId: string

  beforeAll(async () => {
    // Create test user
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user } } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test-password-123',
      email_confirm: true,
    })

    testUserId = user!.id
  })

  it('should allow users to read their own data', async () => {
    // Sign in as test user
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test-password-123',
    })

    const userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session!.access_token}`,
          },
        },
      }
    )

    const { data, error } = await userClient
      .from('users')
      .select('*')
      .eq('id', testUserId)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('should prevent users from reading other users data', async () => {
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test-password-123',
    })

    const userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session!.access_token}`,
          },
        },
      }
    )

    const { data, error } = await userClient
      .from('users')
      .select('*')
      .neq('id', testUserId)

    expect(data).toHaveLength(0) // RLS should filter out other users
  })
})
```

## Error Handling Framework

### Comprehensive Error Handler

```typescript
// lib/errors/supabase-errors.ts
import { PostgrestError } from '@supabase/supabase-js'

export class SupabaseError extends Error {
  constructor(
    public code: string,
    public details: string,
    public hint?: string
  ) {
    super(details)
    this.name = 'SupabaseError'
  }
}

export function handleSupabaseError(error: PostgrestError | null): never {
  if (!error) {
    throw new Error('Unknown error occurred')
  }

  // RLS Policy Violation
  if (error.code === '42501' || error.message.includes('policy')) {
    throw new SupabaseError(
      'RLS_POLICY_VIOLATION',
      'You do not have permission to perform this action',
      'Check row-level security policies'
    )
  }

  // Unique Constraint Violation
  if (error.code === '23505') {
    const field = error.message.match(/Key \((.*?)\)/)?.[1]
    throw new SupabaseError(
      'DUPLICATE_ENTRY',
      `A record with this ${field} already exists`,
      'Use a different value or update the existing record'
    )
  }

  // Foreign Key Violation
  if (error.code === '23503') {
    throw new SupabaseError(
      'INVALID_REFERENCE',
      'The referenced record does not exist',
      'Ensure the related record exists before creating this one'
    )
  }

  // Connection Error
  if (error.message.includes('Failed to fetch')) {
    throw new SupabaseError(
      'CONNECTION_ERROR',
      'Unable to connect to the database',
      'Check your network connection and Supabase status'
    )
  }

  // Generic Error
  throw new SupabaseError(
    error.code || 'UNKNOWN_ERROR',
    error.message,
    error.hint
  )
}

// Usage
try {
  const { data, error } = await supabase
    .from('users')
    .insert({ email: 'test@example.com' })

  if (error) handleSupabaseError(error)

  return data
} catch (err) {
  if (err instanceof SupabaseError) {
    console.error(`[${err.code}] ${err.details}`)
    if (err.hint) console.error(`Hint: ${err.hint}`)

    // Return user-friendly error
    return {
      error: true,
      message: err.details,
      code: err.code,
    }
  }
  throw err
}
```

## Monitoring & Observability

```typescript
// lib/monitoring/supabase-logger.ts
import { createClient } from '@supabase/supabase-js'

interface QueryLog {
  query: string
  duration: number
  error?: string
  timestamp: string
}

export class SupabaseMonitor {
  private logs: QueryLog[] = []

  constructor(private supabase: ReturnType<typeof createClient>) {
    this.wrapClient()
  }

  private wrapClient() {
    const originalFrom = this.supabase.from.bind(this.supabase)

    this.supabase.from = (table: string) => {
      const startTime = Date.now()
      const builder = originalFrom(table)

      const wrapMethod = (method: string) => {
        const original = (builder as any)[method].bind(builder)
        ;(builder as any)[method] = async (...args: any[]) => {
          const result = await original(...args)
          const duration = Date.now() - startTime

          this.logs.push({
            query: `${method} on ${table}`,
            duration,
            error: result.error?.message,
            timestamp: new Date().toISOString(),
          })

          // Log slow queries
          if (duration > 1000) {
            console.warn(`Slow query detected: ${method} on ${table} took ${duration}ms`)
          }

          return result
        }
      }

      ;['select', 'insert', 'update', 'delete', 'upsert'].forEach(wrapMethod)

      return builder
    }
  }

  getLogs() {
    return this.logs
  }

  getSlowQueries(threshold = 1000) {
    return this.logs.filter(log => log.duration > threshold)
  }

  getErrorRate() {
    const totalQueries = this.logs.length
    const errorQueries = this.logs.filter(log => log.error).length
    return totalQueries > 0 ? errorQueries / totalQueries : 0
  }
}
```

## Migration from Firebase

```typescript
// scripts/migrate-from-firebase.ts
import admin from 'firebase-admin'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

admin.initializeApp({
  credential: admin.credential.cert('./firebase-credentials.json'),
})

export async function migrateUsers() {
  const auth = admin.auth()
  let nextPageToken: string | undefined

  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken)

    for (const userRecord of listUsersResult.users) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: userRecord.email!,
          email_confirm: true,
          user_metadata: {
            name: userRecord.displayName,
            avatar_url: userRecord.photoURL,
            migrated_from_firebase: true,
          },
        })

        if (error) {
          console.error(`Failed to migrate user ${userRecord.email}:`, error)
          continue
        }

        console.log(`Migrated user: ${userRecord.email}`)
      } catch (err) {
        console.error(`Error migrating user ${userRecord.email}:`, err)
      }
    }

    nextPageToken = listUsersResult.pageToken
  } while (nextPageToken)
}

export async function migrateFirestoreCollection(
  collectionName: string,
  tableName: string
) {
  const firestore = admin.firestore()
  const snapshot = await firestore.collection(collectionName).get()

  for (const doc of snapshot.docs) {
    const data = doc.data()

    // Transform Firestore document to Supabase row
    const row = {
      id: doc.id,
      ...data,
      // Convert Firestore timestamps
      created_at: data.createdAt?._seconds
        ? new Date(data.createdAt._seconds * 1000).toISOString()
        : null,
    }

    const { error } = await supabase
      .from(tableName)
      .insert(row)

    if (error) {
      console.error(`Failed to migrate document ${doc.id}:`, error)
    } else {
      console.log(`Migrated document: ${doc.id}`)
    }
  }
}
```

---

**Last Updated:** 2025-01-08
