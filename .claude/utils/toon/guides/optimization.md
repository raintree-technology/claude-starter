# Optimization Guide

Maximizing token savings with TOON format.

## Quick Wins

### 1. Use TOON for Arrays ≥5 Items

**Don't use TOON:**
```json
[
  {"name": "Alice"},
  {"name": "Bob"}
]
```
Only 2 items → minimal savings (8%)

**Use TOON:**
```json
[
  {"name": "Alice"},
  {"name": "Bob"},
  {"name": "Carol"},
  {"name": "Dave"},
  {"name": "Eve"}
]
```
5+ items → good savings (35%)

### 2. Enable Key Folding for Nested Config

**Without folding (28 tokens):**
```
server:
  host: localhost
  port: 8080
```

**With folding (18 tokens, 36% savings):**
```
server.host: localhost
server.port: 8080
```

### 3. Choose Right Delimiter

**Comma with addresses (many quotes):**
```
[2]{name,address}:
  Alice,"123 Main St, NYC"
  Bob,"456 Oak Ave, LA"
```

**Tab (no quotes needed):**
```
[2\t]{name,address}:
  Alice	123 Main St, NYC
  Bob	456 Oak Ave, LA
```

## Token Estimation

**Formula:**
```
tokens ≈ bytes / 4
```

**Example:**
```bash
JSON_SIZE=$(wc -c < data.json)
TOON_SIZE=$(wc -c < data.toon)

JSON_TOKENS=$((JSON_SIZE / 4))
TOON_TOKENS=$((TOON_SIZE / 4))
SAVED=$((JSON_TOKENS - TOON_TOKENS))
PERCENT=$((SAVED * 100 / JSON_TOKENS))

echo "JSON: $JSON_TOKENS tokens"
echo "TOON: $TOON_TOKENS tokens"
echo "Saved: $PERCENT%"
```

## Uniformity Matters

**60% threshold** determines tabular vs expanded:

### High Uniformity (85%) → Tabular

**JSON (240 tokens):**
```json
[
  {"id": 1, "name": "Alice", "age": 30, "city": "NYC"},
  {"id": 2, "name": "Bob", "age": 25, "city": "LA"},
  {"id": 3, "name": "Carol", "age": 35, "city": "SF"}
]
```

**TOON (144 tokens, 40% savings):**
```
[3]{id,name,age,city}:
  1,Alice,30,NYC
  2,Bob,25,LA
  3,Carol,35,SF
```

### Low Uniformity (30%) → Expanded

**JSON:**
```json
[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "role": "admin"},
  {"name": "Carol", "age": 25, "role": "user", "level": 5}
]
```

**TOON (only 10% savings):**
```
- name: Alice
  age: 30
- name: Bob
  role: admin
- name: Carol
  age: 25
  role: user
  level: 5
```

**Recommendation:** For <60% uniformity, keep JSON or restructure data.

## Restructuring for Better Savings

### Bad: Mixed Types in Array

**JSON:**
```json
{
  "users": [
    {"type": "user", "name": "Alice", "age": 30},
    {"type": "admin", "name": "Bob", "permissions": ["read", "write"]}
  ]
}
```
Uniformity: 40% → Poor savings

### Good: Split by Type

**JSON:**
```json
{
  "users": [
    {"name": "Alice", "age": 30}
  ],
  "admins": [
    {"name": "Bob", "permissions": ["read", "write"]}
  ]
}
```

**TOON:**
```
[1]{name,age}:
  Alice,30

[1]{name,permissions}:
  Bob,"[read,write]"
```
Each array 100% uniform → Better savings

## Field Ordering

Order fields by frequency to improve readability:

**Less optimal:**
```
[100]{optionalField,id,name,age}:
  null,1,Alice,30
  null,2,Bob,25
  ...
```

**More optimal:**
```
[100]{id,name,age,optionalField}:
  1,Alice,30,null
  2,Bob,25,null
  ...
```

Common fields first → easier to scan.

## Inline vs. Tabular

### Use Inline for Primitives ≤10

**Inline (14 tokens):**
```
tags[5]: js,react,node,web,api
```

**Tabular (28 tokens):**
```
[5]{tag}:
  js
  react
  node
  web
  api
```

**Verdict:** Inline saves 50% for primitive arrays.

### Use Tabular for Objects ≥5

**Tabular (42 tokens):**
```
[5]{name,age}:
  Alice,30
  Bob,25
  Carol,35
  Dave,28
  Eve,32
```

**Expanded (68 tokens):**
```
- name: Alice
  age: 30
- name: Bob
  age: 25
...
```

**Verdict:** Tabular saves 38% for uniform objects.

## Real-World Benchmarks

### API Documentation

**JSON:** 892KB, ~223k tokens
**TOON:** 518KB, ~130k tokens
**Savings: 42% (93k tokens)**

Breakdown:
- Endpoints array (400 items) → tabular
- Pipe delimiter (descriptions have commas)
- No key folding needed (flat objects)

### Transaction Logs

**JSON:** 4.5MB, ~1.125M tokens
**TOON:** 2.7MB, ~675k tokens
**Savings: 40% (450k tokens)**

Breakdown:
- Transactions array (10,000 items) → tabular
- Comma delimiter (numeric data)
- Key folding for metadata (server.host, etc.)

### Configuration Files

**JSON:** 18KB, ~4.5k tokens
**TOON:** 11KB, ~2.75k tokens
**Savings: 39% (1.75k tokens)**

Breakdown:
- Small arrays → inline format
- Nested config → key folding enabled
- Tab delimiter (paths with commas)

## Anti-Patterns

### ❌ Using TOON for Small Data

**JSON (24 tokens):**
```json
{"name": "Alice", "age": 30}
```

**TOON (22 tokens):**
```
name: Alice
age: 30
```

**Verdict:** Only 8% savings, not worth it for single objects.

### ❌ Forcing Tabular on Non-Uniform

**Tabular (with many nulls):**
```
[3]{name,age,role,level,dept}:
  Alice,30,null,null,null
  Bob,null,admin,5,null
  Carol,25,user,null,engineering
```

**Better (expanded):**
```
- name: Alice
  age: 30
- name: Bob
  role: admin
  level: 5
- name: Carol
  age: 25
  dept: engineering
```

### ❌ Over-Nesting with Key Folding

**Too deep (harder to read):**
```
app.config.server.ssl.cert.path.filesystem.location: /etc/certs
```

**Better (stop at 3 levels):**
```
app.config.server:
  ssl.cert.path: /etc/certs/server.pem
```

## Optimization Checklist

Before encoding:

- [ ] Array has ≥5 items?
- [ ] Objects have ≥60% uniformity?
- [ ] Data is config/logs/metrics (not prose)?
- [ ] Nesting is 2-3 levels (good for folding)?
- [ ] Delimiter matches data (comma/tab/pipe)?

If all yes → TOON will save 30-60% tokens.

## Measuring Impact

### Before/After Comparison

```bash
# Encode
./zig-out/bin/toon encode data.json > data.toon

# Measure
echo "JSON: $(wc -c < data.json) bytes"
echo "TOON: $(wc -c < data.toon) bytes"

# Token estimate (bytes / 4)
JSON_TOKENS=$(($(wc -c < data.json) / 4))
TOON_TOKENS=$(($(wc -c < data.toon) / 4))
echo "Saved: $(($JSON_TOKENS - $TOON_TOKENS)) tokens"
```

### A/B Testing in RAG

```python
# Test with JSON
response_json = llm.query(prompt_with_json_data)
json_tokens = count_tokens(prompt_with_json_data)

# Test with TOON
response_toon = llm.query(prompt_with_toon_data)
toon_tokens = count_tokens(prompt_with_toon_data)

print(f"JSON cost: ${json_tokens * 0.000003}")
print(f"TOON cost: ${toon_tokens * 0.000003}")
print(f"Saved: ${(json_tokens - toon_tokens) * 0.000003}")
```

## See Also

- [Encoding Guide](./encoding.md) - JSON → TOON strategies
- [Configuration Guide](./configuration.md) - Encoder options
- [Examples](../examples/) - Real-world examples with savings
