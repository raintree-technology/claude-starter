# Escape Sequences

TOON v2.0 supports exactly **five escape sequences** within quoted strings.

## The Five Escape Sequences

| Sequence | Meaning | Unicode |
|----------|---------|---------|
| `\\` | Backslash | U+005C |
| `\"` | Double quote | U+0022 |
| `\n` | Newline | U+000A |
| `\r` | Carriage return | U+000D |
| `\t` | Tab | U+0009 |

**IMPORTANT:** All other backslash combinations are **invalid** and will error in strict mode.

## Basic Usage

### Backslash

**JSON:**
```json
{"path": "C:\\Users\\Alice"}
```

**TOON:**
```
path: "C:\\Users\\Alice"
```

### Double Quote

**JSON:**
```json
{"quote": "She said \"hello\""}
```

**TOON:**
```
quote: "She said \"hello\""
```

### Newline

**JSON:**
```json
{"text": "Line 1\nLine 2"}
```

**TOON:**
```
text: "Line 1\nLine 2"
```

### Carriage Return

**JSON:**
```json
{"text": "Windows line\r\nending"}
```

**TOON:**
```
text: "Windows line\r\nending"
```

### Tab

**JSON:**
```json
{"data": "Column1\tColumn2"}
```

**TOON:**
```
data: "Column1\tColumn2"
```

## When Quotes Are Required

Escape sequences **only work inside quoted strings**:

✅ **Correct:**
```
path: "C:\\Users\\Alice"
```

❌ **Wrong (literal backslash, not escape):**
```
path: C:\Users\Alice
```

## Invalid Escape Sequences

These are **NOT valid** in TOON and will error:

```
"\a"  ❌ Alert/bell
"\b"  ❌ Backspace
"\f"  ❌ Form feed
"\v"  ❌ Vertical tab
"\0"  ❌ Null character
"\x"  ❌ Hex escape
"\u"  ❌ Unicode escape
```

**Why restricted:** Simplicity and portability. The five sequences cover all common use cases.

## Handling Unsupported Characters

For characters not in the five escapes, use the literal character:

### Unicode characters

**JSON:**
```json
{"emoji": "Hello 👋"}
```

**TOON (literal UTF-8):**
```
emoji: "Hello 👋"
```

### Control characters

For control chars not in the five (like `\b`, `\f`), use:
1. Literal byte (if your editor supports it)
2. Encode differently (e.g., Base64)
3. Avoid if possible

**Not recommended:**
```
data: "\x08"  ❌ Invalid in TOON
```

**Alternatives:**
```
data: "<backspace>"      # Describe it
data_base64: "CAg="      # Encode it
```

## Real-World Examples

### File Paths

**Windows:**
```
file: "C:\\Program Files\\MyApp\\config.json"
```

**Unix:**
```
file: "/usr/local/bin/myapp"  # No escapes needed
```

### Quoted Speech

```
dialogue: "He said, \"It's great!\""
```

### Multi-line Text

```
description: "First line\nSecond line\nThird line"
```

### Log Messages

```
log: "[2025-01-15 10:30:00] User \"alice\" logged in\nIP: 192.168.1.100"
```

### TSV Data in TOON

```
data: "col1\tcol2\tcol3"
```

## Escape Sequences in Arrays

### Inline arrays

**JSON:**
```json
{"paths": ["C:\\Users", "D:\\Data"]}
```

**TOON:**
```
paths[2]: "C:\\Users","D:\\Data"
```

### Tabular arrays

**JSON:**
```json
[
  {"name": "Alice", "quote": "She said \"hi\""},
  {"name": "Bob", "quote": "He said \"bye\""}
]
```

**TOON:**
```
[2]{name,quote}:
  Alice,"She said \"hi\""
  Bob,"He said \"bye\""
```

## Strict Mode Validation

In strict mode, invalid escape sequences cause errors:

**Invalid TOON:**
```
path: "C:\Users\alice"  ❌ \U and \a are invalid
```

**Error message:**
```
Invalid escape sequence '\U' at line 1, column 8
Valid sequences: \\ \" \n \r \t
```

**Valid TOON:**
```
path: "C:\\Users\\alice"
```

## Encoding from JSON

When encoding JSON to TOON, only these five get escaped:

**JSON:**
```json
{
  "text": "Line 1\nLine 2\twith\ttabs\rand \"quotes\""
}
```

**TOON:**
```
text: "Line 1\nLine 2\twith\ttabs\rand \"quotes\""
```

All other characters (including Unicode) pass through as-is.

## Decoding to JSON

When decoding TOON to JSON, escapes are unescaped:

**TOON:**
```
path: "C:\\Users\\Alice"
quote: "She said \"hello\""
```

**JSON:**
```json
{
  "path": "C:\\Users\\Alice",
  "quote": "She said \"hello\""
}
```

## Comparison with JSON

TOON has **fewer** escape sequences than JSON:

| Escape | JSON | TOON |
|--------|------|------|
| `\\` | ✅ | ✅ |
| `\"` | ✅ | ✅ |
| `\n` | ✅ | ✅ |
| `\r` | ✅ | ✅ |
| `\t` | ✅ | ✅ |
| `\b` | ✅ | ❌ |
| `\f` | ✅ | ❌ |
| `\/` | ✅ | ❌ (literal `/` instead) |
| `\uXXXX` | ✅ | ❌ (literal UTF-8 instead) |

**Rationale:** TOON uses UTF-8 natively, so `\u` escapes are unnecessary. Rare control chars (`\b`, `\f`) are omitted for simplicity.

## Edge Cases

### Literal backslash at end

**JSON:**
```json
{"path": "C:\\"}
```

**TOON:**
```
path: "C:\\"
```

### Multiple consecutive escapes

**JSON:**
```json
{"text": "\\n means newline"}
```

**TOON:**
```
text: "\\n means newline"
```
(First `\\` escapes to literal `\`, then `n` is literal)

### Empty string

**JSON:**
```json
{"empty": ""}
```

**TOON:**
```
empty: ""
```
(No escapes)

### Only escapes

**JSON:**
```json
{"escapes": "\n\r\t"}
```

**TOON:**
```
escapes: "\n\r\t"
```

## Common Mistakes

### Wrong: Using unsupported escapes

```
text: "Alert: \a"  ❌ \a not supported
```

**Correct:**
```
text: "Alert: <bell>"
```

### Wrong: Forgetting quotes

```
path: C:\Users\alice  ❌ Unquoted, treated as literal text
```

**Correct:**
```
path: "C:\\Users\\alice"
```

### Wrong: Single backslash before n

```
text: "Line 1\nLine 2"  ✅ Correct (newline)
text: "\\nLine 2"       ✅ Correct (literal \n)
text: "\\\nLine 2"      ✅ Correct (backslash then newline)
```

### Wrong: Escaping delimiter unnecessarily

**Comma delimiter:**
```
value: "hello\,world"  ❌ \, not needed (comma doesn't need escape)
```

**Correct:**
```
value: "hello,world"   ✅ Quote the whole value instead
```

## Performance

Escape processing is fast:

**Encoding:**
- Scan for 5 characters: `\ " \n \r \t`
- O(n) single pass
- ~5% overhead for strings with escapes

**Decoding:**
- State machine for `\X` sequences
- O(n) single pass
- ~5% overhead

**Recommendation:** Use escapes freely; performance impact is negligible.

## See Also

- [Quoting Rules](./quoting-rules.md) - When quotes are required
- [Delimiters](./delimiters.md) - Choosing comma/tab/pipe
- [Strict Mode](./strict-mode.md) - Validation rules
