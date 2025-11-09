---
name: stripe-billing-subscriptions
description: Use when implementing subscriptions, recurring billing, pricing models, or customer portals. Invoke for subscription creation, usage-based billing, invoice management, trial periods, subscription updates, or self-service billing portals.
allowed-tools: Read, Grep, Glob
---

# Stripe Billing & Subscriptions Expert

## Purpose

Expert knowledge of Stripe's subscription and billing infrastructure. Covers subscription creation, pricing models, usage-based billing, invoices, trials, upgrades/downgrades, and customer portal.

## When to Use

Invoke this skill when:
- Implementing subscription billing
- Creating pricing plans
- Setting up usage-based billing
- Managing invoices
- Implementing trial periods
- Handling subscription updates
- Building customer portals
- Processing proration
- Managing subscription lifecycle
- Debugging billing issues

## Documentation Available

**Location**: `./docs/stripe/`

**Coverage** (~124 files in billing/):
- **Subscriptions**:
  - Creating and managing subscriptions
  - Subscription lifecycle
  - Multiple subscriptions per customer
  - Subscription schedules

- **Pricing**:
  - Products and prices
  - Flat rate pricing
  - Tiered pricing
  - Usage-based pricing
  - Metered billing

- **Invoices**:
  - Invoice generation
  - Invoice finalization
  - Payment collection
  - Invoice customization

- **Customer Portal**:
  - Self-service billing
  - Subscription management
  - Payment method updates
  - Invoice history

## Related Skills

- **stripe-payments**: For one-time payments
- **stripe-api-integration**: For webhooks and API patterns
- **stripe-connect**: For marketplace subscriptions

## Best Practices

- **Use Products and Prices** - Not deprecated Plans
- **Handle webhook events** - subscription.updated, invoice.paid
- **Implement proration** - For mid-cycle changes
- **Set up customer portal** - Self-service management
- **Handle failed payments** - Smart retries and dunning
- **Use metadata** - Track custom attributes
- **Implement trial periods** - Convert more customers
- **Monitor MRR metrics** - Track recurring revenue
- **Test subscription flows** - Use test clocks

## Examples

### Example 1: Create Subscription with Pricing

**Question**: "How do I set up a subscription?"

**Response**:
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 1. Create Product and Price (one-time setup)
async function createProductAndPrice() {
  const product = await stripe.products.create({
    name: 'Pro Plan',
    description: 'Professional subscription plan',
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2999, // $29.99
    currency: 'usd',
    recurring: {
      interval: 'month', // or 'day', 'week', 'year'
      interval_count: 1,
    },
  });

  return { product, price };
}

// 2. Create Customer (if not exists)
async function createCustomer(email: string) {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId: 'user_123',
    },
  });

  return customer;
}

// 3. Create Subscription
export async function createSubscription(req, res) {
  try {
    const { customerId, priceId, paymentMethodId } = req.body;

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice)
        .payment_intent?.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Frontend: Confirm subscription payment
function SubscriptionCheckout({ priceId }: { priceId: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    // Create subscription
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_xxx',
        priceId,
      }),
    }).then(r => r.json());

    // Confirm payment if needed
    if (response.clientSecret) {
      const { error } = await stripe.confirmCardPayment(response.clientSecret);

      if (error) {
        console.error(error.message);
      } else {
        console.log('Subscription activated!');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

**References**:
- See: `docs/stripe/billing/subscriptions/`

### Example 2: Usage-Based Billing

**Question**: "How do I implement usage-based billing?"

**Response**:
```typescript
// 1. Create metered price
async function createMeteredPrice() {
  const product = await stripe.products.create({
    name: 'API Calls',
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered', // Metered billing
    },
    billing_scheme: 'per_unit',
    unit_amount: 10, // $0.10 per API call
  });

  return price;
}

// 2. Create subscription with metered price
async function createMeteredSubscription(customerId: string, priceId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
  });

  return subscription;
}

// 3. Report usage
export async function reportUsage(req, res) {
  try {
    const { subscriptionItemId, quantity, timestamp } = req.body;

    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity, // Number of units used
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment', // or 'set'
      },
      {
        idempotencyKey: `usage_${timestamp}_${subscriptionItemId}`,
      }
    );

    res.json({ usageRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 4. Get usage summary
export async function getUsageSummary(req, res) {
  try {
    const { subscriptionItemId } = req.query;

    const usageRecordSummaries = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId as string
    );

    res.json({ summaries: usageRecordSummaries.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Example: Report API usage
async function trackApiCall(userId: string) {
  // Get user's subscription
  const subscription = await db.subscriptions.findUnique({
    where: { userId },
  });

  if (subscription) {
    // Report usage to Stripe
    await fetch('/api/report-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionItemId: subscription.itemId,
        quantity: 1, // 1 API call
      }),
    });
  }
}

// Tiered pricing
async function createTieredPrice() {
  const price = await stripe.prices.create({
    product: 'prod_xxx',
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
    },
    billing_scheme: 'tiered',
    tiers_mode: 'graduated', // or 'volume'
    tiers: [
      {
        up_to: 100,
        unit_amount: 10, // $0.10 per unit for first 100
      },
      {
        up_to: 1000,
        unit_amount: 8, // $0.08 per unit for 101-1000
      },
      {
        up_to: 'inf',
        unit_amount: 5, // $0.05 per unit for 1001+
      },
    ],
  });

  return price;
}
```

**References**:
- See: `docs/stripe/billing/subscriptions/usage-based/`

### Example 3: Subscription Updates & Proration

**Question**: "How do I upgrade/downgrade subscriptions?"

**Response**:
```typescript
// Upgrade subscription
export async function upgradeSubscription(req, res) {
  try {
    const { subscriptionId, newPriceId } = req.body;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations', // Charge/credit difference
        // proration_behavior: 'none', // No proration
        // proration_behavior: 'always_invoice', // Invoice immediately
      }
    );

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Downgrade at period end
export async function downgradeSubscription(req, res) {
  try {
    const { subscriptionId, newPriceId } = req.body;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Schedule downgrade for end of period
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'none',
        billing_cycle_anchor: 'unchanged', // Keep current billing date
      }
    );

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Cancel subscription
export async function cancelSubscription(req, res) {
  try {
    const { subscriptionId, immediately } = req.body;

    if (immediately) {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      res.json({ subscription });
    } else {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      res.json({ subscription });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Resume canceled subscription
export async function resumeSubscription(req, res) {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Add item to subscription
export async function addSubscriptionItem(req, res) {
  try {
    const { subscriptionId, priceId } = req.body;

    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
      proration_behavior: 'create_prorations',
    });

    res.json({ subscriptionItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Proration Options**:
- `create_prorations`: Calculate and charge/credit difference
- `none`: No proration
- `always_invoice`: Invoice immediately

**References**:
- See: `docs/stripe/billing/subscriptions/upgrade-downgrade/`

### Example 4: Trial Periods

**Question**: "How do I implement free trials?"

**Response**:
```typescript
// Create subscription with trial
export async function createTrialSubscription(req, res) {
  try {
    const { customerId, priceId, trialDays = 14 } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
    });

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create subscription with specific trial end
export async function createTrialWithEndDate(req, res) {
  try {
    const { customerId, priceId, trialEndDate } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_end: Math.floor(new Date(trialEndDate).getTime() / 1000), // Unix timestamp
    });

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Extend trial
export async function extendTrial(req, res) {
  try {
    const { subscriptionId, newTrialEnd } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      trial_end: Math.floor(new Date(newTrialEnd).getTime() / 1000),
    });

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// End trial early
export async function endTrial(req, res) {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      trial_end: 'now',
    });

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Check if trial
function isTrialActive(subscription: Stripe.Subscription): boolean {
  return subscription.status === 'trialing';
}

// Days remaining in trial
function trialDaysRemaining(subscription: Stripe.Subscription): number {
  if (!subscription.trial_end) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = subscription.trial_end - now;

  return Math.ceil(remaining / 86400); // Convert to days
}
```

**References**:
- See: `docs/stripe/billing/subscriptions/trials/`

### Example 5: Customer Portal

**Question**: "How do I implement a customer portal?"

**Response**:
```typescript
// Backend: Create portal session
export async function createPortalSession(req, res) {
  try {
    const { customerId } = req.body;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/account`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Configure portal (one-time setup in Dashboard or API)
async function configurePortal() {
  const configuration = await stripe.billingPortal.configurations.create({
    features: {
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end', // or 'immediately'
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive',
            'missing_features',
            'switched_service',
            'unused',
            'other',
          ],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price', 'quantity', 'promotion_code'],
        proration_behavior: 'create_prorations',
        products: [
          {
            product: 'prod_basic',
            prices: ['price_basic_monthly', 'price_basic_yearly'],
          },
          {
            product: 'prod_pro',
            prices: ['price_pro_monthly', 'price_pro_yearly'],
          },
        ],
      },
      invoice_history: {
        enabled: true,
      },
    },
    business_profile: {
      headline: 'Manage your subscription',
    },
  });

  return configuration;
}

// Frontend: Redirect to portal
function ManageSubscriptionButton({ customerId }: { customerId: string }) {
  const handleClick = async () => {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    }).then(r => r.json());

    // Redirect to portal
    window.location.href = response.url;
  };

  return (
    <button onClick={handleClick}>
      Manage Subscription
    </button>
  );
}
```

**Portal Features**:
- Update payment method
- Cancel subscription
- Upgrade/downgrade plan
- View invoice history
- Download receipts
- Update billing details

**References**:
- See: `docs/stripe/billing/subscriptions/customer-portal/`

## Common Patterns

### Subscription Webhooks
```typescript
switch (event.type) {
  case 'customer.subscription.created':
    // New subscription created
    break;
  case 'customer.subscription.updated':
    // Subscription modified
    break;
  case 'customer.subscription.deleted':
    // Subscription canceled
    break;
  case 'customer.subscription.trial_will_end':
    // Trial ending soon (3 days before)
    break;
  case 'invoice.paid':
    // Invoice payment succeeded
    break;
  case 'invoice.payment_failed':
    // Invoice payment failed
    break;
}
```

### Check Subscription Status
```typescript
function hasActiveSubscription(subscription: Stripe.Subscription): boolean {
  return ['active', 'trialing'].includes(subscription.status);
}
```

### Get Upcoming Invoice
```typescript
const invoice = await stripe.invoices.retrieveUpcoming({
  customer: customerId,
});

console.log('Next charge:', invoice.amount_due / 100);
```

## Search Helpers

```bash
# Find subscription docs
grep -r "subscription\|billing\|recurring" ./docs/stripe/billing/

# Find usage docs
grep -r "usage\|metered\|tiered" ./docs/stripe/billing/

# Find invoice docs
grep -r "invoice\|payment\|collection" ./docs/stripe/billing/

# List billing files
ls ./docs/stripe/billing/
```

## Common Errors

- **No payment method attached**: Customer has no default payment method
  - Solution: Attach payment method before creating subscription

- **Subscription already canceled**: Trying to update canceled subscription
  - Solution: Check subscription status first

- **Invalid price**: Price doesn't exist or wrong ID
  - Solution: Verify price ID is correct

- **Proration failed**: Invalid proration configuration
  - Solution: Check proration_behavior settings

## Metrics to Track

1. **MRR** - Monthly Recurring Revenue
2. **Churn Rate** - Subscription cancellations
3. **LTV** - Customer Lifetime Value
4. **Trial Conversion** - Trial to paid conversion rate
5. **ARPU** - Average Revenue Per User

## Notes

- Documentation covers latest Stripe API (2023+)
- Use Products/Prices (not deprecated Plans)
- Customer Portal requires configuration in Dashboard
- Trials don't require payment method by default
- Proration handles mid-cycle changes automatically
- Usage-based billing supports metered and tiered pricing
- File paths reference local documentation cache
- For latest updates, check https://stripe.com/docs/billing
