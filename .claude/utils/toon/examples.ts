/**
 * TOON Library - Comprehensive Examples
 *
 * Real-world usage examples for the Claude Starter Kit
 *
 * @module @claude/toon/examples
 */

import {
  encodeTOON,
  decodeTOON,
  compareFormats,
  formatFinancialContext,
  prepareClaudeRequest,
  calculateAPICost,
  TOONStreamEncoder,
  TokenTracker,
  analyzeAllFormats,
} from './index';

// ============================================================================
// Example 1: Basic Encoding/Decoding
// ============================================================================

export function example1_BasicEncoding() {
  console.log('=== Example 1: Basic Encoding/Decoding ===\n');

  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
  ];

  // Encode to TOON
  const toon = encodeTOON(users);
  console.log('TOON format:');
  console.log(toon);
  console.log();

  // Decode back
  const decoded = decodeTOON(toon, { coerceTypes: true });
  console.log('Decoded:');
  console.log(decoded);
  console.log();

  // Compare formats
  const comparison = compareFormats(users);
  console.log('Token comparison:');
  console.log(`  JSON: ${comparison.baseline.tokens} tokens`);
  console.log(`  TOON: ${comparison.optimized.tokens} tokens`);
  console.log(`  Savings: ${comparison.savingsPercent.toFixed(1)}%`);
  console.log();
}

// ============================================================================
// Example 2: Financial Data - Accounts
// ============================================================================

export function example2_FinancialAccounts() {
  console.log('=== Example 2: Financial Accounts ===\n');

  const accounts = [
    {
      id: 'acc_001',
      name: 'Chase Checking',
      type: 'depository',
      subtype: 'checking',
      balance: 5432.1,
      currency: 'USD',
      institution: 'Chase',
      lastSync: '2024-01-15T10:30:00Z',
    },
    {
      id: 'acc_002',
      name: 'High Yield Savings',
      type: 'depository',
      subtype: 'savings',
      balance: 25000.0,
      currency: 'USD',
      institution: 'Marcus',
      lastSync: '2024-01-15T10:30:00Z',
    },
    {
      id: 'acc_003',
      name: 'Sapphire Reserve',
      type: 'credit',
      subtype: 'credit card',
      balance: -1234.56,
      currency: 'USD',
      institution: 'Chase',
      lastSync: '2024-01-15T10:30:00Z',
    },
  ];

  const toon = encodeTOON(accounts);
  console.log('Encoded accounts:');
  console.log(toon);
  console.log();

  const comparison = compareFormats(accounts, 'json', 'toon', {
    pricePerK: 0.003,
  });

  console.log('Efficiency metrics:');
  console.log(`  JSON bytes: ${comparison.baseline.bytes}`);
  console.log(`  TOON bytes: ${comparison.optimized.bytes}`);
  console.log(`  Size reduction: ${((comparison.bytesSaved / comparison.baseline.bytes) * 100).toFixed(1)}%`);
  console.log(`  Token savings: ${comparison.savingsPercent.toFixed(1)}%`);

  if (comparison.costSavings) {
    console.log(`  Cost saved per call: $${comparison.costSavings.saved.toFixed(6)}`);
  }
  console.log();
}

// ============================================================================
// Example 3: Large Transaction Dataset
// ============================================================================

export function example3_LargeTransactions() {
  console.log('=== Example 3: Large Transaction Dataset (1000 records) ===\n');

  // Generate 1000 sample transactions
  const transactions = Array.from({ length: 1000 }, (_, i) => ({
    id: `tx_${String(i).padStart(6, '0')}`,
    date: '2024-01-15',
    amount: Math.round(Math.random() * 50000) / 100,
    merchant: `Merchant ${i % 50}`,
    category: ['Food & Drink', 'Transportation', 'Shopping', 'Bills', 'Entertainment'][i % 5],
    subcategory: `Sub ${i % 15}`,
    accountId: `acc_${(i % 5) + 1}`,
    pending: i % 20 === 0,
    notes: i % 10 === 0 ? 'Important transaction' : '',
  }));

  console.log(`Encoding ${transactions.length} transactions...`);

  const startEncode = Date.now();
  const toon = encodeTOON(transactions);
  const encodeTime = Date.now() - startEncode;

  console.log(`  Encoding time: ${encodeTime}ms`);
  console.log(`  Throughput: ${Math.round((transactions.length / encodeTime) * 1000)} records/sec`);
  console.log();

  const startDecode = Date.now();
  const decoded = decodeTOON(toon, { coerceTypes: true });
  const decodeTime = Date.now() - startDecode;

  console.log(`Decoding ${decoded.length} transactions...`);
  console.log(`  Decoding time: ${decodeTime}ms`);
  console.log(`  Throughput: ${Math.round((decoded.length / decodeTime) * 1000)} records/sec`);
  console.log();

  const analysis = analyzeAllFormats(transactions);

  console.log('Format comparison:');
  console.table(analysis.summary);
  console.log(`Best format: ${analysis.bestFormat}`);
  console.log(`Worst format: ${analysis.worstFormat}`);
  console.log();
}

// ============================================================================
// Example 4: LLM Context Optimization
// ============================================================================

export function example4_LLMContextOptimization() {
  console.log('=== Example 4: LLM Context Optimization ===\n');

  const financialData = {
    accounts: [
      { id: 'acc_1', name: 'Checking', type: 'depository', balance: 5000, currency: 'USD' },
      { id: 'acc_2', name: 'Savings', type: 'depository', balance: 25000, currency: 'USD' },
      { id: 'acc_3', name: 'Credit Card', type: 'credit', balance: -1500, currency: 'USD' },
    ],
    transactions: Array.from({ length: 50 }, (_, i) => ({
      id: `tx_${i}`,
      date: '2024-01-15',
      amount: Math.round(Math.random() * 20000) / 100,
      merchant: ['Starbucks', 'Shell', 'Amazon', 'Whole Foods', 'Target'][i % 5],
      category: ['Food', 'Transport', 'Shopping', 'Groceries', 'Retail'][i % 5],
    })),
    holdings: [
      { symbol: 'AAPL', shares: 10, costBasis: 150.0, currentPrice: 185.5 },
      { symbol: 'GOOGL', shares: 5, costBasis: 2800.0, currentPrice: 3100.0 },
      { symbol: 'MSFT', shares: 15, costBasis: 380.0, currentPrice: 420.0 },
    ],
  };

  // Format for Claude API
  const formatted = formatFinancialContext(financialData, {
    includeSummary: true,
    includeTokenSavings: true,
  });

  console.log('Formatted context for Claude API:');
  console.log('─'.repeat(60));
  console.log(formatted.substring(0, 500) + '...\n');

  // Prepare complete request
  const request = prepareClaudeRequest(
    financialData,
    'What are my top 3 spending categories and how can I reduce expenses?'
  );

  console.log('Request metadata:');
  console.log(`  Original tokens (JSON): ${request.metadata.originalTokenEstimate}`);
  console.log(`  Optimized tokens (TOON): ${request.metadata.optimizedTokenEstimate}`);
  console.log(`  Tokens saved: ${request.metadata.tokensSaved}`);
  console.log(`  Savings: ${((request.metadata.tokensSaved / request.metadata.originalTokenEstimate) * 100).toFixed(1)}%`);
  console.log();

  // Calculate cost impact
  const cost = calculateAPICost(financialData, {
    modelInputPrice: 0.003, // Claude Sonnet
    callsPerDay: 100,
  });

  console.log('Cost analysis (100 calls/day):');
  console.log(`  JSON cost per call: $${cost.jsonCostPerCall.toFixed(6)}`);
  console.log(`  TOON cost per call: $${cost.toonCostPerCall.toFixed(6)}`);
  console.log(`  Savings per call: $${cost.savingsPerCall.toFixed(6)}`);
  console.log(`  Daily savings: $${cost.dailySavings.toFixed(2)}`);
  console.log(`  Monthly savings: $${cost.monthlySavings.toFixed(2)}`);
  console.log(`  Annual savings: $${cost.annualSavings.toFixed(2)}`);
  console.log();
}

// ============================================================================
// Example 5: Streaming Large Datasets
// ============================================================================

export function example5_StreamingEncoder() {
  console.log('=== Example 5: Streaming Encoder ===\n');

  const encoder = new TOONStreamEncoder({
    chunkSize: 100,
  });

  // Generate sample data
  const data = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    balance: Math.round(Math.random() * 100000) / 100,
  }));

  console.log(`Streaming ${data.length} records...`);

  // Initialize encoder
  encoder.initialize(data);

  // Write header
  const header = encoder.writeHeader(data.length);
  console.log('Header:', header.trim());

  // Encode in batches
  let totalBytes = header.length;
  const batchSize = 100;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const encoded = encoder.encodeBatch(batch);
    totalBytes += encoded.length;
  }

  console.log(`  Total bytes encoded: ${totalBytes.toLocaleString()}`);
  console.log(`  Records encoded: ${encoder.getRecordCount()}`);
  console.log(`  Average bytes per record: ${Math.round(totalBytes / data.length)}`);
  console.log();
}

// ============================================================================
// Example 6: Token Tracking Analytics
// ============================================================================

export function example6_TokenTracking() {
  console.log('=== Example 6: Token Tracking Analytics ===\n');

  const tracker = new TokenTracker();

  // Simulate 10 API calls with different data sizes
  for (let i = 0; i < 10; i++) {
    const recordCount = Math.floor(Math.random() * 500) + 100;

    const data = Array.from({ length: recordCount }, (_, j) => ({
      id: j,
      name: `Record ${j}`,
      value: Math.random() * 1000,
    }));

    // Track baseline (JSON)
    tracker.recordUsage(`request-${i}`, data, 'json', false);

    // Track optimized (TOON)
    tracker.recordUsage(`request-${i}`, data, 'toon', true);
  }

  const stats = tracker.getStatistics();

  console.log('Tracking statistics:');
  console.log(`  Total requests: ${stats.totalRequests}`);
  console.log(`  Total baseline tokens: ${stats.totalTokensBaseline.toLocaleString()}`);
  console.log(`  Total optimized tokens: ${stats.totalTokensOptimized.toLocaleString()}`);
  console.log(`  Total tokens saved: ${stats.totalTokensSaved.toLocaleString()}`);
  console.log(`  Average savings: ${stats.averageSavingsPercent.toFixed(1)}%`);
  console.log();

  console.log('Per-request breakdown:');
  stats.measurements.slice(0, 5).forEach((m, i) => {
    console.log(`  Request ${i + 1}:`);
    console.log(`    Baseline: ${m.baseline.tokens} tokens`);
    console.log(`    Optimized: ${m.optimized?.tokens ?? 'N/A'} tokens`);
    console.log(`    Saved: ${m.saved} tokens`);
  });
  console.log();

  // Export CSV
  const csv = tracker.exportCSV();
  console.log('CSV Export (first 200 chars):');
  console.log(csv.substring(0, 200) + '...');
  console.log();
}

// ============================================================================
// Example 7: API Response Handler
// ============================================================================

export function example7_APIResponseHandler() {
  console.log('=== Example 7: API Response Handler Pattern ===\n');

  // Simulated API route handler
  function handleTransactionsRequest(
    format: 'json' | 'toon' = 'json',
    limit: number = 100
  ): { body: string; headers: Record<string, string> } {
    const transactions = Array.from({ length: limit }, (_, i) => ({
      id: `tx_${i}`,
      date: '2024-01-15',
      amount: Math.random() * 500,
      merchant: `Merchant ${i % 20}`,
      category: ['Food', 'Transport', 'Shopping'][i % 3],
    }));

    if (format === 'toon') {
      return {
        body: encodeTOON(transactions),
        headers: {
          'Content-Type': 'application/x-toon',
          'X-Record-Count': String(transactions.length),
        },
      };
    } else {
      return {
        body: JSON.stringify(transactions, null, 2),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }
  }

  console.log('Simulating API request with format=json:');
  const jsonResponse = handleTransactionsRequest('json', 50);
  console.log(`  Content-Type: ${jsonResponse.headers['Content-Type']}`);
  console.log(`  Body size: ${jsonResponse.body.length} bytes`);
  console.log();

  console.log('Simulating API request with format=toon:');
  const toonResponse = handleTransactionsRequest('toon', 50);
  console.log(`  Content-Type: ${toonResponse.headers['Content-Type']}`);
  console.log(`  Body size: ${toonResponse.body.length} bytes`);
  console.log(`  Size reduction: ${((1 - toonResponse.body.length / jsonResponse.body.length) * 100).toFixed(1)}%`);
  console.log();
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TOON Library - Comprehensive Examples                  ║');
  console.log('║   Tokenization-Optimized Object Notation                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();

  example1_BasicEncoding();
  console.log('\n' + '='.repeat(60) + '\n');

  example2_FinancialAccounts();
  console.log('\n' + '='.repeat(60) + '\n');

  example3_LargeTransactions();
  console.log('\n' + '='.repeat(60) + '\n');

  example4_LLMContextOptimization();
  console.log('\n' + '='.repeat(60) + '\n');

  example5_StreamingEncoder();
  console.log('\n' + '='.repeat(60) + '\n');

  example6_TokenTracking();
  console.log('\n' + '='.repeat(60) + '\n');

  example7_APIResponseHandler();

  console.log('='.repeat(60));
  console.log('All examples completed!');
  console.log('='.repeat(60));
}

// Export for CLI usage
if (require.main === module) {
  runAllExamples();
}
