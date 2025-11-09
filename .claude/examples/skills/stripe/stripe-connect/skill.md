---
name: stripe-connect
description: Use when building marketplace platforms, multi-party payments, or managing connected accounts. Invoke for account onboarding, platform payments, charge flows (direct/destination/separate), transfers, payouts, or commission/fee splits.
allowed-tools: Read, Grep, Glob
---

# Stripe Connect Expert

## Purpose

Expert knowledge of Stripe Connect for marketplace and platform payments. Covers connected account management, onboarding, charge flows, transfers, payouts, and multi-party payment splitting.

## When to Use

Invoke this skill when:
- Building marketplace platforms
- Managing seller/vendor accounts
- Implementing account onboarding
- Processing multi-party payments
- Splitting payments between parties
- Handling platform fees/commissions
- Managing payouts to connected accounts
- Implementing OAuth for Connect
- Handling account verification
- Debugging Connect integration issues

## Documentation Available

**Location**: `./docs/stripe/`

**Coverage** (~206 files in connect/):
- **Connected Accounts**:
  - Account types (Standard, Express, Custom)
  - Account creation and verification
  - Account capabilities
  - Identity verification

- **Onboarding**:
  - Account Links for onboarding
  - OAuth integration
  - Pre-filling account information
  - Custom onboarding flows

- **Charge Flows**:
  - Direct charges
  - Destination charges
  - Separate charges and transfers
  - On-behalf-of charges

- **Transfers & Payouts**:
  - Creating transfers
  - Managing payouts
  - Instant payouts
  - Payout scheduling

## Related Skills

- **stripe-payments**: For payment processing
- **stripe-billing-subscriptions**: For subscription marketplaces
- **stripe-api-integration**: For webhooks and API patterns

## Best Practices

- **Choose correct account type** - Standard for full control, Express for quick setup
- **Handle onboarding properly** - Use Account Links or OAuth
- **Verify accounts** - Complete verification before enabling payouts
- **Use appropriate charge flow** - Match your business model
- **Handle platform fees** - Application fees or separate transfers
- **Test with test accounts** - Use Connect test mode
- **Monitor account status** - Check capabilities and requirements
- **Implement proper error handling** - Account errors, verification issues
- **Secure OAuth tokens** - Store securely, refresh when needed

## Examples

### Example 1: Create Connected Account

**Question**: "How do I create a connected account?"

**Response**:
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Standard Account (seller manages everything via Stripe Dashboard)
export async function createStandardAccount(req, res) {
  try {
    const { email } = req.body;

    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      metadata: {
        userId: req.user.id,
      },
    });

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Express Account (embedded onboarding, platform managed)
export async function createExpressAccount(req, res) {
  try {
    const { email, country } = req.body;

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      country,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual', // or 'company'
      metadata: {
        userId: req.user.id,
      },
    });

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Custom Account (full platform control)
export async function createCustomAccount(req, res) {
  try {
    const { email, country } = req.body;

    const account = await stripe.accounts.create({
      type: 'custom',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        mcc: '5734', // Merchant category code
        url: 'https://seller-website.com',
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: req.ip,
      },
    });

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Retrieve account
export async function getAccount(req, res) {
  try {
    const { accountId } = req.query;

    const account = await stripe.accounts.retrieve(accountId as string);

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update account
export async function updateAccount(req, res) {
  try {
    const { accountId, businessProfile } = req.body;

    const account = await stripe.accounts.update(accountId, {
      business_profile: businessProfile,
    });

    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete account
export async function deleteAccount(req, res) {
  try {
    const { accountId } = req.body;

    const deleted = await stripe.accounts.del(accountId);

    res.json({ deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Account Types**:
- **Standard**: Seller manages via Stripe Dashboard, platform has limited control
- **Express**: Platform manages with embedded onboarding, simpler setup
- **Custom**: Full platform control, custom UI, more complexity

**References**:
- See: `docs/stripe/connect/accounts/`

### Example 2: Account Onboarding

**Question**: "How do I onboard connected accounts?"

**Response**:
```typescript
// Create Account Link for onboarding
export async function createAccountLink(req, res) {
  try {
    const { accountId } = req.body;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.APP_URL}/onboarding/refresh`,
      return_url: `${process.env.APP_URL}/onboarding/complete`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Check if account onboarding is complete
export async function checkOnboardingStatus(req, res) {
  try {
    const { accountId } = req.query;

    const account = await stripe.accounts.retrieve(accountId as string);

    const isComplete = account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    const requirements = account.requirements;

    res.json({
      isComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      currentlyDue: requirements?.currently_due || [],
      eventuallyDue: requirements?.eventually_due || [],
      pastDue: requirements?.past_due || [],
      disabled_reason: requirements?.disabled_reason,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Frontend: Onboarding flow
function OnboardingButton({ accountId }: { accountId: string }) {
  const handleOnboarding = async () => {
    const response = await fetch('/api/create-account-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    }).then(r => r.json());

    // Redirect to Stripe onboarding
    window.location.href = response.url;
  };

  return (
    <button onClick={handleOnboarding}>
      Complete Account Setup
    </button>
  );
}

// OAuth Flow (alternative to Account Links)
export async function initiateOAuth(req, res) {
  const clientId = process.env.STRIPE_CLIENT_ID;
  const state = generateRandomState(); // CSRF protection

  const authUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}`;

  res.redirect(authUrl);
}

export async function handleOAuthCallback(req, res) {
  try {
    const { code, state } = req.query;

    // Verify state for CSRF protection
    if (state !== expectedState) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code as string,
    });

    const { stripe_user_id, access_token } = response;

    // Save account ID and token
    await db.connectedAccounts.create({
      data: {
        accountId: stripe_user_id,
        accessToken: access_token,
        userId: req.user.id,
      },
    });

    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**References**:
- See: `docs/stripe/connect/onboarding/`
- See: `docs/stripe/connect/oauth/`

### Example 3: Payment Flows (Direct, Destination, Separate)

**Question**: "What are the different charge flows?"

**Response**:
```typescript
// 1. DIRECT CHARGES (money goes to connected account)
export async function createDirectCharge(req, res) {
  try {
    const { amount, connectedAccountId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      application_fee_amount: amount * 100 * 0.1, // 10% platform fee
    }, {
      stripeAccount: connectedAccountId, // Charge on behalf of connected account
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 2. DESTINATION CHARGES (money goes to platform, transferred to connected account)
export async function createDestinationCharge(req, res) {
  try {
    const { amount, connectedAccountId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      application_fee_amount: amount * 100 * 0.1, // 10% platform fee
      transfer_data: {
        destination: connectedAccountId, // Transfer to connected account
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 3. SEPARATE CHARGES AND TRANSFERS (most flexible)
export async function createSeparateChargeAndTransfer(req, res) {
  try {
    const { amount, connectedAccountId } = req.body;

    // Charge customer on platform account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });

    // After payment succeeds (in webhook)
    // Transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: amount * 100 * 0.9, // 90% to seller (10% platform fee)
      currency: 'usd',
      destination: connectedAccountId,
      metadata: {
        paymentIntentId: paymentIntent.id,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret, transfer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// On-behalf-of (for dispute liability)
export async function createOnBehalfOfCharge(req, res) {
  try {
    const { amount, connectedAccountId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      on_behalf_of: connectedAccountId, // Disputes go to connected account
      transfer_data: {
        destination: connectedAccountId,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Charge Flow Comparison**:
| Flow | Money to | Platform Fee | Disputes | Use Case |
|------|----------|--------------|----------|----------|
| Direct | Connected | Application fee | Connected | Simple marketplace |
| Destination | Platform → Connected | Application fee | Platform | Platform controls experience |
| Separate | Platform, then Transfer | Keep difference | Platform | Most flexible |

**References**:
- See: `docs/stripe/connect/charges/`

### Example 4: Transfers and Payouts

**Question**: "How do I manage transfers and payouts?"

**Response**:
```typescript
// Create transfer
export async function createTransfer(req, res) {
  try {
    const { amount, connectedAccountId } = req.body;

    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: 'usd',
      destination: connectedAccountId,
      metadata: {
        orderId: 'order_123',
      },
    });

    res.json({ transfer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Transfer with source transaction (split payment)
export async function createTransferFromCharge(req, res) {
  try {
    const { chargeId, amount, connectedAccountId } = req.body;

    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: 'usd',
      destination: connectedAccountId,
      source_transaction: chargeId, // Link to original charge
    });

    res.json({ transfer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Reverse transfer (refund to platform)
export async function reverseTransfer(req, res) {
  try {
    const { transferId, amount } = req.body;

    const reversal = await stripe.transfers.createReversal(transferId, {
      amount: amount * 100,
    });

    res.json({ reversal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get account balance
export async function getAccountBalance(req, res) {
  try {
    const { accountId } = req.query;

    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId as string,
    });

    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// List payouts
export async function listPayouts(req, res) {
  try {
    const { accountId } = req.query;

    const payouts = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: accountId as string }
    );

    res.json({ payouts: payouts.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create instant payout (if enabled)
export async function createInstantPayout(req, res) {
  try {
    const { amount, accountId } = req.body;

    const payout = await stripe.payouts.create(
      {
        amount: amount * 100,
        currency: 'usd',
        method: 'instant', // Instant payout (fees apply)
      },
      { stripeAccount: accountId }
    );

    res.json({ payout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**References**:
- See: `docs/stripe/connect/transfers/`
- See: `docs/stripe/connect/payouts/`

### Example 5: Multi-Party Payment Split

**Question**: "How do I split payments between multiple sellers?"

**Response**:
```typescript
// Split payment to multiple connected accounts
export async function createSplitPayment(req, res) {
  try {
    const { amount, sellers } = req.body;
    // sellers = [{ accountId: 'acct_1', amount: 50 }, { accountId: 'acct_2', amount: 30 }]

    // Create payment intent for total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });

    // After payment succeeds (in webhook), create transfers
    // This happens in the webhook handler
    const transfers = await Promise.all(
      sellers.map(seller =>
        stripe.transfers.create({
          amount: seller.amount * 100,
          currency: 'usd',
          destination: seller.accountId,
          metadata: {
            paymentIntentId: paymentIntent.id,
          },
        })
      )
    );

    res.json({ clientSecret: paymentIntent.client_secret, transfers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Webhook handler for multi-party split
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Get order details
  const order = await db.orders.findUnique({
    where: { paymentIntentId: paymentIntent.id },
    include: { items: { include: { seller: true } } },
  });

  // Group items by seller
  const sellerAmounts = new Map();
  order.items.forEach(item => {
    const current = sellerAmounts.get(item.seller.accountId) || 0;
    sellerAmounts.set(item.seller.accountId, current + item.amount);
  });

  // Create transfers to each seller
  const platformFeeRate = 0.1; // 10%

  for (const [accountId, amount] of sellerAmounts) {
    const sellerAmount = amount * (1 - platformFeeRate);

    await stripe.transfers.create({
      amount: Math.round(sellerAmount * 100),
      currency: 'usd',
      destination: accountId,
      metadata: {
        orderId: order.id,
        paymentIntentId: paymentIntent.id,
      },
    });
  }
}
```

**References**:
- See: `docs/stripe/connect/splitting-payments/`

## Common Patterns

### Check Account Capabilities
```typescript
const account = await stripe.accounts.retrieve(accountId);

const canAcceptPayments = account.capabilities?.card_payments === 'active';
const canReceivePayouts = account.capabilities?.transfers === 'active';
```

### Account Dashboard Link
```typescript
const loginLink = await stripe.accounts.createLoginLink(accountId);
// Redirect seller to loginLink.url to access Stripe Dashboard
```

### Handle Connect Webhooks
```typescript
// Webhook events for connected accounts
switch (event.type) {
  case 'account.updated':
    // Account info changed
    break;
  case 'account.application.authorized':
    // OAuth authorization granted
    break;
  case 'account.application.deauthorized':
    // OAuth revoked
    break;
  case 'capability.updated':
    // Account capability changed
    break;
}
```

## Search Helpers

```bash
# Find Connect docs
grep -r "Connect\|connected account\|marketplace" ./docs/stripe/connect/

# Find charge flow docs
grep -r "direct charge\|destination\|transfer" ./docs/stripe/connect/

# Find onboarding docs
grep -r "onboarding\|Account Link\|OAuth" ./docs/stripe/connect/

# List Connect files
ls ./docs/stripe/connect/
```

## Common Errors

- **Account not verified**: Trying to charge unverified account
  - Solution: Complete onboarding and verification

- **Capability not active**: Requesting feature not enabled
  - Solution: Request capability and wait for activation

- **Invalid account type**: Using features not supported by account type
  - Solution: Use correct account type for your use case

- **Transfer exceeds balance**: Trying to transfer more than available
  - Solution: Check account balance before transfer

## Notes

- Documentation covers latest Stripe API (2023+)
- Express accounts are recommended for most platforms
- Standard accounts have separate Stripe Dashboard access
- Custom accounts require more compliance work
- Platform fees are your revenue
- Instant payouts have additional fees
- File paths reference local documentation cache
- For latest updates, check https://stripe.com/docs/connect
