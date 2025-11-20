# Encoding Guide: JSON → TOON

Strategies for converting JSON to TOON format efficiently.

## Quick Start

```bash
# Zig encoder
cd .claude/utils/toon
zig build -Doptimize=ReleaseFast
./zig-out/bin/toon encode data.json > data.toon

# With options
./zig-out/bin/toon encode data.json \
  --delimiter tab \
  --key-folding \
  > data.toon
```

## Encoder Configuration

### EncoderConfig Options

```zig
pub const EncoderConfig = struct {
    indent_size: usize = 2,           // Spaces per indent level
    delimiter: Delimiter = .comma,    // comma, tab, or pipe
    key_folding: bool = true,         // Flatten nested objects
    flatten_depth: ?usize = null,     // null = unlimited folding
};
```

### Setting Options

```bash
# Delimiter
--delimiter comma  # Default
--delimiter tab    # For data with commas
--delimiter pipe   # For markdown

# Key folding
--key-folding      # Enable (default)
--no-key-folding   # Disable

# Indentation
--indent 2         # Default
--indent 4         # 4 spaces per level
```

## Encoding Strategies

### 1. Analyze First

Check if TOON is beneficial:

```bash
./zig-out/bin/toon check data.json
```

**Output:**
```
✓ TOON format recommended
  Items: 150
  Uniformity: 85%
  Estimated savings: 42% (~1250 tokens)
```

### 2. Choose Delimiter

Based on data content:

```bash
# Count comma occurrences
grep -o ',' data.json | wc -l

# If many commas, use tab or pipe
./zig-out/bin/toon encode data.json --delimiter tab
```

### 3. Enable Key Folding

For nested config:

```bash
# Check nesting depth
jq 'walk(if type == "object" then (paths | length) else empty end) | max' data.json

# If 2-3 levels, enable folding
./zig-out/bin/toon encode data.json --key-folding
```

### 4. Verify Output

```bash
# Encode
./zig-out/bin/toon encode data.json > output.toon

# Validate
./zig-out/bin/toon validate output.toon --strict

# Check savings
ORIGINAL=$(wc -c < data.json)
TOON=$(wc -c < output.toon)
SAVED=$((ORIGINAL - TOON))
PERCENT=$((SAVED * 100 / ORIGINAL))
echo "Saved: $PERCENT%"
```

## Array Type Selection

The encoder automatically chooses the best format:

### Inline Arrays (primitives ≤10)

**JSON:**
```json
{"tags": ["js", "react", "web"]}
```

**TOON:**
```
tags[3]: js,react,web
```

### Tabular Arrays (uniform objects ≥5)

**JSON:**
```json
[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "age": 25}
]
```

**TOON:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

### Expanded Lists (fallback)

**JSON:**
```json
[
  {"name": "Alice", "role": "admin"},
  {"name": "Bob", "level": 5}
]
```

**TOON:**
```
- name: Alice
  role: admin
- name: Bob
  level: 5
```

## Uniformity Calculation

Encoder uses **60% threshold**:

```
uniformity = (common_fields / total_unique_fields)

if uniformity ≥ 0.6 and items ≥ 5:
    use tabular
else:
    use expanded list
```

**Example:**
- 10 objects
- 8 have fields: name, age, city
- 2 have fields: name, role

```
common_fields = 1 (name)
total_unique = 4 (name, age, city, role)
uniformity = 1/4 = 0.25 < 0.6
→ Use expanded list
```

## Key Folding Rules

Folding happens when:
1. ✅ Key is valid identifier (`^[A-Za-z_][A-Za-z0-9_]*$`)
2. ✅ No collision with sibling keys
3. ✅ Value is an object (not array/primitive)

**Example:**

**JSON:**
```json
{
  "server": {"host": "localhost"},  // Will fold
  "server.port": 8080                // Collision, won't fold server
}
```

**TOON:**
```
server:
  host: localhost
server.port: 8080
```

## Number Formatting

### Canonical Rules

- No exponent notation (1e3 → 1000)
- NaN → null
- Infinity → null
- -0 → 0
- No trailing zeros (1.50 → 1.5)
- No unnecessary decimal (1.0 → 1)

**Examples:**
```
42 → 42
3.14159 → 3.14159
1.50000 → 1.5
1.0 → 1
1e3 → 1000  ❌ TODO: Currently outputs "1e3"
```

## Escape Handling

Only these five are escaped:

| Character | Escape |
|-----------|--------|
| `\` | `\\` |
| `"` | `\"` |
| Newline | `\n` |
| Carriage return | `\r` |
| Tab | `\t` |

**Example:**

**JSON:**
```json
{"path": "C:\\Users\\Alice\\file.txt"}
```

**TOON:**
```
path: "C:\\Users\\Alice\\file.txt"
```

## Batch Encoding

### Script

```bash
#!/bin/bash
# encode-all.sh

for file in data/*.json; do
  echo "Encoding: $file"
  ./zig-out/bin/toon encode "$file" > "${file%.json}.toon"
done
```

### Makefile

```makefile
JSONS := $(wildcard data/*.json)
TOONS := $(JSONS:.json=.toon)

all: $(TOONS)

%.toon: %.json
	./zig-out/bin/toon encode $< > $@

.PHONY: all
```

## Performance Tips

### 1. Use ReleaseFast build

```bash
zig build -Doptimize=ReleaseFast  # 20x faster than TypeScript
```

### 2. Pipe for large files

```bash
cat huge.json | ./zig-out/bin/toon encode /dev/stdin > huge.toon
```

### 3. Parallel processing

```bash
find data/ -name "*.json" | \
  parallel "./zig-out/bin/toon encode {} > {.}.toon"
```

## Common Issues

### Issue: Minimal savings

**Cause:** Small arrays (<5 items) or low uniformity (<60%)

**Solution:**
```bash
# Check before encoding
./zig-out/bin/toon check data.json

# Output will suggest if TOON is beneficial
```

### Issue: Too many quotes

**Cause:** Using comma delimiter with comma-heavy data

**Solution:**
```bash
# Use tab or pipe delimiter
./zig-out/bin/toon encode data.json --delimiter tab
```

### Issue: Invalid output

**Cause:** Bug in encoder

**Solution:**
```bash
# Validate output
./zig-out/bin/toon validate output.toon --strict

# Report issue with test case
```

## See Also

- [Decoding Guide](./decoding.md) - TOON → JSON
- [Optimization Guide](./optimization.md) - Maximizing savings
- [Configuration Guide](./configuration.md) - All options
