# Delimiters in TOON v2.0

TOON supports three delimiters: comma (`,`), tab (`\t`), and pipe (`|`).

## Delimiter Declaration

Declare the delimiter in the array header:

```
[N,]{fields}:   # Comma (default)
[N\t]{fields}:  # Tab
[N|]{fields}:   # Pipe
```

If no delimiter is specified, comma is assumed.

## Comma Delimiter (Default)

**Best for:** General use, most compact

**Syntax:**
```
[N]{fields}:        # Comma is default
[N,]{fields}:       # Explicit comma
```

**Example:**
```
[3]{name,age,city}:
  Alice,30,NYC
  Bob,25,LA
  Carol,35,SF
```

**Pros:**
- Most compact (no extra characters)
- Default, no declaration needed
- Familiar from CSV

**Cons:**
- Values with commas need quotes
- Less visually aligned

## Tab Delimiter

**Best for:** Data with many commas, columnar alignment

**Syntax:**
```
[N\t]{fields}:
```

**Example:**
```
[3\t]{name,age,location}:
  Alice	30	New York, NY
  Bob	25	Los Angeles, CA
  Carol	35	San Francisco, CA
```

**Pros:**
- No quoting needed for commas in values
- Visually aligned columns (in editors with tab stops)
- Common in TSV files

**Cons:**
- Tabs may render differently in different tools
- Slightly more verbose in declaration

## Pipe Delimiter

**Best for:** Markdown compatibility, visual clarity

**Syntax:**
```
[N|]{fields}:
```

**Example:**
```
[3|]{method,endpoint,description}:
  GET|/api/users|List all users
  POST|/api/users|Create new user
  DELETE|/api/users/:id|Delete user by ID
```

**Pros:**
- Markdown-compatible
- Very visible separator
- Rare in actual data (less quoting)

**Cons:**
- Most verbose (3 chars: `N|]`)
- Pipes in values need quoting

## Choosing a Delimiter

### Decision Tree

```
Does your data contain...

├─ Many commas (addresses, prose)?
│  └─ Use TAB or PIPE
│
├─ Many colons (times, ratios)?
│  └─ Use TAB or PIPE (colons always need quotes regardless)
│
├─ Markdown documentation?
│  └─ Use PIPE for table-like appearance
│
├─ Numeric/code data (no punctuation)?
│  └─ Use COMMA (most compact)
│
└─ Mixed content?
   └─ Count quote occurrences:
      - Comma needs quotes: use TAB/PIPE
      - Few quotes: use COMMA
```

## Real-World Examples

### Use Case: API Endpoints (Pipe)

**Why pipe:** Descriptions have commas and colons

```
[5|]{method,path,auth,description}:
  GET|/api/users|optional|List all users, paginated
  POST|/api/users|required|Create new user: email, name, role
  GET|/api/users/:id|optional|Get user by ID
  PUT|/api/users/:id|required|Update user: partial updates allowed
  DELETE|/api/users/:id|admin|Delete user, cascades to related data
```

### Use Case: Addresses (Tab)

**Why tab:** Addresses always have commas

```
[3\t]{name,address,phone}:
  Alice	123 Main St, New York, NY 10001	(555) 123-4567
  Bob	456 Oak Ave, Los Angeles, CA 90001	(555) 234-5678
  Carol	789 Pine Rd, San Francisco, CA 94102	(555) 345-6789
```

### Use Case: Metrics (Comma)

**Why comma:** Simple numeric data, most compact

```
[4]{timestamp,cpu,memory,disk}:
  2025-01-15T10:00:00Z,45.2,78.5,62.1
  2025-01-15T10:01:00Z,48.7,79.2,62.3
  2025-01-15T10:02:00Z,43.1,77.8,62.0
  2025-01-15T10:03:00Z,46.5,80.1,62.4
```

## Delimiter Detection

Decoders detect the delimiter from the header:

```
[3,]{...}:   → Comma delimiter
[3\t]{...}:  → Tab delimiter
[3|]{...}:   → Pipe delimiter
[3]{...}:    → Comma (default)
```

## Mixed Delimiters in Same File

Different arrays in the same file can use different delimiters:

```
# Metrics use comma (compact)
metrics[2]{cpu,memory}:
  45.2,78.5
  48.7,79.2

# Addresses use tab (avoid quoting commas)
locations[2\t]{name,address}:
  NYC	123 Main St, New York, NY 10001
  LA	456 Oak Ave, Los Angeles, CA 90001

# API docs use pipe (markdown-like)
endpoints[2|]{method,path,description}:
  GET|/api/users|List users, with pagination
  POST|/api/users|Create user: requires email, name
```

## Quoting Still Required

Even with delimiter choice, some characters always need quotes:

### Always quote these patterns:

```
- Values starting with hyphen: "-value"
- Reserved words: "true", "false", "null" (if meant as strings)
- Brackets: "[value]" or "{value}"
- Control characters: "\n\r\t" etc.
```

### Examples:

**Comma delimiter:**
```
[2]{name,note}:
  Alice,"Contains, comma"
  Bob,Normal value
```

**Tab delimiter:**
```
[2\t]{name,note}:
  Alice	Contains, comma (no quotes needed!)
  Bob	"Contains	tab" (quotes needed for tab)
```

**Pipe delimiter:**
```
[2|]{name,note}:
  Alice|Contains, comma and: colon (no quotes!)
  Bob|"Contains | pipe" (quotes needed for pipe)
```

## Token Savings Comparison

Delimiters affect token counts differently:

**Same data, 3 delimiters:**

Comma (most compact):
```
[3]{a,b,c}: 1,2,3 4,5,6 7,8,9
```
≈ 28 tokens

Tab (middle):
```
[3\t]{a,b,c}: 1	2	3 4	5	6 7	8	9
```
≈ 30 tokens

Pipe (most verbose):
```
[3|]{a,b,c}: 1|2|3 4|5|6 7|8|9
```
≈ 32 tokens

**Recommendation:** Use comma unless quoting overhead makes alternatives more efficient.

## Encoder Configuration

### Zig CLI:

```bash
# Comma (default)
toon encode data.json

# Tab
toon encode data.json --delimiter tab

# Pipe
toon encode data.json --delimiter pipe
```

### Programmatic:

```zig
var config = EncoderConfig.init();
config.delimiter = .tab;  // or .comma, .pipe

const result = try toon.encode(json_str, config);
```

## Common Mistakes

### Wrong: No delimiter in header with tabs in data

```
[2]{a,b}:     ❌ Says comma but uses tabs
  1	2
  3	4
```

**Correct:**
```
[2\t]{a,b}:
  1	2
  3	4
```

### Wrong: Mixing delimiters in same array

```
[2]{a,b}:
  1,2         ❌ Mixed comma and pipe
  3|4
```

**Correct:**
```
[2]{a,b}:
  1,2
  3,4
```

### Wrong: Forgetting to quote delimiter in value

```
[2|]{a,b}:
  1|2|3       ❌ Ambiguous: 2 or 3 fields?
  4|5
```

**Correct:**
```
[2|]{a,b}:
  "1|2"|3
  4|5
```

## Performance Comparison

**Encoding speed (Zig implementation):**
- Comma: 1.0x baseline
- Tab: 0.98x (2% slower, tab escaping)
- Pipe: 0.99x (1% slower)

**Decoding speed:**
- Comma: 1.0x baseline
- Tab: 1.05x (5% faster, simpler splitting)
- Pipe: 1.02x (2% faster)

Differences are negligible; choose based on data content.

## See Also

- [Quoting Rules](./quoting-rules.md) - When quotes are required
- [Basic Tabular](./basic-tabular.md) - Tabular array format
- [Inline Arrays](./inline-arrays.md) - Inline array format
- [Escape Sequences](./escape-sequences.md) - Handling special characters
