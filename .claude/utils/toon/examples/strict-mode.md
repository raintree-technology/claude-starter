# Strict Mode Validation

Strict mode enforces additional validation rules for production TOON files.

## Enabling Strict Mode

### Zig CLI:
```bash
toon validate data.toon --strict
```

### Decoder:
```zig
var config = DecoderConfig.init();
config.strict = true;

try toon.validate(toon_str, config);
```

## Validation Rules

### 1. Indentation Consistency

**Rule:** Indentation must be multiples of `indent_size` (default: 2 spaces).

✅ **Valid (2-space indent):**
```
server:
  host: localhost
  database:
    name: mydb
```

❌ **Invalid (mixed 2 and 3 spaces):**
```
server:
  host: localhost
   database:  ← 3 spaces, not a multiple of 2
    name: mydb
```

**Error:**
```
Line 3: Indentation must be multiple of 2 (found 3)
```

### 2. No Tabs in Indentation

**Rule:** Only spaces allowed for indentation (tabs can be values, but not indent).

✅ **Valid:**
```
server:
  host: localhost
```

❌ **Invalid:**
```
server:
	host: localhost  ← Tab character used for indent
```

**Error:**
```
Line 2: Tab character found in indentation (use spaces only)
```

### 3. Array Count Matches

**Rule:** Declared count `[N]` must equal actual rows.

✅ **Valid:**
```
[3]{name,age}:
  Alice,30
  Bob,25
  Carol,35
```

❌ **Invalid (says 3, has 2):**
```
[3]{name,age}:
  Alice,30
  Bob,25
```

**Error:**
```
Array declared [3] items but found 2 rows
```

### 4. Field Width Consistency

**Rule:** All rows in tabular array must have same number of fields.

✅ **Valid:**
```
[2]{name,age,city}:
  Alice,30,NYC
  Bob,25,LA
```

❌ **Invalid (row 2 missing city):**
```
[2]{name,age,city}:
  Alice,30,NYC
  Bob,25
```

**Error:**
```
Line 3: Expected 3 fields, found 2
```

### 5. No Blank Lines Within Arrays

**Rule:** Tabular arrays can't have blank lines between rows.

✅ **Valid:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

❌ **Invalid:**
```
[2]{name,age}:
  Alice,30

  Bob,25
```

**Error:**
```
Line 3: Blank line not allowed within array
```

### 6. Valid Escape Sequences Only

**Rule:** Only `\\ \" \n \r \t` allowed in strings.

✅ **Valid:**
```
path: "C:\\Users\\Alice"
```

❌ **Invalid:**
```
text: "Alert: \a"
```

**Error:**
```
Line 1: Invalid escape sequence '\a' (valid: \\ \" \n \r \t)
```

## Non-Strict Mode

In non-strict mode, these are **warnings** instead of errors:

```bash
toon validate data.toon  # Non-strict (default)
```

**Output:**
```
⚠ Warning: Line 3: Indentation not multiple of 2
⚠ Warning: Line 5: Array count mismatch
File is valid TOON but has 2 warnings
```

## Use Cases

### Development: Non-Strict

During development, warnings are helpful but not blocking:

```bash
toon encode data.json > output.toon
toon validate output.toon
# Warnings shown, exit code 0
```

### Production: Strict

In production, enforce all rules:

```bash
toon encode data.json > output.toon
toon validate output.toon --strict || exit 1
# Errors cause non-zero exit
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
- name: Validate TOON files
  run: |
    for file in data/*.toon; do
      toon validate "$file" --strict
    done
```

## Example Violations

### Indentation Error

**TOON:**
```
server:
  host: localhost
   port: 8080  ← 3 spaces instead of 2
```

**Strict mode output:**
```
❌ Error at line 3: Indentation must be multiple of 2 (found 3)
Validation failed
```

### Array Count Error

**TOON:**
```
[5]{id,name}:
  1,Alice
  2,Bob
  3,Carol
```

**Strict mode output:**
```
❌ Error at line 1: Array declared [5] but found 3 rows
Validation failed
```

### Field Count Error

**TOON:**
```
[2]{name,age,city}:
  Alice,30,NYC
  Bob,25
```

**Strict mode output:**
```
❌ Error at line 3: Expected 3 fields, found 2
Header: [2]{name,age,city}
Row: Bob,25
Validation failed
```

### Invalid Escape Error

**TOON:**
```
path: "C:\Users\alice"
```

**Strict mode output:**
```
❌ Error at line 1: Invalid escape sequence '\U'
Valid sequences: \\ \" \n \r \t
Use: "C:\\Users\\alice"
Validation failed
```

## Configurable Indent Size

Change indent size for validation:

```bash
toon validate data.toon --strict --indent 4
```

**TOON with 4-space indent:**
```
server:
    host: localhost
    database:
        name: mydb
```

## Strict Mode Performance

Strict validation adds:
- **+15% parse time** (extra checks)
- **Same memory** (no additional allocation)

**Recommendation:** Enable in CI/CD, optional in development.

## Fixing Violations

### Auto-fix indentation

```bash
# Re-encode with consistent indentation
toon decode data.toon | toon encode --indent 2 > fixed.toon
```

### Auto-fix count mismatches

Encoder automatically counts:

```bash
toon decode data.toon | toon encode > fixed.toon
```

### Manual fixes

Use editor to:
1. Replace tabs with spaces
2. Align indentation to multiples of 2
3. Fix array counts
4. Add missing fields

## Exit Codes

```
0 - Valid (no errors)
1 - Invalid (errors found in strict mode)
2 - Warnings (non-strict mode only)
```

**Example:**
```bash
toon validate data.toon --strict
if [ $? -eq 0 ]; then
  echo "✓ Valid"
else
  echo "✗ Invalid"
  exit 1
fi
```

## Common Patterns

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

for file in $(git diff --cached --name-only | grep '\.toon$'); do
  toon validate "$file" --strict || {
    echo "❌ Invalid TOON file: $file"
    exit 1
  }
done
```

### Makefile Target

```makefile
validate:
	@find . -name "*.toon" | xargs -I {} toon validate {} --strict

.PHONY: validate
```

### Package.json Script

```json
{
  "scripts": {
    "validate": "find . -name '*.toon' -exec toon validate {} --strict \\;"
  }
}
```

## See Also

- [Escape Sequences](./escape-sequences.md) - Valid escapes
- [Basic Tabular](./basic-tabular.md) - Array format rules
- [Nested Objects](./nested-objects.md) - Indentation rules
