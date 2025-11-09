/**
 * MCP Client Implementation for Code Execution
 *
 * This template shows how to implement an MCP client that allows
 * code execution environments to call MCP tools directly.
 *
 * Supports multiple transports:
 * - stdio (standard input/output)
 * - HTTP (REST API)
 * - WebSocket (real-time)
 * - SSE (Server-Sent Events)
 */

// ============================================================================
// CORE CLIENT INTERFACE
// ============================================================================

/**
 * MCP tool call request
 */
export interface MCPToolCall {
  /** Server name (e.g., "google-drive", "salesforce") */
  server: string;

  /** Tool name (e.g., "get-document", "update-record") */
  tool: string;

  /** Tool arguments */
  arguments: Record<string, any>;

  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * MCP tool call result
 */
export interface MCPToolResult<T = any> {
  /** Tool result content */
  content: T;

  /** Error message if call failed */
  error?: string;

  /** Additional metadata */
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    cached?: boolean;
  };
}

/**
 * MCP client interface
 */
export interface MCPClient {
  /** Call an MCP tool */
  callTool<T = any>(call: MCPToolCall): Promise<MCPToolResult<T>>;

  /** List available servers */
  listServers(): Promise<string[]>;

  /** List available tools for a server */
  listTools(server: string): Promise<Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>>;

  /** Close the client connection */
  close(): Promise<void>;
}


// ============================================================================
// STDIO CLIENT IMPLEMENTATION
// ============================================================================

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * MCP client using stdio transport
 * Communicates with MCP servers via standard input/output
 */
export class StdioMCPClient extends EventEmitter implements MCPClient {
  private processes: Map<string, ChildProcess> = new Map();
  private requestId = 0;
  private pendingRequests: Map<number, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = new Map();

  /**
   * Initialize client with server configurations
   */
  constructor(
    private servers: Record<string, {
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }>
  ) {
    super();
  }

  /**
   * Start MCP server process
   */
  private async startServer(serverName: string): Promise<void> {
    const config = this.servers[serverName];
    if (!config) {
      throw new Error(`Server ${serverName} not configured`);
    }

    if (this.processes.has(serverName)) {
      return; // Already running
    }

    const process = spawn(config.command, config.args || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...config.env }
    });

    // Handle stdout messages
    process.stdout?.on('data', (data) => {
      this.handleMessage(serverName, data);
    });

    // Handle stderr
    process.stderr?.on('data', (data) => {
      console.error(`[${serverName}] ${data}`);
    });

    // Handle process exit
    process.on('exit', (code) => {
      console.log(`[${serverName}] exited with code ${code}`);
      this.processes.delete(serverName);
    });

    this.processes.set(serverName, process);

    // Wait for server to be ready
    await this.waitForReady(serverName);
  }

  /**
   * Wait for server ready signal
   */
  private async waitForReady(serverName: string, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Server ${serverName} failed to start within ${timeout}ms`));
      }, timeout);

      this.once(`ready:${serverName}`, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Handle message from server
   */
  private handleMessage(serverName: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      // Handle ready signal
      if (message.type === 'ready') {
        this.emit(`ready:${serverName}`);
        return;
      }

      // Handle tool response
      if (message.id !== undefined) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          if (message.error) {
            pending.reject(new Error(message.error));
          } else {
            pending.resolve(message.result);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to parse message from ${serverName}:`, error);
    }
  }

  /**
   * Call MCP tool
   */
  async callTool<T = any>(call: MCPToolCall): Promise<MCPToolResult<T>> {
    // Start server if not running
    if (!this.processes.has(call.server)) {
      await this.startServer(call.server);
    }

    const process = this.processes.get(call.server);
    if (!process || !process.stdin) {
      throw new Error(`Server ${call.server} not available`);
    }

    // Generate request ID
    const id = ++this.requestId;

    // Create promise for response
    const resultPromise = new Promise<MCPToolResult<T>>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Timeout handling
      if (call.timeout) {
        setTimeout(() => {
          if (this.pendingRequests.has(id)) {
            this.pendingRequests.delete(id);
            reject(new Error(`Tool call timed out after ${call.timeout}ms`));
          }
        }, call.timeout);
      }
    });

    // Send request to server
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: call.tool,
        arguments: call.arguments
      }
    };

    process.stdin.write(JSON.stringify(request) + '\n');

    return resultPromise;
  }

  /**
   * List available servers
   */
  async listServers(): Promise<string[]> {
    return Object.keys(this.servers);
  }

  /**
   * List tools for a server
   */
  async listTools(server: string): Promise<Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>> {
    const result = await this.callTool({
      server,
      tool: 'list-tools',
      arguments: {}
    });

    return result.content as any;
  }

  /**
   * Close client and all server processes
   */
  async close(): Promise<void> {
    for (const [name, process] of this.processes) {
      process.kill();
      console.log(`Closed server: ${name}`);
    }
    this.processes.clear();
    this.pendingRequests.clear();
  }
}


// ============================================================================
// HTTP CLIENT IMPLEMENTATION
// ============================================================================

/**
 * MCP client using HTTP transport
 * Communicates with MCP servers via REST API
 */
export class HttpMCPClient implements MCPClient {
  constructor(
    private baseUrl: string,
    private apiKey?: string
  ) {}

  async callTool<T = any>(call: MCPToolCall): Promise<MCPToolResult<T>> {
    const url = `${this.baseUrl}/servers/${call.server}/tools/${call.tool}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(call.arguments),
      signal: call.timeout
        ? AbortSignal.timeout(call.timeout)
        : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    return result;
  }

  async listServers(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/servers`);
    const servers = await response.json();
    return servers.map((s: any) => s.name);
  }

  async listTools(server: string): Promise<Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>> {
    const response = await fetch(`${this.baseUrl}/servers/${server}/tools`);
    return await response.json();
  }

  async close(): Promise<void> {
    // HTTP client doesn't maintain persistent connections
  }
}


// ============================================================================
// HELPER FUNCTION FOR TOOL CALLS
// ============================================================================

/**
 * Global MCP client instance
 * Configure this based on your environment
 */
let globalClient: MCPClient;

/**
 * Initialize global MCP client
 */
export function initializeMCPClient(client: MCPClient): void {
  globalClient = client;
}

/**
 * Call MCP tool using global client
 * This is the function imported by server wrappers
 */
export async function callMCPTool<T = any>(
  toolIdentifier: string,
  args: Record<string, any>
): Promise<T> {
  if (!globalClient) {
    throw new Error('MCP client not initialized. Call initializeMCPClient() first.');
  }

  // Parse tool identifier: "server__tool-name"
  const [server, tool] = toolIdentifier.split('__');

  const result = await globalClient.callTool<T>({
    server,
    tool: tool.replace(/_/g, '-'), // Convert underscores to hyphens
    arguments: args
  });

  if (result.error) {
    throw new Error(`MCP tool call failed: ${result.error}`);
  }

  return result.content;
}


// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example: Initialize and use MCP client
 */

// Option 1: stdio transport
const stdioClient = new StdioMCPClient({
  'google-drive': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gdrive']
  },
  'salesforce': {
    command: 'node',
    args: ['./mcp-servers/salesforce/index.js'],
    env: {
      SALESFORCE_TOKEN: process.env.SALESFORCE_TOKEN
    }
  }
});

initializeMCPClient(stdioClient);

// Option 2: HTTP transport
const httpClient = new HttpMCPClient(
  'https://mcp.example.com/api',
  process.env.MCP_API_KEY
);

initializeMCPClient(httpClient);

// Now you can use callMCPTool in server wrappers
import * as gdrive from './servers/google-drive';
const doc = await gdrive.getDocument({ documentId: 'abc123' });


// ============================================================================
// CONFIGURATION FILE
// ============================================================================

/**
 * FILE: ./mcp-config.json
 *
 * Configure your MCP servers here
 */

/*
{
  "transport": "stdio",
  "servers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gdrive"],
      "env": {
        "GDRIVE_TOKEN": "${GDRIVE_TOKEN}"
      }
    },
    "salesforce": {
      "command": "node",
      "args": ["./mcp-servers/salesforce/index.js"],
      "env": {
        "SALESFORCE_TOKEN": "${SALESFORCE_TOKEN}",
        "SALESFORCE_INSTANCE": "${SALESFORCE_INSTANCE}"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_TOKEN": "${SLACK_TOKEN}"
      }
    }
  }
}
*/

/**
 * Load configuration and initialize client
 */
export async function loadMCPConfig(configPath: string): Promise<MCPClient> {
  const fs = require('fs').promises;
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

  // Replace environment variable placeholders
  for (const server of Object.values(config.servers) as any[]) {
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        if (typeof value === 'string' && value.startsWith('${')) {
          const envVar = value.slice(2, -1);
          server.env[key] = process.env[envVar];
        }
      }
    }
  }

  // Create appropriate client
  if (config.transport === 'stdio') {
    return new StdioMCPClient(config.servers);
  } else if (config.transport === 'http') {
    return new HttpMCPClient(config.baseUrl, config.apiKey);
  } else {
    throw new Error(`Unsupported transport: ${config.transport}`);
  }
}

// Usage:
// const client = await loadMCPConfig('./mcp-config.json');
// initializeMCPClient(client);
