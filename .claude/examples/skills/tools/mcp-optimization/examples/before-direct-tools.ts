/**
 * BEFORE: Traditional MCP direct tool calls
 *
 * Token consumption: ~250,000 tokens
 * - Tool definitions loaded upfront: 150,000 tokens (1000 tools)
 * - Document fetch result: 50,000 tokens
 * - Salesforce update (repeated data): 50,000 tokens
 *
 * Issues:
 * - All tool definitions loaded regardless of usage
 * - Large intermediate results flow through context
 * - Data repeated across multiple tool calls
 * - No filtering before entering model context
 */

// ============================================================================
// SCENARIO: Fetch meeting transcript from Google Drive and attach to Salesforce lead
// ============================================================================

// STEP 1: Tool definitions loaded into context upfront (150,000 tokens)
// ============================================================================
// Even though we only need 2 tools, all 1000+ are loaded:

const allToolDefinitions = [
  {
    name: "gdrive.getDocument",
    description: "Retrieves a document from Google Drive",
    parameters: {
      documentId: { type: "string", required: true },
      fields: { type: "string", required: false }
    }
  },
  {
    name: "gdrive.getSheet",
    description: "Retrieves a spreadsheet from Google Drive",
    parameters: { /* ... */ }
  },
  {
    name: "gdrive.listFiles",
    description: "Lists files in Google Drive",
    parameters: { /* ... */ }
  },
  // ... 47 more Google Drive tools

  {
    name: "salesforce.updateRecord",
    description: "Updates a record in Salesforce",
    parameters: {
      objectType: { type: "string", required: true },
      recordId: { type: "string", required: true },
      data: { type: "object", required: true }
    }
  },
  {
    name: "salesforce.query",
    description: "Queries Salesforce records",
    parameters: { /* ... */ }
  },
  // ... 98 more Salesforce tools

  // ... 850 more tools from other servers (Slack, GitHub, Jira, etc.)
];

// All definitions consume context before request is even processed
// Total: ~150,000 tokens

// STEP 2: Fetch document (50,000 tokens)
// ============================================================================
// Model makes tool call:

TOOL_CALL: gdrive.getDocument({
  documentId: "abc123xyz789"
})

// Result returned to model context:
TOOL_RESULT: {
  title: "Q4 Sales Meeting - ACME Corp",
  content: `
    Meeting Date: 2024-11-01
    Attendees: John Smith (ACME), Sarah Johnson (Our Team)

    Discussion Points:
    1. Q4 revenue projections looking strong
    2. Interested in Enterprise tier upgrade
    3. Current pain points with legacy system:
       - Manual data entry consuming 20 hours/week
       - Integration gaps with Salesforce
       - Reporting delays of 3-5 days

    Action Items:
    - Send proposal for Enterprise tier by Nov 15
    - Schedule technical demo for Nov 20
    - Prepare ROI analysis comparing current vs. proposed

    Next Steps:
    - Follow up call scheduled for Nov 8
    - Decision expected by end of Q4

    Notes:
    [... 3 more pages of detailed meeting notes ...]
    [... full transcript of 2-hour meeting ...]
    [... approximately 5,000 words total ...]
  `,
  metadata: {
    createdTime: "2024-11-01T14:30:00Z",
    modifiedTime: "2024-11-01T16:45:00Z",
    permissions: [/* ... */],
    // ... more metadata
  }
}

// Entire document loaded into context: ~50,000 tokens

// STEP 3: Update Salesforce (50,000 tokens)
// ============================================================================
// Model makes second tool call, must write out entire transcript again:

TOOL_CALL: salesforce.updateRecord({
  objectType: "SalesMeeting",
  recordId: "00Q5f000001abcXYZ",
  data: {
    MeetingDate: "2024-11-01",
    Notes: `
      Meeting Date: 2024-11-01
      Attendees: John Smith (ACME), Sarah Johnson (Our Team)

      Discussion Points:
      1. Q4 revenue projections looking strong
      2. Interested in Enterprise tier upgrade
      3. Current pain points with legacy system:
         - Manual data entry consuming 20 hours/week
         - Integration gaps with Salesforce
         - Reporting delays of 3-5 days

      Action Items:
      - Send proposal for Enterprise tier by Nov 15
      - Schedule technical demo for Nov 20
      - Prepare ROI analysis comparing current vs. proposed

      Next Steps:
      - Follow up call scheduled for Nov 8
      - Decision expected by end of Q4

      Notes:
      [... 3 more pages of detailed meeting notes ...]
      [... full transcript of 2-hour meeting ...]
      [... approximately 5,000 words total ...]
    `
  }
})

// Entire transcript written out again in tool call: ~50,000 tokens

TOOL_RESULT: {
  success: true,
  id: "00Q5f000001abcXYZ",
  // ... confirmation response
}

// ============================================================================
// TOTAL TOKEN CONSUMPTION: ~250,000 tokens
// ============================================================================
// - Tool definitions: 150,000
// - Document fetch result: 50,000
// - Salesforce update (repeated): 50,000
//
// ISSUES:
// - Loaded 1000 tool definitions but only used 2
// - Full document flowed through context twice
// - No opportunity to filter or summarize before entering context
// - Sensitive data (if any) exposed to model
// - High cost and latency
// ============================================================================


// ============================================================================
// EXAMPLE 2: Processing large dataset with filtering
// ============================================================================

// Scenario: Find pending orders from last 7 days in 10,000-row spreadsheet

// STEP 1: Fetch entire sheet (500,000 tokens)
TOOL_CALL: gdrive.getSheet({ sheetId: "sheet123" })

TOOL_RESULT: {
  rows: [
    { OrderId: "ORD-0001", Status: "Completed", Date: "2024-10-15", Amount: 1500 },
    { OrderId: "ORD-0002", Status: "Pending", Date: "2024-10-28", Amount: 2300 },
    { OrderId: "ORD-0003", Status: "Completed", Date: "2024-09-12", Amount: 890 },
    // ... 9,997 more rows
  ]
}
// All 10,000 rows in context: ~500,000 tokens

// STEP 2: Model filters in context (still using 500,000 tokens)
const pending = rows.filter(r => r.Status === 'Pending');
const recent = pending.filter(r => {
  const orderDate = new Date(r.Date);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return orderDate > weekAgo;
});

// Result: 15 matching orders
// But model processed all 10,000 rows to get there


// ============================================================================
// EXAMPLE 3: Polling for deployment notification
// ============================================================================

// Scenario: Wait for "deployment complete" message in Slack

// Model must alternate between tool calls and sleep, waiting for response each time:

TOOL_CALL: slack.getChannelHistory({ channel: "C123456" })
TOOL_RESULT: { messages: [/* no deployment message yet */] }

TOOL_CALL: sleep({ milliseconds: 5000 })
TOOL_RESULT: { slept: true }

TOOL_CALL: slack.getChannelHistory({ channel: "C123456" })
TOOL_RESULT: { messages: [/* still no deployment message */] }

TOOL_CALL: sleep({ milliseconds: 5000 })
TOOL_RESULT: { slept: true }

// ... repeats 20+ times, each requiring model response
// Total latency: 20 iterations × (model response + tool call + 5s sleep) = 5+ minutes
// Total token cost: 20 × 5,000 = 100,000 tokens


// ============================================================================
// See after-code-execution.ts for optimized version using code execution
// Token reduction: 250,000 → 900 tokens (99.6% savings)
// ============================================================================
