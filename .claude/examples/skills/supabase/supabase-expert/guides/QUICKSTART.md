# Supabase Quick Start Guide

This guide provides rapid-fire implementations for common Supabase tasks. Each section is self-contained and production-ready.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Authentication](#authentication)
3. [Database & RLS](#database--rls)
4. [Realtime](#realtime)
5. [Storage](#storage)
6. [Edge Functions](#edge-functions)
7. [AI & Vectors](#ai--vectors)

---

## Project Setup

### Next.js 14+ (App Router)

```bash
# Install dependencies
npm install @supabase/supabase-js @supabase/ssr

# Initialize Supabase locally
npx supabase init
npx supabase start
```

**Environment Variables (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Server Client (lib/supabase/server.ts):**
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
}
```

**Client Component (lib/supabase/client.ts):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## Authentication

### Email/Password with Email Confirmation

**Sign Up:**
```typescript
import { createClient } from '@/lib/supabase/client'

export async function signUp(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}
```

**Auth Callback Route (app/auth/callback/route.ts):**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### Social Authentication (Google)

```typescript
export async function signInWithGoogle() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) throw error
  return data
}
```

### Protected Server Component

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Protected content for {user.email}</div>
}
```

---

## Database & RLS

### Create Table with RLS

**Migration (supabase/migrations/20240101000000_create_posts.sql):**
```sql
-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published posts"
  ON posts FOR SELECT
  USING (published = true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_published_idx ON posts(published) WHERE published = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Type-Safe Queries

**Generate Types:**
```bash
npx supabase gen types typescript --local > types/database.ts
```

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Post = Database['public']['Tables']['posts']['Row']

export async function getPosts(): Promise<Post[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

---

## Realtime

### Subscribe to Database Changes

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    supabase
      .from('posts')
      .select('*')
      .then(({ data }) => data && setPosts(data))

    // Subscribe to changes
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts(prev => [payload.new as Post, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(p =>
              p.id === payload.new.id ? payload.new as Post : p
            ))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return posts
}
```

### Presence (Collaborative Features)

```typescript
export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: 'user_id' } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(Object.values(state).flat())
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    return () => { channel.unsubscribe() }
  }, [roomId])

  return onlineUsers
}
```

---

## Storage

### File Upload with Progress

```typescript
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return { path: data.path, publicUrl }
}
```

### Image Transformation

```typescript
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
  } = {}
) {
  const supabase = createClient()

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path, {
      transform: {
        width: options.width,
        height: options.height,
        quality: options.quality || 80,
      },
    })

  return data.publicUrl
}
```

---

## Edge Functions

### Basic Edge Function

**supabase/functions/hello/index.ts:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')!
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

    // Your logic here
    const result = { message: 'Hello from Edge Function!', userId: user.id }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## AI & Vectors

### Setup Vector Search

**Migration:**
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

**Generate Embeddings:**
```typescript
import OpenAI from 'openai'

const openai = new OpenAI()

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })
  return response.data[0].embedding
}

export async function searchDocuments(query: string) {
  const embedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: 10,
  })

  if (error) throw error
  return data
}
```

---

## Common Patterns

### Server Actions (Next.js)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const { data, error } = await supabase
    .from('posts')
    .insert({ title, content, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/posts')
  return { data }
}
```

### Error Handling

```typescript
export class SupabaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

export async function withErrorHandling<T>(
  fn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await fn()

  if (error) {
    if (error.code === '42501') {
      throw new SupabaseError('PERMISSION_DENIED', 'Permission denied', error)
    }
    if (error.code === '23505') {
      throw new SupabaseError('DUPLICATE', 'Duplicate entry', error)
    }
    throw new SupabaseError('UNKNOWN', error.message, error)
  }

  if (!data) {
    throw new SupabaseError('NO_DATA', 'No data returned')
  }

  return data
}
```

---

## Quick Commands

```bash
# Local Development
supabase start                    # Start local instance
supabase stop                     # Stop local instance
supabase status                   # Check status

# Migrations
supabase migration new <name>     # Create migration
supabase db reset                 # Reset & apply migrations
supabase db push                  # Push to remote

# Types
supabase gen types typescript --local > types/database.ts

# Functions
supabase functions new <name>     # Create function
supabase functions serve          # Test locally
supabase functions deploy <name>  # Deploy
```

---

## Performance Tips

1. **Always select specific columns**, not `*`
2. **Use pagination** with `.range(0, 49)`
3. **Add indexes** on frequently queried columns
4. **Use connection pooling** for serverless
5. **Cache results** with Next.js cache functions
6. **Enable RLS** on all tables
7. **Test RLS policies** thoroughly

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
