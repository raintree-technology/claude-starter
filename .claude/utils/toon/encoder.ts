/**
 * TOON Encoder - Convert JavaScript objects to TOON format
 *
 * Enterprise-grade encoder with streaming support, schema validation,
 * and comprehensive error handling.
 *
 * @module @claude/toon/encoder
 * @version 1.0.0
 */

import {
  TOONSchema,
  TOONFieldSchema,
  TOONEncodeOptions,
  TOONError,
  TOONErrorCode,
  TOONStats,
  isPlainObject,
  isTOONPrimitive,
} from './types';
import { inferSchema, validateSchema } from './schema';

/**
 * Encode data array to TOON format
 *
 * Converts an array of objects into tokenization-optimized TOON format.
 * Automatically infers schema unless explicitly provided.
 *
 * @param data - Array of objects to encode
 * @param options - Encoding options
 * @returns TOON-formatted string
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: 1, name: 'Alice', age: 30 },
 *   { id: 2, name: 'Bob', age: 25 }
 * ];
 *
 * const toon = encodeTOON(data);
 * // [2]{id,name,age}:
 * //   1,Alice,30
 * //   2,Bob,25
 * ```
 */
export function encodeTOON(
  data: unknown[],
  options: TOONEncodeOptions = {}
): string {
  const startTime = Date.now();

  // Validate input
  if (!Array.isArray(data)) {
    throw new TOONError(
      'Data must be an array',
      TOONErrorCode.INVALID_INPUT,
      { dataType: typeof data }
    );
  }

  if (data.length === 0) {
    return '[0]{}:';
  }

  // Get or infer schema
  const schema = options.schema ?? (options.inferSchema !== false
    ? inferSchema(data)
    : undefined);

  if (!schema) {
    throw new TOONError(
      'Schema required when inferSchema is disabled',
      TOONErrorCode.SCHEMA_INFERENCE_FAILED
    );
  }

  // Validate if requested
  if (options.validate !== false) {
    const validation = validateSchema(data, schema);
    if (!validation.valid) {
      throw new TOONError(
        'Schema validation failed',
        TOONErrorCode.SCHEMA_VALIDATION_FAILED,
        { errors: validation.errors }
      );
    }
  }

  try {
    // Encode
    const result = encodeWithSchema(data as Record<string, unknown>[], schema, options);

    // Return result
    return result;
  } catch (error) {
    if (error instanceof TOONError) {
      throw error;
    }

    throw new TOONError(
      `Encoding failed: ${error instanceof Error ? error.message : String(error)}`,
      TOONErrorCode.ENCODE_ERROR,
      { originalError: error }
    );
  }
}

/**
 * Encode data with a known schema
 *
 * @internal
 */
function encodeWithSchema(
  data: Record<string, unknown>[],
  schema: TOONSchema,
  options: TOONEncodeOptions
): string {
  const indent = options.indent ?? '  ';
  const parts: string[] = [];

  // Build header: [count]{field1,field2,...}:
  const header = buildHeader(schema, data.length);
  parts.push(header);

  // Encode each record
  for (const record of data) {
    const row = encodeRecord(record, schema, options);
    parts.push(indent + row);
  }

  return parts.join('\n');
}

/**
 * Build TOON header from schema
 *
 * @internal
 */
export function buildHeader(schema: TOONSchema, count: number): string {
  const fields = schema.fields.map((f) => buildFieldHeader(f)).join(',');
  return `[${count}]{${fields}}:`;
}

/**
 * Build field header (including nested structures)
 *
 * @internal
 */
function buildFieldHeader(field: TOONFieldSchema): string {
  if (field.type === 'array' && field.items) {
    // Array notation: fieldName[{nestedFields}]
    const itemFields = field.items.fields.map((f) => buildFieldHeader(f)).join(',');
    return `${field.name}[{${itemFields}}]`;
  } else if (field.type === 'object' && field.properties) {
    // Object notation: fieldName{nestedFields}
    const propFields = field.properties.fields.map((f) => buildFieldHeader(f)).join(',');
    return `${field.name}{${propFields}}`;
  } else {
    // Simple field
    return field.name;
  }
}

/**
 * Encode a single record
 *
 * @internal
 */
export function encodeRecord(
  record: Record<string, unknown>,
  schema: TOONSchema,
  options: TOONEncodeOptions
): string {
  const values = schema.fields.map((field) => {
    const value = record[field.name];
    return encodeValue(value, field, options);
  });

  return values.join(',');
}

/**
 * Encode a single value
 *
 * @internal
 */
function encodeValue(
  value: unknown,
  fieldSchema: TOONFieldSchema,
  options: TOONEncodeOptions
): string {
  // Handle null
  if (value === null || value === undefined) {
    switch (options.nullHandling ?? 'empty') {
      case 'empty':
        return '';
      case 'null':
        return 'null';
      case 'skip':
        return '';
      default:
        return '';
    }
  }

  // Handle dates
  if (value instanceof Date) {
    return encodeDate(value, options);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return encodeArray(value, fieldSchema, options);
  }

  // Handle objects
  if (isPlainObject(value)) {
    return encodeObject(value, fieldSchema, options);
  }

  // Handle primitives
  if (typeof value === 'string') {
    return encodeString(value, options);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  throw new TOONError(
    `Cannot encode value of type ${typeof value}`,
    TOONErrorCode.UNSUPPORTED_TYPE,
    { value, fieldSchema }
  );
}

/**
 * Encode a string value with proper escaping
 *
 * @internal
 */
function encodeString(str: string, options: TOONEncodeOptions): string {
  const strategy = options.escapeStrategy ?? 'quotes';

  // Check if escaping is needed
  const needsEscape = /[,\n\r"]/.test(str);

  if (!needsEscape) {
    return str;
  }

  switch (strategy) {
    case 'quotes':
      // Wrap in quotes and escape internal quotes
      return `"${str.replace(/"/g, '""')}"`;

    case 'backslash':
      // Use backslash escaping
      return str
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');

    case 'url':
      // URL encode
      return encodeURIComponent(str);

    default:
      return str;
  }
}

/**
 * Encode a Date value
 *
 * @internal
 */
function encodeDate(date: Date, options: TOONEncodeOptions): string {
  const format = options.dateFormat ?? 'iso';

  switch (format) {
    case 'iso':
      return date.toISOString();

    case 'unix':
      return String(Math.floor(date.getTime() / 1000));

    case 'custom':
      if (!options.dateFormatter) {
        throw new TOONError(
          'dateFormatter required when dateFormat is "custom"',
          TOONErrorCode.ENCODE_ERROR
        );
      }
      return options.dateFormatter(date);

    default:
      return date.toISOString();
  }
}

/**
 * Encode an array value
 *
 * @internal
 */
function encodeArray(
  arr: unknown[],
  fieldSchema: TOONFieldSchema,
  options: TOONEncodeOptions
): string {
  if (arr.length === 0) {
    return '[]';
  }

  // Check if array of primitives or objects
  if (fieldSchema.items && isPlainObject(arr[0])) {
    // Array of objects - use nested encoding
    const items = arr.map((item) => {
      if (!isPlainObject(item)) {
        throw new TOONError(
          'Mixed array types not supported',
          TOONErrorCode.ENCODE_ERROR,
          { item }
        );
      }

      const encoded = encodeRecord(item, fieldSchema.items!, options);
      return `{${encoded}}`;
    });

    return `[${items.join(',')}]`;
  } else {
    // Array of primitives
    const items = arr.map((item) =>
      encodeValue(
        item,
        { name: '', type: typeof item as any },
        options
      )
    );

    return `[${items.join(',')}]`;
  }
}

/**
 * Encode an object value
 *
 * @internal
 */
function encodeObject(
  obj: Record<string, unknown>,
  fieldSchema: TOONFieldSchema,
  options: TOONEncodeOptions
): string {
  if (!fieldSchema.properties) {
    // No schema for nested object - encode as JSON
    return JSON.stringify(obj);
  }

  const encoded = encodeRecord(obj, fieldSchema.properties, options);
  return `{${encoded}}`;
}

/**
 * Calculate encoding statistics
 *
 * @param data - Original data
 * @param encoded - Encoded TOON string
 * @param processingTimeMs - Time taken to encode
 * @returns Statistics
 */
export function getEncodingStats(
  data: unknown[],
  encoded: string,
  processingTimeMs: number
): TOONStats {
  const bytesProcessed = new TextEncoder().encode(encoded).length;
  const recordsProcessed = data.length;

  return {
    recordsProcessed,
    bytesProcessed,
    processingTimeMs,
    recordsPerSecond: (recordsProcessed / processingTimeMs) * 1000,
    mbPerSecond: (bytesProcessed / processingTimeMs / 1000) * 1000 / (1024 * 1024),
  };
}

/**
 * Encode data to TOON with statistics
 *
 * @param data - Data to encode
 * @param options - Encoding options
 * @returns Encoded string and statistics
 */
export function encodeTOONWithStats(
  data: unknown[],
  options: TOONEncodeOptions = {}
): { encoded: string; stats: TOONStats } {
  const startTime = Date.now();
  const encoded = encodeTOON(data, options);
  const processingTimeMs = Date.now() - startTime;

  const stats = getEncodingStats(data, encoded, processingTimeMs);

  return { encoded, stats };
}
