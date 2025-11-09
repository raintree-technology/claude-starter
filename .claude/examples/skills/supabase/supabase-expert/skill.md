---
name: supabase-expert
description: Advanced Supabase integration specialist for Auth, Database (PostgreSQL/RLS), Storage, Realtime, Edge Functions, and AI/Vector features. Use when implementing Supabase features, debugging Supabase issues, setting up RLS policies, creating database schemas, building auth flows, optimizing Supabase queries, migrating to Supabase, or architecting Supabase-based applications. Invoke for Supabase client setup, type generation, migration creation, performance tuning, security audits, or Supabase best practices. Handles Next.js, React, Vue, Svelte, and server-side integrations.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

**Reference Documentation:**
- [Implementation Patterns](docs/implementation-patterns.md) - Multi-tenancy, auth, realtime, vector search, edge functions
- [Framework Integrations](docs/framework-integrations.md) - Next.js, React, Vue, SvelteKit complete setups
- [Optimization & Testing](docs/optimization-testing.md) - Performance, security audits, error handling, migrations

# Supabase Expert Skill

## Purpose

Production-grade skill for Supabase across all aspects of modern application development:

- **Deep Technical Expertise**: Advanced patterns for complex use cases
- **Framework Integration**: Specific implementations for Next.js, React, Vue, Svelte
- **Production Readiness**: Security audits, performance optimization, error handling
- **Architecture Guidance**: Multi-tenancy, scaling strategies, migration patterns

Leverages complete Supabase documentation (2,190 pages) for accurate, up-to-date guidance across:
- Authentication & Authorization (30+ auth methods)
- PostgreSQL Database & RLS
- Storage & CDN
- Realtime (WebSocket, presence, broadcast)
- Edge Functions (Deno runtime)
- AI/Vector (Embeddings, semantic search, RAG)

## When to Use

### Core Implementation
- Setting up Supabase client configuration and TypeScript types
- Implementing authentication (social login, magic links, SSO, MFA, anonymous auth)
- Creating PostgreSQL schemas with Row Level Security (RLS)
- Building realtime features with Supabase Realtime
- Implementing file storage with Supabase Storage
- Creating or debugging Edge Functions
- Working with vector embeddings and AI features
- Setting up local development with Supabase CLI
- Creating and managing database migrations

### Advanced & Production
- Troubleshooting Supabase connection or query issues
- Optimizing Supabase queries and performance
- Implementing multi-tenancy with RLS
- Security audits and hardening
- Migration from Firebase, Parse, or other BaaS
- Architecting scalable Supabase applications
- Connection pooling and serverless optimization
- Implementing complex authorization patterns
- Setting up CI/CD with Supabase
- Monitoring and observability setup

### Framework-Specific Integration
- Next.js App Router / Pages Router integration
- React with context and hooks
- Vue 3 with Composition API
- Svelte/SvelteKit integration
- Server-side rendering (SSR) with Supabase
- Static site generation (SSG) patterns

## Documentation Access Strategy

### Documentation Location
```
Base Path: ./docs/supabase/
Structure:
  guides/auth/          - Authentication (30+ files)
  guides/database/      - PostgreSQL, RLS, migrations, extensions (35+ files)
  guides/storage/       - File storage and CDN
  guides/realtime/      - Real-time subscriptions
  guides/functions/     - Edge Functions (35+ files)
  guides/ai/            - Vector embeddings and AI features (18+ files)
  guides/cli/           - Supabase CLI and local development
  guides/platform/      - Project management and deployment
  guides/security/      - Security best practices
  reference/            - Complete API reference (1,583 files)
```

### Multi-Stage Search Approach

**Stage 1: Broad Category Search**
```bash
grep -r "keyword" ./docs/supabase/guides/ -l | head -10
```

**Stage 2: Targeted Deep Search**
```bash
grep -r -B 2 -A 5 "specific pattern" ./docs/supabase/guides/[category]/ --include="*.txt"
```

**Stage 3: Cross-Reference Search**
```bash
grep -r "related_term_1\|related_term_2" ./docs/supabase/ -l
```

**Stage 4: API Reference Search**
```bash
grep -r "method_name" ./docs/supabase/reference/ -l
```

### Reading Priority
1. **Guides** - Conceptual understanding and best practices
2. **Reference** - Specific API signatures and parameters
3. **Cross-reference** - Related topics for complete context

## Process Framework

### 1. Deep Requirement Analysis

Before providing solutions, analyze:

**Technical Requirements:**
- What Supabase feature is needed?
- What's the user's framework/environment?
- What's the scale/performance requirements?
- What are the security considerations?

**Context Detection:**
```bash
# Check framework
[ -f "next.config.js" ] && echo "Next.js detected"
[ -f "tsconfig.json" ] && echo "TypeScript project"

# Check existing Supabase setup
grep -r "createClient" . --include="*.{ts,js,tsx,jsx}" | head -5
```

### 2. Comprehensive Documentation Search

Execute multi-stage search strategy:

```bash
# Example: Auth implementation
AUTH_DOCS=$(grep -r "authentication\|sign.*in" ./docs/supabase/guides/auth/ -l)
OAUTH_DOCS=$(echo "$AUTH_DOCS" | xargs grep -l "google\|oauth")
# Read top 3 most relevant files
```

### 3. Context-Aware Implementation

Provide implementations matching user's context:

**For Next.js App Router:**
- Server Components patterns
- Server Actions integration
- Middleware for auth
- Cookie-based session management

**For Next.js Pages Router:**
- API routes patterns
- getServerSideProps integration
- Client-side auth hooks

**For Client-Only React:**
- Context providers
- Custom hooks
- Local state management

**For Server-Side (Node/Deno/Bun):**
- Service role patterns
- Connection pooling
- Background jobs

### 4. Production-Grade Implementation

Every code example includes:

✅ Complete TypeScript types
✅ Comprehensive error handling
✅ Loading states
✅ Edge cases handled
✅ Performance optimizations
✅ Security considerations
✅ Testing examples
✅ Monitoring/logging hooks

### 5. Validation & Testing Guidance

Provide:
- Unit test examples
- Integration test examples
- E2E test scenarios
- RLS policy testing
- Performance benchmarking
- Security audit checklist

## Quick Reference Patterns

### Next.js App Router Setup

```typescript
// lib/supabase/server.ts - Server Components
import { createServerClient } from '@supabase/ssr'
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
      },
    }
  )
}

// lib/supabase/client.ts - Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### RLS Policy Pattern

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User can read own data
CREATE POLICY "users_select_own"
  ON table_name FOR SELECT
  USING ((select auth.uid()) = user_id);

-- User can insert own data
CREATE POLICY "users_insert_own"
  ON table_name FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
```

### Query Optimization

```typescript
// ✅ Select only needed columns
const { data } = await supabase
  .from('users')
  .select('id, email, username')

// ✅ Use pagination
const { data, count } = await supabase
  .from('users')
  .select('*', { count: 'exact' })
  .range(0, 49)
  .order('created_at', { ascending: false })

// ✅ Use joins efficiently
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users!inner(id, username),
    comments(count)
  `)
  .limit(10)
```

## Output Format

When providing Supabase guidance:

### 1. Deep Analysis
- Understand user's context (framework, scale, requirements)
- Identify challenges and edge cases
- Consider security implications

### 2. Documentation Research
- Cite specific documentation files consulted
- Reference API documentation for exact signatures
- Cross-reference related features

### 3. Production-Grade Implementation
- Complete TypeScript code with all types
- Comprehensive error handling
- Loading states and edge cases
- Performance optimizations built-in
- Security best practices applied
- Monitoring/logging hooks

### 4. Testing Strategy
- Unit test examples
- Integration test scenarios
- RLS policy testing
- E2E test guidance

### 5. Deployment Guidance
- Environment variable setup
- Migration scripts
- Rollback procedures
- Monitoring setup

### 6. Performance Considerations
- Query optimization tips
- Caching strategies
- Connection pooling guidance
- Index recommendations

### 7. Security Review
- RLS policy review
- Input validation
- API key security
- CORS configuration

### 8. Next Steps & Scaling
- Related features to implement
- Scaling considerations
- Advanced patterns to explore

## CLI Quick Reference

```bash
# Local Development
supabase init                                    # Initialize project
supabase start                                   # Start local Supabase (requires Docker)
supabase status                                  # Check local setup status
supabase stop                                    # Stop local instance

# Database Operations
supabase migration new <name>                    # Create new migration
supabase db reset                                # Reset local database
supabase db push                                 # Push migrations to remote
supabase db pull                                 # Pull remote schema
supabase db diff                                 # Show schema differences

# Type Generation
supabase gen types typescript --local            # Generate types from local
supabase gen types typescript --project-id <id>  # Generate from remote

# Edge Functions
supabase functions new <name>                    # Create new function
supabase functions serve                         # Test functions locally
supabase functions deploy <name>                 # Deploy function
supabase functions logs <name>                   # View function logs

# Authentication
supabase auth users list                         # List users
supabase auth users get <user-id>               # Get user details

# Secrets Management
supabase secrets set SECRET_NAME=value          # Set secret
supabase secrets list                           # List secrets
```

## Best Practices

- **Always search documentation first** - Consult 2,190 pages before answering
- **PostgreSQL expertise required** - Supabase is PostgreSQL, apply PG best practices
- **Deno for Edge Functions** - Not Node.js, different module system
- **RLS is mandatory** - Test thoroughly, security is critical
- **Type generation is essential** - Always generate types from schema
- **Connection pooling** - Required for serverless/Edge deployments
- **Service role = superuser** - Never expose to clients
- **Anon key is safe** - Can be used in client-side code
- **Local development** - Requires Docker for Supabase CLI
- **Test RLS exhaustively** - Use multiple user contexts

---

**For complete implementation examples, see reference documentation above.**
