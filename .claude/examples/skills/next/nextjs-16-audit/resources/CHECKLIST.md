# Next.js 16 Audit Checklist

Complete checklist of what gets reviewed for each file type.

## 📄 All Files (Universal Checks)

- [ ] **File Structure**
  - [ ] Correct location for file type
  - [ ] Naming conventions (kebab-case, PascalCase)
  - [ ] Appropriate exports (default vs named)

- [ ] **Imports**
  - [ ] Valid import sources
  - [ ] No restricted imports
  - [ ] Path aliases used (`@/*`)
  - [ ] No circular dependencies

- [ ] **Type Safety**
  - [ ] No `any` types
  - [ ] Canonical type imports from `@/lib/types`
  - [ ] Proper TypeScript strictness
  - [ ] Array bounds checking

- [ ] **Code Quality**
  - [ ] No `console.log` in production
  - [ ] Structured logging (Pino)
  - [ ] Error handling
  - [ ] No dead/commented code

---

## 🖥️ Server Components (app/**/page.tsx, layout.tsx without "use client")

- [ ] **Component Structure**
  - [ ] Async function for data fetching
  - [ ] No `"use client"` directive
  - [ ] Default export

- [ ] **Data Fetching**
  - [ ] Direct data fetching (no useEffect)
  - [ ] Parallel fetches with Promise.all
  - [ ] Error boundaries

- [ ] **Authentication**
  - [ ] Uses DAL functions (`getUserId`, `getUser`, `verifySession`)
  - [ ] No direct `supabase.auth.getUser()`
  - [ ] Auto-redirects for unauthenticated

- [ ] **Database**
  - [ ] Drizzle operators from `drizzle-orm`
  - [ ] Repository pattern preferred
  - [ ] Proper error handling

- [ ] **Caching**
  - [ ] Data fetching in cached functions
  - [ ] `'use cache'` with `cacheLife()` and `cacheTag()`
  - [ ] No `cacheWrap`

- [ ] **React Patterns**
  - [ ] No React hooks (useState, useEffect, etc.)
  - [ ] No browser APIs
  - [ ] Server Components as children when possible

---

## 💻 Client Components (files with "use client")

- [ ] **Directive**
  - [ ] `"use client"` at top of file
  - [ ] Necessary (uses hooks/events/browser APIs)
  - [ ] Minimal scope

- [ ] **Composition**
  - [ ] Server Components as children where possible
  - [ ] Props from Server Component parent
  - [ ] Small, focused components

- [ ] **React 19 Patterns**
  - [ ] No unnecessary useEffect
  - [ ] State derived when possible
  - [ ] Event handlers for side effects
  - [ ] Keys for component resets
  - [ ] Modern hooks (`use()`, `useSyncExternalStore()`)

- [ ] **State Management**
  - [ ] TanStack Query for server state
  - [ ] Zustand for global client state
  - [ ] Optimistic updates
  - [ ] Proper query keys

- [ ] **Authentication**
  - [ ] Uses `useAuthUser()` or `useAuth()`
  - [ ] No manual auth with useEffect
  - [ ] Loading states

- [ ] **Performance**
  - [ ] Heavy libraries dynamically imported
  - [ ] Suspense boundaries
  - [ ] Memoization when needed

---

## 🛣️ API Routes (app/api/**/route.ts)

- [ ] **Route Handler**
  - [ ] Proper syntax (`export async function GET/POST`)
  - [ ] Returns `Response` objects
  - [ ] NextResponse only for cookies/headers

- [ ] **Caching**
  - [ ] Cacheable logic in `'use cache'` helper functions
  - [ ] Not directly in route handler
  - [ ] Proper cache tags

- [ ] **Authentication**
  - [ ] Uses DAL (`getUserId()`)
  - [ ] Proper error handling for auth failures
  - [ ] No direct Supabase calls

- [ ] **Validation**
  - [ ] Zod schema for request body
  - [ ] `.parse()` or `.safeParse()`
  - [ ] Type inference with `z.infer`

- [ ] **Security**
  - [ ] Input validation
  - [ ] Rate limiting
  - [ ] CORS if needed
  - [ ] No sensitive data leaks

- [ ] **Error Handling**
  - [ ] Try/catch blocks
  - [ ] Structured logging
  - [ ] Proper HTTP status codes
  - [ ] User-friendly error messages

- [ ] **Performance**
  - [ ] Efficient database queries
  - [ ] Pagination for large datasets
  - [ ] Streaming for large responses

---

## 🗄️ Database Files (lib/db/**/*)

- [ ] **Queries**
  - [ ] Drizzle ORM operators from `drizzle-orm`
  - [ ] Parameterized queries (no SQL injection)
  - [ ] Proper error handling

- [ ] **Repositories**
  - [ ] Preferred over query functions
  - [ ] Consistent patterns
  - [ ] Type safety

- [ ] **Services**
  - [ ] Business logic separated
  - [ ] Cached where appropriate
  - [ ] Transaction support

- [ ] **Helpers**
  - [ ] Balance helpers for encryption
  - [ ] Proper error handling
  - [ ] Fallback strategies

---

## 🎣 Hooks (hooks/**/*.ts, lib/hooks/**/*.ts)

- [ ] **Hook Rules**
  - [ ] Name starts with `use`
  - [ ] Only called at top level
  - [ ] Proper dependencies

- [ ] **Auth Hooks**
  - [ ] `useAuthUser()` uses `useSyncExternalStore`
  - [ ] Singleton store pattern
  - [ ] Loading states

- [ ] **Data Hooks**
  - [ ] TanStack Query for server state
  - [ ] Proper cache invalidation
  - [ ] Error handling

- [ ] **Custom Hooks**
  - [ ] Single responsibility
  - [ ] Reusable
  - [ ] Well-documented

---

## 🎨 Components (components/**/*.tsx)

- [ ] **Component Type**
  - [ ] Server Component by default
  - [ ] Client Component only when needed
  - [ ] Proper directive

- [ ] **Props**
  - [ ] TypeScript interface
  - [ ] Validation if from external source
  - [ ] Default values

- [ ] **Accessibility**
  - [ ] Semantic HTML
  - [ ] ARIA attributes
  - [ ] Keyboard navigation
  - [ ] Focus management

- [ ] **Performance**
  - [ ] `next/image` for images
  - [ ] Dynamic imports for heavy components
  - [ ] Memoization when needed

- [ ] **Styling**
  - [ ] Tailwind classes
  - [ ] Design system tokens
  - [ ] Responsive design

---

## 📦 Utilities (lib/utils/**/*.ts, lib/**/*.ts)

- [ ] **Pure Functions**
  - [ ] No side effects
  - [ ] Deterministic
  - [ ] Well-tested

- [ ] **Type Safety**
  - [ ] Proper TypeScript types
  - [ ] Runtime validation where needed
  - [ ] Type guards

- [ ] **Performance**
  - [ ] Efficient algorithms
  - [ ] Memoization if expensive
  - [ ] Lazy loading

- [ ] **Exports**
  - [ ] Barrel exports from index.ts
  - [ ] Named exports (not default)
  - [ ] Clear function names

---

## 🔐 Types (lib/types/**/*.ts)

- [ ] **Canonical Types**
  - [ ] Core business types
  - [ ] No duplicates
  - [ ] Exported properly

- [ ] **Type Organization**
  - [ ] Related types grouped
  - [ ] Clear naming
  - [ ] JSDoc comments

- [ ] **Integration**
  - [ ] Matches database schema
  - [ ] API contracts
  - [ ] Frontend expectations

---

## 🧪 Tests (**/*.test.ts, **/*.spec.ts)

- [ ] **Test Coverage**
  - [ ] Critical paths tested
  - [ ] Edge cases
  - [ ] Error scenarios

- [ ] **Test Quality**
  - [ ] Descriptive test names
  - [ ] Arrange-Act-Assert pattern
  - [ ] No test interdependencies

- [ ] **Mocking**
  - [ ] Database mocked properly
  - [ ] External APIs mocked
  - [ ] Consistent patterns

---

## 📝 Middleware (middleware.ts)

- [ ] **Performance**
  - [ ] Lightweight (runs on edge)
  - [ ] No heavy database queries
  - [ ] Fast execution

- [ ] **Use Cases**
  - [ ] Auth redirects
  - [ ] Rewrites
  - [ ] Headers
  - [ ] Logging

- [ ] **Supabase**
  - [ ] Uses middleware client
  - [ ] Session refresh
  - [ ] Proper error handling

---

## 🔒 Security Checks (All Files)

- [ ] **Input Validation**
  - [ ] Zod schemas at boundaries
  - [ ] Type checking
  - [ ] Range validation

- [ ] **XSS Prevention**
  - [ ] HTML sanitization (DOMPurify)
  - [ ] No raw dangerouslySetInnerHTML
  - [ ] Proper escaping

- [ ] **SQL Injection**
  - [ ] Parameterized queries
  - [ ] No string concatenation
  - [ ] ORM usage

- [ ] **Authentication**
  - [ ] Proper session handling
  - [ ] Secure redirects
  - [ ] No auth bypass

- [ ] **Environment Variables**
  - [ ] NEXT_PUBLIC_ for client
  - [ ] Server-only for secrets
  - [ ] Validation at startup

---

## 🚀 Performance Checks (All Files)

- [ ] **Images**
  - [ ] `next/image` component
  - [ ] Proper sizes
  - [ ] Priority for above-fold

- [ ] **Code Splitting**
  - [ ] Dynamic imports
  - [ ] Route-based splitting
  - [ ] Component-based splitting

- [ ] **Bundle Size**
  - [ ] Tree-shaking friendly
  - [ ] No heavy dependencies
  - [ ] Lazy loading

- [ ] **Caching**
  - [ ] Aggressive caching
  - [ ] Proper invalidation
  - [ ] Cache tags

---

## ♿ Accessibility Checks (Components)

- [ ] **Semantic HTML**
  - [ ] Proper elements
  - [ ] Heading hierarchy
  - [ ] Landmark regions

- [ ] **Forms**
  - [ ] Labels with htmlFor
  - [ ] Error messages
  - [ ] Required fields marked

- [ ] **Interactive Elements**
  - [ ] `<button>` not `<div onClick>`
  - [ ] Keyboard navigation
  - [ ] Focus indicators

- [ ] **ARIA**
  - [ ] Attributes when needed
  - [ ] Roles
  - [ ] States

- [ ] **Color Contrast**
  - [ ] WCAG 2.1 AA compliance
  - [ ] Text readable
  - [ ] Interactive elements visible

---

## Summary Scoring

Each file gets a score based on:

- **Critical (30%)**: Security, auth, type safety
- **High (25%)**: Patterns, caching, database
- **Medium (25%)**: Performance, accessibility
- **Low (20%)**: Code quality, structure

**Passing Score**: 85/100

**Grade Scale**:
- 95-100: Excellent ⭐⭐⭐⭐⭐
- 85-94: Good ⭐⭐⭐⭐
- 75-84: Acceptable ⭐⭐⭐
- 65-74: Needs Work ⚠️
- <65: Critical Issues 🚨
