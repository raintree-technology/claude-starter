/**
 * TOON Token Measurement and Analytics
 *
 * Tools for measuring token consumption, comparing formats,
 * and tracking optimization savings.
 *
 * @module @claude/toon/measure
 * @version 1.0.0
 */

import { encodeTOON } from './encoder';
import {
  TokenMeasurement,
  TokenComparison,
  TOONEncodeOptions,
} from './types';

/**
 * Estimate token count from text
 *
 * Uses Claude's tokenization approximation:
 * ~1 token per 4 characters for English text
 * ~1 token per 3 characters for structured data
 *
 * For production use, consider using @anthropic-ai/tokenizer
 * for exact Claude token counts.
 *
 * @param text - Text to measure
 * @param format - Format type (affects estimation algorithm)
 * @returns Estimated token count
 */
export function estimateTokens(
  text: string,
  format: 'json' | 'toon' | 'yaml' | 'csv' = 'json'
): number {
  const bytes = new TextEncoder().encode(text).length;

  // Different formats have different token densities
  switch (format) {
    case 'json':
      // JSON has more structural overhead: {}, [], "", :
      // ~1 token per 3.5 characters
      return Math.ceil(bytes / 3.5);

    case 'toon':
      // TOON is more dense due to less overhead
      // ~1 token per 4.5 characters
      return Math.ceil(bytes / 4.5);

    case 'csv':
      // CSV is very dense
      // ~1 token per 5 characters
      return Math.ceil(bytes / 5);

    case 'yaml':
      // YAML is less dense due to whitespace
      // ~1 token per 3.8 characters
      return Math.ceil(bytes / 3.8);

    default:
      // Default: ~1 token per 4 characters
      return Math.ceil(bytes / 4);
  }
}

/**
 * Measure token usage for a dataset in a specific format
 *
 * @param data - Data to measure
 * @param format - Format to measure in
 * @param options - Format-specific options
 * @returns Measurement result
 *
 * @example
 * ```typescript
 * const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 *
 * const jsonMeasure = measureTokens(data, 'json');
 * console.log(`JSON: ${jsonMeasure.tokens} tokens, ${jsonMeasure.bytes} bytes`);
 *
 * const toonMeasure = measureTokens(data, 'toon');
 * console.log(`TOON: ${toonMeasure.tokens} tokens, ${toonMeasure.bytes} bytes`);
 * ```
 */
export function measureTokens(
  data: unknown[],
  format: 'json' | 'toon' | 'yaml' | 'csv',
  options?: TOONEncodeOptions
): TokenMeasurement {
  let serialized: string;

  switch (format) {
    case 'json':
      serialized = JSON.stringify(data, null, 2);
      break;

    case 'toon':
      serialized = encodeTOON(data, options);
      break;

    case 'yaml':
      serialized = convertToYAML(data);
      break;

    case 'csv':
      serialized = convertToCSV(data);
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const bytes = new TextEncoder().encode(serialized).length;
  const tokens = estimateTokens(serialized, format);

  return {
    format,
    tokens,
    bytes,
    recordCount: data.length,
    timestamp: new Date(),
  };
}

/**
 * Compare token usage across multiple formats
 *
 * @param data - Data to compare
 * @param baseline - Baseline format (default: 'json')
 * @param optimized - Optimized format (default: 'toon')
 * @param options - Encoding options
 * @returns Comparison result
 *
 * @example
 * ```typescript
 * const data = generateSampleData(100);
 * const comparison = compareFormats(data);
 *
 * console.log(`Baseline (JSON): ${comparison.baseline.tokens} tokens`);
 * console.log(`Optimized (TOON): ${comparison.optimized.tokens} tokens`);
 * console.log(`Savings: ${comparison.tokensSaved} tokens (${comparison.savingsPercent.toFixed(1)}%)`);
 * ```
 */
export function compareFormats(
  data: unknown[],
  baseline: 'json' | 'yaml' = 'json',
  optimized: 'toon' | 'csv' = 'toon',
  options?: {
    toonOptions?: TOONEncodeOptions;
    pricePerK?: number;
    currency?: string;
  }
): TokenComparison {
  const baselineMeasure = measureTokens(data, baseline);
  const optimizedMeasure = measureTokens(data, optimized, options?.toonOptions);

  const tokensSaved = baselineMeasure.tokens - optimizedMeasure.tokens;
  const savingsPercent = (tokensSaved / baselineMeasure.tokens) * 100;
  const bytesSaved = baselineMeasure.bytes - optimizedMeasure.bytes;

  const result: TokenComparison = {
    baseline: baselineMeasure,
    optimized: optimizedMeasure,
    tokensSaved,
    savingsPercent,
    bytesSaved,
  };

  // Calculate cost savings if price provided
  if (options?.pricePerK) {
    result.costSavings = {
      pricePerK: options.pricePerK,
      saved: (tokensSaved / 1000) * options.pricePerK,
      currency: options.currency ?? 'USD',
    };
  }

  return result;
}

/**
 * Run comprehensive format comparison across all formats
 *
 * @param data - Data to analyze
 * @returns Comparison matrix
 *
 * @example
 * ```typescript
 * const data = generateSampleData(1000);
 * const analysis = analyzeAllFormats(data);
 *
 * console.table(analysis.summary);
 * console.log(`Best format: ${analysis.bestFormat}`);
 * console.log(`Worst format: ${analysis.worstFormat}`);
 * ```
 */
export function analyzeAllFormats(data: unknown[]): {
  measurements: {
    json: TokenMeasurement;
    toon: TokenMeasurement;
    yaml: TokenMeasurement;
    csv: TokenMeasurement;
  };
  summary: Array<{
    format: string;
    tokens: number;
    bytes: number;
    savingsVsJSON: string;
  }>;
  bestFormat: string;
  worstFormat: string;
} {
  const measurements = {
    json: measureTokens(data, 'json'),
    toon: measureTokens(data, 'toon'),
    yaml: measureTokens(data, 'yaml'),
    csv: measureTokens(data, 'csv'),
  };

  const baseline = measurements.json.tokens;

  const summary = Object.entries(measurements).map(([format, measure]) => ({
    format,
    tokens: measure.tokens,
    bytes: measure.bytes,
    savingsVsJSON:
      format === 'json'
        ? 'baseline'
        : `${(((baseline - measure.tokens) / baseline) * 100).toFixed(1)}%`,
  }));

  // Sort by token count to find best/worst
  const sorted = Object.entries(measurements).sort(
    (a, b) => a[1].tokens - b[1].tokens
  );

  return {
    measurements,
    summary,
    bestFormat: sorted[0][0],
    worstFormat: sorted[sorted.length - 1][0],
  };
}

/**
 * Track token usage over time for analytics
 *
 * @example
 * ```typescript
 * const tracker = new TokenTracker();
 *
 * // Track API calls
 * tracker.recordUsage('api-call-1', data, 'json');
 * tracker.recordUsage('api-call-2', data, 'toon');
 *
 * // Get statistics
 * const stats = tracker.getStatistics();
 * console.log(`Total tokens saved: ${stats.totalTokensSaved}`);
 * console.log(`Average savings: ${stats.averageSavingsPercent.toFixed(1)}%`);
 * ```
 */
export class TokenTracker {
  private measurements: Map<
    string,
    {
      baseline: TokenMeasurement;
      optimized?: TokenMeasurement;
      timestamp: Date;
    }
  > = new Map();

  /**
   * Record token usage for a request
   */
  recordUsage(
    requestId: string,
    data: unknown[],
    format: 'json' | 'toon' | 'yaml' | 'csv',
    isOptimized: boolean = format === 'toon' || format === 'csv'
  ): void {
    const measurement = measureTokens(data, format);

    const existing = this.measurements.get(requestId);

    if (existing && isOptimized) {
      // Update with optimized measurement
      existing.optimized = measurement;
    } else {
      // Create new entry
      this.measurements.set(requestId, {
        baseline: measurement,
        optimized: isOptimized ? measurement : undefined,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get statistics across all tracked requests
   */
  getStatistics(): {
    totalRequests: number;
    totalTokensBaseline: number;
    totalTokensOptimized: number;
    totalTokensSaved: number;
    averageSavingsPercent: number;
    measurements: Array<{
      requestId: string;
      baseline: TokenMeasurement;
      optimized?: TokenMeasurement;
      saved: number;
      timestamp: Date;
    }>;
  } {
    const measurements = Array.from(this.measurements.entries()).map(
      ([requestId, data]) => {
        const saved = data.optimized
          ? data.baseline.tokens - data.optimized.tokens
          : 0;

        return {
          requestId,
          baseline: data.baseline,
          optimized: data.optimized,
          saved,
          timestamp: data.timestamp,
        };
      }
    );

    const totalTokensBaseline = measurements.reduce(
      (sum, m) => sum + m.baseline.tokens,
      0
    );

    const totalTokensOptimized = measurements.reduce(
      (sum, m) => sum + (m.optimized?.tokens ?? m.baseline.tokens),
      0
    );

    const totalTokensSaved = totalTokensBaseline - totalTokensOptimized;

    const averageSavingsPercent =
      (totalTokensSaved / totalTokensBaseline) * 100;

    return {
      totalRequests: this.measurements.size,
      totalTokensBaseline,
      totalTokensOptimized,
      totalTokensSaved,
      averageSavingsPercent,
      measurements,
    };
  }

  /**
   * Export data as CSV for analysis
   */
  exportCSV(): string {
    const stats = this.getStatistics();

    const rows = [
      'Request ID,Baseline Tokens,Optimized Tokens,Tokens Saved,Savings %,Timestamp',
    ];

    for (const m of stats.measurements) {
      const saved = m.optimized
        ? m.baseline.tokens - m.optimized.tokens
        : 0;
      const savingsPercent = m.optimized
        ? (saved / m.baseline.tokens) * 100
        : 0;

      rows.push(
        `${m.requestId},${m.baseline.tokens},${m.optimized?.tokens ?? 'N/A'},${saved},${savingsPercent.toFixed(2)},${m.timestamp.toISOString()}`
      );
    }

    return rows.join('\n');
  }

  /**
   * Clear all tracked data
   */
  clear(): void {
    this.measurements.clear();
  }
}

/**
 * Convert data to YAML format (simplified)
 *
 * @internal
 */
function convertToYAML(data: unknown[]): string {
  // Simplified YAML conversion - doesn't handle all edge cases
  const lines: string[] = [];

  for (const item of data) {
    lines.push('-');

    if (typeof item === 'object' && item !== null) {
      for (const [key, value] of Object.entries(item)) {
        lines.push(`  ${key}: ${formatYAMLValue(value)}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format value for YAML
 *
 * @internal
 */
function formatYAMLValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();

  return JSON.stringify(value);
}

/**
 * Convert data to CSV format
 *
 * @internal
 */
function convertToCSV(data: unknown[]): string {
  if (data.length === 0) return '';

  // Get all keys from first object
  const first = data[0];

  if (typeof first !== 'object' || first === null) {
    throw new Error('CSV format requires array of objects');
  }

  const keys = Object.keys(first);

  // Header row
  const lines = [keys.join(',')];

  // Data rows
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;

    const values = keys.map((key) => {
      const value = (item as Record<string, unknown>)[key];
      return formatCSVValue(value);
    });

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Format value for CSV
 *
 * @internal
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();

  const str = String(value);

  // Quote if contains comma, quote, or newline
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
