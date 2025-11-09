# Stripe Expert Skills - Complete Suite

Comprehensive Stripe integration expertise based on 3,041 documentation files (fetched 2025-11-06).

## 📚 Available Skills

### 1. Main Skill: `stripe-expert`
**Location**: `stripe-expert/skill.md`

Complete Stripe platform expertise covering:
- Payment processing (PaymentIntents, Checkout, Payment Methods)
- Subscriptions & billing
- Webhooks & events
- Stripe Connect (platforms/marketplaces)
- Security & compliance
- Testing & development
- 500+ lines of production-ready examples

**Invoke with**: Questions about any Stripe integration, API usage, or payment flows

### 2. Specialized Skill: `billing-subscriptions`
**Location**: `billing-subscriptions/skill.md`

Deep expertise in recurring revenue:
- All subscription models (fixed, tiered, usage-based, hybrid)
- Subscription lifecycle management
- Usage-based/metered billing
- Invoice generation & management
- Proration handling
- Dunning & failed payment recovery
- Customer portal integration
- Revenue recognition (ASC 606/IFRS 15)

**Invoke with**: Subscription questions, billing logic, revenue management

## 📁 Organized Guide Structure

### Location: `stripe-expert/guides/`

#### Quick Start
1. **INDEX.md** - Complete guide navigation and best practices
2. **quick-reference/** - Instant lookups
   - `error-codes.md` - Error code reference table
   - `test-data.md` - All test card numbers
   - `webhook-events.md` - Event type quick reference

#### Code Patterns
3. **patterns/** - Production-ready code
   - `typescript-setup.md` - TypeScript configuration
   - `nextjs-integration.md` - Next.js patterns (App Router & Pages)

#### Topic Guides (Ready to populate)
4. **payments/** - Payment processing guides
5. **billing/** - Subscription & billing guides  
6. **connect/** - Platform integration guides
7. **webhooks/** - Event handling guides
8. **api/** - API integration guides
9. **security/** - Security & compliance guides
10. **testing/** - Development & testing guides
11. **troubleshooting/** - Common issues & solutions

## 🎯 Documentation Coverage

### Complete Stripe Documentation (3,041 files)
**Source**: `./docs/stripe/`

**Major Categories**:
- **Payments** (436 files) - Payment processing, checkout, payment methods
- **Billing** (124 files) - Subscriptions, invoicing, revenue
- **Connect** (206 files) - Platforms, marketplaces, connected accounts
- **Tax** (198 files) - Tax calculation and compliance
- **Terminal** (78 files) - In-person payments
- **Issuing** (71 files) - Card issuing
- **Revenue Recognition** (50 files) - Financial reporting
- **Radar** (19 files) - Fraud prevention
- **API Reference** (874 files) - Complete API documentation
- **JavaScript SDK** (226 files) - Client-side integration
- And 90+ more categories...

## 🚀 Usage Examples

### Using the Main Expert Skill

```typescript
// LLM can reference stripe-expert skill for:
- "How do I implement 3D Secure authentication?"
- "What's the best way to handle failed subscription payments?"
- "Show me how to create a marketplace with Stripe Connect"
- "How do I verify webhook signatures?"
```

### Using Specialized Skills

```typescript
// For billing-specific questions, use billing-subscriptions skill:
- "How do I implement usage-based pricing?"
- "What's the correct way to prorate subscription changes?"
- "How do I handle trial-to-paid conversions?"
- "Show me dunning best practices"
```

### Using Quick References

```typescript
// LLM can quickly lookup:
- Error codes: guides/quick-reference/error-codes.md
- Test cards: guides/quick-reference/test-data.md  
- Webhook events: guides/quick-reference/webhook-events.md
```

### Using Code Patterns

```typescript
// LLM can reference production patterns:
- TypeScript setup: guides/patterns/typescript-setup.md
- Next.js integration: guides/patterns/nextjs-integration.md
```

## 🔧 Skill Features

### 1. Complete API Coverage
- All Stripe products and features
- Latest API version (2023-10+)
- Production-ready code examples
- Type-safe TypeScript patterns

### 2. Best Practices
- Security (PCI compliance, webhook verification)
- Error handling (comprehensive error scenarios)
- Testing (test cards, Stripe CLI, scenarios)
- Performance (idempotency, rate limiting)

### 3. Real-World Patterns
- Next.js (App Router & Pages Router)
- TypeScript configuration
- Webhook handlers
- Error recovery
- Multi-tenancy patterns

### 4. Quick Access
- Organized by topic
- Searchable documentation
- Direct file references
- Code snippets ready to use

## 📖 How LLMs Access Documentation

### Method 1: Skill Invocation
```
User: "How do I set up Stripe subscriptions?"
LLM: [Invokes stripe-expert or billing-subscriptions skill]
      [Reads relevant docs from /docs/stripe/billing/]
      [Provides comprehensive answer with code]
```

### Method 2: Guide Reference
```
LLM: [Reads guides/billing/subscriptions.md]
     [References guides/quick-reference/webhook-events.md]
     [Provides structured answer]
```

### Method 3: Source Documentation
```
LLM: [Searches /docs/stripe/ for specific topics]
     [Reads multiple related files]
     [Synthesizes comprehensive answer]
```

## 🎨 Skill Architecture

```
stripe/
├── stripe-expert/           # Main comprehensive skill
│   ├── skill.md            # 500+ lines, all topics
│   └── guides/             # Organized reference guides
│       ├── INDEX.md        # Navigation & best practices
│       ├── quick-reference/ # Cheat sheets
│       ├── patterns/        # Code patterns
│       ├── payments/        # Payment guides
│       ├── billing/         # Billing guides
│       ├── connect/         # Connect guides
│       ├── webhooks/        # Webhook guides
│       ├── api/             # API guides
│       ├── security/        # Security guides
│       ├── testing/         # Testing guides
│       └── troubleshooting/ # Issue resolution
│
├── billing-subscriptions/   # Specialized billing skill
│   └── skill.md            # Deep billing expertise
│
└── README.md               # This file
```

## 📊 Statistics

- **Total Skills**: 2 (main + 1 specialized)
- **Guide Categories**: 11
- **Quick References**: 3
- **Code Patterns**: 2
- **Source Documentation**: 3,041 files
- **Documentation Size**: Complete Stripe API coverage
- **Last Updated**: 2025-11-06

## 🔮 Future Enhancements

Additional specialized skills ready to create:
- `connect-platforms` - Deep Connect expertise
- `webhooks-events` - Advanced event handling
- `checkout-payments` - Checkout specialization
- `tax-compliance` - Tax calculation & reporting
- `fraud-prevention` - Radar integration

## 💡 Pro Tips

1. **Start with INDEX.md** - Understand guide structure
2. **Use quick-reference/** - Fast lookups during coding
3. **Reference patterns/** - Production-ready code
4. **Search source docs** - Deep dives when needed
5. **Test extensively** - Use test-data.md cards

## 🔗 References

- **Skills Location**: `.claude/skills/stripe/`
- **Guides Location**: `.claude/skills/stripe/stripe-expert/guides/`
- **Source Docs**: `./docs/stripe/`
- **Official Docs**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api

---

**Ready to use!** Invoke `stripe-expert` or `billing-subscriptions` skills for any Stripe integration questions.
