# Next.js 16 Audit Skill

**Enterprise-grade auditing for Next.js 16, React 19, and Clarity architecture compliance.** Now includes official Next.js 16 documentation integration with 26 comprehensive audit categories.

## Structure

```
nextjs-16-audit/
├── skill.md              # Main skill file (invoked by Claude) - 26 audit categories
├── README.md            # This file
├── audit.ts             # Executable audit script (optional)
├── CHANGELOG.md         # Version history and migration guides
└── resources/           # Reference materials
    ├── SKILL.md         # Detailed audit methodology (1200+ lines)
    ├── CHECKLIST.md     # Comprehensive checklist by file type
    ├── USAGE.md         # Usage examples
    ├── quick-reference.md  # Quick lookup guide
    └── nextjs-16-reference.md  # Official Next.js 16 docs integration
```

## Installation

1. Place this directory in `.claude/skills/`
2. Restart Claude Code or reload skills
3. Verify skill appears in settings

## Usage

### Trigger the Skill

To activate, say:
- "Audit this file with my nextjs-16-audit skill"
- "Check [file-path] for Next.js 16 compliance"
- "Review this component for best practices"

### What Gets Audited (26 Categories)

**Core Next.js 16 Architecture**:
- ✅ **Server/Client Components** - Boundaries, data flow, environment protection
- ✅ **Linking & Navigation** - `<Link>` optimization, prefetching, streaming
- ✅ **Layouts & Pages** - Route structure, dynamic segments, async params
- ✅ **Caching & Revalidating** - Cache Components, `revalidateTag`, `revalidatePath`
- ✅ **Error Handling** - Boundaries, expected errors, global errors
- ✅ **Proxy** - Request interception, redirects, header manipulation

**Advanced Patterns**:
- ✅ **Data Fetching** - Parallel/sequential, request memoization, fetch API
- ✅ **Server Functions** - `'use server'`, form actions, auth validation
- ✅ **Streaming & Suspense** - Route loading, component boundaries, skeletons
- ✅ **React 19** - `use` hook, `useActionState`, `useTransition`
- ✅ **Security** - Input sanitization, XSS prevention, server-only protection
- ✅ **Performance** - Image optimization, dynamic imports, bundle analysis
- ✅ **Accessibility** - Semantic HTML, ARIA, keyboard navigation

**Clarity Architecture**:
- ✅ **Type Centralization** - Domain types in `@/lib/types`
- ✅ **Auth Patterns** - DAL usage vs direct Supabase calls
- ✅ **Database** - Drizzle imports, repository pattern, balance helpers
- ✅ **Build Config** - `cacheComponents: true`, runtime compatibility

## Output

The skill generates:

1. **File Classification** - Identifies file type (Server Component, Client Component, etc.)
2. **Compliance Score** - 0-100 rating with grade (Excellent/Good/Acceptable/Needs Work/Critical)
3. **Categorized Findings** - Critical (🚨), Warning (⚠️), Suggestion (💡) levels
4. **Exact Code Snippets** - With line numbers and context
5. **Auto-Fix Instructions** - Specific Edit commands for remediation
6. **Migration Guides** - Next.js 15→16 upgrade assistance
7. **Performance Impact** - Core Web Vitals optimization suggestions

## Reference Files

**Core Documentation**:
- `skill.md` - Main audit skill (26 categories, 4000+ lines)
- `resources/SKILL.md` - Complete audit methodology (1200+ lines)
- `resources/CHECKLIST.md` - File-type-specific checklists
- `resources/USAGE.md` - Detailed usage examples
- `resources/quick-reference.md` - Quick violation lookups

**Official Next.js 16 Integration**:
- `resources/nextjs-16-reference.md` - Official documentation patterns
- Integrated examples from: Server/Client Components, Linking/Navigation, Layouts/Pages, Caching/Revalidating, Error Handling, Proxy

## Version

- **Version**: 5.0.0
- **Last Updated**: 2025-11-03
- **Next.js**: 16.0.1 (Complete feature coverage with official docs integration)
- **React**: 19 (Full Server/Client Components, modern hooks)
- **Features**: 26 audit categories, official documentation integration, migration guides, enterprise-grade compliance, comprehensive reference materials

## License

Internal use for Clarity project
