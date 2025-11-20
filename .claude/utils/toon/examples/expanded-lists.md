# Expanded Lists

Fallback format for non-uniform or complex arrays.

## Syntax

```
key:
  - item1
  - item2
  - item3
```

- Hyphen (`-`) marks each list item
- Items indented consistently (default 2 spaces)
- Can contain any value type

## When to Use

✅ **Use expanded lists when:**
- Array has <60% field uniformity
- Items are complex nested objects
- Items are mixed types (objects, arrays, primitives)
- Readability is priority over compactness

❌ **Don't use expanded when:**
- All primitives ≤10 items → use inline arrays
- All objects ≥60% uniform → use tabular arrays
- Token efficiency is critical → restructure data

## Basic Example

**JSON:**
```json
{
  "items": [
    "apple",
    "banana",
    "cherry"
  ]
}
```

**TOON:**
```
items:
  - apple
  - banana
  - cherry
```

## Mixed Types

**JSON:**
```json
{
  "data": [
    42,
    "hello",
    true,
    null,
    {"nested": "object"}
  ]
}
```

**TOON:**
```
data:
  - 42
  - hello
  - true
  - null
  - nested: object
```

## Non-Uniform Objects

**JSON:**
```json
[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "role": "admin"},
  {"name": "Carol", "age": 25, "role": "user", "active": true}
]
```

**TOON (uniformity <60%, can't use tabular):**
```
users:
  - name: Alice
    age: 30
  - name: Bob
    role: admin
  - name: Carol
    age: 25
    role: user
    active: true
```

## Nested Arrays

**JSON:**
```json
{
  "matrix": [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]
}
```

**TOON:**
```
matrix:
  - [3]: 1,2,3
  - [3]: 4,5,6
  - [3]: 7,8,9
```

(Inner arrays use inline format)

## Complex Nested Objects

**JSON:**
```json
{
  "configs": [
    {
      "server": {
        "host": "localhost",
        "port": 8080
      }
    },
    {
      "database": {
        "host": "db.example.com",
        "port": 5432
      }
    }
  ]
}
```

**TOON:**
```
configs:
  - server:
      host: localhost
      port: 8080
  - database:
      host: db.example.com
      port: 5432
```

## Token Savings

Expanded lists have **minimal savings** (5-15%) compared to JSON:

**JSON:**
```json
{"items": ["a", "b", "c"]}
```
≈ 24 tokens

**TOON:**
```
items:
  - a
  - b
  - c
```
≈ 22 tokens

**Savings: ~8%**

**Recommendation:** Use expanded lists for clarity, not token savings.

## Indentation Rules

Default indentation: **2 spaces** per level

**Correct:**
```
items:
  - item1      # 2 spaces
  - nested:
      value    # 4 spaces (2 for list, 2 for object)
```

**Wrong (inconsistent):**
```
items:
 - item1       ❌ 1 space
   - item2     ❌ 3 spaces
```

**Wrong (tabs):**
```
items:
	- item1     ❌ Tab character (strict mode error)
```

## Empty Arrays

**JSON:**
```json
{"items": []}
```

**TOON:**
```
items: []
```

## Single Item

**JSON:**
```json
{"items": ["only"]}
```

**TOON:**
```
items:
  - only
```

## Comparison with Other Formats

### When to use what:

| Array Content | Best Format | Savings |
|---------------|-------------|---------|
| Primitives ≤10 | Inline | 20-40% |
| Uniform objects ≥5 | Tabular | 30-60% |
| Non-uniform | Expanded | 5-15% |
| Nested complex | Expanded | 5-15% |

### Example: Same data, different formats

**Tabular (uniform objects):**
```
[3]{name,age}:
  Alice,30
  Bob,25
  Carol,35
```
≈ 42 tokens

**Expanded (same data):**
```
users:
  - name: Alice
    age: 30
  - name: Bob
    age: 25
  - name: Carol
    age: 35
```
≈ 68 tokens

**Verdict:** Tabular is 38% more efficient for uniform data.

## Real-World Use Case: Mixed Config

**JSON:**
```json
{
  "tasks": [
    {
      "type": "email",
      "to": "user@example.com",
      "subject": "Welcome"
    },
    {
      "type": "slack",
      "channel": "#general",
      "message": "Deploy complete"
    },
    {
      "type": "webhook",
      "url": "https://example.com/hook",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  ]
}
```

**TOON (non-uniform, expanded is best):**
```
tasks:
  - type: email
    to: user@example.com
    subject: Welcome
  - type: slack
    channel: "#general"
    message: Deploy complete
  - type: webhook
    url: https://example.com/hook
    method: POST
    headers:
      Authorization: Bearer token
```

## Common Mistakes

### Wrong: No hyphen

```
items:
  item1       ❌ Missing hyphen
  item2
```

**Correct:**
```
items:
  - item1
  - item2
```

### Wrong: Inconsistent indentation

```
items:
  - item1
   - item2   ❌ Different indent
```

**Correct:**
```
items:
  - item1
  - item2
```

### Wrong: Using expanded for uniform data

```
users:
  - name: Alice   ❌ Uniform data, use tabular
    age: 30
  - name: Bob
    age: 25
```

**Better (tabular):**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

### Wrong: Mixing hyphens and commas

```
items:
  - a, b, c    ❌ Not a valid inline array
```

**Correct (choose one format):**
```
items:
  - a
  - b
  - c
```

Or:
```
items[3]: a,b,c
```

## Performance

Expanded lists are:
- **Slowest to parse** (must track indentation)
- **Largest output size** (minimal compression)
- **Most flexible** (any content)

**Recommendation:** Use for flexibility, not performance.

## See Also

- [Basic Tabular](./basic-tabular.md) - For uniform objects
- [Inline Arrays](./inline-arrays.md) - For small primitive arrays
- [Nested Objects](./nested-objects.md) - Indentation rules
