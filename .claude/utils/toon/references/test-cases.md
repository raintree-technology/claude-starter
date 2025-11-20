# TOON v2.0 Test Cases

Reference test cases for validation and conformance.

## Basic Arrays

### Test 1: Simple Tabular Array

**Input JSON:**
```json
[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "age": 25}
]
```

**Expected TOON:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

**Validation:**
- ✅ Count matches rows
- ✅ Fields consistent
- ✅ Comma delimiter (default)

### Test 2: Inline Primitive Array

**Input JSON:**
```json
{"tags": ["js", "react", "node"]}
```

**Expected TOON:**
```
tags[3]: js,react,node
```

**Validation:**
- ✅ Count matches values
- ✅ All primitives
- ✅ ≤10 items

### Test 3: Expanded List (Non-Uniform)

**Input JSON:**
```json
[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "role": "admin"}
]
```

**Expected TOON:**
```
- name: Alice
  age: 30
- name: Bob
  role: admin
```

**Validation:**
- ✅ Non-uniform fields (<60%)
- ✅ Hyphen markers
- ✅ Consistent indentation

## Delimiters

### Test 4: Tab Delimiter

**Input JSON:**
```json
[
  {"name": "Alice", "location": "New York, NY"},
  {"name": "Bob", "location": "Los Angeles, CA"}
]
```

**Expected TOON:**
```
[2\t]{name,location}:
  Alice	New York, NY
  Bob	Los Angeles, CA
```

**Validation:**
- ✅ Tab in header `[2\t]`
- ✅ Tabs in data rows
- ✅ No quotes needed for commas

### Test 5: Pipe Delimiter

**Input JSON:**
```json
[
  {"method": "GET", "path": "/api/users", "desc": "List users"},
  {"method": "POST", "path": "/api/users", "desc": "Create user"}
]
```

**Expected TOON:**
```
[2|]{method,path,desc}:
  GET|/api/users|List users
  POST|/api/users|Create user
```

**Validation:**
- ✅ Pipe in header `[2|]`
- ✅ Pipes in data rows
- ✅ No quotes for commas/colons

## Key Folding

### Test 6: Simple Folding

**Input JSON:**
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

**Expected TOON (with folding):**
```
server.host: localhost
server.port: 8080
```

**Validation:**
- ✅ Dotted keys
- ✅ No collision
- ✅ Valid identifiers

### Test 7: Collision Prevention

**Input JSON:**
```json
{
  "server": {"host": "localhost"},
  "server.host": "override"
}
```

**Expected TOON (no folding - collision):**
```
server:
  host: localhost
server.host: override
```

**Validation:**
- ✅ Detects collision
- ✅ Falls back to nesting

## Escape Sequences

### Test 8: All Five Escapes

**Input JSON:**
```json
{
  "text": "Line 1\nLine 2",
  "path": "C:\\Users\\Alice",
  "quote": "She said \"hello\"",
  "windows": "Line 1\r\nLine 2",
  "data": "Col1\tCol2"
}
```

**Expected TOON:**
```
text: "Line 1\nLine 2"
path: "C:\\Users\\Alice"
quote: "She said \"hello\""
windows: "Line 1\r\nLine 2"
data: "Col1\tCol2"
```

**Validation:**
- ✅ `\n` for newline
- ✅ `\\` for backslash
- ✅ `\"` for quote
- ✅ `\r` for carriage return
- ✅ `\t` for tab

### Test 9: Invalid Escape (Strict Mode)

**Input TOON:**
```
text: "Unicode: \u0041"
```

**Expected Result:**
```
❌ Error: Invalid escape sequence '\u'
Valid sequences: \\ \" \n \r \t
```

**Validation:**
- ✅ Rejects `\u` escape
- ✅ Strict mode enforced

## Quoting Rules

### Test 10: Auto-Quoting

**Input JSON:**
```json
{
  "location": "New York, NY",
  "time": "10:30 AM",
  "note": "[URGENT]",
  "negative": "-5",
  "bool_str": "true"
}
```

**Expected TOON:**
```
location: "New York, NY"
time: "10:30 AM"
note: "[URGENT]"
negative: "-5"
bool_str: "true"
```

**Validation:**
- ✅ Quotes for comma
- ✅ Quotes for colon
- ✅ Quotes for brackets
- ✅ Quotes for leading hyphen
- ✅ Quotes for reserved word

### Test 11: No Quotes Needed

**Input JSON:**
```json
{
  "name": "Alice",
  "age": 30,
  "active": true,
  "value": null,
  "url": "https://example.com"
}
```

**Expected TOON:**
```
name: Alice
age: 30
active: true
value: null
url: https://example.com
```

**Validation:**
- ✅ No quotes for simple strings
- ✅ No quotes for numbers
- ✅ No quotes for booleans
- ✅ No quotes for null
- ✅ No quotes for URLs (no special chars)

## Strict Mode

### Test 12: Indentation Error

**Input TOON:**
```
server:
  host: localhost
   port: 8080
```

**Expected Result (strict mode):**
```
❌ Error: Line 3: Indentation must be multiple of 2 (found 3)
```

**Validation:**
- ✅ Detects 3-space indent
- ✅ Expects multiples of 2

### Test 13: Array Count Mismatch

**Input TOON:**
```
[3]{name,age}:
  Alice,30
  Bob,25
```

**Expected Result (strict mode):**
```
❌ Error: Array declared [3] but found 2 rows
```

**Validation:**
- ✅ Detects count mismatch
- ✅ Blocks parsing

### Test 14: Field Width Mismatch

**Input TOON:**
```
[2]{name,age,city}:
  Alice,30,NYC
  Bob,25
```

**Expected Result (strict mode):**
```
❌ Error: Line 3: Expected 3 fields, found 2
```

**Validation:**
- ✅ Detects missing field
- ✅ Shows expected vs actual

## Numbers

### Test 15: Canonical Numbers

**Input JSON:**
```json
{
  "int": 42,
  "float": 3.14159,
  "trailing": 1.50000,
  "whole": 1.0,
  "negative": -0,
  "nan": NaN,
  "inf": Infinity
}
```

**Expected TOON:**
```
int: 42
float: 3.14159
trailing: 1.5
whole: 1
negative: 0
nan: null
inf: null
```

**Validation:**
- ✅ Integers unchanged
- ✅ Trailing zeros removed
- ✅ Unnecessary decimal removed
- ✅ -0 normalized to 0
- ✅ NaN → null
- ✅ Infinity → null

## Edge Cases

### Test 16: Empty Array

**Input JSON:**
```json
{"items": []}
```

**Expected TOON:**
```
items: []
```

**Validation:**
- ✅ Empty array notation
- ✅ No rows

### Test 17: Single Item Array

**Input JSON:**
```json
[{"name": "Alice"}]
```

**Expected TOON:**
```
[1]{name}:
  Alice
```

**Validation:**
- ✅ Count is 1
- ✅ Single row

### Test 18: Nested Arrays in Objects

**Input JSON:**
```json
{
  "user": {
    "name": "Alice",
    "tags": ["admin", "editor"]
  }
}
```

**Expected TOON:**
```
user:
  name: Alice
  tags[2]: admin,editor
```

**Validation:**
- ✅ Nested structure preserved
- ✅ Inline array within object
- ✅ Correct indentation

### Test 19: Empty String

**Input JSON:**
```json
{"empty": ""}
```

**Expected TOON:**
```
empty: ""
```

**Validation:**
- ✅ Quotes required for empty string

### Test 20: Unicode

**Input JSON:**
```json
{"emoji": "Hello 👋", "chinese": "你好"}
```

**Expected TOON:**
```
emoji: "Hello 👋"
chinese: 你好
```

**Validation:**
- ✅ UTF-8 preserved
- ✅ No `\u` escapes needed

## Roundtrip Tests

### Test 21: JSON → TOON → JSON

**Input JSON:**
```json
{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ]
}
```

**TOON (intermediate):**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

**Output JSON (after decode):**
```json
{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ]
}
```

**Validation:**
- ✅ Lossless roundtrip
- ✅ Structure preserved
- ✅ Values unchanged

## Performance Tests

### Test 22: Large Array (10,000 items)

**Metrics:**
- Encoding time: <100ms
- Memory usage: O(n)
- Token savings: ~40%

### Test 23: Deep Nesting (10 levels)

**Metrics:**
- Encoding time: <50ms
- Key folding depth: configurable
- Indentation correct

## See Also

- [Examples](../examples/) - Detailed examples
- [Compliance Matrix](./compliance-matrix.md) - Implementation status
- [Strict Mode](../examples/strict-mode.md) - Validation rules
