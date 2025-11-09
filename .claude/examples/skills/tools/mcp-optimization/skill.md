---
name: mcp-code-execution
description: PROACTIVELY use when working with MCP servers, handling large datasets, or optimizing token consumption. Generates code-based MCP tool wrappers to reduce token usage by 95%+. Implements progressive disclosure, context-efficient filtering, and state persistence patterns. Auto-invoked for "optimize MCP", "reduce tokens", "MCP performance", "code execution with MCP", "too many tools", "context window full".
globs: ["servers/**/*.ts", "skills/**/*.ts", "workspace/**/*"]
---

# MCP Code Execution Optimization

When working with MCP servers, prefer code execution patterns over direct tool calls to dramatically reduce token consumption and improve performance.

## Core Principles

### 1. Progressive Tool Disclosure
Load tool definitions on-demand instead of upfront:

**Traditional Approach (High Token Cost)**:
- Load all tool definitions into context upfront
- 1000 tools × 150 tokens = 150,000 tokens before processing request

**Optimized Approach (Low Token Cost)**:
- Present tools as filesystem structure
- Agent explores `./servers/` directory
- Load only needed tool definitions
- 5 tools × 150 tokens = 750 tokens (99.5% reduction)

### 2. Context-Efficient Results
Process data in execution environment before returning to model:

**Traditional Approach**:
```typescript
// All 10,000 rows flow through model context
TOOL CALL: gdrive.getSheet(sheetId: "abc123")
→ returns 10,000 rows (500,000 tokens)

// Model filters in context
const pending = rows.filter(r => r.status === 'pending')
```

**Optimized Approach**:
```typescript
// Filter in execution environment
const allRows = await gdrive.getSheet({ sheetId: 'abc123' });
const pending = allRows.filter(row => row.status === 'pending');

// Only return summary to model
console.log(`Found ${pending.length} pending orders`);
console.log(pending.slice(0, 5)); // Show first 5 for review
// Result: 500 tokens instead of 500,000 (99.9% reduction)
```

### 3. Advanced Control Flow
Use native code patterns instead of chaining tool calls:

**Traditional Approach**:
```
TOOL CALL: slack.getMessages()
TOOL CALL: sleep(5000)
TOOL CALL: slack.getMessages()
TOOL CALL: sleep(5000)
[repeat 20 times, waiting for model response each time]
```

**Optimized Approach**:
```typescript
// Single code execution with native loop
let found = false;
while (!found) {
  const messages = await slack.getChannelHistory({ channel: 'C123456' });
  found = messages.some(m => m.text.includes('deployment complete'));
  if (!found) await new Promise(r => setTimeout(r, 5000));
}
console.log('Deployment notification received');
```

## Implementation Patterns

### Pattern 1: Filesystem-Based Tool Discovery

Create a `servers/` directory structure:

```
servers/
├── google-drive/
│   ├── index.ts
│   ├── getDocument.ts
│   ├── getSheet.ts
│   └── listFiles.ts
├── salesforce/
│   ├── index.ts
│   ├── updateRecord.ts
│   ├── query.ts
│   └── createLead.ts
└── slack/
    ├── index.ts
    ├── postMessage.ts
    └── getChannelHistory.ts
```

Each tool file exports a typed function:

```typescript
// ./servers/google-drive/getDocument.ts
import { callMCPTool } from "../../../client.js";

interface GetDocumentInput {
  documentId: string;
  fields?: string;
}

interface GetDocumentResponse {
  content: string;
  title: string;
  metadata: Record<string, any>;
}

/** Retrieves a document from Google Drive */
export async function getDocument(
  input: GetDocumentInput
): Promise<GetDocumentResponse> {
  return callMCPTool<GetDocumentResponse>(
    'google_drive__get_document',
    input
  );
}
```

Agent discovers tools by:
1. List `./servers/` directory to find available servers
2. Read specific tool files to understand interfaces
3. Import and use only needed tools

### Pattern 2: Data Filtering & Transformation

Keep large datasets in execution environment:

```typescript
// Import only what you need
import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';

// Fetch large dataset (stays in execution env)
const allLeads = await salesforce.query({
  query: 'SELECT Id, Email, Status, CreatedDate FROM Lead LIMIT 10000'
});

// Transform in code (not in context)
const recentPending = allLeads
  .filter(lead => lead.Status === 'New')
  .filter(lead => {
    const created = new Date(lead.CreatedDate);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created > weekAgo;
  })
  .slice(0, 100);

// Only log summary and sample
console.log(`Found ${recentPending.length} leads from last 7 days`);
console.log('Sample:', recentPending.slice(0, 3));

// Use filtered data in next operation
for (const lead of recentPending) {
  await salesforce.updateRecord({
    objectType: 'Lead',
    recordId: lead.Id,
    data: { Status: 'Contacted' }
  });
}
```

### Pattern 3: Privacy-Preserving Operations

Sensitive data can flow through workflow without entering model context:

```typescript
// PII stays in execution environment
const customerData = await gdrive.getSheet({ sheetId: 'abc123' });

// Process without logging sensitive fields
for (const row of customerData.rows) {
  await salesforce.updateRecord({
    objectType: 'Lead',
    recordId: row.salesforceId,
    data: {
      Email: row.email,      // Never logged to model
      Phone: row.phone,      // Never logged to model
      Name: row.name         // Never logged to model
    }
  });
}

// Only log non-sensitive summary
console.log(`Updated ${customerData.rows.length} customer records`);
```

### Pattern 4: State Persistence

Save intermediate results and progress:

```typescript
// Save processed data for later use
const leads = await salesforce.query({
  query: 'SELECT Id, Email FROM Lead LIMIT 1000'
});

const csvData = leads.map(l => `${l.Id},${l.Email}`).join('\n');
await fs.writeFile('./workspace/leads.csv', csvData);

console.log('Saved leads to ./workspace/leads.csv');

// Later execution can resume from saved state
const savedLeads = await fs.readFile('./workspace/leads.csv', 'utf-8');
const rows = savedLeads.split('\n').map(line => line.split(','));
console.log(`Loaded ${rows.length} leads from previous run`);
```

### Pattern 5: Reusable Skills

Save working code as skills for future use:

```typescript
// Create reusable skill: ./skills/export-sheet-as-csv.ts
import * as gdrive from '../servers/google-drive';
import { promises as fs } from 'fs';

/**
 * Exports a Google Sheet as CSV file
 * @param sheetId - Google Sheet ID
 * @returns Path to saved CSV file
 */
export async function exportSheetAsCsv(sheetId: string): Promise<string> {
  const data = await gdrive.getSheet({ sheetId });
  const csv = data.rows.map(row => row.join(',')).join('\n');
  const path = `./workspace/sheet-${sheetId}.csv`;
  await fs.writeFile(path, csv);
  return path;
}

// Add SKILL.md documentation
```

Later, in any execution:

```typescript
import { exportSheetAsCsv } from './skills/export-sheet-as-csv';

const csvPath = await exportSheetAsCsv('abc123');
console.log(`Sheet exported to ${csvPath}`);
```

## When to Use This Pattern

**Use code execution with MCP when**:
- Connected to 10+ MCP servers or 100+ tools
- Working with large datasets (1000+ rows, 100KB+ responses)
- Need loops, conditionals, or complex control flow
- Processing sensitive data that shouldn't enter model context
- Building reusable workflows to save as skills

**Use direct tool calls when**:
- Connected to 1-5 tools total
- Single-step operations with small results
- No need for data transformation or filtering
- Rapid prototyping without performance constraints

## Performance Impact

**Example: Google Drive → Salesforce workflow**

Traditional approach:
```
Load 1000 tool definitions: 150,000 tokens
Fetch document (full text): 50,000 tokens
Update Salesforce (repeat text): 50,000 tokens
Total: 250,000 tokens
```

Optimized approach:
```
Load 2 tool definitions: 300 tokens
Fetch + process in code: 0 tokens (stays in execution)
Update Salesforce: 500 tokens
Log summary: 100 tokens
Total: 900 tokens
```

**Result: 99.6% reduction (250K → 900 tokens)**

## References

- [Anthropic: Code execution with MCP](https://www.anthropic.com/research/building-effective-agents) (Nov 2024)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- See `./examples/` for before/after comparisons
- See `./templates/` for implementation templates

## Usage

This skill automatically activates when you:
- Work with MCP servers
- Mention token optimization or performance
- Handle large datasets or many tools
- Need to filter data before processing

Claude will suggest code execution patterns instead of direct tool calls.
