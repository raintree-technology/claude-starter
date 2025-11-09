/**
 * MCP Server Wrapper Template
 *
 * This template generates filesystem-based tool wrappers for MCP servers,
 * enabling progressive disclosure and code execution patterns.
 *
 * Usage:
 * 1. Replace {{SERVER_NAME}} with your MCP server name (e.g., "google-drive")
 * 2. Replace {{TOOL_NAME}} with each tool name (e.g., "getDocument")
 * 3. Add type definitions for inputs and outputs
 * 4. Generate one file per tool in ./servers/{{SERVER_NAME}}/
 */

// ============================================================================
// FILE: ./servers/{{SERVER_NAME}}/{{TOOL_NAME}}.ts
// ============================================================================

import { callMCPTool } from "../../../client.js";

/**
 * Input parameters for {{TOOL_NAME}}
 * Replace with actual parameter types from MCP tool definition
 */
interface {{ToolName}}Input {
  // Example: documentId: string;
  // Example: fields?: string;
  // Add all required and optional parameters
}

/**
 * Response type for {{TOOL_NAME}}
 * Replace with actual response schema from MCP tool
 */
interface {{ToolName}}Response {
  // Example: content: string;
  // Example: metadata: Record<string, any>;
  // Add all response fields
}

/**
 * {{Brief description of what this tool does}}
 *
 * @param input - {{Input description}}
 * @returns {{Response description}}
 *
 * @example
 * ```typescript
 * const result = await {{toolName}}({
 *   // ... parameters
 * });
 * ```
 */
export async function {{toolName}}(
  input: {{ToolName}}Input
): Promise<{{ToolName}}Response> {
  return callMCPTool<{{ToolName}}Response>(
    '{{server_name}}__{{tool_name}}', // MCP tool identifier
    input
  );
}


// ============================================================================
// FILE: ./servers/{{SERVER_NAME}}/index.ts
// ============================================================================

/**
 * {{SERVER_NAME}} MCP Server
 *
 * Exports all tools from this server for easy import:
 * ```typescript
 * import * as {{serverName}} from './servers/{{SERVER_NAME}}';
 * const doc = await {{serverName}}.{{toolName}}({ ... });
 * ```
 */

export * from './{{TOOL_NAME_1}}';
export * from './{{TOOL_NAME_2}}';
export * from './{{TOOL_NAME_3}}';
// ... export all tools


// ============================================================================
// FILE: ./client.ts (MCP client implementation)
// ============================================================================

/**
 * MCP Client for calling tools from code execution environment
 *
 * This is a simplified example - actual implementation depends on your
 * MCP client library and transport mechanism.
 */

interface MCPToolCall {
  server: string;
  tool: string;
  arguments: Record<string, any>;
}

interface MCPToolResult {
  content: any;
  error?: string;
}

/**
 * Calls an MCP tool and returns the result
 *
 * @param toolIdentifier - Tool identifier in format "server__tool_name"
 * @param args - Tool arguments
 * @returns Tool result
 */
export async function callMCPTool<T = any>(
  toolIdentifier: string,
  args: Record<string, any>
): Promise<T> {
  // Parse tool identifier
  const [server, tool] = toolIdentifier.split('__');

  // Make MCP request (implementation depends on your MCP client)
  const result = await mcpClient.callTool({
    server,
    tool: tool.replace(/_/g, '-'), // Convert snake_case to kebab-case if needed
    arguments: args
  });

  if (result.error) {
    throw new Error(`MCP tool call failed: ${result.error}`);
  }

  return result.content as T;
}

// Your MCP client instance
// This could be stdio, HTTP, or other transport
declare const mcpClient: {
  callTool(call: MCPToolCall): Promise<MCPToolResult>;
};


// ============================================================================
// EXAMPLE: Complete server wrapper for Google Drive
// ============================================================================

// File: ./servers/google-drive/getDocument.ts
import { callMCPTool } from "../../../client.js";

interface GetDocumentInput {
  documentId: string;
  fields?: string;
}

interface GetDocumentResponse {
  content: string;
  title: string;
  createdTime: string;
  modifiedTime: string;
  metadata: {
    mimeType: string;
    permissions: Array<{
      role: string;
      emailAddress: string;
    }>;
  };
}

/**
 * Retrieves a document from Google Drive
 *
 * @param input - Document ID and optional field mask
 * @returns Document content and metadata
 */
export async function getDocument(
  input: GetDocumentInput
): Promise<GetDocumentResponse> {
  return callMCPTool<GetDocumentResponse>(
    'google_drive__get_document',
    input
  );
}

// File: ./servers/google-drive/getSheet.ts
interface GetSheetInput {
  sheetId: string;
  range?: string;
}

interface GetSheetResponse {
  rows: Array<Array<string | number>>;
  metadata: {
    title: string;
    sheetCount: number;
  };
}

export async function getSheet(
  input: GetSheetInput
): Promise<GetSheetResponse> {
  return callMCPTool<GetSheetResponse>(
    'google_drive__get_sheet',
    input
  );
}

// File: ./servers/google-drive/index.ts
export * from './getDocument';
export * from './getSheet';
export * from './listFiles';
export * from './createDocument';
export * from './updateDocument';


// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Single tool import
import { getDocument } from './servers/google-drive/getDocument';

const doc = await getDocument({ documentId: 'abc123' });
console.log(doc.title);


// Example 2: Namespace import (recommended)
import * as gdrive from './servers/google-drive';

const doc = await gdrive.getDocument({ documentId: 'abc123' });
const sheet = await gdrive.getSheet({ sheetId: 'xyz789' });


// Example 3: Multiple servers
import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';
import * as slack from './servers/slack';

// Fetch data
const transcript = await gdrive.getDocument({ documentId: 'abc123' });

// Update CRM
await salesforce.updateRecord({
  objectType: 'Meeting',
  recordId: '00Q5f...',
  data: { Notes: transcript.content }
});

// Notify team
await slack.postMessage({
  channel: 'C123456',
  text: `Updated meeting notes for ${transcript.title}`
});


// ============================================================================
// DIRECTORY STRUCTURE
// ============================================================================

/*
servers/
├── google-drive/
│   ├── index.ts              # Exports all tools
│   ├── getDocument.ts        # Individual tool wrapper
│   ├── getSheet.ts
│   ├── listFiles.ts
│   ├── createDocument.ts
│   └── updateDocument.ts
├── salesforce/
│   ├── index.ts
│   ├── query.ts
│   ├── updateRecord.ts
│   ├── createRecord.ts
│   └── deleteRecord.ts
├── slack/
│   ├── index.ts
│   ├── postMessage.ts
│   ├── getChannelHistory.ts
│   └── uploadFile.ts
└── client.ts                 # MCP client implementation
*/


// ============================================================================
// GENERATION SCRIPT
// ============================================================================

/**
 * Script to auto-generate server wrappers from MCP server definitions
 *
 * This is a conceptual example - actual implementation depends on how
 * your MCP servers expose their tool definitions.
 */

async function generateServerWrapper(serverName: string) {
  // Get tool definitions from MCP server
  const tools = await mcpClient.listTools(serverName);

  // Create server directory
  await fs.mkdir(`./servers/${serverName}`, { recursive: true });

  // Generate wrapper for each tool
  for (const tool of tools) {
    const toolFile = `./servers/${serverName}/${tool.name}.ts`;
    const content = `
import { callMCPTool } from "../../../client.js";

interface ${pascalCase(tool.name)}Input {
  ${generateInputInterface(tool.parameters)}
}

interface ${pascalCase(tool.name)}Response {
  ${generateResponseInterface(tool.responseSchema)}
}

/**
 * ${tool.description}
 */
export async function ${camelCase(tool.name)}(
  input: ${pascalCase(tool.name)}Input
): Promise<${pascalCase(tool.name)}Response> {
  return callMCPTool<${pascalCase(tool.name)}Response>(
    '${serverName}__${tool.name}',
    input
  );
}
    `.trim();

    await fs.writeFile(toolFile, content);
  }

  // Generate index.ts
  const indexContent = tools
    .map(t => `export * from './${t.name}';`)
    .join('\n');
  await fs.writeFile(`./servers/${serverName}/index.ts`, indexContent);

  console.log(`✓ Generated wrapper for ${serverName} (${tools.length} tools)`);
}

// Usage:
// await generateServerWrapper('google-drive');
// await generateServerWrapper('salesforce');
// await generateServerWrapper('slack');
