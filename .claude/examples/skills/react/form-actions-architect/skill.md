---
name: Form Actions Architect
description: Design and audit Server Actions for Next.js 16 forms. Implements 'use server', useActionState hooks, progressive enhancement, validation, error handling, and optimistic updates.
version: 1.0.0
---

# Form Actions Architect

## Overview

Specialized skill for Next.js 16 Server Actions and form handling. Focuses on:
- **Server Actions** - `'use server'` directive for mutations
- **React 19 Hooks** - `useActionState`, `useTransition`, `useOptimistic`
- **Form Handling** - Progressive enhancement, validation, error states
- **Security** - Auth checks, input sanitization, CSRF protection
- **UX** - Loading states, optimistic updates, error recovery

## When to Use

Invoke when:
- "Design a form"
- "Implement Server Action"
- "Add form validation"
- "Fix form submission"
- "Audit form security"
- "Optimize form UX"

## Core Principle

> **Server Actions for mutations. No API routes for form submissions.**

## Basic Pattern

### 1. Server Action

```ts
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/data/dal'
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(10),
})

export async function createPost(formData: FormData) {
  // 1. Auth check
  const userId = await getUserId()

  // 2. Validate input
  const validated = CreatePostSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  // 3. Perform mutation
  const post = await db.insert(posts).values({
    ...validated,
    userId,
  })

  // 4. Revalidate cache
  revalidatePath('/posts')

  // 5. Return success
  return { success: true, postId: post.id }
}
```

### 2. Form Component

```tsx
// app/posts/new/CreatePostForm.tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/app/actions'

export function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null)

  return (
    <form action={action}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          required
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <div className="error">{state.error}</div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

## Advanced Patterns

### 1. Expected Errors (Return Values)

```ts
// ✅ CORRECT - Return errors, don't throw
'use server'

export async function createPost(formData: FormData) {
  try {
    const userId = await getUserId()
  } catch (error) {
    return { error: 'Unauthorized' }
  }

  // Validate
  const result = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!result.success) {
    return {
      error: 'Validation failed',
      issues: result.error.errors,
    }
  }

  // Business logic validation
  const existingPost = await db.query.posts.findFirst({
    where: eq(posts.title, result.data.title),
  })

  if (existingPost) {
    return { error: 'Post with this title already exists' }
  }

  // Create post
  const post = await db.insert(posts).values({
    ...result.data,
    userId,
  })

  revalidatePath('/posts')
  return { success: true, postId: post.id }
}

// ❌ WRONG - Throwing expected errors
export async function badCreatePost(formData: FormData) {
  const userId = await getUserId() // Throws if not authenticated

  const validated = CreatePostSchema.parse({ ... }) // Throws on validation error

  throw new Error('Duplicate title') // Don't throw expected errors!
}
```

### 2. File-Level vs Inline Server Actions

```ts
// ✅ Option 1: File-level (recommended for shared actions)
// app/actions.ts
'use server'

export async function createPost(formData: FormData) { ... }
export async function updatePost(formData: FormData) { ... }
export async function deletePost(formData: FormData) { ... }

// ✅ Option 2: Inline (good for component-specific actions)
// app/posts/PostCard.tsx
import { revalidatePath } from 'next/cache'

export function PostCard({ post }: { post: Post }) {
  async function deletePost() {
    'use server'
    await db.delete(posts).where(eq(posts.id, post.id))
    revalidatePath('/posts')
  }

  return (
    <div>
      <h2>{post.title}</h2>
      <form action={deletePost}>
        <button type="submit">Delete</button>
      </form>
    </div>
  )
}
```

### 3. useActionState Hook

```tsx
// ✅ CORRECT - useActionState for forms
'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions'

export function ProfileForm({ user }: { user: User }) {
  const [state, action, isPending] = useActionState(
    updateProfile,
    { success: false }
  )

  return (
    <form action={action}>
      <input
        name="name"
        defaultValue={user.name}
        disabled={isPending}
      />

      <input
        name="email"
        defaultValue={user.email}
        disabled={isPending}
      />

      {state.error && (
        <div role="alert" className="error">
          {state.error}
        </div>
      )}

      {state.success && (
        <div role="status" className="success">
          Profile updated successfully!
        </div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
```

### 4. Optimistic Updates

```tsx
// ✅ CORRECT - Optimistic UI with useOptimistic
'use client'

import { useOptimistic } from 'react'
import { updateTodo } from '@/app/actions'

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  async function handleSubmit(formData: FormData) {
    const todo = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      completed: false,
    }

    // Show optimistic update immediately
    addOptimisticTodo(todo)

    // Submit to server
    await updateTodo(formData)
  }

  return (
    <div>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
            {todo.title}
          </li>
        ))}
      </ul>

      <form action={handleSubmit}>
        <input name="title" required />
        <button type="submit">Add Todo</button>
      </form>
    </div>
  )
}
```

### 5. useTransition for Pending States

```tsx
// ✅ CORRECT - useTransition for programmatic actions
'use client'

import { useTransition } from 'react'
import { likePost } from '@/app/actions'

export function LikeButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleLike = () => {
    startTransition(async () => {
      await likePost(postId)
    })
  }

  return (
    <button onClick={handleLike} disabled={isPending}>
      {isPending ? 'Liking...' : 'Like'}
    </button>
  )
}
```

### 6. Progressive Enhancement

```tsx
// ✅ CORRECT - Works without JavaScript
export function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null)

  return (
    <form action={action}>
      {/* Form works even without JS */}
      <input name="title" required />
      <textarea name="content" required />

      {/* Enhanced with JS for pending state */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>

      {/* Enhanced with JS for inline errors */}
      {state?.error && <div className="error">{state.error}</div>}
    </form>
  )
}
```

### 7. Validation with Zod

```ts
// ✅ CORRECT - Comprehensive validation
'use server'

import { z } from 'zod'

const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  email: z.string().email('Invalid email'),
  age: z.coerce.number().int().positive().optional(),
  phone: z.string().regex(/^\d{10}$/, 'Invalid phone number').optional(),
})

export async function updateAccount(formData: FormData) {
  const userId = await getUserId()

  const result = UpdateAccountSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    age: formData.get('age'),
    phone: formData.get('phone'),
  })

  if (!result.success) {
    return {
      error: 'Validation failed',
      issues: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    }
  }

  await db.update(accounts).set(result.data).where(eq(accounts.userId, userId))

  revalidatePath('/account')
  return { success: true }
}
```

### 8. Field-Level Errors

```tsx
// ✅ CORRECT - Show errors per field
'use client'

import { useActionState } from 'react'

type FormState = {
  success?: boolean
  error?: string
  issues?: Array<{ field: string; message: string }>
}

export function SignupForm() {
  const [state, action, isPending] = useActionState<FormState>(
    signup,
    { success: false }
  )

  const getFieldError = (field: string) => {
    return state?.issues?.find(issue => issue.field === field)?.message
  }

  return (
    <form action={action}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          aria-invalid={!!getFieldError('email')}
          aria-describedby="email-error"
        />
        {getFieldError('email') && (
          <div id="email-error" role="alert" className="error">
            {getFieldError('email')}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          aria-invalid={!!getFieldError('password')}
          aria-describedby="password-error"
        />
        {getFieldError('password') && (
          <div id="password-error" role="alert" className="error">
            {getFieldError('password')}
          </div>
        )}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

### 9. Multi-Step Forms

```tsx
// ✅ CORRECT - Multi-step form with Server Actions
'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { submitForm } from '@/app/actions'

export function MultiStepForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [state, action, isPending] = useActionState(submitForm, null)

  const handleStep1Submit = (data: FormData) => {
    setFormData(prev => ({
      ...prev,
      email: data.get('email'),
      name: data.get('name'),
    }))
    setStep(2)
  }

  const handleStep2Submit = (data: FormData) => {
    setFormData(prev => ({
      ...prev,
      address: data.get('address'),
      city: data.get('city'),
    }))
    setStep(3)
  }

  const handleFinalSubmit = async (data: FormData) => {
    const finalData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      finalData.append(key, value as string)
    })
    finalData.append('payment', data.get('payment') as string)

    await action(finalData)
  }

  return (
    <div>
      {step === 1 && (
        <form onSubmit={(e) => {
          e.preventDefault()
          handleStep1Submit(new FormData(e.currentTarget))
        }}>
          <input name="email" required />
          <input name="name" required />
          <button type="submit">Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={(e) => {
          e.preventDefault()
          handleStep2Submit(new FormData(e.currentTarget))
        }}>
          <input name="address" required />
          <input name="city" required />
          <button type="button" onClick={() => setStep(1)}>Back</button>
          <button type="submit">Next</button>
        </form>
      )}

      {step === 3 && (
        <form action={handleFinalSubmit}>
          <input name="payment" required />
          <button type="button" onClick={() => setStep(2)}>Back</button>
          <button type="submit" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  )
}
```

### 10. File Uploads

```ts
// ✅ CORRECT - File upload with Server Action
'use server'

import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function uploadFile(formData: FormData) {
  const userId = await getUserId()

  const file = formData.get('file') as File

  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type' }
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large (max 5MB)' }
  }

  // Save file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `${Date.now()}-${file.name}`
  const path = join(process.cwd(), 'uploads', userId, filename)

  await writeFile(path, buffer)

  // Save to database
  await db.insert(files).values({
    userId,
    filename,
    path,
    type: file.type,
    size: file.size,
  })

  revalidatePath('/files')
  return { success: true, filename }
}

// Client Component
'use client'

export function FileUploadForm() {
  const [state, action, isPending] = useActionState(uploadFile, null)

  return (
    <form action={action}>
      <input
        type="file"
        name="file"
        accept="image/*"
        required
        disabled={isPending}
      />

      {state?.error && <div className="error">{state.error}</div>}
      {state?.success && <div className="success">File uploaded!</div>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  )
}
```

## Anti-Patterns

### ❌ Using API Routes for Forms

```ts
// ❌ BAD - Don't create API routes for form submissions
// app/api/posts/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  await createPost(body)
  return NextResponse.json({ success: true })
}

// Client component fetches API route
async function handleSubmit(data: FormData) {
  await fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ✅ GOOD - Use Server Action directly
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  await db.insert(posts).values(...)
  revalidatePath('/posts')
}

// Client component calls Server Action
<form action={createPost}>...</form>
```

### ❌ Throwing Expected Errors

```ts
// ❌ BAD - Throwing validation errors
'use server'

export async function createPost(formData: FormData) {
  if (!formData.get('title')) {
    throw new Error('Title required') // Don't throw!
  }
  ...
}

// ✅ GOOD - Return error objects
'use server'

export async function createPost(formData: FormData) {
  if (!formData.get('title')) {
    return { error: 'Title required' }
  }
  ...
}
```

### ❌ No Auth Checks

```ts
// ❌ BAD - No authentication
'use server'

export async function deletePost(postId: string) {
  await db.delete(posts).where(eq(posts.id, postId))
  // Anyone can delete any post!
}

// ✅ GOOD - Verify auth and ownership
'use server'

export async function deletePost(postId: string) {
  const userId = await getUserId() // Throws if not authenticated

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  })

  if (!post || post.userId !== userId) {
    return { error: 'Not authorized' }
  }

  await db.delete(posts).where(eq(posts.id, postId))
  revalidatePath('/posts')
  return { success: true }
}
```

### ❌ Missing Revalidation

```ts
// ❌ BAD - No cache invalidation
'use server'

export async function updatePost(formData: FormData) {
  await db.update(posts).set(...).where(...)
  // UI still shows old data!
}

// ✅ GOOD - Revalidate after mutation
'use server'

export async function updatePost(formData: FormData) {
  await db.update(posts).set(...).where(...)
  revalidatePath('/posts') // Refresh UI
}
```

## Audit System

### How to Audit

**Invoke audit mode:**
```
Audit form handling in app/posts/CreatePostForm.tsx
```

The skill will check:
1. Server Action implementation
2. Auth checks present
3. Validation with Zod
4. Error handling (return vs throw)
5. Cache revalidation
6. Loading states
7. Accessibility

### Audit Report

```markdown
## Form Audit: app/posts/CreatePostForm.tsx

**Form Score**: 78/100 (Acceptable ⭐⭐⭐)

### ✅ Strengths
- useActionState hook properly used
- Loading states implemented
- Progressive enhancement

### 🚨 Critical Issues

#### 1. Missing Auth Check (actions.ts:15)
**Current**: No getUserId() call
**Fix**: Add auth check at start of Server Action
**Impact**: HIGH - Anyone can create posts

#### 2. No Validation (actions.ts:18)
**Current**: Direct use of formData without validation
**Fix**: Add Zod schema validation
**Impact**: HIGH - Data integrity risk

### ⚠️ High Priority

#### 3. Missing Revalidation (actions.ts:25)
**Current**: No revalidatePath() call
**Fix**: Add revalidatePath('/posts') after mutation
**Impact**: MEDIUM - Stale UI after submission

### Score Breakdown
- Auth & Security: 5/25 🚨
- Validation: 10/25 🚨
- Error Handling: 20/20 ✅
- UX (Loading/Errors): 18/20 ✅
- Accessibility: 15/15 ✅
- Revalidation: 10/15 ⚠️
```

### Scoring Rubric

**Critical (25 points each)**:
- [ ] Auth check with getUserId()
- [ ] Zod validation
- [ ] Error handling (returns, not throws)
- [ ] No sensitive data exposure

**High Priority (15 points each)**:
- [ ] Cache revalidation
- [ ] Loading states (isPending)
- [ ] Field-level errors
- [ ] CSRF protection (built-in)

**Medium Priority (5 points each)**:
- [ ] Accessibility (labels, ARIA)
- [ ] Progressive enhancement
- [ ] Optimistic updates
- [ ] Success feedback

## Best Practices

### 1. Security First

```ts
// Always check auth
const userId = await getUserId()

// Always validate input
const validated = Schema.parse(data)

// Always sanitize output
return { error: sanitize(error.message) }
```

### 2. User Experience

```tsx
// Show loading states
<button disabled={isPending}>
  {isPending ? 'Loading...' : 'Submit'}
</button>

// Show errors inline
{state?.error && <div role="alert">{state.error}</div>}

// Optimistic updates for instant feedback
const [optimistic, addOptimistic] = useOptimistic(...)
```

### 3. Accessibility

```tsx
// Proper labels
<label htmlFor="email">Email</label>
<input id="email" name="email" />

// ARIA for errors
<input aria-invalid={!!error} aria-describedby="error" />
<div id="error" role="alert">{error}</div>

// Disabled during submission
<button disabled={isPending}>Submit</button>
```

## Success Criteria

A well-designed form has:

✅ **Auth Checks** - getUserId() at start of Server Action
✅ **Validation** - Zod schemas for all inputs
✅ **Error Handling** - Returns errors, doesn't throw
✅ **Revalidation** - Cache invalidated after mutations
✅ **Loading States** - isPending shown to user
✅ **Field Errors** - Per-field validation feedback
✅ **Accessibility** - Labels, ARIA, keyboard navigation
✅ **Progressive Enhancement** - Works without JavaScript
✅ **Security** - No sensitive data exposure, input sanitization

## Resources

- `/resources/patterns.md` - Common form patterns
- `/resources/validation.md` - Zod schema examples
- `/resources/security.md` - Security best practices
- `/resources/accessibility.md` - A11y guidelines
