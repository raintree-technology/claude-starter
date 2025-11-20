# Quoting Rules

When values need quotes and when they can be bare.

## Quote When Value Contains

### 1. Delimiter character

**Comma delimiter:**
```
location: "New York, NY"  # Contains comma
```

**Tab delimiter:**
```
[|\t] data: "Contains	tab"  # Contains tab
```

**Pipe delimiter:**
```
[||] note: "Status: active | ready"  # Contains pipe
```

### 2. Colon

```
time: "10:30 AM"
ratio: "16:9"
```

### 3. Brackets

```
note: "[URGENT] Please review"
formula: "{x + y}"
```

### 4. Control characters

```
text: "Line 1\nLine 2"  # Contains newline
path: "C:\\Users\\Alice"  # Contains backslash
```

### 5. Leading hyphen

```
value: "-negative"  # Conflicts with list marker
```

### 6. Reserved words (as strings)

```
status: "true"   # String "true", not boolean
value: "null"    # String "null", not null
flag: "false"    # String "false", not boolean
```

## Don't Quote

### Simple values

```
name: Alice
age: 30
active: true
value: null
```

### URLs (no special chars)

```
url: https://example.com
```

### Paths (forward slashes OK)

```
path: /usr/local/bin
```

### Numbers

```
count: 42
price: 19.99
negative: -5
```

### Booleans and null

```
enabled: true
disabled: false
missing: null
```

## Edge Cases

### String that looks like number

```
zipcode: "10001"  # Quote to preserve as string
```

### Empty string

```
empty: ""  # Quotes required
```

### String with only spaces

```
spaces: "   "  # Quotes required
```

### Value starting with quote

```
quote: "\"Hello\""  # Escape inner quotes
```

## See Also

- [Escape Sequences](./escape-sequences.md)
- [Delimiters](./delimiters.md)
