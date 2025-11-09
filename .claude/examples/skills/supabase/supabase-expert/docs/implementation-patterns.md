# Supabase Implementation Patterns Reference

Complete pattern library for advanced Supabase implementations.

## Pattern 1: Advanced RLS with Multi-Tenancy

**Scenario:** Multi-tenant SaaS with organization-based access control

### Schema

```sql
-- Organization table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership table with roles
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Projects table (tenant data)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Helper function to check membership
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check role
CREATE OR REPLACE FUNCTION get_user_role(org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (is_organization_member(id));

-- RLS Policies for projects
CREATE POLICY "Organization members can view projects"
  ON projects FOR SELECT
  USING (is_organization_member(organization_id));

CREATE POLICY "Admins and owners can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    get_user_role(organization_id) IN ('admin', 'owner')
    AND auth.uid() = created_by
  );

CREATE POLICY "Admins and owners can update projects"
  ON projects FOR UPDATE
  USING (get_user_role(organization_id) IN ('admin', 'owner'));

CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE
  USING (get_user_role(organization_id) = 'owner');

-- Indexes for performance
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
```

### TypeScript Client Usage

```typescript
// types/database.ts
export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  created_by: string
  created_at: string
}

// lib/supabase/organizations.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export class OrganizationService {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async getOrganizations() {
    const { data, error } = await this.supabase
      .from('organizations')
      .select(`
        *,
        organization_members!inner(role)
      `)

    if (error) throw error
    return data
  }

  async getProjects(organizationId: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createProject(organizationId: string, name: string) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        organization_id: organizationId,
        name,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}
```

## Pattern 2: Advanced Auth with Custom Claims

### Implementation

```typescript
// lib/auth/custom-claims.ts
import { createClient } from '@supabase/supabase-js'

export interface UserClaims {
  role: 'admin' | 'user' | 'moderator'
  organization_id?: string
  permissions: string[]
}

export async function setUserClaims(
  userId: string,
  claims: UserClaims
): Promise<void> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role required
  )

  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    {
      app_metadata: { claims }
    }
  )

  if (error) throw error
}

export async function getUserClaims(userId: string): Promise<UserClaims | null> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.admin.getUserById(userId)

  if (error) throw error
  return data.user.app_metadata.claims as UserClaims || null
}

// Middleware for Next.js App Router
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Check if accessing admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const claims = session.user.app_metadata.claims as UserClaims

    if (claims?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
}
```

## Pattern 3: Realtime with Presence and Broadcast

```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
  [key: string]: {
    user_id: string
    username: string
    online_at: string
  }[]
}

export function usePresence(roomId: string) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const presenceChannel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setPresenceState(state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              username: user.email,
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    setChannel(presenceChannel)

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [roomId])

  const sendBroadcast = async (event: string, payload: any) => {
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
  }

  return {
    presenceState,
    onlineUsers: Object.values(presenceState).flat(),
    sendBroadcast,
  }
}

// Component usage
export function CollaborativeEditor({ documentId }: { documentId: string }) {
  const { onlineUsers, sendBroadcast } = usePresence(documentId)

  const handleCursorMove = (position: { x: number; y: number }) => {
    sendBroadcast('cursor_move', position)
  }

  return (
    <div>
      <div className="online-users">
        {onlineUsers.map(user => (
          <div key={user.user_id}>
            {user.username} (online)
          </div>
        ))}
      </div>
      {/* Editor component */}
    </div>
  )
}
```

## Pattern 4: Vector Search with OpenAI Embeddings

### SQL Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table with embeddings
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
) LANGUAGE sql STABLE AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### TypeScript Implementation

```typescript
// lib/ai/embeddings.ts
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })

  return response.data[0].embedding
}

export async function addDocument(
  content: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const embedding = await generateEmbedding(content)

  const { error } = await supabase
    .from('documents')
    .insert({
      content,
      embedding,
      metadata,
    })

  if (error) throw error
}

export async function searchDocuments(
  query: string,
  matchThreshold: number = 0.78,
  matchCount: number = 10
) {
  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  })

  if (error) throw error
  return data
}

// RAG (Retrieval Augmented Generation) implementation
export async function ragQuery(userQuestion: string): Promise<string> {
  // 1. Get relevant documents
  const relevantDocs = await searchDocuments(userQuestion, 0.78, 5)

  // 2. Build context from documents
  const context = relevantDocs
    .map(doc => doc.content)
    .join('\n\n')

  // 3. Generate response with OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Answer questions based on the provided context.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${userQuestion}`,
      },
    ],
  })

  return response.choices[0].message.content || ''
}
```

## Pattern 5: Edge Functions with Background Jobs

```typescript
// supabase/functions/process-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface PaymentRequest {
  amount: number
  currency: string
  userId: string
  organizationId: string
}

serve(async (req) => {
  try {
    // 1. Authenticate request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body: PaymentRequest = await req.json()

    // 3. Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount,
      currency: body.currency,
      metadata: {
        user_id: body.userId,
        organization_id: body.organizationId,
      },
    })

    // 4. Store payment record in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: body.userId,
        organization_id: body.organizationId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: body.amount,
        currency: body.currency,
        status: 'pending',
      })

    if (dbError) throw dbError

    // 5. Return client secret
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

---

**Last Updated:** 2025-01-08
