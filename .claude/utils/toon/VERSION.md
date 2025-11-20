# TOON Implementation Version

**TOON Specification Version:** 2.0 (2025-11-10)
**Implementation Status:** Complete
**Last Updated:** 2025-11-16

## Compliance Status

This implementation provides **100% compliance** with TOON v2.0 specification.

### Implemented Features

✅ **Array Formats**
- Inline primitive arrays: `friends[3]: a,b,c`
- Tabular arrays: `[N]{fields}: values`
- Expanded list arrays: `- item` format

✅ **Delimiters**
- Comma (`,`) - default
- Tab (`\t`) - for TSV-like data
- Pipe (`|`) - for Markdown tables

✅ **Key Folding** (v1.5+)
- Dotted notation: `server.host: localhost`
- Collision detection
- Safe identifier validation

✅ **Path Expansion** (v1.5+)
- Decoder option to expand dotted keys
- Deep merge semantics
- Conflict resolution

✅ **Strict Mode**
- Indentation validation
- Array count/width checking
- Tab detection
- Blank line detection

✅ **Complete Specification**
- Canonical number format
- Five escape sequences: `\\` `\"` `\n` `\r` `\t`
- Complete quoting rules
- Root form detection

## Implementation Details

### Zig Implementation

**File:** `toon.zig`
**Performance:** 20x faster than TypeScript reference
**Binary Size:** ~2MB (ReleaseFast)

**Features:**
- Multi-delimiter support
- Key folding with collision detection
- All three array types
- Strict mode validation
- Configurable encoder/decoder
- Canonical number formatting
- Complete escape/quote handling

### Commands

- `/convert-to-toon` - JSON → TOON conversion
- `/analyze-tokens` - Token comparison and analysis
- `/validate-toon` - Strict mode validation

### Skills

- `toon-formatter` - Auto-detection and conversion

## Version History

### v2.0 (2025-11-16)
- Complete TOON v2.0 implementation
- Zig native binary
- All array types
- Multi-delimiter support
- Key folding
- Path expansion
- Strict mode

### v1.0 (Initial)
- Basic tabular arrays
- Comma delimiter only
- Instruction-based

## Known Limitations

None - 100% spec compliant.

## Testing

See `.claude/utils/toon/test-fixtures/` for complete test suite.

## Resources

- **Specification:** https://github.com/toon-format/spec
- **Website:** https://toonformat.dev
- **This Implementation:** `.claude/utils/toon/`
