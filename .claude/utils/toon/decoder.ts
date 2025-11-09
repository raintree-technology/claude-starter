/**
 * TOON Decoder - Parse TOON format back to JavaScript objects
 *
 * Enterprise-grade decoder with type coercion, validation,
 * and comprehensive error handling.
 *
 * @module @claude/toon/decoder
 * @version 1.0.0
 */

import {
  TOONSchema,
  TOONFieldSchema,
  TOONDecodeOptions,
  TOONError,
  TOONErrorCode,
  TOONStats,
  isPlainObject,
} from './types';

/**
 * Decode TOON format string back to JavaScript objects
 *
 * Parses TOON-formatted string and reconstructs original data structure.
 * Supports type coercion, validation, and nested structures.
 *
 * @param toon - TOON-formatted string
 * @param options - Decoding options
 * @returns Array of decoded objects
 *
 * @example
 * ```typescript
 * const toon = `[2]{id,name,age}:
 *   1,Alice,30
 *   2,Bob,25`;
 *
 * const data = decodeTOON(toon);
 * // [
 * //   { id: 1, name: 'Alice', age: 30 },
 * //   { id: 2, name: 'Bob', age: 25 }
 * // ]
 * ```
 */
export function decodeTOON(
  toon: string,
  options: TOONDecodeOptions = {}
): Record<string, unknown>[] {
  if (typeof toon !== 'string') {
    throw new TOONError(
      'Input must be a string',
      TOONErrorCode.INVALID_INPUT,
      { inputType: typeof toon }
    );
  }

  if (toon.trim().length === 0) {
    return [];
  }

  try {
    // Parse header and extract schema
    const { schema, count, bodyStart } = parseHeader(toon);

    // Parse body
    const lines = toon
      .substring(bodyStart)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length !== count) {
      throw new TOONError(
        `Expected ${count} records but found ${lines.length}`,
        TOONErrorCode.PARSE_ERROR,
        { expected: count, actual: lines.length }
      );
    }

    // Decode each line
    const results: Record<string, unknown>[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const record = decodeLine(line, schema, options);
      results.push(record);
    }

    return results;
  } catch (error) {
    if (error instanceof TOONError) {
      throw error;
    }

    throw new TOONError(
      `Decoding failed: ${error instanceof Error ? error.message : String(error)}`,
      TOONErrorCode.PARSE_ERROR,
      { originalError: error }
    );
  }
}

/**
 * Parse TOON header to extract schema and metadata
 *
 * Header format: [count]{field1,field2,...}:
 *
 * @internal
 */
function parseHeader(toon: string): {
  schema: TOONSchema;
  count: number;
  bodyStart: number;
} {
  // Match header pattern: [count]{fields}:
  const headerMatch = toon.match(/^\[(\d+)\]\{([^}]+)\}:/);

  if (!headerMatch) {
    throw new TOONError(
      'Invalid TOON header format',
      TOONErrorCode.PARSE_ERROR,
      { header: toon.substring(0, 100) }
    );
  }

  const count = parseInt(headerMatch[1], 10);
  const fieldsStr = headerMatch[2];
  const bodyStart = headerMatch[0].length;

  // Parse field definitions
  const fields = parseFieldDefinitions(fieldsStr);

  const schema: TOONSchema = {
    fields,
    metadata: {
      version: '1.0.0',
      description: 'Parsed from TOON format',
      createdAt: new Date(),
    },
  };

  return { schema, count, bodyStart };
}

/**
 * Parse field definitions from header
 *
 * Supports nested structures:
 * - Simple: field1,field2
 * - Object: user{id,name}
 * - Array: items[{id,name}]
 *
 * @internal
 */
function parseFieldDefinitions(fieldsStr: string): TOONFieldSchema[] {
  const fields: TOONFieldSchema[] = [];
  let current = '';
  let depth = 0;
  let inBracket = false;

  for (let i = 0; i < fieldsStr.length; i++) {
    const char = fieldsStr[i];

    if (char === '{' || char === '[') {
      depth++;
      if (char === '[') inBracket = true;
      current += char;
    } else if (char === '}' || char === ']') {
      depth--;
      if (char === ']') inBracket = false;
      current += char;
    } else if (char === ',' && depth === 0) {
      // End of field
      fields.push(parseFieldDefinition(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  if (current.trim()) {
    fields.push(parseFieldDefinition(current.trim()));
  }

  return fields;
}

/**
 * Parse a single field definition
 *
 * @internal
 */
function parseFieldDefinition(fieldDef: string): TOONFieldSchema {
  // Check for array: fieldName[{...}]
  const arrayMatch = fieldDef.match(/^(\w+)\[\{([^}]+)\}\]$/);
  if (arrayMatch) {
    const name = arrayMatch[1];
    const itemFields = parseFieldDefinitions(arrayMatch[2]);

    return {
      name,
      type: 'array',
      items: {
        fields: itemFields,
      },
    };
  }

  // Check for object: fieldName{...}
  const objectMatch = fieldDef.match(/^(\w+)\{([^}]+)\}$/);
  if (objectMatch) {
    const name = objectMatch[1];
    const propFields = parseFieldDefinitions(objectMatch[2]);

    return {
      name,
      type: 'object',
      properties: {
        fields: propFields,
      },
    };
  }

  // Simple field
  return {
    name: fieldDef,
    type: 'string', // Default type, will be coerced if needed
  };
}

/**
 * Decode a single line into a record
 *
 * @internal
 */
function decodeLine(
  line: string,
  schema: TOONSchema,
  options: TOONDecodeOptions
): Record<string, unknown> {
  const values = parseValues(line);

  if (values.length !== schema.fields.length) {
    throw new TOONError(
      `Field count mismatch: expected ${schema.fields.length} but got ${values.length}`,
      TOONErrorCode.PARSE_ERROR,
      { expected: schema.fields.length, actual: values.length, line }
    );
  }

  const record: Record<string, unknown> = {};

  for (let i = 0; i < schema.fields.length; i++) {
    const field = schema.fields[i];
    const value = values[i];

    record[field.name] = decodeValue(value, field, options);
  }

  return record;
}

/**
 * Parse values from a line, respecting quotes and nested structures
 *
 * @internal
 */
function parseValues(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let depth = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === '{' || char === '[') && !inQuotes) {
      depth++;
      current += char;
    } else if ((char === '}' || char === ']') && !inQuotes) {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  if (current.length > 0 || line.endsWith(',')) {
    values.push(current.trim());
  }

  return values;
}

/**
 * Decode a single value with type coercion
 *
 * @internal
 */
function decodeValue(
  value: string,
  fieldSchema: TOONFieldSchema,
  options: TOONDecodeOptions
): unknown {
  // Handle empty/null
  if (value === '' || value === 'null') {
    const handling = options.missingFieldHandling ?? 'null';

    switch (handling) {
      case 'null':
        return null;
      case 'undefined':
        return undefined;
      case 'error':
        throw new TOONError(
          `Missing value for field '${fieldSchema.name}'`,
          TOONErrorCode.MISSING_FIELD,
          { field: fieldSchema.name }
        );
    }
  }

  // Handle quoted strings
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }

  // Handle arrays
  if (value.startsWith('[') && value.endsWith(']')) {
    return decodeArray(value, fieldSchema, options);
  }

  // Handle objects
  if (value.startsWith('{') && value.endsWith('}')) {
    return decodeObject(value, fieldSchema, options);
  }

  // Type coercion
  if (options.coerceTypes !== false) {
    return coerceType(value, fieldSchema, options);
  }

  return value;
}

/**
 * Decode an array value
 *
 * @internal
 */
function decodeArray(
  value: string,
  fieldSchema: TOONFieldSchema,
  options: TOONDecodeOptions
): unknown[] {
  // Extract array content: [item1,item2,...]
  const content = value.slice(1, -1).trim();

  if (content.length === 0) {
    return [];
  }

  // Parse array items
  const items = parseValues(content);

  // Decode each item
  return items.map((item) => {
    if (fieldSchema.items) {
      return decodeValue(item, fieldSchema.items.fields[0], options);
    } else {
      // Try to infer type
      return decodeValue(item, { name: '', type: 'string' }, options);
    }
  });
}

/**
 * Decode an object value
 *
 * @internal
 */
function decodeObject(
  value: string,
  fieldSchema: TOONFieldSchema,
  options: TOONDecodeOptions
): Record<string, unknown> {
  // Extract object content: {field1,field2,...}
  const content = value.slice(1, -1).trim();

  if (content.length === 0) {
    return {};
  }

  if (!fieldSchema.properties) {
    // No schema - try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      throw new TOONError(
        `Cannot decode object without schema: ${value}`,
        TOONErrorCode.PARSE_ERROR,
        { value }
      );
    }
  }

  // Parse with schema
  return decodeLine(content, fieldSchema.properties, options);
}

/**
 * Coerce value to appropriate type
 *
 * @internal
 */
function coerceType(
  value: string,
  fieldSchema: TOONFieldSchema,
  options: TOONDecodeOptions
): unknown {
  // Try to infer type from schema or value
  const targetType = fieldSchema.type ?? inferTypeFromValue(value);

  try {
    switch (targetType) {
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Cannot coerce "${value}" to number`);
        }
        return num;
      }

      case 'boolean':
        if (value === 'true') return true;
        if (value === 'false') return false;
        throw new Error(`Cannot coerce "${value}" to boolean`);

      case 'date': {
        const dateFormat = options.dateFormat ?? 'auto';

        if (dateFormat === 'auto') {
          // Try ISO first, then unix timestamp
          const isoDate = new Date(value);
          if (!isNaN(isoDate.getTime())) {
            return isoDate;
          }

          const unixTimestamp = Number(value);
          if (!isNaN(unixTimestamp)) {
            return new Date(unixTimestamp * 1000);
          }

          throw new Error(`Cannot parse date: ${value}`);
        } else if (dateFormat === 'iso') {
          return new Date(value);
        } else if (dateFormat === 'unix') {
          return new Date(Number(value) * 1000);
        } else if (dateFormat === 'custom' && options.dateParser) {
          return options.dateParser(value);
        }

        throw new Error(`Unsupported date format: ${dateFormat}`);
      }

      case 'string':
      default:
        return value;
    }
  } catch (error) {
    throw new TOONError(
      `Type coercion failed for field '${fieldSchema.name}': ${
        error instanceof Error ? error.message : String(error)
      }`,
      TOONErrorCode.TYPE_COERCION_FAILED,
      { field: fieldSchema.name, value, targetType }
    );
  }
}

/**
 * Infer type from value string
 *
 * @internal
 */
function inferTypeFromValue(value: string): 'string' | 'number' | 'boolean' | 'date' {
  // Check boolean
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }

  // Check number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return 'number';
  }

  // Check date (ISO format)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return 'date';
  }

  return 'string';
}

/**
 * Decode TOON with statistics
 *
 * @param toon - TOON string to decode
 * @param options - Decoding options
 * @returns Decoded data and statistics
 */
export function decodeTOONWithStats(
  toon: string,
  options: TOONDecodeOptions = {}
): { data: Record<string, unknown>[]; stats: TOONStats } {
  const startTime = Date.now();
  const data = decodeTOON(toon, options);
  const processingTimeMs = Date.now() - startTime;

  const bytesProcessed = new TextEncoder().encode(toon).length;

  const stats: TOONStats = {
    recordsProcessed: data.length,
    bytesProcessed,
    processingTimeMs,
    recordsPerSecond: (data.length / processingTimeMs) * 1000,
    mbPerSecond: (bytesProcessed / processingTimeMs / 1000) * 1000 / (1024 * 1024),
  };

  return { data, stats };
}
