/**
 * AFTER: Optimized MCP with code execution
 *
 * Token consumption: ~900 tokens
 * - Tool definitions loaded on-demand: 300 tokens (2 servers, ~5 tools)
 * - Document processing: 0 tokens (stays in execution environment)
 * - Result summary: 100 tokens
 *
 * Benefits:
 * - Load only needed tool definitions (99.5% reduction)
 * - Process data in execution environment (99.9% reduction)
 * - Filter before returning to context
 * - Native control flow (loops, conditionals)
 * - Privacy-preserving (PII never enters model)
 */

// ============================================================================
// SCENARIO: Fetch meeting transcript from Google Drive and attach to Salesforce lead
// ============================================================================

// STEP 1: Progressive tool loading (300 tokens)
// ============================================================================
// Agent explores filesystem to discover available servers:

// $ ls ./servers/
// google-drive/  salesforce/  slack/  github/  jira/  ...

// Agent reads only needed tool definitions:

// $ cat ./servers/google-drive/getDocument.ts
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

// $ cat ./servers/salesforce/updateRecord.ts
interface UpdateRecordInput {
  objectType: string;
  recordId: string;
  data: Record<string, any>;
}

export async function updateRecord(
  input: UpdateRecordInput
): Promise<{ success: boolean; id: string }> {
  return callMCPTool('salesforce__update_record', input);
}

// Only 2 tool definitions loaded: ~300 tokens (vs 150,000)
// Reduction: 99.8%


// STEP 2: Execute workflow in code (0 tokens to model)
// ============================================================================
// Agent writes and executes code:

import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';

// Fetch document (stays in execution environment)
const transcript = await gdrive.getDocument({ documentId: 'abc123xyz789' });

// Process in code - NEVER enters model context
// transcript.content contains full 5,000-word meeting notes
// But model doesn't see it - stays in execution environment

// Update Salesforce directly (data flows server → server)
const result = await salesforce.updateRecord({
  objectType: 'SalesMeeting',
  recordId: '00Q5f000001abcXYZ',
  data: {
    MeetingDate: '2024-11-01',
    Notes: transcript.content  // 50,000 tokens but NEVER in model context
  }
});

// Only log summary back to model
console.log('✓ Updated Salesforce meeting notes');
console.log(`Document: ${transcript.title}`);
console.log(`Record ID: ${result.id}`);

// Model sees only summary: ~100 tokens
// Document content (50,000 tokens) never entered context
// Reduction: 99.8%

// ============================================================================
// TOTAL TOKEN CONSUMPTION: ~900 tokens
// ============================================================================
// - Tool definitions (on-demand): 300 tokens
// - Execution: 0 tokens (stays in environment)
// - Summary to model: 100 tokens
// - Thinking/planning: ~500 tokens
//
// SAVINGS: 250,000 → 900 tokens (99.6% reduction)
// ============================================================================


// ============================================================================
// EXAMPLE 2: Processing large dataset with filtering
// ============================================================================

// Scenario: Find pending orders from last 7 days in 10,000-row spreadsheet

import * as gdrive from './servers/google-drive';

// Fetch data (stays in execution environment - not in model context)
const allRows = await gdrive.getSheet({ sheetId: 'sheet123' });

// Filter in code - 10,000 rows NEVER enter model context
const pending = allRows.rows.filter(row => row.Status === 'Pending');

const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const recentPending = pending.filter(row => {
  const orderDate = new Date(row.Date);
  return orderDate > weekAgo;
});

// Only show summary and sample to model
console.log(`Found ${recentPending.length} pending orders from last 7 days`);
console.log('Sample orders:', recentPending.slice(0, 3));

// Token usage:
// - Before: 500,000 tokens (all rows in context)
// - After: 500 tokens (summary only)
// - Reduction: 99.9%


// ============================================================================
// EXAMPLE 3: Polling for deployment notification
// ============================================================================

// Scenario: Wait for "deployment complete" message in Slack

import * as slack from './servers/slack';

// Native loop in code - no model involvement
let found = false;
let attempts = 0;

while (!found && attempts < 20) {
  const messages = await slack.getChannelHistory({ channel: 'C123456' });
  found = messages.some(m => m.text.includes('deployment complete'));

  if (!found) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
}

if (found) {
  console.log('✓ Deployment notification received');
} else {
  console.log('⚠ Timed out waiting for deployment');
}

// Token usage:
// - Before: 100,000 tokens (20 tool calls through model)
// - After: 500 tokens (single code execution)
// - Reduction: 99.5%
//
// Latency:
// - Before: 5+ minutes (model response each iteration)
// - After: 1-2 minutes (native loop, no model calls)


// ============================================================================
// EXAMPLE 4: Privacy-preserving customer data sync
// ============================================================================

// Scenario: Import customer contacts from Google Sheets to Salesforce
// Requirement: PII must never enter model context

import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';

// Fetch customer data (stays in execution environment)
const customerSheet = await gdrive.getSheet({ sheetId: 'customer-contacts' });

// Process PII without logging to model
let updated = 0;
for (const row of customerSheet.rows) {
  // PII never logged or entered into model context
  await salesforce.updateRecord({
    objectType: 'Lead',
    recordId: row.salesforceId,
    data: {
      Name: row.name,        // Never in model context
      Email: row.email,      // Never in model context
      Phone: row.phone,      // Never in model context
      Company: row.company   // Never in model context
    }
  });
  updated++;
}

// Only non-sensitive summary logged
console.log(`Updated ${updated} customer records`);

// Privacy guarantee:
// - Before: All PII visible in model context
// - After: Zero PII in model context
// - Data flows: Sheets → execution env → Salesforce (model never sees it)


// ============================================================================
// EXAMPLE 5: Reusable skill with state persistence
// ============================================================================

// Create reusable skill for future use

import { promises as fs } from 'fs';
import * as gdrive from './servers/google-drive';

/**
 * Exports Google Sheet as CSV and saves to workspace
 * Can be reused across multiple workflows
 */
async function exportSheetAsCsv(sheetId: string): Promise<string> {
  // Fetch data
  const sheet = await gdrive.getSheet({ sheetId });

  // Convert to CSV
  const csv = sheet.rows.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  // Save to workspace
  const filename = `sheet-${sheetId}-${Date.now()}.csv`;
  const path = `./workspace/${filename}`;
  await fs.writeFile(path, csv);

  console.log(`Exported ${sheet.rows.length} rows to ${path}`);
  return path;
}

// Use the skill
const csvPath = await exportSheetAsCsv('abc123');

// Later execution can load saved file
const savedData = await fs.readFile(csvPath, 'utf-8');
console.log(`Loaded ${savedData.split('\n').length} rows from ${csvPath}`);

// Save skill for reuse
await fs.writeFile('./skills/export-sheet.ts', `
import * as gdrive from '../servers/google-drive';
import { promises as fs } from 'fs';

export async function exportSheetAsCsv(sheetId: string): Promise<string> {
  const sheet = await gdrive.getSheet({ sheetId });
  const csv = sheet.rows.map(row =>
    row.map(cell => \`"\${cell}"\`).join(',')
  ).join('\\n');
  const path = \`./workspace/sheet-\${sheetId}.csv\`;
  await fs.writeFile(path, csv);
  return path;
}
`);

console.log('✓ Saved reusable skill to ./skills/export-sheet.ts');

// Future workflows can import and use
// import { exportSheetAsCsv } from './skills/export-sheet';


// ============================================================================
// EXAMPLE 6: Complex multi-step workflow
// ============================================================================

// Scenario: Generate weekly sales report
// 1. Query Salesforce for closed deals
// 2. Fetch customer info from Google Sheets
// 3. Calculate metrics
// 4. Post summary to Slack

import * as salesforce from './servers/salesforce';
import * as gdrive from './servers/google-drive';
import * as slack from './servers/slack';

// Step 1: Get closed deals (data stays in execution)
const deals = await salesforce.query({
  query: `
    SELECT Id, Amount, CloseDate, AccountId
    FROM Opportunity
    WHERE CloseDate >= LAST_N_DAYS:7
    AND StageName = 'Closed Won'
  `
});

// Step 2: Enrich with customer data (no PII in model context)
const customers = await gdrive.getSheet({ sheetId: 'customer-master' });
const enrichedDeals = deals.map(deal => ({
  ...deal,
  customer: customers.rows.find(c => c.sfId === deal.AccountId)
}));

// Step 3: Calculate metrics (in code, not context)
const totalRevenue = enrichedDeals.reduce((sum, d) => sum + d.Amount, 0);
const avgDealSize = totalRevenue / enrichedDeals.length;
const topDeal = enrichedDeals.reduce((max, d) =>
  d.Amount > max.Amount ? d : max
);

// Step 4: Post summary (only aggregates, no PII)
await slack.postMessage({
  channel: 'C123456',
  text: `
📊 Weekly Sales Report

✓ ${enrichedDeals.length} deals closed
💰 $${totalRevenue.toLocaleString()} total revenue
📈 $${avgDealSize.toLocaleString()} average deal size
🏆 Largest deal: $${topDeal.Amount.toLocaleString()}
  `.trim()
});

console.log('✓ Posted weekly sales report to Slack');

// Token efficiency:
// - Deals data: 50,000 tokens (stays in execution)
// - Customer data: 200,000 tokens (stays in execution)
// - Calculations: 0 tokens (in code)
// - Slack message: 200 tokens (only summary)
// Total: ~500 tokens vs ~250,000 with direct tools (99.8% reduction)


// ============================================================================
// SUMMARY: Code Execution Advantages
// ============================================================================
//
// 1. PROGRESSIVE DISCLOSURE
//    Load 5 tools instead of 1000
//    Reduction: 150,000 → 300 tokens (99.8%)
//
// 2. CONTEXT-EFFICIENT PROCESSING
//    Filter 10,000 rows → 15 rows before entering context
//    Reduction: 500,000 → 500 tokens (99.9%)
//
// 3. NATIVE CONTROL FLOW
//    Loops/conditionals in code vs chained tool calls
//    Reduction: 100,000 → 500 tokens (99.5%)
//
// 4. PRIVACY PRESERVATION
//    PII flows through workflow without entering model
//    Exposure: 100% → 0%
//
// 5. STATE PERSISTENCE
//    Save results, build reusable skills
//    Enables workflow continuity and skill evolution
//
// OVERALL IMPACT: 250,000 → 900 tokens (99.6% reduction)
// ============================================================================
