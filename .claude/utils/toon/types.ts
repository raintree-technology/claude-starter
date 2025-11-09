/**
 * TOON (Tokenization-Optimized Object Notation) - Type Definitions
 *
 * Enterprise-grade type system for TOON format encoding/decoding.
 * Provides full TypeScript support with strict type safety.
 *
 * @module @claude/toon/types
 * @version 1.0.0
 */

/**
 * Primitive types supported by TOON format
 */
export type TOONPrimitive = string | number | boolean | null | Date;

/**
 * Valid TOON data types for schema definition
 */
export type TOONDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'date'
  | 'array'
  | 'object';

/**
 * Field definition in a TOON schema
 */
export interface TOONFieldSchema {
  /** Field name */
  name: string;

  /** Data type of the field */
  type: TOONDataType;

  /** Whether the field can be null */
  nullable?: boolean;

  /** For arrays: schema of array elements */
  items?: TOONSchema;

  /** For objects: nested schema */
  properties?: TOONSchema;

  /** Optional field description for documentation */
  description?: string;
}

/**
 * Complete TOON schema definition
 */
export interface TOONSchema {
  /** Schema fields in order */
  fields: TOONFieldSchema[];

  /** Optional schema metadata */
  metadata?: {
    /** Schema version */
    version?: string;

    /** Schema description */
    description?: string;

    /** Creation timestamp */
    createdAt?: Date;
  };
}

/**
 * TOON encoding options
 */
export interface TOONEncodeOptions {
  /** Whether to include type hints in output (default: false) */
  includeTypeHints?: boolean;

  /** Indentation for nested structures (default: 2 spaces) */
  indent?: string;

  /** Whether to infer schema automatically (default: true) */
  inferSchema?: boolean;

  /** Explicit schema to use (overrides inference) */
  schema?: TOONSchema;

  /** Whether to validate data against schema (default: true) */
  validate?: boolean;

  /** Date serialization format (default: 'iso') */
  dateFormat?: 'iso' | 'unix' | 'custom';

  /** Custom date formatter (requires dateFormat: 'custom') */
  dateFormatter?: (date: Date) => string;

  /** How to handle null values (default: 'empty') */
  nullHandling?: 'empty' | 'null' | 'skip';

  /** Escape strategy for special characters (default: 'quotes') */
  escapeStrategy?: 'quotes' | 'backslash' | 'url';
}

/**
 * TOON decoding options
 */
export interface TOONDecodeOptions {
  /** Schema to use for parsing (required for type coercion) */
  schema?: TOONSchema;

  /** Whether to strictly validate against schema (default: false) */
  strict?: boolean;

  /** Date parsing format (default: 'auto') */
  dateFormat?: 'auto' | 'iso' | 'unix' | 'custom';

  /** Custom date parser (requires dateFormat: 'custom') */
  dateParser?: (value: string) => Date;

  /** Whether to coerce types (e.g., "123" -> 123) */
  coerceTypes?: boolean;

  /** How to handle missing fields (default: 'null') */
  missingFieldHandling?: 'null' | 'undefined' | 'error';
}

/**
 * Streaming encoder options
 */
export interface TOONStreamOptions extends TOONEncodeOptions {
  /** Chunk size for batching (default: 100 records) */
  chunkSize?: number;

  /** Whether to write header immediately (default: true) */
  writeHeaderImmediately?: boolean;

  /** High water mark for backpressure (default: 16KB) */
  highWaterMark?: number;
}

/**
 * Token measurement result
 */
export interface TokenMeasurement {
  /** Format measured */
  format: 'json' | 'toon' | 'yaml' | 'csv';

  /** Estimated token count */
  tokens: number;

  /** Byte size */
  bytes: number;

  /** Number of records */
  recordCount: number;

  /** Timestamp of measurement */
  timestamp: Date;
}

/**
 * Token comparison result
 */
export interface TokenComparison {
  /** Baseline measurement (usually JSON) */
  baseline: TokenMeasurement;

  /** Optimized measurement (usually TOON) */
  optimized: TokenMeasurement;

  /** Absolute token savings */
  tokensSaved: number;

  /** Percentage savings */
  savingsPercent: number;

  /** Absolute byte savings */
  bytesSaved: number;

  /** Cost savings (based on token pricing) */
  costSavings?: {
    /** Price per 1K tokens */
    pricePerK: number;

    /** Absolute cost saved */
    saved: number;

    /** Currency */
    currency: string;
  };
}

/**
 * Validation error details
 */
export interface TOONValidationError {
  /** Field that failed validation */
  field: string;

  /** Expected type */
  expected: TOONDataType;

  /** Actual value received */
  actual: unknown;

  /** Error message */
  message: string;

  /** Path to the field (for nested objects) */
  path?: string[];
}

/**
 * Validation result
 */
export interface TOONValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors (if any) */
  errors: TOONValidationError[];

  /** Warnings (non-fatal issues) */
  warnings?: string[];
}

/**
 * TOON encoder/decoder statistics
 */
export interface TOONStats {
  /** Number of records processed */
  recordsProcessed: number;

  /** Total bytes processed */
  bytesProcessed: number;

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Records per second */
  recordsPerSecond: number;

  /** Megabytes per second */
  mbPerSecond: number;
}

/**
 * Error thrown during TOON operations
 */
export class TOONError extends Error {
  constructor(
    message: string,
    public readonly code: TOONErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TOONError';
    Object.setPrototypeOf(this, TOONError.prototype);
  }
}

/**
 * TOON error codes
 */
export enum TOONErrorCode {
  /** Schema inference failed */
  SCHEMA_INFERENCE_FAILED = 'SCHEMA_INFERENCE_FAILED',

  /** Schema validation failed */
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',

  /** Invalid input data */
  INVALID_INPUT = 'INVALID_INPUT',

  /** Parsing failed */
  PARSE_ERROR = 'PARSE_ERROR',

  /** Encoding failed */
  ENCODE_ERROR = 'ENCODE_ERROR',

  /** Type coercion failed */
  TYPE_COERCION_FAILED = 'TYPE_COERCION_FAILED',

  /** Unsupported data type */
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',

  /** Missing required field */
  MISSING_FIELD = 'MISSING_FIELD',
}

/**
 * Type guard: check if value is a TOON primitive
 */
export function isTOONPrimitive(value: unknown): value is TOONPrimitive {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value instanceof Date
  );
}

/**
 * Type guard: check if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/**
 * Type guard: check if value is an array of objects
 */
export function isArrayOfObjects(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isPlainObject);
}
