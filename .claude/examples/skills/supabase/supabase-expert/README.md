# Supabase Expert Skill

A comprehensive Claude Code skill for working with Supabase - authentication, database, storage, realtime, edge functions, and AI features.

## Overview

This skill provides expert guidance for all aspects of Supabase development:

- **Authentication** - Social login, magic links, SSO, MFA, session management
- **Database** - PostgreSQL schemas, RLS policies, migrations, query optimization
- **Storage** - File uploads, bucket policies, CDN integration
- **Realtime** - Subscriptions, presence, broadcast channels
- **Edge Functions** - Deno-based serverless functions
- **AI/Vector** - Embeddings, semantic search, vector operations
- **CLI** - Local development, migrations, type generation

## Features

- Access to complete Supabase documentation
- TypeScript-first code examples
- Security best practices and RLS patterns
- Performance optimization guidance
- Comprehensive error handling
- Testing strategies

## When to Use

Invoke this skill when:
- Setting up Supabase in a project
- Implementing authentication flows
- Creating database schemas with RLS
- Building realtime features
- Working with file storage
- Creating Edge Functions
- Debugging Supabase issues
- Optimizing queries and performance

## Installation

This skill is already set up in your project at:
```
.claude/skills/supabase-expert/
```

The skill automatically has access to documentation at:
```
./docs/supabase/
```

## Usage

### Automatic Invocation

The skill will automatically activate when you mention Supabase-related tasks:

```
"Set up Supabase authentication with Google OAuth"
"Create a posts table with RLS policies"
"Help me debug this Supabase connection error"
"Implement realtime subscriptions for chat messages"
```

### Manual Invocation

You can also explicitly invoke the skill:

```
"Use the supabase-expert skill to help me implement storage"
```

## Examples

### Example 1: Authentication Setup

**Request:** "Set up email authentication with Supabase"

**Response:** Complete implementation including:
- Supabase client setup
- Sign up/sign in functions
- Session management
- Error handling
- TypeScript types

### Example 2: Database Schema

**Request:** "Create a users table with RLS"

**Response:** SQL migration including:
- Table schema
- RLS policies for CRUD operations
- Indexes for performance
- Triggers for timestamps
- Security best practices

### Example 3: Realtime Features

**Request:** "Add realtime updates to my messages"

**Response:** Complete implementation including:
- Channel subscription
- Event handling
- Cleanup logic
- TypeScript types
- Error handling

## Documentation Coverage

The skill has access to comprehensive documentation covering:

### Guides
- **AI** - Vector search, embeddings, hybrid search
- **API** - REST API, auto-generated endpoints
- **Auth** - All authentication methods and configurations
- **CLI** - Local development and deployment
- **Database** - Schema, RLS, functions, optimization
- **Deployment** - Production best practices
- **Functions** - Edge Functions with Deno
- **Platform** - Project management and configuration
- **Realtime** - Subscriptions and presence
- **Security** - Best practices and hardening
- **Storage** - File management and CDN

### Reference
- Complete API reference for all Supabase services
- Type definitions
- Configuration options

## Common Tasks

### Client Setup
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Type Generation
```bash
supabase gen types typescript --local > types/supabase.ts
```

### Local Development
```bash
supabase start
supabase migration new migration_name
supabase db push
```

### RLS Policy Template
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

## Best Practices

### Security
- Always enable RLS on tables with user data
- Never expose service role key to clients
- Validate all user input
- Use prepared statements
- Test RLS policies thoroughly

### Performance
- Add indexes for frequently queried columns
- Use select() to limit returned columns
- Implement pagination for large datasets
- Enable connection pooling for serverless
- Cache frequently accessed data

### Development
- Use Supabase CLI for local development
- Version control all migrations
- Generate TypeScript types
- Test locally before deploying
- Use branching for preview environments

## Troubleshooting

### Common Issues

**"Invalid login credentials"**
- Check email/password are correct
- Verify user exists in auth.users
- Check email confirmation status

**"Row-level security policy violation"**
- Review RLS policies on the table
- Verify user authentication
- Check auth.uid() matches expected user

**"Connection timeout"**
- Check network connectivity
- Verify Supabase URL is correct
- Enable connection pooling

**"Type errors"**
- Regenerate types: `supabase gen types typescript --local`
- Check schema matches types
- Update @supabase/supabase-js version

### Debugging Steps

1. Check Supabase Dashboard logs
2. Enable debug mode in client
3. Test RLS policies in dashboard
4. Verify environment variables
5. Check API usage limits

## Contributing

To improve this skill:

1. **Update documentation:** Run `python3 fetch_docs.py` to get latest Supabase docs
2. **Add examples:** Add more code examples to SKILL.md
3. **Improve patterns:** Add common patterns you discover
4. **Report issues:** Note any inaccuracies or missing features

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Supabase Discord](https://discord.supabase.com)

## Version

- **Skill Version:** 1.0.0
- **Documentation Date:** 2025-11-06
- **Supabase Version:** Latest (as of documentation fetch)

## License

This skill is part of the project and follows the project's license.
