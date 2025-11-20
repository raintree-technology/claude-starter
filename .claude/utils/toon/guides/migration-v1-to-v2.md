# Migration Guide: TOON v1 to v2

Upgrading from TOON v1.x to v2.0.

## What's New in v2.0

### New Features

1. **Multiple Delimiters** - comma, tab, pipe (v1 had comma only)
2. **Inline Primitive Arrays** - `friends[3]: a,b,c` format
3. **Expanded Lists** - `- item` format for non-uniform data
4. **Key Folding** - Flatten nested objects (`server.host: value`)
5. **Path Expansion** - Decoder expands dotted keys
6. **Strict Mode** - Production validation
7. **Canonical Numbers** - Normalized number format
8. **Complete Escape Rules** - Exactly five escape sequences

### Breaking Changes

1. **Delimiter Declaration** - Must use `[N,]`, `[N\t]`, or `[N|]` syntax
2. **Escape Sequences** - Only 5 allowed (v1 had 8)
3. **Array Format** - Count is required: `[N]{fields}:` not `{fields}:`
4. **Key Validation** - Stricter identifier rules for folding

## Syntax Changes

### v1: Basic Tabular

**v1.x:**
```
{name,age}:
  Alice,30
  Bob,25
```

**v2.0:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

**Change:** Count `[2]` is now required.

### v1: No Delimiters

**v1.x:** Only comma supported

**v2.0:**
```
[2,]{name,age}:    # Comma (explicit)
[2\t]{name,age}:   # Tab
[2|]{name,age}:    # Pipe
```

**Change:** Delimiter can be declared in header.

### v1: Limited Escapes

**v1.x:** Had `\b`, `\f`, `\u` escapes

**v2.0:** Only `\\ \" \n \r \t`

**Change:** Remove unsupported escapes from data.

## Migration Steps

### Step 1: Add Array Counts

**Before (v1):**
```
{id,name}:
  1,Alice
  2,Bob
```

**After (v2):**
```
[2]{id,name}:
  1,Alice
  2,Bob
```

**Automated fix:**
```bash
# Count rows and add [N]
sed -i 's/^{/{COUNT}{/' file.toon
# (Manual: replace COUNT with actual number)
```

### Step 2: Update Escape Sequences

**Before (v1):**
```
text: "Unicode: \u0041"
control: "Backspace: \b"
```

**After (v2):**
```
text: "Unicode: A"      # Use literal UTF-8
control: "Backspace: "  # Use literal or remove
```

**Automated check:**
```bash
# Find invalid escapes
grep -n '\\[^\\\"nrt]' file.toon
```

### Step 3: Add Delimiter Declarations

**Before (v1):** Implicit comma

**After (v2):** Explicit delimiter

```
[2,]{name,age}:   # Comma (can omit, it's default)
[2\t]{name,age}:  # Tab
[2|]{name,age}:   # Pipe
```

### Step 4: Consider Key Folding

**v1:** No folding support

**v2:** Optional folding

**Before:**
```
server:
  host: localhost
  port: 8080
```

**After (with folding):**
```
server.host: localhost
server.port: 8080
```

**Note:** Folding is optional; old syntax still valid.

## Automated Migration

### Script

```bash
#!/bin/bash
# migrate-v1-to-v2.sh

FILE="$1"

if [[ ! -f "$FILE" ]]; then
  echo "Usage: $0 <file.toon>"
  exit 1
fi

# Backup original
cp "$FILE" "${FILE}.v1.bak"

# 1. Add array counts (manual step needed)
echo "Step 1: Add array counts manually"
echo "  Change: {fields}: → [N]{fields}:"
echo ""

# 2. Check for invalid escapes
echo "Step 2: Checking for invalid escape sequences..."
if grep -n '\\[^\\\"nrt]' "$FILE"; then
  echo "⚠ Found invalid escapes above. Valid: \\ \" \n \r \t"
else
  echo "✓ No invalid escapes found"
fi
echo ""

# 3. Validate
echo "Step 3: Validating v2 syntax..."
./zig-out/bin/toon validate "$FILE" --strict

echo ""
echo "Backup saved to: ${FILE}.v1.bak"
echo "Manual fixes may be needed. Check output above."
```

### Usage

```bash
chmod +x migrate-v1-to-v2.sh
./migrate-v1-to-v2.sh data.toon
```

## Compatibility

### v2 Decoder with v1 Files

**Partially compatible:**
- ✅ Tabular arrays work (if counts added)
- ❌ Invalid escapes will error in strict mode
- ⚠ Missing counts will error

### v1 Decoder with v2 Files

**Not compatible:**
- v1 decoders don't understand `[N,]`, `[N\t]`, `[N|]` syntax
- v1 decoders don't support inline arrays
- v1 decoders don't support key folding

**Recommendation:** Upgrade decoders to v2.

## Feature Parity

| Feature | v1.x | v2.0 |
|---------|------|------|
| Tabular arrays | ✅ | ✅ |
| Inline arrays | ❌ | ✅ |
| Expanded lists | ❌ | ✅ |
| Delimiters | Comma only | Comma, tab, pipe |
| Key folding | ❌ | ✅ |
| Path expansion | ❌ | ✅ |
| Strict mode | ❌ | ✅ |
| Escape sequences | 8 | 5 (simplified) |
| Array count required | ❌ | ✅ |

## Testing Migration

### 1. Roundtrip Test

```bash
# v1 file
cat v1-data.toon

# Decode (assuming counts added)
./zig-out/bin/toon decode v1-data.toon > data.json

# Re-encode with v2
./zig-out/bin/toon encode data.json > v2-data.toon

# Compare
diff -u v1-data.toon v2-data.toon
```

### 2. Validation Test

```bash
# Check v2 compliance
./zig-out/bin/toon validate v2-data.toon --strict

# Should pass without errors
```

### 3. Token Comparison

```bash
# v1 format
V1_TOKENS=$(($(wc -c < v1-data.toon) / 4))

# v2 format with all features
V2_TOKENS=$(($(wc -c < v2-data.toon) / 4))

echo "v1: $V1_TOKENS tokens"
echo "v2: $V2_TOKENS tokens"
echo "Improvement: $(($V1_TOKENS - $V2_TOKENS)) tokens"
```

## Rollback Plan

If migration fails:

```bash
# Restore v1 backups
for file in *.toon.v1.bak; do
  mv "$file" "${file%.v1.bak}"
done

# Revert to v1 encoder
git checkout v1.x
```

## Gradual Migration

Migrate incrementally:

1. **Week 1:** Add array counts to existing files
2. **Week 2:** Update escape sequences
3. **Week 3:** Test v2 decoder with updated files
4. **Week 4:** Start using v2 encoder for new data
5. **Week 5:** Enable key folding for config files
6. **Week 6:** Full v2 adoption

## FAQs

### Q: Can v2 read v1 files?

**A:** Partially. You need to add array counts `[N]` first. Invalid escapes will error in strict mode.

### Q: Can v1 read v2 files?

**A:** No. v1 decoders don't understand v2 syntax.

### Q: Do I have to use all v2 features?

**A:** No. v2 is backwards-compatible if you:
- Add array counts
- Remove invalid escapes
- Use comma delimiter (default)

### Q: What if I have thousands of v1 files?

**A:** Write a migration script:
1. Detect tabular arrays
2. Count rows
3. Add `[N]` prefix
4. Validate output

### Q: Will v2 break my pipeline?

**A:** Only if you don't add array counts. Test migration on a small dataset first.

## See Also

- [TOON v2.0 Changelog](../references/v2-changelog.md)
- [Encoding Guide](./encoding.md)
- [Validation Guide](./validation.md)
