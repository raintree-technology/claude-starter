---
name: resend-email-architect
description: Design, implement, and audit email functionality using Resend API with React Email templates. Implements Next.js integration patterns, transactional emails, marketing broadcasts, webhook handling, and domain verification. Use when building email features, debugging deliverability, or auditing email infrastructure.
version: 1.0.0
---

# Resend Email Architect

**Note**: Core patterns for email implementation with Resend API. See `docs/resend/` directory for complete Resend documentation.

Specialized skill for designing, implementing, and auditing email functionality using **Resend**. Focuses on Next.js integration, React Email templates, transactional emails, and deliverability.

## When to Use

Invoke when:
- "Add email functionality" / "Send transactional email"
- "Create email template" / "Set up Resend"
- "Fix email deliverability" / "Handle email webhooks"
- Building password resets, welcome emails, notifications
- Debugging bounces or spam issues

## Core Patterns

### 1. Resend SDK Setup

```ts
// lib/email/resend.ts
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Type-safe send function
export async function sendEmail(options: {
  from: string
  to: string | string[]
  subject: string
  react?: React.ReactElement
  html?: string
  tags?: Array<{ name: string; value: string }>
}) {
  const data = await resend.emails.send(options)
  logger.info({ emailId: data.id }, 'Email sent')
  return data
}
```

### 2. React Email Template (Basic)

```tsx
// emails/welcome.tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  verifyUrl: string
}

export default function WelcomeEmail({ name, verifyUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>Welcome, {name}!</Heading>
          <Text>Thanks for signing up. Verify your email to get started.</Text>
          <Button href={verifyUrl}>Verify Email</Button>
        </Container>
      </Body>
    </Html>
  )
}
```

### 3. Sending Transactional Emails

```ts
// app/actions/auth.ts
'use server'
import { sendEmail } from '@/lib/email/resend'
import WelcomeEmail from '@/emails/welcome'

export async function sendWelcomeEmail(userId: string) {
  const user = await getUser(userId)
  const verifyUrl = `${process.env.APP_URL}/verify?token=${user.verificationToken}`

  await sendEmail({
    from: 'noreply@yourdomain.com',
    to: user.email,
    subject: 'Welcome to App!',
    react: WelcomeEmail({ name: user.name, verifyUrl }),
    tags: [
      { name: 'category', value: 'auth' },
      { name: 'user_id', value: userId }
    ]
  })
}
```

### 4. Next.js API Route Integration

```ts
// app/api/email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import { z } from 'zod'

const schema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string()
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validated = schema.parse(body)

  const data = await sendEmail({
    from: 'noreply@yourdomain.com',
    to: validated.to,
    subject: validated.subject,
    html: validated.body
  })

  return NextResponse.json({ id: data.id })
}
```

### 5. Webhook Handling

```ts
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('resend-signature')

  if (!verifySignature(payload, signature!, process.env.RESEND_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)

  // Handle events
  switch (event.type) {
    case 'email.sent':
      await logEmailSent(event.data)
      break
    case 'email.bounced':
      await handleBounce(event.data)
      break
    case 'email.complained':
      await handleComplaint(event.data)
      break
  }

  return NextResponse.json({ received: true })
}
```

### 6. Domain Configuration

**Quick setup checklist:**

1. **Add domain in Resend dashboard**
2. **Configure DNS records:**
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Add provided TXT record
   - DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
3. **Wait for verification** (usually 24-48 hours)
4. **Test deliverability**


### 7. Batch Sending

```ts
// Send to multiple recipients
async function sendBulkEmails(recipients: string[]) {
  const promises = recipients.map(email =>
    sendEmail({
      from: 'updates@yourdomain.com',
      to: email,
      subject: 'Monthly Update',
      react: MonthlyUpdateEmail()
    })
  )

  const results = await Promise.allSettled(promises)
  const sent = results.filter(r => r.status === 'fulfilled').length
  logger.info({ sent, total: recipients.length }, 'Batch send complete')
}
```

## Common Use Cases

### Password Reset Email

```ts
import PasswordResetEmail from '@/emails/password-reset'

await sendEmail({
  from: 'security@yourdomain.com',
  to: user.email,
  subject: 'Reset your password',
  react: PasswordResetEmail({
    resetUrl: `${APP_URL}/reset?token=${token}`,
    expiresIn: '1 hour'
  }),
  tags: [{ name: 'category', value: 'security' }]
})
```

### Order Confirmation

```ts
import OrderConfirmationEmail from '@/emails/order-confirmation'

await sendEmail({
  from: 'orders@yourdomain.com',
  to: customer.email,
  subject: `Order #${order.id} confirmed`,
  react: OrderConfirmationEmail({ order, customer }),
  tags: [
    { name: 'category', value: 'transactional' },
    { name: 'order_id', value: order.id }
  ]
})
```

### Notification Email

```ts
await sendEmail({
  from: 'notifications@yourdomain.com',
  to: user.email,
  subject: 'You have a new message',
  react: NotificationEmail({ message, sender }),
  tags: [{ name: 'category', value: 'notification' }]
})
```

## Anti-Patterns to Avoid

### ❌ Hardcoded Email Addresses

```ts
// BAD
to: 'user@example.com' // Hardcoded

// GOOD
to: user.email // From database
```

### ❌ Inline HTML Templates

```ts
// BAD
html: '<h1>Welcome</h1><p>Thanks for signing up</p>'

// GOOD
react: WelcomeEmail({ name: user.name })
```

### ❌ Missing Error Handling

```ts
// BAD
await sendEmail(options) // No error handling

// GOOD
try {
  await sendEmail(options)
} catch (error) {
  logger.error({ error }, 'Email send failed')
  // Fallback or retry logic
}
```

### ❌ No Rate Limiting

```ts
// BAD
for (const user of users) {
  await sendEmail({ to: user.email, ... }) // Sequential, no limits
}

// GOOD
// Use batch API or rate-limited queue
await sendBulkEmails(users.map(u => u.email))
```

## Quick Audit Checklist

**Critical (Must Fix):**
- [ ] Resend SDK properly initialized
- [ ] Environment variables configured
- [ ] Email addresses validated
- [ ] Error handling implemented
- [ ] Webhook signature verification
- [ ] SPF/DKIM/DMARC records configured

**High Priority:**
- [ ] React Email templates used (not inline HTML)
- [ ] Rate limiting for bulk sends
- [ ] Email events logged
- [ ] Tags used for categorization
- [ ] Bounce/complaint handling

**Medium Priority:**
- [ ] Template versioning
- [ ] Scheduling for non-urgent emails
- [ ] A/B testing setup
- [ ] Analytics integration


## Environment Variables

```bash
# .env.local
RESEND_API_KEY=re_xxxxx           # From dashboard.resend.com
RESEND_WEBHOOK_SECRET=whsec_xxxxx # Optional, for webhook security
APP_URL=https://yourdomain.com     # For email links
```

## Email Event Types

- `email.sent` - Email successfully sent
- `email.delivered` - Email delivered to recipient
- `email.bounced` - Email bounced (hard/soft)
- `email.complained` - Recipient marked as spam
- `email.opened` - Email opened (tracking enabled)
- `email.clicked` - Link clicked (tracking enabled)

*For webhook implementation details, email templates, and deliverability guides, see `docs/resend/` directory.*
