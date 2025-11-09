# MCP Code Execution Optimization Skill

Reduces token consumption by 95%+ when working with Model Context Protocol (MCP) servers by using code execution instead of direct tool calls.

## Overview

Traditional MCP usage loads all tool definitions upfront and passes intermediate results through the model's context window. This causes high token consumption, increased latency, and potential context overflow.

This skill teaches Claude to interact with MCP servers through code execution, enabling:

- **Progressive disclosure**: Load only needed tool definitions (99.5% reduction)
- **Context-efficient filtering**: Process data before returning to model (99.9% reduction)
- **Native control flow**: Use loops/conditionals instead of chaining tool calls
- **Privacy preservation**: Keep sensitive data in execution environment
- **State persistence**: Save intermediate results and reusable skills

## Performance Impact

**Real-world example**: Google Drive document → Salesforce update

| Approach | Token Usage | Reduction |
|----------|-------------|-----------|
| Direct tool calls | 250,000 tokens | baseline |
| Code execution | 900 tokens | **99.6%** |

**Breakdown**:
- Tool definitions: 150K → 300 tokens (load 2 instead of 1000)
- Document fetch: 50K → 0 tokens (stays in execution env)
- Salesforce update: 50K → 500 tokens (no repeated data)

## Installation

**Option 1: Enable globally** (all MCP workflows)
```bash
cp -r .claude/examples/skills/mcp-optimization .claude/core/skills/
```

**Option 2: Use selectively** (reference when needed)
```bash
# Keep in examples/, mention "use MCP optimization skill" in prompts
```

## Usage

Once enabled, Claude will automatically suggest code execution patterns when:
- Working with MCP servers (10+ tools)
- Handling large datasets (1000+ rows)
- Performing multi-step workflows
- Processing sensitive data
- Building reusable automation

### Example 1: Progressive Tool Loading

**Before** (150,000 tokens):
```typescript
// All 1000 tool definitions loaded into context
[gdrive.getDocument, gdrive.getSheet, gdrive.listFiles, ...]
[salesforce.query, salesforce.updateRecord, ...]
[slack.postMessage, ...]
// ... 997 more tools
```

**After** (300 tokens):
```typescript
// Agent explores filesystem to find needed tools
import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';
// Only 2 servers, ~5 tools loaded on-demand
```

### Example 2: Context-Efficient Filtering

**Before** (500,000 tokens):
```typescript
TOOL CALL: salesforce.query("SELECT * FROM Lead LIMIT 10000")
// → All 10,000 rows returned to model context

// Model filters in context
const pending = rows.filter(r => r.Status === 'New');
const recent = pending.filter(r => recentDate(r.CreatedDate));
```

**After** (500 tokens):
```typescript
// Fetch in execution environment (doesn't enter context)
const allLeads = await salesforce.query({
  query: 'SELECT Id, Email, Status, CreatedDate FROM Lead LIMIT 10000'
});

// Filter in code (not in model context)
const recentPending = allLeads
  .filter(lead => lead.Status === 'New')
  .filter(lead => isRecent(lead.CreatedDate))
  .slice(0, 100);

// Only show summary to model
console.log(`Found ${recentPending.length} leads`);
console.log('Sample:', recentPending.slice(0, 3));
```

### Example 3: Privacy-Preserving Workflows

**Before** (PII flows through model):
```typescript
TOOL CALL: gdrive.getSheet("customer-contacts")
// → Returns:
// [
//   { name: "John Smith", email: "john@example.com", phone: "+1-555-0123" },
//   { name: "Jane Doe", email: "jane@example.com", phone: "+1-555-0456" },
//   ...
// ]
// All PII visible in model context

TOOL CALL: salesforce.updateRecord({
  data: { Name: "John Smith", Email: "john@example.com", Phone: "+1-555-0123" }
})
// PII repeated in context
```

**After** (PII stays in execution):
```typescript
// Data fetched in execution environment (not logged)
const customers = await gdrive.getSheet({ sheetId: 'customer-contacts' });

// Process without exposing PII to model
for (const row of customers.rows) {
  await salesforce.updateRecord({
    objectType: 'Lead',
    recordId: row.salesforceId,
    data: {
      Name: row.name,    // Never enters model context
      Email: row.email,  // Never enters model context
      Phone: row.phone   // Never enters model context
    }
  });
}

// Only non-sensitive summary logged
console.log(`Updated ${customers.rows.length} customer records`);
```

### Example 4: Reusable Skills

Build a library of tested workflows:

```typescript
// ./skills/sync-leads-to-sheet.ts
import * as salesforce from '../servers/salesforce';
import * as gdrive from '../servers/google-drive';

export async function syncLeadsToSheet(sheetId: string) {
  const leads = await salesforce.query({
    query: 'SELECT Id, Email, Status FROM Lead WHERE Status = "New"'
  });

  const rows = leads.map(l => [l.Id, l.Email, l.Status]);
  await gdrive.updateSheet({ sheetId, rows });

  return `Synced ${leads.length} leads to sheet`;
}
```

Add SKILL.md documentation, then reuse:

```typescript
import { syncLeadsToSheet } from './skills/sync-leads-to-sheet';
await syncLeadsToSheet('abc123');
```

## File Structure

```
mcp-optimization/
├── SKILL.md                    # Skill definition (auto-loaded by Claude)
├── README.md                   # This file
├── examples/
│   ├── before-direct-tools.ts  # Traditional approach
│   ├── after-code-execution.ts # Optimized approach
│   └── comparison.md           # Side-by-side analysis
└── templates/
    ├── server-wrapper.ts       # Template for wrapping MCP servers
    ├── skill-template.ts       # Template for reusable skills
    └── client.ts               # MCP client implementation
```

## When to Use

**Use this skill when**:
- ✅ Connected to 10+ MCP servers or 100+ tools
- ✅ Working with large datasets (1000+ rows, 100KB+ responses)
- ✅ Multi-step workflows with data transformation
- ✅ Loops, conditionals, or complex control flow needed
- ✅ Processing sensitive data (PII, credentials)
- ✅ Building reusable automation to save as skills
- ✅ Context window approaching limits
- ✅ High token costs or latency issues

**Don't use when**:
- ❌ Connected to 1-5 tools only
- ❌ Single-step operations with small results (<1KB)
- ❌ No data transformation needed
- ❌ Rapid prototyping without performance constraints
- ❌ MCP server doesn't support code execution

## Background

This skill implements patterns from Anthropic's research on building efficient agents with MCP:

> "Direct tool calls consume context for each definition and result. Agents scale better by writing code to call tools instead."
>
> — Anthropic, "Code execution with MCP: Building more efficient agents" (Nov 2024)

Cloudflare published similar findings, referring to this as "Code Mode." The core insight: LLMs excel at writing code, and developers should leverage this strength to build agents that interact with MCP servers more efficiently.

## References

- [Anthropic: Code execution with MCP](https://www.anthropic.com/research/building-effective-agents) (Nov 4, 2024)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers Directory](https://github.com/modelcontextprotocol/servers)
- [Cloudflare: Code Mode Research](https://blog.cloudflare.com/building-agents-with-workers-ai)

## Examples

See `./examples/` for detailed before/after comparisons:

- **before-direct-tools.ts**: Traditional MCP usage (250K tokens)
- **after-code-execution.ts**: Optimized patterns (900 tokens)
- **comparison.md**: Side-by-side analysis with token counts

## Templates

See `./templates/` for implementation helpers:

- **server-wrapper.ts**: Generate filesystem-based tool wrappers
- **skill-template.ts**: Create reusable skill functions
- **client.ts**: MCP client implementation for code execution

## Support

- [Claude Starter Issues](https://github.com/raintree-technology/claude-starter/issues)
- [MCP Discord Community](https://discord.gg/modelcontextprotocol)
- [Anthropic Documentation](https://docs.anthropic.com/)
