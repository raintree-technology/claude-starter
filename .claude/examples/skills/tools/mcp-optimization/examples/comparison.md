# Before/After Comparison: MCP Optimization

Side-by-side analysis of traditional MCP usage vs. code execution patterns.

## Scenario: Google Drive → Salesforce Workflow

**Task**: Fetch meeting transcript from Google Drive and attach to Salesforce lead record.

### Before: Direct Tool Calls

```typescript
// STEP 1: Load all tool definitions upfront
[
  gdrive.getDocument,
  gdrive.getSheet,
  gdrive.listFiles,
  // ... 47 more Google Drive tools
  salesforce.updateRecord,
  salesforce.query,
  // ... 98 more Salesforce tools
  // ... 850 more tools from other servers
]
// Token cost: 150,000 tokens

// STEP 2: Fetch document
TOOL_CALL: gdrive.getDocument({ documentId: "abc123" })
TOOL_RESULT: {
  content: "[... 5,000 word transcript ...]"
}
// Token cost: 50,000 tokens

// STEP 3: Update Salesforce (repeat entire transcript)
TOOL_CALL: salesforce.updateRecord({
  data: { Notes: "[... 5,000 word transcript ...]" }
})
// Token cost: 50,000 tokens

// TOTAL: 250,000 tokens
```

### After: Code Execution

```typescript
// STEP 1: Load only needed tools
import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';
// Token cost: 300 tokens (2 servers, ~5 tools)

// STEP 2 & 3: Execute in code (data stays in environment)
const doc = await gdrive.getDocument({ documentId: 'abc123' });
await salesforce.updateRecord({
  recordId: '00Q5f000001abcXYZ',
  data: { Notes: doc.content }
});
console.log('✓ Updated meeting notes');
// Token cost: 100 tokens (summary only)

// TOTAL: 900 tokens
```

### Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Token usage** | 250,000 | 900 | **99.6%** ↓ |
| **Tools loaded** | 1,000 | 5 | **99.5%** ↓ |
| **Data in context** | 100,000 chars | 50 chars | **99.95%** ↓ |
| **API calls** | 2 (through model) | 2 (direct) | Same |
| **Latency** | ~30 seconds | ~5 seconds | **83%** ↓ |

---

## Scenario: Large Dataset Filtering

**Task**: Find pending orders from last 7 days in 10,000-row spreadsheet.

### Before: Direct Tool Calls

```typescript
// Load all rows into context
TOOL_CALL: gdrive.getSheet({ sheetId: "sheet123" })
TOOL_RESULT: {
  rows: [
    { OrderId: "ORD-0001", Status: "Completed", ... },
    { OrderId: "ORD-0002", Status: "Pending", ... },
    // ... 9,998 more rows
  ]
}
// Token cost: 500,000 tokens (all rows)

// Filter in context (still using 500K tokens)
const pending = rows.filter(r => r.Status === 'Pending');
const recent = pending.filter(r => isRecent(r.Date));

// TOTAL: 500,000 tokens
```

### After: Code Execution

```typescript
// Fetch in execution environment (not in context)
const allRows = await gdrive.getSheet({ sheetId: 'sheet123' });

// Filter in code (10,000 rows never enter context)
const pending = allRows.rows.filter(r => r.Status === 'Pending');
const recent = pending.filter(r => isRecent(r.Date));

// Only show summary
console.log(`Found ${recent.length} pending orders`);
console.log('Sample:', recent.slice(0, 3));

// TOTAL: 500 tokens (summary only)
```

### Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Token usage** | 500,000 | 500 | **99.9%** ↓ |
| **Rows in context** | 10,000 | 3 (sample) | **99.97%** ↓ |
| **Processing time** | 45 seconds | 3 seconds | **93%** ↓ |
| **Results accuracy** | Same | Same | No change |

---

## Scenario: Polling Loop

**Task**: Wait for "deployment complete" notification in Slack channel.

### Before: Direct Tool Calls

```typescript
// Iteration 1
TOOL_CALL: slack.getChannelHistory({ channel: "C123456" })
TOOL_RESULT: { messages: [/* no deployment msg */] }

TOOL_CALL: sleep({ ms: 5000 })
TOOL_RESULT: { slept: true }

// Iteration 2
TOOL_CALL: slack.getChannelHistory({ channel: "C123456" })
TOOL_RESULT: { messages: [/* still no msg */] }

TOOL_CALL: sleep({ ms: 5000 })
TOOL_RESULT: { slept: true }

// ... repeats 20 times
// Token cost: 20 iterations × 5,000 tokens = 100,000 tokens
// Latency: 20 × (model response + tool call + 5s) = 5+ minutes
```

### After: Code Execution

```typescript
// Native loop (no model involvement)
let found = false;
let attempts = 0;

while (!found && attempts < 20) {
  const messages = await slack.getChannelHistory({
    channel: 'C123456'
  });
  found = messages.some(m => m.text.includes('deployment complete'));

  if (!found) {
    await new Promise(r => setTimeout(r, 5000));
    attempts++;
  }
}

console.log(found ? '✓ Deployment complete' : '⚠ Timeout');

// Token cost: 500 tokens (single execution)
// Latency: 20 × 5s = 100 seconds (no model overhead)
```

### Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Token usage** | 100,000 | 500 | **99.5%** ↓ |
| **Latency** | 5+ minutes | 1-2 minutes | **60-70%** ↓ |
| **Model calls** | 40 (20 iterations) | 1 | **97.5%** ↓ |
| **Complexity** | High (chained) | Low (native loop) | Cleaner code |

---

## Scenario: Privacy-Preserving Data Sync

**Task**: Import customer contacts from Google Sheets to Salesforce.

### Before: Direct Tool Calls

```typescript
// Fetch customer data
TOOL_CALL: gdrive.getSheet({ sheetId: "customers" })
TOOL_RESULT: {
  rows: [
    {
      name: "John Smith",
      email: "john@example.com",
      phone: "+1-555-0123",
      ssn: "123-45-6789"  // ⚠️ PII visible in context
    },
    // ... 999 more customers with PII
  ]
}
// Token cost: 300,000 tokens
// PII exposure: 1,000 customers × 4 PII fields = 4,000 exposures

// Update each record (PII repeated)
for (const customer of customers) {
  TOOL_CALL: salesforce.updateRecord({
    data: {
      Name: "John Smith",      // PII in context again
      Email: "john@...",       // PII in context again
      Phone: "+1-555-0123",    // PII in context again
    }
  })
}
// Additional token cost: 300,000 tokens
// PII exposure: 8,000 total instances

// TOTAL: 600,000 tokens, 8,000 PII exposures
```

### After: Code Execution

```typescript
// Fetch in execution environment (not logged)
const customers = await gdrive.getSheet({ sheetId: 'customers' });

// Process without exposing PII to model
for (const row of customers.rows) {
  await salesforce.updateRecord({
    objectType: 'Lead',
    recordId: row.salesforceId,
    data: {
      Name: row.name,    // Never enters model context
      Email: row.email,  // Never enters model context
      Phone: row.phone,  // Never enters model context
    }
  });
}

// Only non-sensitive summary logged
console.log(`Updated ${customers.rows.length} records`);

// TOTAL: 500 tokens, 0 PII exposures
```

### Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Token usage** | 600,000 | 500 | **99.92%** ↓ |
| **PII exposures** | 8,000 | 0 | **100%** ↓ |
| **Compliance risk** | High | Low | ✓ GDPR/HIPAA safe |
| **Data flow** | Through model | Direct server→server | Secure |

---

## Scenario: Multi-Step Workflow

**Task**: Generate weekly sales report (query Salesforce, enrich with customer data, post to Slack).

### Before: Direct Tool Calls

```typescript
// Step 1: Query deals
TOOL_CALL: salesforce.query({ query: "SELECT ..." })
TOOL_RESULT: { /* 500 deals */ }
// Token cost: 100,000 tokens

// Step 2: Get customer data
TOOL_CALL: gdrive.getSheet({ sheetId: "customers" })
TOOL_RESULT: { /* 1000 customers */ }
// Token cost: 200,000 tokens

// Step 3: Model joins data in context
const enriched = deals.map(d => ({
  ...d,
  customer: customers.find(c => c.id === d.accountId)
}))
// Token cost: 300,000 tokens (enriched data)

// Step 4: Calculate metrics in context
const total = enriched.reduce(...)
const avg = total / enriched.length
// Token cost: 300,000 tokens (still in context)

// Step 5: Post to Slack
TOOL_CALL: slack.postMessage({
  text: "Report: ..."
})

// TOTAL: 900,000 tokens
```

### After: Code Execution

```typescript
// All data stays in execution environment
const deals = await salesforce.query({ query: "SELECT ..." });
const customers = await gdrive.getSheet({ sheetId: 'customers' });

// Join and calculate in code (not in context)
const enriched = deals.map(d => ({
  ...d,
  customer: customers.rows.find(c => c.id === d.accountId)
}));

const total = enriched.reduce((sum, d) => sum + d.Amount, 0);
const avg = total / enriched.length;

// Post only summary
await slack.postMessage({
  channel: 'C123456',
  text: `📊 Report\n${enriched.length} deals\n$${total} revenue`
});

console.log('✓ Posted sales report');

// TOTAL: 800 tokens (only summary)
```

### Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Token usage** | 900,000 | 800 | **99.91%** ↓ |
| **Intermediate data** | All in context | In execution env | Cleaner |
| **Calculations** | In context | In code | Faster |
| **Maintainability** | 5 tool calls | 1 code block | Simpler |

---

## Overall Summary

### Token Savings by Pattern

| Pattern | Typical Before | Typical After | Reduction |
|---------|---------------|---------------|-----------|
| Tool loading | 150,000 | 300 | 99.8% |
| Large datasets | 500,000 | 500 | 99.9% |
| Control flow | 100,000 | 500 | 99.5% |
| Multi-step workflows | 900,000 | 800 | 99.91% |
| **Average** | **412,500** | **525** | **99.87%** |

### Additional Benefits

| Benefit | Before | After |
|---------|--------|-------|
| **Latency** | High (model overhead each call) | Low (native execution) |
| **Privacy** | PII in context | PII isolated |
| **Complexity** | Chained tool calls | Native code patterns |
| **Reusability** | Manual re-implementation | Save as skills |
| **State** | Lost between calls | Persistent across workflow |

### When Code Execution Wins

✅ **Use code execution when:**
- Connected to 10+ MCP servers or 100+ tools
- Working with large datasets (1000+ rows, 100KB+ responses)
- Multi-step workflows with data transformation
- Privacy-sensitive operations (PII, credentials)
- Complex control flow (loops, conditionals, error handling)
- Building reusable automation

❌ **Direct tool calls still work for:**
- 1-5 tools total
- Single-step operations
- Small results (<1KB)
- Rapid prototyping
- Simple queries without transformation

---

## Migration Checklist

Converting from direct tools to code execution:

- [ ] Identify high-token operations (use `/analyze-tokens` or similar)
- [ ] Generate filesystem wrappers for MCP servers (see `templates/`)
- [ ] Refactor tool calls to imports + function calls
- [ ] Move filtering/transformation logic into code
- [ ] Add logging for summaries only (not full data)
- [ ] Test that data never enters model context unnecessarily
- [ ] Save working patterns as reusable skills
- [ ] Document token savings for future reference

**Expected outcome**: 95-99%+ token reduction for most workflows.
