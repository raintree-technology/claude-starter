# Architecture & Design Patterns

Comprehensive guide to architecting Supabase applications for scalability, performance, and maintainability.

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Data Modeling](#data-modeling)
3. [Security Architecture](#security-architecture)
4. [Performance Architecture](#performance-architecture)
5. [Caching Strategies](#caching-strategies)
6. [Connection Management](#connection-management)
7. [Multi-Region Setup](#multi-region-setup)
8. [Microservices Patterns](#microservices-patterns)
9. [Scaling Considerations](#scaling-considerations)

---

## Architecture Decisions

### When to Use Edge Functions vs Database Functions

**Edge Functions (Deno)**
- ✅ External API integrations (Stripe, OpenAI, SendGrid)
- ✅ Complex business logic with multiple services
- ✅ Webhook handlers
- ✅ File processing and transformations
- ✅ Long-running operations (>2 seconds)
- ✅ Third-party OAuth flows
- ❌ Heavy database operations
- ❌ Transactions requiring ACID guarantees

**Database Functions (PL/pgSQL)**
- ✅ Data-intensive operations
- ✅ Complex queries with joins
- ✅ Atomic transactions
- ✅ RLS policy enforcement
- ✅ Triggers on data changes
- ✅ High-performance queries (microsecond latency)
- ❌ External API calls
- ❌ Long-running operations

**Example: Hybrid Approach**
```typescript
// Edge Function: Orchestrates the workflow
serve(async (req) => {
  const { orderId } = await req.json()

  // 1. External API call (Stripe)
  const payment = await stripe.paymentIntents.create({
    amount: 1000,
    currency: 'usd',
  })

  // 2. Database function handles the transaction
  const { data, error } = await supabase.rpc('process_order', {
    p_order_id: orderId,
    p_payment_intent_id: payment.id
  })

  // 3. Send confirmation email (SendGrid)
  await sendConfirmationEmail(data.email)

  return new Response(JSON.stringify({ success: true }))
})
```

```sql
-- Database Function: Handles atomic order processing
CREATE OR REPLACE FUNCTION process_order(
  p_order_id UUID,
  p_payment_intent_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_order JSON;
  v_inventory INT;
BEGIN
  -- Lock order
  SELECT json_build_object(
    'id', id,
    'user_id', user_id,
    'email', email,
    'product_id', product_id,
    'quantity', quantity
  ) INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  -- Check inventory
  SELECT quantity INTO v_inventory
  FROM inventory
  WHERE product_id = (v_order->>'product_id')::UUID
  FOR UPDATE;

  IF v_inventory < (v_order->>'quantity')::INT THEN
    RAISE EXCEPTION 'Insufficient inventory';
  END IF;

  -- Update inventory
  UPDATE inventory
  SET quantity = quantity - (v_order->>'quantity')::INT
  WHERE product_id = (v_order->>'product_id')::UUID;

  -- Update order
  UPDATE orders
  SET status = 'paid',
      payment_intent_id = p_payment_intent_id,
      paid_at = NOW()
  WHERE id = p_order_id;

  RETURN v_order;
END;
$$ LANGUAGE plpgsql;
```

### When to Use Realtime vs Polling

**Realtime Subscriptions**
- ✅ Collaborative features (Google Docs style)
- ✅ Chat applications
- ✅ Live dashboards with frequent updates
- ✅ Presence tracking (who's online)
- ✅ Real-time notifications
- ❌ High-frequency updates (>100/sec per client)
- ❌ Large result sets (>100 records)

**Polling**
- ✅ Infrequent updates (>30 seconds)
- ✅ Large datasets
- ✅ Complex aggregations
- ✅ Better control over rate limiting
- ❌ Sub-second latency requirements

### When to Use Storage vs Database

**Storage (S3-compatible)**
- ✅ Files >1MB
- ✅ Images, videos, audio
- ✅ User uploads
- ✅ Static assets
- ✅ Backups and exports
- ✅ CDN-delivered content

**Database (PostgreSQL JSONB)**
- ✅ Structured data
- ✅ Queryable content
- ✅ Small documents (<1MB)
- ✅ Frequently updated data
- ✅ Data requiring RLS

**Hybrid Approach**
```typescript
// Store file metadata in database, file in storage
async function uploadDocument(file: File, userId: string) {
  const supabase = createClient()

  // Upload file to storage
  const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  // Store metadata in database
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      filename: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      url: publicUrl,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## Data Modeling

### Multi-Tenancy Patterns

**Pattern 1: Organization-Based (Recommended)**
```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members with roles
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- All tenant data includes organization_id
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for multi-tenancy
CREATE POLICY "Users can view organization projects"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Index for performance
CREATE INDEX projects_org_id_idx ON projects(organization_id);
CREATE INDEX org_members_user_id_idx ON organization_members(user_id);
CREATE INDEX org_members_org_id_idx ON organization_members(organization_id);
```

**Pattern 2: Row-Level Isolation**
```sql
-- Simple user-owned resources
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "Users manage own notes"
  ON notes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX notes_user_id_idx ON notes(user_id);
```

### Normalized vs Denormalized Data

**Normalized (OLTP workloads)**
```sql
-- Normalized: Better for writes, referential integrity
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL
);

CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

-- Require joins for queries
SELECT p.*, u.email, array_agg(t.name) as tags
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN post_tags pt ON pt.post_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
GROUP BY p.id, u.email;
```

**Denormalized (OLAP/Read-Heavy)**
```sql
-- Denormalized: Better for reads, avoids joins
CREATE TABLE posts_denormalized (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_email TEXT, -- Denormalized
  title TEXT NOT NULL,
  tags TEXT[], -- Denormalized array
  comment_count INT DEFAULT 0, -- Pre-computed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple query, no joins
SELECT * FROM posts_denormalized
WHERE 'technology' = ANY(tags)
ORDER BY comment_count DESC;

-- Update denormalized data via triggers
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts_denormalized
  SET comment_count = comment_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_comment_count
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();
```

### JSONB for Flexible Schemas

```sql
-- Flexible schema with JSONB
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for JSONB queries
CREATE INDEX events_data_idx ON events USING GIN (data);
CREATE INDEX events_type_idx ON events(type);

-- Query JSONB data
SELECT *
FROM events
WHERE type = 'purchase'
  AND (data->>'amount')::numeric > 100
  AND data->'metadata'->>'category' = 'electronics';

-- Update JSONB field
UPDATE events
SET data = jsonb_set(data, '{status}', '"processed"')
WHERE id = '...';
```

---

## Security Architecture

### Defense in Depth

**Layer 1: RLS Policies (Database)**
```sql
-- Always the first line of defense
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own data"
  ON sensitive_data
  USING (user_id = auth.uid());
```

**Layer 2: Application Logic (Edge Functions)**
```typescript
// Additional authorization checks
serve(async (req) => {
  const { data: { user } } = await supabase.auth.getUser()

  // Check user permissions
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403
    })
  }

  // Proceed with operation
})
```

**Layer 3: API Keys (Rate Limiting)**
```typescript
// Rate limit by user or API key
const rateLimiter = new Map()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimiter.get(identifier)

  if (!limit || now > limit.resetAt) {
    rateLimiter.set(identifier, {
      count: 1,
      resetAt: now + 60000 // 1 minute
    })
    return true
  }

  if (limit.count >= 100) return false

  limit.count++
  return true
}
```

### Audit Logging

```sql
-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic audit logging trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to tables
CREATE TRIGGER audit_sensitive_data
  AFTER INSERT OR UPDATE OR DELETE ON sensitive_data
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();
```

---

## Performance Architecture

### Query Optimization

**Index Strategy**
```sql
-- Primary key (automatic)
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key index
CREATE INDEX posts_user_id_idx ON posts(user_id);

-- Filter column index
CREATE INDEX posts_status_idx ON posts(status);

-- Composite index for common queries
CREATE INDEX posts_user_status_idx ON posts(user_id, status);

-- Partial index for specific queries
CREATE INDEX posts_published_idx ON posts(status, created_at)
  WHERE status = 'published';

-- Covering index (includes additional columns)
CREATE INDEX posts_list_idx ON posts(user_id, created_at DESC)
  INCLUDE (title, summary);
```

**Query Patterns**
```typescript
// Bad: Select all columns
const { data } = await supabase
  .from('posts')
  .select('*')

// Good: Select only needed columns
const { data } = await supabase
  .from('posts')
  .select('id, title, created_at')

// Bad: Multiple round trips
const { data: posts } = await supabase.from('posts').select('id')
for (const post of posts) {
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', post.id)
}

// Good: Single query with join
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    comments (
      id,
      content,
      created_at
    )
  `)
```

### Pagination Strategies

**Cursor-Based Pagination (Recommended)**
```typescript
// First page
const { data, error } = await supabase
  .from('posts')
  .select('id, title, created_at')
  .order('created_at', { ascending: false })
  .limit(50)

// Next page using cursor
const lastItem = data[data.length - 1]
const { data: nextPage } = await supabase
  .from('posts')
  .select('id, title, created_at')
  .order('created_at', { ascending: false })
  .lt('created_at', lastItem.created_at)
  .limit(50)
```

**Offset Pagination (Simple but slower)**
```typescript
const page = 2
const pageSize = 50

const { data, count } = await supabase
  .from('posts')
  .select('id, title', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1)
```

---

## Caching Strategies

### Application-Level Caching

```typescript
// In-memory cache for Edge Functions
const cache = new Map<string, {
  data: any
  expiresAt: number
}>()

async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = cache.get(key)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }

  const data = await fetchFn()

  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  })

  return data
}

// Usage
serve(async (req) => {
  const data = await getCachedOrFetch(
    'featured-posts',
    async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('featured', true)
        .limit(10)
      return data
    },
    300 // 5 minutes
  )

  return new Response(JSON.stringify(data))
})
```

### Database-Level Caching (Materialized Views)

```sql
-- Create materialized view for expensive queries
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT c.id) as comment_count,
  MAX(p.created_at) as last_post_at
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
LEFT JOIN comments c ON c.user_id = u.id
GROUP BY u.id, u.email;

-- Create index on materialized view
CREATE INDEX user_stats_id_idx ON user_stats(id);

-- Refresh strategy (use one of these)

-- 1. Manual refresh
REFRESH MATERIALIZED VIEW user_stats;

-- 2. Scheduled refresh (via pg_cron extension)
SELECT cron.schedule(
  'refresh-user-stats',
  '0 * * * *', -- Every hour
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats$$
);

-- 3. Trigger-based refresh
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_stats_on_post
  AFTER INSERT OR DELETE ON posts
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_user_stats();
```

---

## Connection Management

### Connection Pooling with Supavisor

```typescript
// Next.js App Router - Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  // Uses connection pooler automatically
  const supabase = createClient()

  const { data } = await supabase
    .from('posts')
    .select('*')

  return <div>{/* render */}</div>
}

// For direct Postgres access
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Use Supavisor pooler
  ssl: { rejectUnauthorized: false },
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}
```

### Connection Limits

```sql
-- Check current connections
SELECT
  datname,
  count(*) as connections
FROM pg_stat_activity
GROUP BY datname;

-- Check connection limit
SHOW max_connections;

-- Set connection pool limits per user
ALTER USER your_user CONNECTION LIMIT 50;
```

---

## Multi-Region Setup

### Read Replicas

```typescript
// Primary database for writes
const primarySupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Read replica for reads
const replicaSupabase = createClient(
  process.env.SUPABASE_READ_REPLICA_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Write operations
export async function createPost(data: any) {
  return await primarySupabase
    .from('posts')
    .insert(data)
    .select()
    .single()
}

// Read operations
export async function getPosts() {
  return await replicaSupabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
}
```

### Multi-Region Edge Functions

```typescript
// Deploy Edge Function to multiple regions
// It automatically routes to nearest region

serve(async (req) => {
  // Get user's region from header
  const region = req.headers.get('x-vercel-ip-region') || 'us-east-1'

  console.log(`Request from region: ${region}`)

  // Use closest database
  const supabaseUrl = getRegionalDatabaseUrl(region)

  const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!)

  // Process request
  const { data } = await supabase.from('posts').select('*')

  return new Response(JSON.stringify(data))
})

function getRegionalDatabaseUrl(region: string): string {
  const urls = {
    'us-east-1': process.env.SUPABASE_US_EAST_URL!,
    'eu-central-1': process.env.SUPABASE_EU_URL!,
    'ap-southeast-1': process.env.SUPABASE_ASIA_URL!,
  }

  return urls[region] || process.env.SUPABASE_URL!
}
```

---

## Microservices Patterns

### Event-Driven Architecture

```sql
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX events_unprocessed_idx ON events(created_at)
  WHERE NOT processed;
```

```typescript
// Event publisher (Edge Function)
serve(async (req) => {
  const { type, aggregateId, payload } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Publish event
  await supabase.from('events').insert({
    type,
    aggregate_id: aggregateId,
    payload
  })

  return new Response(JSON.stringify({ success: true }))
})

// Event processor (Scheduled Edge Function)
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Fetch unprocessed events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(100)

  for (const event of events || []) {
    try {
      // Process event based on type
      await processEvent(event)

      // Mark as processed
      await supabase
        .from('events')
        .update({ processed: true })
        .eq('id', event.id)

    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error)
    }
  }

  return new Response(JSON.stringify({
    processed: events?.length || 0
  }))
})
```

---

## Scaling Considerations

### Vertical Scaling

- Free tier: Shared resources
- Pro: 2 CPU cores, 1GB RAM, 8GB storage
- Team: 4 CPU cores, 4GB RAM, 100GB storage
- Enterprise: Custom configuration

### Horizontal Scaling

**Connection Pooling**
- Use Supavisor for 10,000+ concurrent connections
- Enable transaction mode for short-lived connections
- Session mode for long-lived connections

**Read Replicas**
- Offload read traffic to replicas
- Near-zero replication lag
- Automatic failover

**Sharding (Advanced)**
```sql
-- Partition large tables by date
CREATE TABLE posts (
  id UUID,
  created_at TIMESTAMPTZ,
  -- other columns
) PARTITION BY RANGE (created_at);

CREATE TABLE posts_2024_01 PARTITION OF posts
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE posts_2024_02 PARTITION OF posts
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'posts_' || to_char(start_date, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF posts FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Best Practices Summary

1. **Security First**: Enable RLS on all tables, use service role sparingly
2. **Index Everything**: Add indexes for foreign keys and filter columns
3. **Denormalize Reads**: Pre-compute aggregations for read-heavy workloads
4. **Cache Aggressively**: Use materialized views, application caching
5. **Monitor Performance**: Use `EXPLAIN ANALYZE` for slow queries
6. **Connection Pooling**: Always use Supavisor for serverless
7. **Audit Everything**: Log sensitive operations for compliance
8. **Test RLS**: Write tests for all policies
9. **Backup Strategy**: Regular backups, point-in-time recovery
10. **Monitoring**: Set up alerts for errors, slow queries, high connections

---

## Resources

- [Supabase Architecture](https://supabase.com/docs/guides/platform/architecture)
- [Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [Read Replicas](https://supabase.com/docs/guides/platform/read-replicas)
