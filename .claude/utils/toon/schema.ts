/**
 * TOON Schema Inference and Validation
 *
 * Enterprise-grade schema inference with validation, type coercion,
 * and comprehensive error reporting.
 *
 * @module @claude/toon/schema
 * @version 1.0.0
 */

import {
  TOONSchema,
  TOONFieldSchema,
  TOONDataType,
  TOONValidationResult,
  TOONValidationError,
  TOONError,
  TOONErrorCode,
  isPlainObject,
  isTOONPrimitive,
} from './types';

/**
 * Infer TOON schema from data array
 *
 * Analyzes the structure of input data to automatically generate
 * a schema definition. Uses multiple samples to handle nullable fields.
 *
 * @param data - Array of objects to analyze
 * @param options - Inference options
 * @returns Inferred schema
 *
 * @example
 * ```typescript
 * const data = [
 *   { id: 1, name: 'Alice', age: 30 },
 *   { id: 2, name: 'Bob', age: null }
 * ];
 *
 * const schema = inferSchema(data);
 * // {
 * //   fields: [
 * //     { name: 'id', type: 'number', nullable: false },
 * //     { name: 'name', type: 'string', nullable: false },
 * //     { name: 'age', type: 'number', nullable: true }
 * //   ]
 * // }
 * ```
 */
export function inferSchema(
  data: unknown[],
  options: {
    /** Number of samples to analyze (default: all) */
    sampleSize?: number;
    /** Whether to analyze all records for nullable detection (default: true) */
    strictNullable?: boolean;
  } = {}
): TOONSchema {
  if (!Array.isArray(data) || data.length === 0) {
    throw new TOONError(
      'Cannot infer schema from empty or non-array data',
      TOONErrorCode.SCHEMA_INFERENCE_FAILED,
      { dataType: typeof data, length: Array.isArray(data) ? data.length : 'N/A' }
    );
  }

  const { sampleSize = data.length, strictNullable = true } = options;

  // Use sample or all data
  const samples = sampleSize < data.length ? data.slice(0, sampleSize) : data;

  // Verify all samples are objects
  if (!samples.every(isPlainObject)) {
    throw new TOONError(
      'All array elements must be plain objects',
      TOONErrorCode.SCHEMA_INFERENCE_FAILED,
      { invalidTypes: samples.filter((s) => !isPlainObject(s)).map((s) => typeof s) }
    );
  }

  // Collect all unique keys across samples
  const allKeys = new Set<string>();
  samples.forEach((sample) => {
    Object.keys(sample).forEach((key) => allKeys.add(key));
  });

  // Infer schema for each field
  const fields: TOONFieldSchema[] = Array.from(allKeys).map((key) => {
    return inferFieldSchema(key, samples, strictNullable);
  });

  return {
    fields,
    metadata: {
      version: '1.0.0',
      description: `Auto-generated schema from ${data.length} records`,
      createdAt: new Date(),
    },
  };
}

/**
 * Infer schema for a single field across multiple samples
 *
 * @internal
 */
function inferFieldSchema(
  fieldName: string,
  samples: Record<string, unknown>[],
  strictNullable: boolean
): TOONFieldSchema {
  const values = samples.map((s) => s[fieldName]);

  // Check if field is nullable
  const hasNull = values.some((v) => v === null || v === undefined);

  // Get non-null values for type inference
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);

  if (nonNullValues.length === 0) {
    // All values are null
    return {
      name: fieldName,
      type: 'null',
      nullable: true,
    };
  }

  // Infer type from first non-null value
  const firstValue = nonNullValues[0];
  const baseType = inferType(firstValue);

  // For arrays and objects, infer nested schema
  let fieldSchema: TOONFieldSchema = {
    name: fieldName,
    type: baseType,
    nullable: strictNullable ? hasNull : false,
  };

  if (baseType === 'array' && Array.isArray(firstValue)) {
    // Infer array item schema
    if (firstValue.length > 0 && isPlainObject(firstValue[0])) {
      // Array of objects - infer schema from all array items
      const allArrayItems = nonNullValues.flatMap((v) =>
        Array.isArray(v) ? v.filter(isPlainObject) : []
      );

      if (allArrayItems.length > 0) {
        fieldSchema.items = inferSchema(allArrayItems, { strictNullable });
      }
    }
  } else if (baseType === 'object' && isPlainObject(firstValue)) {
    // Nested object - infer schema
    const nestedObjects = nonNullValues.filter(isPlainObject);
    fieldSchema.properties = inferSchema(nestedObjects, { strictNullable });
  }

  return fieldSchema;
}

/**
 * Infer type from a single value
 *
 * @internal
 */
function inferType(value: unknown): TOONDataType {
  if (value === null || value === undefined) return 'null';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';

  throw new TOONError(
    `Unsupported type: ${typeof value}`,
    TOONErrorCode.UNSUPPORTED_TYPE,
    { value, type: typeof value }
  );
}

/**
 * Validate data against a TOON schema
 *
 * Performs comprehensive validation including type checking,
 * null handling, and nested structure validation.
 *
 * @param data - Data to validate
 * @param schema - Schema to validate against
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const schema: TOONSchema = {
 *   fields: [
 *     { name: 'id', type: 'number', nullable: false },
 *     { name: 'name', type: 'string', nullable: false }
 *   ]
 * };
 *
 * const result = validateSchema(
 *   [{ id: 1, name: 'Alice' }],
 *   schema
 * );
 *
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateSchema(
  data: unknown[],
  schema: TOONSchema,
  options: {
    /** Whether to stop at first error (default: false) */
    failFast?: boolean;
    /** Whether to allow extra fields (default: true) */
    allowExtraFields?: boolean;
  } = {}
): TOONValidationResult {
  const { failFast = false, allowExtraFields = true } = options;
  const errors: TOONValidationError[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(data)) {
    errors.push({
      field: 'root',
      expected: 'array',
      actual: typeof data,
      message: 'Data must be an array',
    });

    return { valid: false, errors, warnings };
  }

  // Validate each record
  for (let i = 0; i < data.length; i++) {
    const record = data[i];

    if (!isPlainObject(record)) {
      errors.push({
        field: `[${i}]`,
        expected: 'object',
        actual: typeof record,
        message: `Record at index ${i} must be an object`,
      });

      if (failFast) break;
      continue;
    }

    // Validate each field in schema
    for (const fieldSchema of schema.fields) {
      const value = record[fieldSchema.name];
      const path = [`[${i}]`, fieldSchema.name];

      const fieldErrors = validateField(value, fieldSchema, path);
      errors.push(...fieldErrors);

      if (failFast && fieldErrors.length > 0) break;
    }

    // Check for extra fields
    if (!allowExtraFields) {
      const schemaFields = new Set(schema.fields.map((f) => f.name));
      const extraFields = Object.keys(record).filter((k) => !schemaFields.has(k));

      if (extraFields.length > 0) {
        warnings.push(
          `Record at index ${i} has extra fields: ${extraFields.join(', ')}`
        );
      }
    }

    if (failFast && errors.length > 0) break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate a single field value against its schema
 *
 * @internal
 */
function validateField(
  value: unknown,
  fieldSchema: TOONFieldSchema,
  path: string[]
): TOONValidationError[] {
  const errors: TOONValidationError[] = [];
  const fieldPath = path.join('.');

  // Check null/undefined
  if (value === null || value === undefined) {
    if (!fieldSchema.nullable) {
      errors.push({
        field: fieldSchema.name,
        expected: fieldSchema.type,
        actual: value,
        message: `Field '${fieldPath}' cannot be null`,
        path,
      });
    }
    return errors;
  }

  // Validate type
  const actualType = inferType(value);

  if (actualType !== fieldSchema.type) {
    errors.push({
      field: fieldSchema.name,
      expected: fieldSchema.type,
      actual: value,
      message: `Field '${fieldPath}' expected type '${fieldSchema.type}' but got '${actualType}'`,
      path,
    });
    return errors;
  }

  // Validate nested structures
  if (fieldSchema.type === 'array' && fieldSchema.items && Array.isArray(value)) {
    // Validate array items
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const itemPath = [...path, `[${i}]`];

      if (isPlainObject(item) && fieldSchema.items.fields) {
        for (const nestedField of fieldSchema.items.fields) {
          const nestedValue = item[nestedField.name];
          const nestedErrors = validateField(nestedValue, nestedField, [
            ...itemPath,
            nestedField.name,
          ]);
          errors.push(...nestedErrors);
        }
      }
    }
  } else if (
    fieldSchema.type === 'object' &&
    fieldSchema.properties &&
    isPlainObject(value)
  ) {
    // Validate nested object
    for (const nestedField of fieldSchema.properties.fields) {
      const nestedValue = value[nestedField.name];
      const nestedErrors = validateField(nestedValue, nestedField, [
        ...path,
        nestedField.name,
      ]);
      errors.push(...nestedErrors);
    }
  }

  return errors;
}

/**
 * Merge multiple schemas into one
 *
 * Useful for combining schemas from different data sources.
 * Handles nullable fields and type conflicts.
 *
 * @param schemas - Schemas to merge
 * @returns Merged schema
 *
 * @example
 * ```typescript
 * const schema1: TOONSchema = {
 *   fields: [
 *     { name: 'id', type: 'number', nullable: false },
 *     { name: 'name', type: 'string', nullable: false }
 *   ]
 * };
 *
 * const schema2: TOONSchema = {
 *   fields: [
 *     { name: 'id', type: 'number', nullable: false },
 *     { name: 'age', type: 'number', nullable: true }
 *   ]
 * };
 *
 * const merged = mergeSchemas([schema1, schema2]);
 * // Fields: id, name, age
 * ```
 */
export function mergeSchemas(schemas: TOONSchema[]): TOONSchema {
  if (schemas.length === 0) {
    throw new TOONError(
      'Cannot merge empty schema array',
      TOONErrorCode.SCHEMA_VALIDATION_FAILED
    );
  }

  if (schemas.length === 1) {
    return schemas[0];
  }

  // Collect all fields by name
  const fieldMap = new Map<string, TOONFieldSchema[]>();

  for (const schema of schemas) {
    for (const field of schema.fields) {
      if (!fieldMap.has(field.name)) {
        fieldMap.set(field.name, []);
      }
      fieldMap.get(field.name)!.push(field);
    }
  }

  // Merge fields
  const mergedFields: TOONFieldSchema[] = [];

  for (const [fieldName, fields] of fieldMap) {
    if (fields.length === 1) {
      mergedFields.push(fields[0]);
      continue;
    }

    // Check for type conflicts
    const types = new Set(fields.map((f) => f.type));
    if (types.size > 1) {
      throw new TOONError(
        `Type conflict for field '${fieldName}': ${Array.from(types).join(', ')}`,
        TOONErrorCode.SCHEMA_VALIDATION_FAILED,
        { field: fieldName, types: Array.from(types) }
      );
    }

    // Merge nullable flags (if any schema has nullable, merged is nullable)
    const nullable = fields.some((f) => f.nullable);

    // Use first field as base
    const baseField = fields[0];

    mergedFields.push({
      ...baseField,
      nullable,
    });
  }

  return {
    fields: mergedFields,
    metadata: {
      version: '1.0.0',
      description: `Merged schema from ${schemas.length} sources`,
      createdAt: new Date(),
    },
  };
}

/**
 * Compare two schemas for compatibility
 *
 * @param schema1 - First schema
 * @param schema2 - Second schema
 * @returns True if schemas are compatible
 */
export function areSchemasCompatible(
  schema1: TOONSchema,
  schema2: TOONSchema
): boolean {
  // Build field maps
  const fields1 = new Map(schema1.fields.map((f) => [f.name, f]));
  const fields2 = new Map(schema2.fields.map((f) => [f.name, f]));

  // Check all fields in schema1
  for (const [name, field1] of fields1) {
    const field2 = fields2.get(name);

    if (!field2) {
      // Field missing in schema2
      if (!field1.nullable) {
        return false; // Non-nullable field required
      }
      continue;
    }

    // Check type compatibility
    if (field1.type !== field2.type) {
      return false;
    }

    // Check nullable compatibility
    if (!field1.nullable && field2.nullable) {
      return false; // schema2 allows null but schema1 doesn't
    }
  }

  // Check all fields in schema2
  for (const [name, field2] of fields2) {
    if (!fields1.has(name) && !field2.nullable) {
      return false; // Non-nullable field required but not in schema1
    }
  }

  return true;
}
