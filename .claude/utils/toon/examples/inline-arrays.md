# Inline Primitive Arrays

Compact format for small arrays of primitive values.

## Syntax

```
key[N]: value1,value2,value3
```

- `key` - Field name
- `[N]` - Array count (must match number of values)
- `:` - Separator
- Values - Comma-separated (or custom delimiter)

## When to Use

✅ **Use inline arrays when:**
- All values are primitives (string, number, bool, null)
- Array has ≤10 items
- Values are simple (no nested structures)

❌ **Don't use inline when:**
- Array has >10 items (use tabular)
- Values are objects (use tabular)
- Array has mixed types (allowed, but consider readability)

## Simple Examples

### Strings

**JSON:**
```json
{
  "friends": ["Alice", "Bob", "Carol"]
}
```

**TOON:**
```
friends[3]: Alice,Bob,Carol
```

### Numbers

**JSON:**
```json
{
  "scores": [85, 92, 78, 95, 88]
}
```

**TOON:**
```
scores[5]: 85,92,78,95,88
```

### Booleans

**JSON:**
```json
{
  "features": [true, false, true, true]
}
```

**TOON:**
```
features[4]: true,false,true,true
```

### Mixed Primitives

**JSON:**
```json
{
  "mixed": [42, "hello", true, null]
}
```

**TOON:**
```
mixed[4]: 42,hello,true,null
```

## Real-World Examples

### Tags/Labels

**JSON:**
```json
{
  "tags": ["javascript", "react", "frontend", "web"]
}
```

**TOON:**
```
tags[4]: javascript,react,frontend,web
```

### Numeric Measurements

**JSON:**
```json
{
  "temperatures": [72.5, 73.1, 71.8, 74.2, 73.5]
}
```

**TOON:**
```
temperatures[5]: 72.5,73.1,71.8,74.2,73.5
```

### Status Flags

**JSON:**
```json
{
  "permissions": ["read", "write", "execute"],
  "active": [true, true, false, true]
}
```

**TOON:**
```
permissions[3]: read,write,execute
active[4]: true,true,false,true
```

## Nested in Objects

Inline arrays work well within larger objects:

**JSON:**
```json
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"],
    "scores": [95, 87, 92]
  }
}
```

**TOON:**
```
user:
  name: Alice
  roles[2]: admin,editor
  scores[3]: 95,87,92
```

## Quoting Rules

Values need quotes if they contain delimiters or special characters:

### Comma in value (default delimiter)

**JSON:**
```json
{
  "locations": ["New York, NY", "Los Angeles, CA"]
}
```

**TOON:**
```
locations[2]: "New York, NY","Los Angeles, CA"
```

### Colon in value

**JSON:**
```json
{
  "times": ["10:30 AM", "2:45 PM", "6:00 PM"]
}
```

**TOON:**
```
times[3]: "10:30 AM","2:45 PM","6:00 PM"
```

## Alternative Delimiters

Use tab or pipe delimiter to avoid quoting:

### With tab delimiter

**JSON:**
```json
{
  "locations": ["New York, NY", "Los Angeles, CA"]
}
```

**TOON:**
```
[|\t] locations[2]: New York, NY	Los Angeles, CA
```

### With pipe delimiter

**JSON:**
```json
{
  "descriptions": ["Feature A: enabled", "Feature B: disabled"]
}
```

**TOON:**
```
[||] descriptions[2]: Feature A: enabled|Feature B: disabled
```

## Token Savings

Inline arrays provide **20-40% token savings** for primitive arrays:

**Example: 5-item array**
- JSON: `["a","b","c","d","e"]` = ~24 tokens
- TOON: `items[5]: a,b,c,d,e` = ~14 tokens
- **Savings: 42%**

**Example: 10-item array**
- JSON: Full brackets, quotes, commas = ~120 tokens
- TOON: Inline format = ~70 tokens
- **Savings: 42%**

## Limits and Edge Cases

### Maximum 10 items recommended

```
✅ Good: friends[5]: a,b,c,d,e
⚠️  OK: friends[10]: a,b,c,d,e,f,g,h,i,j
❌ Bad: friends[20]: a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t
```

For >10 items, use tabular format.

### Empty arrays

**JSON:**
```json
{"items": []}
```

**TOON:**
```
items[0]:
```

### Single item

**JSON:**
```json
{"item": ["single"]}
```

**TOON:**
```
item[1]: single
```

## Common Mistakes

### Wrong: Missing count

```
friends: a,b,c  ❌ Missing [N]
```

**Correct:**
```
friends[3]: a,b,c
```

### Wrong: Count mismatch

```
friends[5]: a,b,c  ❌ Says 5 but only 3 values
```

**Correct:**
```
friends[3]: a,b,c
```

### Wrong: Unquoted delimiter

```
locations[2]: New York, NY,Los Angeles, CA  ❌ Ambiguous commas
```

**Correct:**
```
locations[2]: "New York, NY","Los Angeles, CA"
```

### Wrong: Object in inline array

```
users[2]: {name: alice},{name: bob}  ❌ Objects not allowed
```

**Correct - use tabular:**
```
[2]{name}:
  alice
  bob
```

## Comparison with Tabular

When to use inline vs tabular:

| Criteria | Inline | Tabular |
|----------|--------|---------|
| **Value type** | Primitives only | Objects |
| **Array size** | ≤10 items | ≥5 items |
| **Structure** | Flat | Can have fields |
| **Format** | `key[N]: v1,v2` | `[N]{f}: v1\n v2` |
| **Savings** | 20-40% | 30-60% |

## See Also

- [Basic Tabular](./basic-tabular.md) - For arrays of objects
- [Delimiters](./delimiters.md) - Choosing comma/tab/pipe
- [Quoting Rules](./quoting-rules.md) - When quotes are needed
- [Expanded Lists](./expanded-lists.md) - For mixed-type arrays
