/**
 * TOON (Tokenization-Optimized Object Notation)
 *
 * Enterprise-grade library for reducing LLM token consumption
 * by 40-61% through optimized data serialization.
 *
 * @module @claude/toon
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { encodeTOON, decodeTOON, compareFormats } from '@claude/toon';
 *
 * // Encode data
 * const data = [
 *   { id: 1, name: 'Alice', age: 30 },
 *   { id: 2, name: 'Bob', age: 25 }
 * ];
 *
 * const toon = encodeTOON(data);
 * console.log(toon);
 * // [2]{id,name,age}:
 * //   1,Alice,30
 * //   2,Bob,25
 *
 * // Decode data
 * const decoded = decodeTOON(toon);
 * console.log(decoded);
 * // [{ id: 1, name: 'Alice', age: 30 }, { id: 2, name: 'Bob', age: 25 }]
 *
 * // Compare formats
 * const comparison = compareFormats(data);
 * console.log(`Token savings: ${comparison.savingsPercent.toFixed(1)}%`);
 * ```
 */

// Core encoding/decoding
export {
  encodeTOON,
  encodeTOONWithStats,
  getEncodingStats,
  encodeRecord,
  buildHeader,
} from './encoder';

export {
  decodeTOON,
  decodeTOONWithStats,
} from './decoder';

// Schema management
export {
  inferSchema,
  validateSchema,
  mergeSchemas,
  areSchemasCompatible,
} from './schema';

// Streaming support
export {
  TOONStreamEncoder,
  TOONStreamDecoder,
  createTOONStream,
} from './stream';

// Token measurement
export {
  estimateTokens,
  measureTokens,
  compareFormats,
  analyzeAllFormats,
  TokenTracker,
} from './measure';

// LLM integration
export {
  formatFinancialContext,
  getTOONSystemPrompt,
  prepareClaudeRequest,
  calculateAPICost,
} from './llm';

export type { FinancialContext } from './llm';

// Types
export type {
  TOONPrimitive,
  TOONDataType,
  TOONFieldSchema,
  TOONSchema,
  TOONEncodeOptions,
  TOONDecodeOptions,
  TOONStreamOptions,
  TokenMeasurement,
  TokenComparison,
  TOONValidationResult,
  TOONValidationError,
  TOONStats,
} from './types';

export {
  TOONError,
  TOONErrorCode,
  isTOONPrimitive,
  isPlainObject,
  isArrayOfObjects,
} from './types';

/**
 * TOON library version
 */
export const VERSION = '1.0.0';

/**
 * Quick start helper - encode, decode, and compare in one call
 *
 * @param data - Data to process
 * @returns Results including encoded TOON, decoded data, and comparison
 *
 * @example
 * ```typescript
 * import { quickStart } from '@claude/toon';
 *
 * const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * const result = quickStart(data);
 *
 * console.log('TOON format:', result.toon);
 * console.log('Decoded:', result.decoded);
 * console.log('Token savings:', result.comparison.savingsPercent.toFixed(1) + '%');
 * ```
 */
export function quickStart(data: unknown[]) {
  const { encodeTOON } = require('./encoder');
  const { decodeTOON } = require('./decoder');
  const { compareFormats } = require('./measure');

  const toon = encodeTOON(data);
  const decoded = decodeTOON(toon);
  const comparison = compareFormats(data);

  return {
    toon,
    decoded,
    comparison,
    summary: {
      records: data.length,
      jsonTokens: comparison.baseline.tokens,
      toonTokens: comparison.optimized.tokens,
      savingsPercent: comparison.savingsPercent,
    },
  };
}
