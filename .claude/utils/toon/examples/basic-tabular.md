# Basic Tabular Arrays

The most common TOON format for uniform arrays of objects.

## Syntax

```
[N]{field1,field2,field3}:
  value1,value2,value3
  value4,value5,value6
```

- `[N]` - Array count (must match number of rows)
- `{fields}` - Comma-separated field names
- `:` - Header terminator
- Data rows - One per line, values separated by delimiter

## Simple Example

**JSON (120 tokens):**
```json
[
  {"name": "Alice", "age": 30, "city": "NYC"},
  {"name": "Bob", "age": 25, "city": "LA"},
  {"name": "Carol", "age": 35, "city": "SF"}
]
```

**TOON (72 tokens, 40% savings):**
```
[3]{name,age,city}:
  Alice,30,NYC
  Bob,25,LA
  Carol,35,SF
```

## API Endpoints Example

**JSON (240 tokens):**
```json
[
  {
    "method": "GET",
    "path": "/api/users",
    "auth": "required",
    "rateLimit": "100/min"
  },
  {
    "method": "POST",
    "path": "/api/users",
    "auth": "required",
    "rateLimit": "20/min"
  },
  {
    "method": "DELETE",
    "path": "/api/users/:id",
    "auth": "admin",
    "rateLimit": "10/min"
  }
]
```

**TOON (144 tokens, 40% savings):**
```
[3]{method,path,auth,rateLimit}:
  GET,/api/users,required,100/min
  POST,/api/users,required,20/min
  DELETE,/api/users/:id,admin,10/min
```

## Transaction Logs Example

**JSON (480 tokens):**
```json
[
  {
    "id": "tx_001",
    "timestamp": "2025-01-15T10:30:00Z",
    "amount": 150.50,
    "status": "completed",
    "user": "alice@example.com"
  },
  {
    "id": "tx_002",
    "timestamp": "2025-01-15T10:31:22Z",
    "amount": 75.00,
    "status": "pending",
    "user": "bob@example.com"
  },
  {
    "id": "tx_003",
    "timestamp": "2025-01-15T10:32:45Z",
    "amount": 200.00,
    "status": "completed",
    "user": "carol@example.com"
  }
]
```

**TOON (288 tokens, 40% savings):**
```
[3]{id,timestamp,amount,status,user}:
  tx_001,2025-01-15T10:30:00Z,150.50,completed,alice@example.com
  tx_002,2025-01-15T10:31:22Z,75.00,pending,bob@example.com
  tx_003,2025-01-15T10:32:45Z,200.00,completed,carol@example.com
```

## Field Alignment Best Practices

For readability with many fields, align values:

```
[3]{id,name,email,role,department,location}:
  1,Alice,alice@co.com,engineer,backend,NYC
  2,Bob,bob@co.com,designer,frontend,LA
  3,Carol,carol@co.com,manager,product,SF
```

## When to Use Tabular Format

✅ **Use tabular when:**
- Array has ≥5 items
- Objects have ≥60% field uniformity
- All fields are flat (not nested objects)
- Data is record-like (logs, metrics, API docs)

❌ **Don't use tabular when:**
- Array has <5 items (minimal savings)
- Objects have <60% uniformity (field names repeat)
- Objects have nested structures (use key folding instead)
- Fields contain many delimiters (quotes add overhead)

## Common Pitfalls

### Wrong: Missing count

```
{name,age}:  ❌ Missing [N]
  Alice,30
  Bob,25
```

**Correct:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

### Wrong: Count mismatch

```
[3]{name,age}:  ❌ Says 3 but only 2 rows
  Alice,30
  Bob,25
```

**Correct:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

### Wrong: Field count mismatch

```
[2]{name,age,city}:
  Alice,30        ❌ Missing city
  Bob,25,LA
```

**Correct:**
```
[2]{name,age,city}:
  Alice,30,NYC
  Bob,25,LA
```

## See Also

- [Delimiters](./delimiters.md) - Using tab or pipe instead of comma
- [Inline Arrays](./inline-arrays.md) - For small primitive arrays
- [Expanded Lists](./expanded-lists.md) - For non-uniform objects
- [Strict Mode](./strict-mode.md) - Validation rules
