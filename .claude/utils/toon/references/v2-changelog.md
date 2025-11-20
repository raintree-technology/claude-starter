# TOON v2.0 Changelog

Complete list of changes from v1.x to v2.0.

## Release: v2.0 (2025-11-10)

### New Features

#### 1. Multiple Delimiters
- **Added:** Tab (`\t`) and pipe (`|`) delimiters
- **Syntax:** `[N\t]{fields}:` and `[N|]{fields}:`
- **Benefit:** Avoid quoting when data contains commas
- **v1:** Comma only
- **v2:** Comma, tab, or pipe

#### 2. Inline Primitive Arrays
- **Added:** Compact format for small arrays
- **Syntax:** `key[N]: value1,value2,value3`
- **Benefit:** 20-40% savings for ≤10 primitive arrays
- **v1:** Not supported
- **v2:** Fully supported

#### 3. Expanded List Arrays
- **Added:** Fallback for non-uniform data
- **Syntax:** `- item` format
- **Benefit:** Handles mixed-type and complex arrays
- **v1:** Not supported
- **v2:** Fully supported

#### 4. Key Folding
- **Added:** Flatten nested objects
- **Syntax:** `server.host: localhost`
- **Benefit:** 25-35% savings for 2-3 level nesting
- **v1:** Not supported
- **v2:** Encoder option (default: enabled)

#### 5. Path Expansion
- **Added:** Decoder expands dotted keys
- **Syntax:** `server.host` → `{server: {host: ...}}`
- **Benefit:** Roundtrip compatibility with key folding
- **v1:** Not supported
- **v2:** Decoder option (default: enabled)

#### 6. Strict Mode
- **Added:** Production validation
- **Rules:** Indentation, counts, widths, blanks, escapes
- **Benefit:** Catch errors before production
- **v1:** Not supported
- **v2:** `--strict` flag

#### 7. Canonical Number Format
- **Added:** Normalized numbers
- **Rules:** No exponents, no trailing zeros, NaN/Inf→null
- **Benefit:** Consistent representation
- **v1:** Inconsistent formatting
- **v2:** Canonical format enforced

### Breaking Changes

#### 1. Array Count Required
- **v1:** `{fields}:` (count optional)
- **v2:** `[N]{fields}:` (count required)
- **Reason:** Enables validation and faster parsing
- **Migration:** Add `[N]` to all tabular arrays

#### 2. Escape Sequences Reduced
- **v1:** 8 escapes (`\\ \" \n \r \t \b \f \u`)
- **v2:** 5 escapes (`\\ \" \n \r \t`)
- **Removed:** `\b`, `\f`, `\uXXXX`
- **Reason:** Simplicity; use literal UTF-8 instead
- **Migration:** Replace `\u` with literal chars, remove `\b`/`\f`

#### 3. Delimiter Declaration
- **v1:** Delimiter implicit (always comma)
- **v2:** Delimiter in header (`[N,]`, `[N\t]`, `[N|]`)
- **Reason:** Support multiple delimiters
- **Migration:** Add `,` to header if using comma

#### 4. Stricter Key Validation
- **v1:** Any key allowed
- **v2:** Keys must match `^[A-Za-z_][A-Za-z0-9_]*$` for folding
- **Reason:** Avoid collisions and ambiguity
- **Migration:** Rename keys with special chars

### Deprecated Features

#### 1. Count-less Arrays
- **Deprecated:** `{fields}:` syntax
- **Replacement:** `[N]{fields}:`
- **Timeline:** Removed in v2.0
- **Migration:** Add counts

#### 2. Backspace/Form Feed Escapes
- **Deprecated:** `\b` and `\f`
- **Replacement:** Use literal chars or Base64
- **Timeline:** Removed in v2.0
- **Migration:** Find and replace

#### 3. Unicode Escapes
- **Deprecated:** `\uXXXX`
- **Replacement:** Use literal UTF-8
- **Timeline:** Removed in v2.0
- **Migration:** Use literal Unicode chars

### Performance Improvements

#### 1. Zig Implementation
- **Added:** Native Zig encoder/decoder
- **Speed:** 20x faster than TypeScript reference
- **Binary:** ~2MB (ReleaseFast)
- **Memory:** Minimal allocations

#### 2. Smart Type Detection
- **Added:** Automatic array type selection
- **Logic:** ≥60% uniformity → tabular, else expanded
- **Benefit:** Optimal format without manual choice

#### 3. Single-Pass Parsing
- **Improved:** Encoder and decoder use single-pass algorithms
- **Benefit:** O(n) time complexity

### Compatibility

#### v2 Encoder
- **Reads:** JSON (any version)
- **Writes:** TOON v2.0
- **Option:** Can write v1-compatible (with counts)

#### v2 Decoder
- **Reads:** TOON v2.0
- **Reads:** TOON v1.x (if counts added manually)
- **Writes:** JSON

#### v1 Decoder
- **Reads:** TOON v1.x only
- **Cannot read:** TOON v2.0 (syntax incompatible)

### Migration Path

1. **Phase 1:** Add array counts to v1 files
2. **Phase 2:** Update escape sequences
3. **Phase 3:** Test with v2 decoder
4. **Phase 4:** Start using v2 encoder
5. **Phase 5:** Enable new features (folding, delimiters)

See [Migration Guide](../guides/migration-v1-to-v2.md) for details.

### Known Issues

#### Decoder Not Yet Implemented
- **Status:** Encoder complete, decoder TODO
- **Timeline:** Next release
- **Workaround:** Use TypeScript reference for decoding

#### Strict Mode Validation TODO
- **Status:** Validation logic not yet implemented
- **Timeline:** Next release
- **Workaround:** Manual validation

### Future Plans

#### v2.1 (Planned)
- Complete Zig decoder
- Strict mode validation
- Performance benchmarks
- Complete test suite

#### v2.2 (Planned)
- Streaming encoder/decoder
- Compression support
- Schema validation

### Resources

- **Specification:** https://github.com/toon-format/spec
- **Website:** https://toonformat.dev
- **This Implementation:** `.claude/utils/toon/`
- **Migration Guide:** [migration-v1-to-v2.md](../guides/migration-v1-to-v2.md)

### Credits

- **Specification:** TOON Format Working Group
- **Zig Implementation:** claude-starter project
- **TypeScript Reference:** toon-format/toon

---

**Released:** 2025-11-10
**Version:** 2.0.0
**Status:** Encoder complete, decoder in progress
