/**
 * TOON Library Test Suite
 *
 * Comprehensive tests with real-world financial data scenarios
 *
 * @module @claude/toon/__tests__
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  encodeTOON,
  decodeTOON,
  inferSchema,
  validateSchema,
  compareFormats,
  formatFinancialContext,
  TOONStreamEncoder,
  estimateTokens,
} from '../index';

describe('TOON Encoder/Decoder', () => {
  describe('Simple flat objects', () => {
    it('should encode and decode simple objects', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
      ];

      const toon = encodeTOON(data);

      expect(toon).toContain('[3]{');
      expect(toon).toContain('id,name,age');
      expect(toon).toContain('1,Alice,30');
      expect(toon).toContain('2,Bob,25');

      const decoded = decodeTOON(toon, { coerceTypes: true });

      expect(decoded).toHaveLength(3);
      expect(decoded[0]).toEqual({ id: 1, name: 'Alice', age: 30 });
      expect(decoded[1]).toEqual({ id: 2, name: 'Bob', age: 25 });
    });

    it('should handle empty arrays', () => {
      const data: any[] = [];
      const toon = encodeTOON(data);

      expect(toon).toBe('[0]{}:');

      const decoded = decodeTOON(toon);
      expect(decoded).toEqual([]);
    });

    it('should handle null values', () => {
      const data = [
        { id: 1, name: 'Alice', value: null },
        { id: 2, name: 'Bob', value: 100 },
      ];

      const toon = encodeTOON(data, { nullHandling: 'empty' });
      const decoded = decodeTOON(toon, { coerceTypes: true });

      expect(decoded[0].value).toBeNull();
      expect(decoded[1].value).toBe(100);
    });
  });

  describe('Real-world financial data', () => {
    const accountData = [
      {
        id: 'acc_001',
        name: 'Chase Checking',
        type: 'depository',
        subtype: 'checking',
        balance: 5432.1,
        currency: 'USD',
      },
      {
        id: 'acc_002',
        name: 'Savings Account',
        type: 'depository',
        subtype: 'savings',
        balance: 25000.0,
        currency: 'USD',
      },
      {
        id: 'acc_003',
        name: 'Credit Card',
        type: 'credit',
        subtype: 'credit card',
        balance: -1234.56,
        currency: 'USD',
      },
    ];

    it('should encode account data efficiently', () => {
      const toon = encodeTOON(accountData);

      expect(toon).toContain('[3]{');
      expect(toon).toContain('id,name,type,subtype,balance,currency');

      // Verify token savings
      const json = JSON.stringify(accountData);
      const toonBytes = new TextEncoder().encode(toon).length;
      const jsonBytes = new TextEncoder().encode(json).length;

      expect(toonBytes).toBeLessThan(jsonBytes);
    });

    it('should decode account data correctly', () => {
      const toon = encodeTOON(accountData);
      const decoded = decodeTOON(toon, { coerceTypes: true });

      expect(decoded).toHaveLength(3);
      expect(decoded[0].id).toBe('acc_001');
      expect(decoded[0].balance).toBe(5432.1);
      expect(decoded[2].balance).toBe(-1234.56);
    });

    const transactionData = [
      {
        id: 'tx_001',
        date: '2024-01-15',
        amount: 42.5,
        merchant: 'Starbucks',
        category: 'Food & Drink',
        pending: false,
      },
      {
        id: 'tx_002',
        date: '2024-01-15',
        amount: 125.0,
        merchant: 'Shell Gas Station',
        category: 'Transportation',
        pending: false,
      },
      {
        id: 'tx_003',
        date: '2024-01-16',
        amount: 1250.0,
        merchant: 'Rent Payment',
        category: 'Housing',
        pending: true,
      },
    ];

    it('should handle transaction data', () => {
      const toon = encodeTOON(transactionData);
      const decoded = decodeTOON(toon, { coerceTypes: true });

      expect(decoded).toHaveLength(3);
      expect(decoded[0].amount).toBe(42.5);
      expect(decoded[0].pending).toBe(false);
      expect(decoded[2].pending).toBe(true);
    });

    it('should handle large transaction datasets', () => {
      // Generate 1000 transactions
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `tx_${String(i).padStart(6, '0')}`,
        date: '2024-01-15',
        amount: Math.random() * 1000,
        merchant: `Merchant ${i}`,
        category: 'Shopping',
        pending: i % 2 === 0,
      }));

      const startTime = Date.now();
      const toon = encodeTOON(largeDataset);
      const encodeTime = Date.now() - startTime;

      expect(encodeTime).toBeLessThan(1000); // Should encode in <1s

      const decoded = decodeTOON(toon, { coerceTypes: true });

      expect(decoded).toHaveLength(1000);
      expect(decoded[0].id).toBe('tx_000000');
      expect(decoded[999].id).toBe('tx_000999');
    });
  });

  describe('Special characters and escaping', () => {
    it('should handle strings with commas', () => {
      const data = [
        { id: 1, description: 'Coffee, pastries, and breakfast' },
        { id: 2, description: 'Simple description' },
      ];

      const toon = encodeTOON(data);
      const decoded = decodeTOON(toon);

      expect(decoded[0].description).toBe('Coffee, pastries, and breakfast');
    });

    it('should handle strings with quotes', () => {
      const data = [{ id: 1, text: 'He said "hello" to me' }];

      const toon = encodeTOON(data);
      const decoded = decodeTOON(toon);

      expect(decoded[0].text).toBe('He said "hello" to me');
    });

    it('should handle multiline strings', () => {
      const data = [{ id: 1, notes: 'Line 1\nLine 2\nLine 3' }];

      const toon = encodeTOON(data, { escapeStrategy: 'backslash' });
      const decoded = decodeTOON(toon);

      expect(decoded[0].notes).toContain('Line 1');
    });
  });
});

describe('Schema Inference and Validation', () => {
  it('should infer schema from data', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30, active: true },
      { id: 2, name: 'Bob', age: 25, active: false },
    ];

    const schema = inferSchema(data);

    expect(schema.fields).toHaveLength(4);
    expect(schema.fields.find((f) => f.name === 'id')?.type).toBe('number');
    expect(schema.fields.find((f) => f.name === 'name')?.type).toBe('string');
    expect(schema.fields.find((f) => f.name === 'active')?.type).toBe('boolean');
  });

  it('should detect nullable fields', () => {
    const data = [
      { id: 1, value: 100 },
      { id: 2, value: null },
      { id: 3, value: 200 },
    ];

    const schema = inferSchema(data, { strictNullable: true });
    const valueField = schema.fields.find((f) => f.name === 'value');

    expect(valueField?.nullable).toBe(true);
  });

  it('should validate data against schema', () => {
    const schema = inferSchema([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);

    const validData = [
      { id: 3, name: 'Charlie' },
      { id: 4, name: 'David' },
    ];

    const result = validateSchema(validData, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect validation errors', () => {
    const schema = inferSchema([{ id: 1, name: 'Alice' }]);

    const invalidData = [
      { id: 'not-a-number', name: 'Bob' }, // Wrong type for id
    ];

    const result = validateSchema(invalidData, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Token Measurement', () => {
  it('should estimate tokens accurately', () => {
    const text = 'Hello, world!';
    const tokens = estimateTokens(text);

    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });

  it('should compare formats correctly', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      balance: Math.random() * 10000,
    }));

    const comparison = compareFormats(data);

    expect(comparison.tokensSaved).toBeGreaterThan(0);
    expect(comparison.savingsPercent).toBeGreaterThan(30); // At least 30% savings
    expect(comparison.savingsPercent).toBeLessThan(70); // Less than 70% (realistic)
  });

  it('should show significant savings for large datasets', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: `tx_${i}`,
      date: '2024-01-15',
      amount: 42.5,
      merchant: 'Coffee Shop',
      category: 'Food & Drink',
      subcategory: 'Coffee Shops',
      accountId: 'acc_123',
    }));

    const comparison = compareFormats(data, 'json', 'toon', {
      pricePerK: 0.003, // Claude Sonnet pricing
    });

    expect(comparison.savingsPercent).toBeGreaterThan(40);

    if (comparison.costSavings) {
      expect(comparison.costSavings.saved).toBeGreaterThan(0);
    }
  });
});

describe('LLM Context Formatting', () => {
  it('should format financial context for Claude API', () => {
    const context = {
      accounts: [
        { id: 'acc_1', name: 'Checking', type: 'depository', balance: 5000 },
        { id: 'acc_2', name: 'Savings', type: 'depository', balance: 25000 },
      ],
      transactions: [
        {
          id: 'tx_1',
          date: '2024-01-15',
          amount: 42.5,
          merchant: 'Starbucks',
          category: 'Food & Drink',
        },
        {
          id: 'tx_2',
          date: '2024-01-15',
          amount: 125.0,
          merchant: 'Shell',
          category: 'Transportation',
        },
      ],
    };

    const formatted = formatFinancialContext(context);

    expect(formatted).toContain('ACCOUNTS');
    expect(formatted).toContain('TRANSACTIONS');
    expect(formatted).toContain('[2]{');
    expect(formatted).toContain('acc_1,Checking');
  });

  it('should include token savings estimate', () => {
    const context = {
      accounts: Array.from({ length: 20 }, (_, i) => ({
        id: `acc_${i}`,
        name: `Account ${i}`,
        type: 'depository',
        balance: 1000,
      })),
      transactions: Array.from({ length: 500 }, (_, i) => ({
        id: `tx_${i}`,
        date: '2024-01-15',
        amount: 42.5,
      })),
    };

    const formatted = formatFinancialContext(context, {
      includeTokenSavings: true,
    });

    expect(formatted).toContain('Token Savings');
    expect(formatted).toMatch(/\d+\.\d+%/); // Should include percentage
  });
});

describe('Streaming Encoder', () => {
  it('should stream encode large datasets', () => {
    const encoder = new TOONStreamEncoder();

    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    encoder.initialize(data);

    const header = encoder.writeHeader(2);
    expect(header).toContain('[2]{');

    const line1 = encoder.encodeRecord(data[0]);
    const line2 = encoder.encodeRecord(data[1]);

    expect(line1).toContain('1,Alice');
    expect(line2).toContain('2,Bob');

    expect(encoder.getRecordCount()).toBe(2);
  });

  it('should batch encode records', () => {
    const encoder = new TOONStreamEncoder();

    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
    }));

    encoder.initialize(data);
    encoder.writeHeader(data.length);

    const batch = encoder.encodeBatch(data);

    expect(batch).toContain('0,User 0');
    expect(batch).toContain('99,User 99');
  });
});

describe('Real-world integration scenarios', () => {
  it('should handle complete financial data export', () => {
    const financialData = {
      accounts: Array.from({ length: 10 }, (_, i) => ({
        id: `acc_${String(i).padStart(3, '0')}`,
        name: `Account ${i}`,
        type: i % 2 === 0 ? 'depository' : 'credit',
        balance: Math.random() * 50000,
        currency: 'USD',
      })),

      transactions: Array.from({ length: 500 }, (_, i) => ({
        id: `tx_${String(i).padStart(6, '0')}`,
        date: '2024-01-15',
        amount: Math.random() * 500,
        merchant: `Merchant ${i % 50}`,
        category: ['Food', 'Transport', 'Shopping', 'Bills'][i % 4],
        pending: i % 10 === 0,
      })),

      holdings: Array.from({ length: 25 }, (_, i) => ({
        symbol: `STOCK${i}`,
        shares: Math.floor(Math.random() * 100),
        costBasis: Math.random() * 200,
        currentPrice: Math.random() * 250,
      })),
    };

    const formatted = formatFinancialContext(financialData);

    // Verify all sections are present
    expect(formatted).toContain('ACCOUNTS');
    expect(formatted).toContain('TRANSACTIONS');
    expect(formatted).toContain('HOLDINGS');

    // Verify TOON format is used
    expect(formatted).toMatch(/\[\d+\]\{/g); // Multiple TOON headers

    // Verify token savings
    const jsonSize = JSON.stringify(financialData).length;
    const toonSize = formatted.length;

    expect(toonSize).toBeLessThan(jsonSize);
  });

  it('should round-trip encode/decode without data loss', () => {
    const originalData = [
      {
        id: 1,
        name: 'Complex Record',
        amount: 1234.56,
        date: '2024-01-15',
        active: true,
        notes: 'Special characters: ,;"',
      },
      {
        id: 2,
        name: 'Another Record',
        amount: 9876.54,
        date: '2024-01-16',
        active: false,
        notes: '',
      },
    ];

    const toon = encodeTOON(originalData);
    const decoded = decodeTOON(toon, { coerceTypes: true });

    expect(decoded).toHaveLength(originalData.length);
    expect(decoded[0].id).toBe(originalData[0].id);
    expect(decoded[0].name).toBe(originalData[0].name);
    expect(decoded[0].amount).toBe(originalData[0].amount);
    expect(decoded[0].active).toBe(originalData[0].active);
  });
});

describe('Performance benchmarks', () => {
  it('should encode 10K records in under 1 second', () => {
    const data = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      balance: Math.random() * 10000,
      created: '2024-01-15',
    }));

    const startTime = Date.now();
    const toon = encodeTOON(data);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000);
    expect(toon.length).toBeGreaterThan(0);
  });

  it('should decode 10K records in under 1 second', () => {
    const data = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      balance: Math.random() * 10000,
    }));

    const toon = encodeTOON(data);

    const startTime = Date.now();
    const decoded = decodeTOON(toon, { coerceTypes: true });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000);
    expect(decoded).toHaveLength(10000);
  });
});
