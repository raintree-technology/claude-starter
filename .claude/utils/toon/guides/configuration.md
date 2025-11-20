# Configuration Guide

Complete reference for encoder and decoder options.

## Encoder Configuration

### EncoderConfig Structure

```zig
pub const EncoderConfig = struct {
    indent_size: usize = 2,           // Spaces per indentation level
    delimiter: Delimiter = .comma,    // comma, tab, or pipe
    key_folding: bool = true,         // Flatten nested objects
    flatten_depth: ?usize = null,     // Max folding depth (null = unlimited)
};
```

### CLI Options

```bash
toon encode <file> [OPTIONS]

OPTIONS:
  --delimiter <comma|tab|pipe>  # Delimiter for arrays (default: comma)
  --key-folding                 # Enable key folding (default)
  --no-key-folding              # Disable key folding
  --indent <N>                  # Spaces per level (default: 2)
```

### Examples

**Default (comma, folding, 2-space indent):**
```bash
./zig-out/bin/toon encode data.json
```

**Tab delimiter:**
```bash
./zig-out/bin/toon encode data.json --delimiter tab
```

**Pipe delimiter with 4-space indent:**
```bash
./zig-out/bin/toon encode data.json --delimiter pipe --indent 4
```

**Disable key folding:**
```bash
./zig-out/bin/toon encode data.json --no-key-folding
```

## Decoder Configuration

### DecoderConfig Structure

```zig
pub const DecoderConfig = struct {
    indent_size: usize = 2,       // Expected indent (for validation)
    strict: bool = false,         // Enable strict mode
    expand_paths: bool = true,    // Expand dotted keys (server.host → nested)
};
```

### CLI Options

```bash
toon decode <file> [OPTIONS]

OPTIONS:
  --strict              # Enable strict mode validation
  --no-expand-paths     # Keep dotted keys flat
  --indent <N>          # Expected indent size (default: 2)
```

### Examples

**Default (non-strict, expand paths):**
```bash
./zig-out/bin/toon decode data.toon
```

**Strict mode:**
```bash
./zig-out/bin/toon decode data.toon --strict
```

**Keep dotted keys flat:**
```bash
./zig-out/bin/toon decode data.toon --no-expand-paths
```

## Delimiter Options

### Comma (Default)

**Best for:** General use, numeric data, compact output

**Declaration:** `[N]{fields}:` or `[N,]{fields}:`

**Example:**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

**Pros:** Most compact, default
**Cons:** Values with commas need quotes

### Tab

**Best for:** Data with commas, TSV-like data

**Declaration:** `[N\t]{fields}:`

**Example:**
```
[2\t]{name,location}:
  Alice	New York, NY
  Bob	Los Angeles, CA
```

**Pros:** No quoting for commas, columnar alignment
**Cons:** Tabs may render differently

### Pipe

**Best for:** Markdown compatibility, visual clarity

**Declaration:** `[N|]{fields}:`

**Example:**
```
[2|]{method,path,description}:
  GET|/api/users|List all users
  POST|/api/users|Create new user
```

**Pros:** Markdown-like, very visible
**Cons:** Most verbose declaration

## Key Folding

### Enabled (Default)

Flattens nested objects:

**Input JSON:**
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

**Output TOON:**
```
server.host: localhost
server.port: 8080
```

**Savings:** 25-35%

### Disabled

Preserves nesting:

**Output TOON:**
```
server:
  host: localhost
  port: 8080
```

**When to disable:**
- Deeply nested (>3 levels)
- Field names have special characters
- Collision risks

## Path Expansion

### Enabled (Default)

Expands dotted keys back to nested:

**Input TOON:**
```
server.host: localhost
server.port: 8080
```

**Output JSON:**
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

### Disabled

Keeps dotted keys as literal:

**Output JSON:**
```json
{
  "server.host": "localhost",
  "server.port": 8080
}
```

**Use case:** When dotted keys are intentional field names.

## Strict Mode

### Disabled (Default)

Lenient parsing, warnings only:

```bash
./zig-out/bin/toon decode data.toon
```

**Output:**
```
⚠ Warning: Line 3: Indentation not multiple of 2
⚠ Warning: Line 5: Array count mismatch
Decoded successfully (2 warnings)
```

### Enabled

Strict validation, errors block decoding:

```bash
./zig-out/bin/toon decode data.toon --strict
```

**Output:**
```
❌ Error: Line 3: Indentation must be multiple of 2
Decoding failed
```

**When to enable:**
- Production environments
- CI/CD validation
- Data integrity critical

## Indentation

### 2 Spaces (Default)

```
server:
  host: localhost
  database:
    name: mydb
```

### 4 Spaces

```bash
./zig-out/bin/toon encode data.json --indent 4
```

```
server:
    host: localhost
    database:
        name: mydb
```

### Validation

Decoder checks indentation matches config:

```bash
# File has 4-space indent
./zig-out/bin/toon decode data.toon --indent 4 --strict
```

## Environment Variables

Set defaults via environment:

```bash
export TOON_DELIMITER=tab
export TOON_INDENT=4
export TOON_STRICT=1

./zig-out/bin/toon encode data.json  # Uses env defaults
```

## Configuration Files

### .toonrc.json

```json
{
  "encoder": {
    "delimiter": "tab",
    "keyFolding": true,
    "indentSize": 2
  },
  "decoder": {
    "strict": false,
    "expandPaths": true,
    "indentSize": 2
  }
}
```

Load with:
```bash
./zig-out/bin/toon encode data.json --config .toonrc.json
```

## Programmatic Usage

### Zig

```zig
const std = @import("std");
const toon = @import("toon");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Configure encoder
    var enc_config = toon.EncoderConfig.init();
    enc_config.delimiter = .tab;
    enc_config.key_folding = true;
    enc_config.indent_size = 2;

    // Encode
    const json_str = try std.fs.cwd().readFileAlloc(allocator, "data.json", 10_000_000);
    defer allocator.free(json_str);

    var t = try toon.Toon.init(allocator);
    defer t.deinit();

    const result = try t.encode(json_str, enc_config);
    defer allocator.free(result);

    try std.fs.cwd().writeFile("output.toon", result);
}
```

## See Also

- [Encoding Guide](./encoding.md) - Strategies
- [Optimization Guide](./optimization.md) - Maximizing savings
- [Examples](../examples/) - Real-world usage
