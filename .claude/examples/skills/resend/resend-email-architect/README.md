# Resend Email Architect Skill

Specialized Claude Code skill for designing, implementing, and auditing email functionality using Resend API.

## Purpose

This skill helps you:
- Set up Resend integration in Next.js projects
- Create type-safe React Email templates
- Implement transactional emails (auth, notifications, receipts)
- Handle marketing emails with audiences and broadcasts
- Configure domain verification (SPF, DKIM, DMARC)
- Process email webhooks (bounces, opens, clicks)
- Debug deliverability issues
- Audit email infrastructure

## When to Invoke

Use this skill when you need to:
- Add email functionality to the application
- Create new email templates
- Set up Resend API integration
- Handle email webhooks
- Fix deliverability problems
- Implement password resets, welcome emails, notifications
- Audit existing email code

## Invocation Examples

```
Add a password reset email
```

```
Create a React Email template for transaction alerts
```

```
Set up Resend webhook handling for bounces
```

```
Audit the email infrastructure
```

```
Fix email deliverability issues
```

## What This Skill Provides

### Core Patterns (12 Total)
1. **Resend SDK Setup** - Centralized client initialization with error handling
2. **React Email Templates** - Type-safe components using design system
3. **Transactional Emails** - Service layer for auth, notifications, receipts
4. **Next.js Integration** - API routes with auth, validation, rate limiting
5. **Webhook Handling** - Event processing with signature verification (12 event types)
6. **Domain Configuration** - SPF/DKIM/DMARC setup checklist
7. **Batch Sending** - Concurrent processing with rate limiting
8. **Audience Management** - Contact lists, CSV imports, preferences
9. **Template Management** - Versioned templates with variables from dashboard
10. **SMTP Configuration** - Alternative setup for legacy systems (ports 465, 587)
11. **Inbound Email Handling** - Receive emails, process attachments, auto-replies
12. **DMARC Monitoring** - RUA/RUF report parsing, deliverability health checks

### Best Practices
- Use React Email components (not inline HTML)
- Centralize email services in `lib/email/services/`
- Use design system colors (`hexColors` from `@/lib/design`)
- Add tags to all emails (category, type, userId)
- Handle bounces/complaints in webhooks
- Rate limit email endpoints (10-50/min)
- Log all email operations with structured logging
- Never throw on email failures (except critical like password resets)

### Anti-Patterns to Avoid
- ❌ Hardcoded email addresses or API keys
- ❌ Inline HTML templates without React Email
- ❌ Missing error handling
- ❌ No rate limiting on email endpoints
- ❌ Ignoring webhook events
- ❌ Using shared/free domains (gmail.com)
- ❌ Sending high volumes without domain warmup

## Project Context

This skill is built specifically for the **Clarity** project and follows:
- Next.js 16 App Router patterns
- Clarity API infrastructure (`@/lib/api`)
- Clarity design system (`@/lib/design`)
- Clarity DAL patterns (`@/lib/data/dal`)
- Drizzle ORM for database operations
- Supabase for authentication

## Resources Referenced

Full Resend documentation available at:
```
./docs/resend/
├── docs/introduction.txt
├── integrations/nextjs.txt
├── features/email-api.txt
├── dashboard/domains.txt
├── dashboard/webhooks.txt
└── blog/sender-reputation.txt
```

## Environment Variables Required

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_ADDRESS="Clarity <noreply@clarity.finance>"
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Optional
RESEND_AUDIENCE_ID=aud_xxxxxxxxxxxxx       # Optional
```

## Typical File Structure

```
lib/email/
├── resend.ts                    # Client initialization
├── services/
│   ├── transactional.ts        # Welcome, reset, notifications
│   ├── batch.ts                # Batch sending
│   └── audiences.ts            # Contact management
├── templates/
│   ├── WelcomeEmail.tsx
│   ├── PasswordResetEmail.tsx
│   └── TransactionAlertEmail.tsx
└── types.ts

app/api/
├── v1/email/send-welcome/route.ts
└── webhooks/resend/route.ts
```

## Dependencies

- `resend` - Resend Node.js SDK
- `@react-email/components` - Email template components
- `p-limit` - Concurrency control for batch sending
- `zod` - Input validation
- Clarity infrastructure (`@/lib/api`, `@/lib/design`, `@/lib/utils`)

## Related Skills

- `next-api-architect` - API route patterns (used for email endpoints)
- `react-server-components` - Server component patterns
- `clarity-dal-architect` - Data access layer (for user lookups)

## Version

1.0.0 - Initial release (2025-11-06)
