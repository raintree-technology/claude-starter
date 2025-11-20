# TOON v2.0 ABNF Grammar

Formal grammar specification in Augmented Backus-Naur Form (ABNF).

## Document

**Status:** Simplified reference (full ABNF pending official spec)
**Source:** https://github.com/toon-format/spec
**Version:** v2.0 (2025-11-10)

## Root

```abnf
toon-document = *( key-value / array / comment / CRLF )

key-value = key COLON value CRLF
array = tabular-array / inline-array / expanded-list

comment = "#" *VCHAR CRLF
```

## Keys

```abnf
key = simple-key / folded-key

simple-key = 1*( ALPHA / DIGIT / "_" / "-" )

folded-key = identifier *( "." identifier )
identifier = ( ALPHA / "_" ) *( ALPHA / DIGIT / "_" )
```

## Values

```abnf
value = string / number / boolean / null / object / array

string = quoted-string / bare-string

quoted-string = DQUOTE *( escaped-char / unescaped-char ) DQUOTE
escaped-char = "\\" / "\"" / "\n" / "\r" / "\t"
unescaped-char = %x20-21 / %x23-5B / %x5D-10FFFF  ; Any except " and \

bare-string = 1*( ALPHA / DIGIT / "." / "-" / "/" / "_" )

number = [ "-" ] ( integer / float )
integer = "0" / ( %x31-39 *DIGIT )
float = integer "." 1*DIGIT

boolean = "true" / "false"

null = "null"
```

## Tabular Arrays

```abnf
tabular-array = array-header CRLF *array-row

array-header = "[" count [ delimiter-marker ] "]" "{" field-list "}" ":"

count = 1*DIGIT

delimiter-marker = "," / "\t" / "|"

field-list = field *( "," field )
field = identifier

array-row = indent value *( delimiter value ) CRLF

delimiter = "," / "\t" / "|"  ; Must match delimiter-marker
```

## Inline Arrays

```abnf
inline-array = key "[" count "]" ":" value-list CRLF

value-list = value *( delimiter value )
```

## Expanded Lists

```abnf
expanded-list = *list-item

list-item = indent "-" SP value CRLF
          / indent "-" CRLF nested-object

nested-object = *( deeper-indent key-value )
```

## Objects

```abnf
object = "{" [ key-value-pairs ] "}"

key-value-pairs = key ":" value *( "," key ":" value )
```

## Indentation

```abnf
indent = *( SP )  ; Must be multiple of indent-size

deeper-indent = indent 1*( SP )  ; indent + indent-size
```

## Delimiters

```abnf
COLON = ":"
COMMA = ","
TAB = %x09
PIPE = "|"
```

## Whitespace

```abnf
SP = %x20  ; Space
CRLF = %x0A  ; Newline (LF only, not CRLF)
```

## Character Classes

```abnf
ALPHA = %x41-5A / %x61-7A  ; A-Z / a-z
DIGIT = %x30-39            ; 0-9
DQUOTE = %x22              ; "
```

## Examples

### Tabular Array

```abnf
; Grammar
tabular-array = "[" "3" "]" "{" "name" "," "age" "}" ":" CRLF
                "Alice" "," "30" CRLF
                "Bob" "," "25" CRLF
                "Carol" "," "35" CRLF

; Actual TOON
[3]{name,age}:
  Alice,30
  Bob,25
  Carol,35
```

### Inline Array

```abnf
; Grammar
inline-array = "friends" "[" "3" "]" ":" "Alice" "," "Bob" "," "Carol" CRLF

; Actual TOON
friends[3]: Alice,Bob,Carol
```

### Expanded List

```abnf
; Grammar
expanded-list = "-" SP "Alice" CRLF
                "-" SP "Bob" CRLF

; Actual TOON
- Alice
- Bob
```

### Key Folding

```abnf
; Grammar
folded-key = "server" "." "host"
key-value = folded-key ":" "localhost" CRLF

; Actual TOON
server.host: localhost
```

## Validation Rules (Strict Mode)

```abnf
; Indentation must be multiple of indent-size
valid-indent = indent-size / ( 2 * indent-size ) / ( 3 * indent-size ) / ...

; Array count must match rows
valid-array = "[" count "]" ... count-rows
count-rows = count * array-row

; Field width must be consistent
valid-row = field-count-values
field-count = count-fields-in-header
```

## Notes

### Escape Sequences

Only five escape sequences are valid:
- `\\` → Backslash
- `\"` → Double quote
- `\n` → Newline (LF)
- `\r` → Carriage return (CR)
- `\t` → Tab

### Line Endings

TOON uses LF (`\n`) only, not CRLF (`\r\n`).

### UTF-8

All text is UTF-8 encoded. No `\uXXXX` escapes needed.

### Reserved Words

When used as string values, these must be quoted:
- `true`
- `false`
- `null`

### Delimiter Declaration

If delimiter is not comma (default), it must be declared in header:
- Comma: `[N]{fields}:` or `[N,]{fields}:`
- Tab: `[N\t]{fields}:`
- Pipe: `[N|]{fields}:`

## References

- **Full Specification:** https://github.com/toon-format/spec
- **ABNF RFC:** https://www.rfc-editor.org/rfc/rfc5234
- **This Implementation:** `.claude/utils/toon/toon.zig`

## See Also

- [Examples](../examples/) - Syntax examples
- [Compliance Matrix](./compliance-matrix.md) - Implementation status
- [v2 Changelog](./v2-changelog.md) - What's new

---

**Note:** This is a simplified reference. For the complete, authoritative ABNF grammar, see the official TOON specification at https://github.com/toon-format/spec.
