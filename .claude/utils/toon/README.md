# TOON Format - Instructions for Claude

This directory contains instructions for working with TOON (Token-Oriented Object Notation) format.

## What is TOON?

TOON is a compact format for representing tabular data that reduces token consumption by 30-60% compared to JSON.

**Example:**

```json
// JSON (verbose) - ~120 tokens
[
  {"method": "GET", "path": "/api/users", "auth": "required"},
  {"method": "POST", "path": "/api/users", "auth": "required"}
]
```

```
// TOON (compact) - ~70 tokens (40% savings)
[2]{method,path,auth}:
  GET,/api/users,required
  POST,/api/users,required
```

## TOON Format Specification

### Structure

```
[count]{field1,field2,field3}:
  value1,value2,value3
  value1,value2,value3
```

### Rules

1. **Header Line**: `[count]{comma-separated-fields}:`
   - `count` = number of data rows
   - Fields listed in order, comma-separated
   - Ends with colon

2. **Data Lines**: One per object
   - Values in same order as header fields
   - Comma-separated
   - One value per field

3. **Special Cases**:
   - Null/undefined: leave empty between commas (`value1,,value3`)
   - Commas in values: escape with backslash (`value1\,with\,commas,value2`)
   - Maintain consistent field order

## When to Use TOON

### ✅ Use TOON When:
- Array of objects with uniform structure
- 5+ items in array
- 60%+ of objects share the same fields
- Flat structure (not deeply nested)
- Tabular data (API responses, logs, metrics, database results)

### ❌ Use JSON When:
- Small arrays (<5 items)
- Non-uniform objects (different fields)
- Deeply nested structures
- Single objects
- Prose or free-form text

## How to Convert (Instructions for Claude)

### JSON to TOON

1. **Analyze the array**:
   - Extract all unique field names across all objects
   - Count total items
   - Check uniformity (what % of objects have the same fields)

2. **Build header**:
   - Format: `[count]{field1,field2,...}:`
   - Use consistent field order

3. **Build data rows**:
   - For each object, extract values in header field order
   - Join with commas
   - Handle null/undefined (empty string)
   - Escape commas in values

4. **Combine**:
   ```
   [count]{fields}:
     row1
     row2
   ```

### TOON to JSON

1. **Parse header**:
   - Extract count from `[count]`
   - Extract fields from `{field1,field2,...}`

2. **Parse data lines**:
   - Split by commas (handle escapes)
   - Map each row to object with field names as keys

3. **Build array**:
   - Create array of objects
   - Each row becomes one object

## Token Estimation

**Rough formula**:
- **JSON**: `(items × fields × 4) + overhead`
  - Each field is ~4 tokens: `"field": "value",`

- **TOON**: `(header tokens) + (items × fields × 2)`
  - Header is ~10-20 tokens
  - Each value is ~2 tokens: `value,`

**Typical savings**: 30-60% for uniform data with 10+ items

## Examples

### API Endpoints
```json
// JSON - 892 tokens
[
  {"method": "GET", "path": "/api/users", "auth": "required"},
  {"method": "POST", "path": "/api/users", "auth": "required"},
  {"method": "DELETE", "path": "/api/users/:id", "auth": "admin"}
]
```

```
// TOON - 534 tokens (40% savings)
[3]{method,path,auth}:
  GET,/api/users,required
  POST,/api/users,required
  DELETE,/api/users/:id,admin
```

### Transactions
```json
// JSON - 4545 tokens
[
  {"id": 1001, "amount": 250.50, "status": "completed", "date": "2024-01-15"},
  {"id": 1002, "amount": 125.00, "status": "pending", "date": "2024-01-16"}
]
```

```
// TOON - 2744 tokens (39% savings)
[2]{id,amount,status,date}:
  1001,250.50,completed,2024-01-15
  1002,125.00,pending,2024-01-16
```

## Usage in Claude Code

### In Skills
When a skill needs to process large datasets, check if TOON would be beneficial and convert automatically.

### In Commands
Use `/convert-to-toon <file>` to convert JSON files to TOON format.

### In Documentation
Store large tabular data in TOON format to reduce token usage when Claude reads docs.

## References

- **Official Spec**: https://github.com/toon-format/spec
- **Website**: https://toonformat.dev
- **Benchmarks**: 39.6% token reduction, 3.2% accuracy improvement vs JSON

## Related Files

- `.claude/skills/data/toon-formatter/` - Auto-detection skill
- `.claude/commands/convert-to-toon.md` - Conversion command
- `.claude/docs/toon/` - Additional documentation and examples
