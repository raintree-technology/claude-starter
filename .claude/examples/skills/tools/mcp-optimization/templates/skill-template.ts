/**
 * Reusable Skill Template
 *
 * Use this template to create reusable skills that persist across workflows.
 * Once you've developed working code, save it as a skill for future use.
 *
 * Benefits:
 * - Avoid re-implementing common patterns
 * - Build library of tested workflows
 * - Share with team or community
 * - Compose complex automation from simple skills
 */

// ============================================================================
// TEMPLATE: Basic Skill Structure
// ============================================================================

/**
 * FILE: ./skills/{{skill-name}}/{{skill-name}}.ts
 */

import * as {{serverName}} from '../servers/{{SERVER_NAME}}';
import { promises as fs } from 'fs';

/**
 * {{Brief description of what this skill does}}
 *
 * @param {{paramName}} - {{Parameter description}}
 * @returns {{Return value description}}
 *
 * @example
 * ```typescript
 * import { {{skillName}} } from './skills/{{skill-name}}';
 * const result = await {{skillName}}({{ ...args }});
 * ```
 */
export async function {{skillName}}(
  {{paramName}}: {{ParamType}}
): Promise<{{ReturnType}}> {
  // Implementation
  // ...

  return result;
}


// ============================================================================
// TEMPLATE: Skill with State Persistence
// ============================================================================

/**
 * FILE: ./skills/export-and-transform/index.ts
 */

import * as gdrive from '../servers/google-drive';
import { promises as fs } from 'fs';

interface TransformOptions {
  filter?: (row: any) => boolean;
  map?: (row: any) => any;
  format?: 'json' | 'csv' | 'tsv';
}

/**
 * Exports Google Sheet, applies transformations, and saves to workspace
 *
 * @param sheetId - Google Sheet ID
 * @param options - Transformation options
 * @returns Path to saved file
 */
export async function exportAndTransform(
  sheetId: string,
  options: TransformOptions = {}
): Promise<string> {
  // Fetch data
  const sheet = await gdrive.getSheet({ sheetId });
  let rows = sheet.rows;

  // Apply filter
  if (options.filter) {
    rows = rows.filter(options.filter);
  }

  // Apply transformation
  if (options.map) {
    rows = rows.map(options.map);
  }

  // Format output
  let content: string;
  let extension: string;

  switch (options.format || 'json') {
    case 'json':
      content = JSON.stringify(rows, null, 2);
      extension = 'json';
      break;
    case 'csv':
      content = rows.map(r => r.join(',')).join('\n');
      extension = 'csv';
      break;
    case 'tsv':
      content = rows.map(r => r.join('\t')).join('\n');
      extension = 'tsv';
      break;
  }

  // Save to workspace
  const filename = `sheet-${sheetId}-${Date.now()}.${extension}`;
  const path = `./workspace/${filename}`;
  await fs.writeFile(path, content);

  console.log(`✓ Exported ${rows.length} rows to ${path}`);
  return path;
}


// ============================================================================
// TEMPLATE: Skill with Error Handling
// ============================================================================

/**
 * FILE: ./skills/resilient-sync/index.ts
 */

import * as salesforce from '../servers/salesforce';
import * as gdrive from '../servers/google-drive';

interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Syncs data from Google Sheets to Salesforce with retry logic
 *
 * @param sheetId - Source Google Sheet ID
 * @param objectType - Salesforce object type
 * @returns Sync results with error details
 */
export async function resilientSync(
  sheetId: string,
  objectType: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Fetch source data
  const sheet = await gdrive.getSheet({ sheetId });

  // Process each row with retry
  for (let i = 0; i < sheet.rows.length; i++) {
    const row = sheet.rows[i];
    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      try {
        await salesforce.createRecord({
          objectType,
          data: rowToSalesforceData(row)
        });
        result.success++;
        success = true;
      } catch (error) {
        attempts++;
        if (attempts >= 3) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            error: error.message
          });
        } else {
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
        }
      }
    }
  }

  console.log(`Sync complete: ${result.success} success, ${result.failed} failed`);
  return result;
}

function rowToSalesforceData(row: any[]): Record<string, any> {
  // Convert row array to Salesforce field mapping
  return {
    Name: row[0],
    Email: row[1],
    Phone: row[2],
    // ... field mapping
  };
}


// ============================================================================
// TEMPLATE: Composable Skills
// ============================================================================

/**
 * FILE: ./skills/weekly-report/index.ts
 *
 * Composes multiple skills into higher-level automation
 */

import { exportAndTransform } from '../export-and-transform';
import { resilientSync } from '../resilient-sync';
import * as salesforce from '../../servers/salesforce';
import * as slack from '../../servers/slack';

interface ReportConfig {
  salesforceQuery: string;
  slackChannel: string;
  sheetId: string;
}

/**
 * Generates weekly report by composing multiple skills
 *
 * 1. Queries Salesforce for deals
 * 2. Exports to Google Sheet
 * 3. Posts summary to Slack
 */
export async function generateWeeklyReport(
  config: ReportConfig
): Promise<void> {
  // Step 1: Query Salesforce
  const deals = await salesforce.query({ query: config.salesforceQuery });
  console.log(`Found ${deals.length} deals`);

  // Step 2: Calculate metrics
  const total = deals.reduce((sum, d) => sum + (d.Amount || 0), 0);
  const avg = total / deals.length;

  // Step 3: Export to Sheet (reuse skill)
  const csvPath = await exportAndTransform(config.sheetId, {
    format: 'csv',
    map: deal => [deal.Id, deal.Name, deal.Amount, deal.CloseDate]
  });

  // Step 4: Post to Slack
  await slack.postMessage({
    channel: config.slackChannel,
    text: `
📊 Weekly Sales Report

✓ ${deals.length} deals closed
💰 $${total.toLocaleString()} total revenue
📈 $${avg.toLocaleString()} average deal size
📎 Details: ${csvPath}
    `.trim()
  });

  console.log('✓ Weekly report posted to Slack');
}


// ============================================================================
// TEMPLATE: Skill with SKILL.md Documentation
// ============================================================================

/**
 * FILE: ./skills/{{skill-name}}/SKILL.md
 */

/*
---
name: {{skill-name}}
description: {{Brief description that triggers auto-invocation}}. Auto-invoked for "{{trigger phrase 1}}", "{{trigger phrase 2}}", "{{trigger phrase 3}}".
globs: ["{{pattern1}}", "{{pattern2}}"]
---

# {{Skill Name}}

{{Detailed description of what this skill does and when to use it}}

## Usage

```typescript
import { {{skillName}} } from './skills/{{skill-name}}';

const result = await {{skillName}}({
  // ... parameters
});
```

## Examples

### Example 1: {{Use case}}

```typescript
// {{Description}}
const result = await {{skillName}}({
  param1: 'value1',
  param2: 'value2'
});
```

### Example 2: {{Another use case}}

```typescript
// {{Description}}
const result = await {{skillName}}({
  param1: 'different-value',
  param2: 123
});
```

## Parameters

- `param1` ({{type}}): {{Description}}
- `param2` ({{type}}): {{Description}}

## Returns

{{Return value description}}

## Related Skills

- `{{related-skill-1}}`: {{Brief description}}
- `{{related-skill-2}}`: {{Brief description}}
*/


// ============================================================================
// EXAMPLE: Complete Skill - Export Sheet as CSV
// ============================================================================

/**
 * FILE: ./skills/export-sheet-csv/index.ts
 */

import * as gdrive from '../../servers/google-drive';
import { promises as fs } from 'fs';

/**
 * Exports a Google Sheet as CSV file
 *
 * @param sheetId - Google Sheet ID
 * @param options - Export options
 * @returns Path to saved CSV file
 */
export async function exportSheetAsCsv(
  sheetId: string,
  options: {
    range?: string;
    headers?: boolean;
    delimiter?: string;
  } = {}
): Promise<string> {
  // Fetch sheet data
  const sheet = await gdrive.getSheet({
    sheetId,
    range: options.range
  });

  // Convert to CSV
  const delimiter = options.delimiter || ',';
  const rows = sheet.rows;

  // Optionally include headers
  let csvLines = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(delimiter)
  );

  if (options.headers && sheet.metadata.headers) {
    csvLines = [
      sheet.metadata.headers.map(h => `"${h}"`).join(delimiter),
      ...csvLines
    ];
  }

  const csv = csvLines.join('\n');

  // Save to workspace
  const filename = `sheet-${sheetId}-${Date.now()}.csv`;
  const path = `./workspace/${filename}`;
  await fs.writeFile(path, csv);

  console.log(`✓ Exported ${rows.length} rows to ${path}`);
  return path;
}

/**
 * FILE: ./skills/export-sheet-csv/SKILL.md
 */

/*
---
name: export-sheet-csv
description: Exports Google Sheets as CSV files with customizable formatting. Auto-invoked for "export sheet", "download sheet", "sheet to csv", "convert sheet".
globs: ["workspace/sheet-*.csv"]
---

# Export Sheet as CSV

Fetches data from Google Sheets and saves as CSV file in workspace.

## Usage

```typescript
import { exportSheetAsCsv } from './skills/export-sheet-csv';

const path = await exportSheetAsCsv('abc123', {
  headers: true,
  delimiter: ','
});
```

## Parameters

- `sheetId` (string): Google Sheet ID
- `options.range` (string, optional): Cell range to export (e.g., "A1:D100")
- `options.headers` (boolean, optional): Include header row (default: false)
- `options.delimiter` (string, optional): CSV delimiter (default: ",")

## Returns

Path to saved CSV file in workspace

## Examples

### Basic export

```typescript
const path = await exportSheetAsCsv('abc123');
```

### Export with headers

```typescript
const path = await exportSheetAsCsv('abc123', { headers: true });
```

### Export specific range as TSV

```typescript
const path = await exportSheetAsCsv('abc123', {
  range: 'A1:D100',
  delimiter: '\t'
});
```
*/


// ============================================================================
// SKILL COMPOSITION EXAMPLE
// ============================================================================

/**
 * Build complex workflows by composing simple skills
 */

import { exportSheetAsCsv } from './skills/export-sheet-csv';
import { resilientSync } from './skills/resilient-sync';
import { generateWeeklyReport } from './skills/weekly-report';

// Workflow: Export → Sync → Report
async function automatedWorkflow() {
  // Export latest data
  const csvPath = await exportSheetAsCsv('abc123', { headers: true });

  // Sync to Salesforce
  const syncResult = await resilientSync('abc123', 'Lead');

  if (syncResult.failed === 0) {
    // Generate report if sync successful
    await generateWeeklyReport({
      salesforceQuery: 'SELECT * FROM Lead WHERE CreatedDate = THIS_WEEK',
      slackChannel: 'C123456',
      sheetId: 'abc123'
    });
  }

  console.log('✓ Automated workflow complete');
}


// ============================================================================
// SKILL DIRECTORY STRUCTURE
// ============================================================================

/*
skills/
├── export-sheet-csv/
│   ├── index.ts
│   ├── SKILL.md
│   └── tests.ts
├── resilient-sync/
│   ├── index.ts
│   ├── SKILL.md
│   └── tests.ts
├── weekly-report/
│   ├── index.ts
│   ├── SKILL.md
│   └── config.json
└── shared/
    ├── utils.ts
    └── types.ts
*/
