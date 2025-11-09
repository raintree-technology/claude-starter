# Next.js Cache Architect Skill

Complete skill for designing, implementing, and optimizing caching strategies in Next.js 16+ applications using Cache Components.

## Quick Start

**Invoke the skill:**
```
use next-cache-architect
```

**Common tasks:**
- `Audit caching in app/api/v1/transactions/route.ts`
- `Migrate cacheWrap to Cache Components in lib/services/accounts.ts`
- `Optimize dashboard caching strategy`
- `Debug stale cache in user profile`
- `Design cache architecture for new feature`

## What This Skill Does

The Next.js Cache Architect skill helps you:

1. **Design** - Plan caching strategies for new features
2. **Audit** - Identify caching opportunities and issues
3. **Migrate** - Convert legacy `cacheWrap` to Cache Components
4. **Optimize** - Improve cache hit rates and performance
5. **Debug** - Troubleshoot cache problems
6. **Implement** - Write production-ready cached functions

## Core Capabilities

### 1. Cache Strategy Design

The skill analyzes your data flows and recommends:
- Appropriate `cacheLife` profiles (minutes/hours/days)
- Cache tag structure for surgical invalidation
- Composition patterns for related data
- Request memoization for deduplication

### 2. Migration from Legacy cacheWrap

Systematically converts:
```ts
// Before (cacheWrap)
await cacheWrap(
  buildCacheKey('user', userId, 'accounts'),
  async () => fetchAccounts(userId),
  300
)

// After (Cache Components)
export async function getAccountsCached(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(UserTags.accounts(userId))
  return fetchAccounts(userId)
}
```

### 3. Performance Auditing

Generates detailed reports:
- Cache coverage percentage
- Missing invalidation handlers
- Over-cached or under-cached operations
- Performance improvements possible
- Scoring (0-100) with actionable fixes

### 4. Implementation Patterns

Provides battle-tested patterns for:
- API route caching
- Dashboard data aggregation
- Transaction filtering
- Real-time market data
- Search results
- Analytics computation

### 5. Debugging Support

Helps diagnose:
- Cache not working
- Stale data after updates
- Wrong data shown to users
- Performance degradation
- Memory issues

## Resources

The skill includes comprehensive documentation:

### 📚 [migration-guide.md](./resources/migration-guide.md)
Complete step-by-step guide for migrating from `cacheWrap` to Cache Components:
- Why migrate
- Migration strategy
- Before/after examples
- Common pitfalls
- Rollback strategy

### 📋 [patterns.md](./resources/patterns.md)
Common caching patterns reference:
- Basic patterns (single resource, collections, aggregations)
- Composition patterns (nested, layered, dependencies)
- Invalidation patterns (single, batch, conditional, cascade)
- Advanced patterns (conditional, time-based, warming)
- Anti-patterns to avoid

### 💡 [examples.md](./resources/examples.md)
Real-world production implementations:
- Dashboard with multiple data sources
- Transaction list with filters
- Account balance sync
- Real estate property data
- Market data (crypto/stocks)
- User analytics
- Plaid integration
- Search and filtering

### 🔧 [debugging.md](./resources/debugging.md)
Troubleshooting guide:
- Common issues and solutions
- Debugging tools
- Cache hit/miss tracking
- Performance profiling
- Troubleshooting checklist

## Architecture Overview

The skill enforces a three-layer caching strategy:

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Request Memoization (React cache())   │
│  Scope: Single request                          │
│  Purpose: Deduplicate within SSR render         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Layer 2: Cache Components ('use cache')        │
│  Scope: Across requests (5 min - 30 days)      │
│  Purpose: Primary application caching           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Layer 3: HTTP Cache (Cache-Control headers)    │
│  Scope: Browser cache (30s SWR)                │
│  Purpose: CDN and browser optimization          │
└─────────────────────────────────────────────────┘
```

## Cache Tag Structure

The skill uses a structured tag naming convention:

```ts
// User-scoped tags
UserTags.accounts(userId)      → "user:{id}:accounts"
UserTags.transactions(userId)  → "user:{id}:transactions"
UserTags.dashboard(userId)     → "user:{id}:dashboard"

// Global data tags
DataTags.CATEGORIES           → "data:categories"
DataTags.INSTITUTIONS         → "data:institutions"

// Content tags
ContentTags.POSTS            → "content:posts"
ContentTags.HELP             → "content:help"
```

## Cache Lifetime Profiles

Recommended profiles by data type:

| Profile | Duration | Use Case |
|---------|----------|----------|
| `'minutes'` | 5-15 min | User data, balances, transactions |
| `'hours'` | 1-4 hours | Analytics, aggregations, global data |
| `'days'` | 7-30 days | Reference data, CMS content |
| Custom | Varies | Real-time data, special requirements |

## Audit Scoring

The skill scores cache implementations (0-100):

**Critical (25 points each):**
- All data fetching operations cached
- Cache tags present for invalidation
- Mutations invalidate relevant caches
- No dynamic values in cached functions

**High Priority (15 points each):**
- Appropriate cache lifetimes
- Request memoization for deduplication
- Cache monitoring/logging
- No cacheWrap (migrated to Cache Components)

**Medium Priority (5 points each):**
- Cache hit/miss tracking
- Performance metrics logged
- Documentation of cache strategy

**Interpretation:**
- 90-100: Excellent ✅
- 70-89: Good 👍
- 50-69: Needs Work ⚠️
- 0-49: Critical Issues 🚨

## Example Workflows

### Workflow 1: Audit Existing Route

```
You: Audit caching in app/api/v1/dashboard/data/route.ts

Skill:
1. Analyzes all data fetching operations
2. Checks for cache directives
3. Verifies cache tags exist
4. Ensures invalidation is implemented
5. Generates detailed report with fixes
6. Provides before/after performance estimates
```

### Workflow 2: Migrate Legacy Code

```
You: Migrate cacheWrap to Cache Components in lib/services/accounts.ts

Skill:
1. Identifies all cacheWrap calls
2. Creates helpers.ts file structure
3. Extracts cacheable logic
4. Adds 'use cache' directives
5. Sets appropriate cacheLife and cacheTags
6. Updates route handlers
7. Migrates invalidation to revalidateTag
8. Tests cache behavior
```

### Workflow 3: Design New Feature Cache

```
You: Design cache architecture for portfolio analytics feature

Skill:
1. Analyzes data access patterns
2. Determines data volatility
3. Recommends cache lifetimes
4. Designs tag structure
5. Plans invalidation strategy
6. Provides implementation examples
7. Documents cache behavior
```

### Workflow 4: Debug Cache Issue

```
You: Why is user dashboard showing stale data after transaction sync?

Skill:
1. Checks if sync handler invalidates dashboard cache
2. Verifies cache tags are consistent
3. Confirms revalidateTag is called
4. Checks if cached function has cacheTag
5. Provides fix with code examples
6. Recommends testing approach
```

## Best Practices Enforced

The skill enforces these patterns:

1. **Always add cache tags** - Enable invalidation
2. **Extract to helpers** - Can't use `'use cache'` in route handlers
3. **User-scoped tags** - Never cache user data globally
4. **Invalidate after mutations** - Keep cache fresh
5. **Appropriate lifetimes** - Match data volatility
6. **Monitor performance** - Track hit rates
7. **Document strategy** - Help team understand caching

## Configuration Requirements

### next.config.ts

```ts
const nextConfig: NextConfig = {
  cacheComponents: true, // Required
}
```

### Runtime

- Node.js 20.9+ (Cache Components require Node.js)
- Edge Runtime NOT supported

## Integration with Clarity Project

This skill is designed specifically for the Clarity financial app and:

- Uses Clarity's cache tag structure (`UserTags`, `DataTags`, `ContentTags`)
- Follows Clarity's DAL patterns (Data Access Layer)
- Integrates with Plaid sync invalidation
- Supports encrypted balance caching
- Works with Drizzle ORM queries
- Follows Clarity's type safety conventions

## When to Use This Skill

**Always use when:**
- Creating new API routes
- Adding data fetching to Server Components
- Migrating from cacheWrap
- Experiencing slow API responses
- After adding mutations
- When users report stale data
- Before deploying data-heavy features

**Consider using when:**
- Reviewing pull requests
- Optimizing application performance
- Planning new features with data access
- Troubleshooting production issues
- Training team on caching

## Success Metrics

A well-cached application using this skill should have:

- ✅ **95%+ cache hit rate** for user data
- ✅ **< 15ms** average cached response time
- ✅ **< 100ms** average cache miss response time
- ✅ **Zero** stale data bugs
- ✅ **100%** mutation handlers invalidate caches
- ✅ **All** expensive operations cached
- ✅ **Zero** cacheWrap calls (fully migrated)

## Updates and Maintenance

This skill is versioned and updated as:
- Next.js caching APIs evolve
- New patterns are discovered
- Project architecture changes
- Team feedback is incorporated

**Current version:** 1.0.0 (Next.js 16.0.1)

## Support

For issues with this skill:
1. Check the [debugging guide](./resources/debugging.md)
2. Review [examples](./resources/examples.md) for similar cases
3. Consult [patterns](./resources/patterns.md) for best practices
4. Ask the skill for help: `Debug cache issue in [file]`

## Contributing

To improve this skill:
1. Add new patterns to `resources/patterns.md`
2. Document real-world examples in `resources/examples.md`
3. Update debugging guide with new issues
4. Enhance audit scoring criteria
5. Add new cache strategies

---

**Built for Clarity by Claude Code** 🚀
