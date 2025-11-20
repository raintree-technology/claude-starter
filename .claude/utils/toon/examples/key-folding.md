# Key Folding

Key folding flattens nested objects into dotted keys, reducing token overhead.

## Syntax

**Without key folding (nested):**
```
server:
  host: localhost
  port: 8080
```

**With key folding (flattened):**
```
server.host: localhost
server.port: 8080
```

## When to Use

✅ **Use key folding when:**
- Objects have 2-3 levels of nesting
- Field names are valid identifiers (`[A-Za-z_][A-Za-z0-9_]*`)
- No sibling key collisions
- Configuration or settings data

❌ **Don't use key folding when:**
- Deeply nested (>3 levels) - harder to read
- Field names have spaces or special characters
- Collision with existing dotted keys
- Objects are in arrays (use tabular arrays instead)

## Basic Example

**JSON:**
```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb"
  }
}
```

**TOON with key folding:**
```
database.host: localhost
database.port: 5432
database.name: mydb
```

**TOON without key folding (28% more tokens):**
```
database:
  host: localhost
  port: 5432
  name: mydb
```

## Configuration Example

**JSON:**
```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "ssl": {
      "enabled": true,
      "cert": "/path/to/cert.pem"
    }
  },
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "pool": {
      "min": 2,
      "max": 10
    }
  }
}
```

**TOON with key folding:**
```
server.host: 0.0.0.0
server.port: 8080
server.ssl.enabled: true
server.ssl.cert: /path/to/cert.pem
database.host: db.example.com
database.port: 5432
database.pool.min: 2
database.pool.max: 10
```

## Token Savings

Key folding provides **25-35% token savings** for nested config:

**Without folding:**
```
server:         # 10 tokens for nesting overhead
  host: localhost
  port: 8080
```
≈ 28 tokens

**With folding:**
```
server.host: localhost
server.port: 8080
```
≈ 18 tokens

**Savings: 36%**

## Valid Identifiers

Key segments must be valid identifiers:

✅ **Valid:**
```
server.host: value
db_connection.pool_size: 10
apiKey: secret
_private.setting: value
```

❌ **Invalid (can't be folded):**
```
"server name".host: value        # Space in key
"api-key".value: secret          # Hyphen in key
"123start".value: value          # Starts with number
```

## Collision Detection

Key folding is **disabled** if it would create a collision:

### Example 1: Sibling collision

**JSON:**
```json
{
  "server": {"host": "localhost"},
  "server.host": "override"
}
```

**TOON (no folding - collision detected):**
```
server:
  host: localhost
server.host: override
```

### Example 2: Safe to fold (no collision)

**JSON:**
```json
{
  "server": {"host": "localhost"},
  "serverName": "prod-1"
}
```

**TOON (folding OK):**
```
server.host: localhost
serverName: prod-1
```

## Multiple Nesting Levels

Key folding works for multiple levels:

**JSON:**
```json
{
  "app": {
    "logging": {
      "level": "info",
      "file": "/var/log/app.log"
    }
  }
}
```

**TOON:**
```
app.logging.level: info
app.logging.file: /var/log/app.log
```

## Mixed Folding and Arrays

Key folding stops at arrays:

**JSON:**
```json
{
  "server": {
    "hosts": ["host1", "host2"],
    "port": 8080
  }
}
```

**TOON:**
```
server.hosts[2]: host1,host2
server.port: 8080
```

## Folding with Tabular Arrays

Objects inside tabular arrays are NOT folded:

**JSON:**
```json
[
  {
    "name": "Alice",
    "config": {"role": "admin", "level": 5}
  }
]
```

**TOON (config NOT folded inside array):**
```
[1]{name,config}:
  Alice,{role: admin, level: 5}
```

## Encoder Configuration

### Zig CLI:

```bash
# Enable key folding (default)
toon encode data.json --key-folding

# Disable key folding
toon encode data.json --no-key-folding
```

### Programmatic:

```zig
var config = EncoderConfig.init();
config.key_folding = true;  // or false

const result = try toon.encode(json_str, config);
```

## Path Expansion (Decoder)

Decoders can expand dotted keys back to nested objects:

**TOON:**
```
server.host: localhost
server.port: 8080
```

**Decoded to JSON:**
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

### Decoder Configuration:

```zig
var config = DecoderConfig.init();
config.expand_paths = true;  // Default

const json = try toon.decode(toon_str, config);
```

## Deep Merge Semantics

When multiple dotted keys share a prefix, they're merged:

**TOON:**
```
server.host: localhost
server.port: 8080
database.host: db.example.com
database.port: 5432
```

**Decoded:**
```json
{
  "server": {"host": "localhost", "port": 8080},
  "database": {"host": "db.example.com", "port": 5432}
}
```

## Edge Cases

### Empty objects

**JSON:**
```json
{"server": {}}
```

**TOON:**
```
server: {}
```
(Can't fold empty object)

### Single nested field

**JSON:**
```json
{"server": {"host": "localhost"}}
```

**TOON:**
```
server.host: localhost
```
(Folding beneficial even for single field)

### Very deep nesting (>3 levels)

**JSON:**
```json
{
  "a": {
    "b": {
      "c": {
        "d": "value"
      }
    }
  }
}
```

**TOON (still folds, but less readable):**
```
a.b.c.d: value
```

**Recommendation:** For >3 levels, consider restructuring or not folding.

## Real-World Example: Application Config

**JSON (180 tokens):**
```json
{
  "app": {
    "name": "MyApp",
    "version": "1.0.0"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "timeout": 30
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb",
    "pool": {
      "min": 2,
      "max": 10
    }
  },
  "logging": {
    "level": "info",
    "file": "/var/log/app.log"
  }
}
```

**TOON with key folding (115 tokens, 36% savings):**
```
app.name: MyApp
app.version: 1.0.0
server.host: 0.0.0.0
server.port: 8080
server.timeout: 30
database.host: localhost
database.port: 5432
database.name: mydb
database.pool.min: 2
database.pool.max: 10
logging.level: info
logging.file: /var/log/app.log
```

## Common Mistakes

### Wrong: Folding non-identifier keys

```
"api-key".value: secret  ❌ Hyphen not allowed
"my key".value: secret   ❌ Space not allowed
```

**Correct:**
```
api_key.value: secret
my_key.value: secret
```

### Wrong: Creating collision

**JSON:**
```json
{
  "server.host": "override",
  "server": {"host": "localhost"}
}
```

**Wrong TOON:**
```
server.host: override   ❌ Collision!
server.host: localhost
```

**Correct (no folding):**
```
server.host: override
server:
  host: localhost
```

### Wrong: Folding arrays

```
server.hosts.0: host1   ❌ Array indices aren't folded
server.hosts.1: host2
```

**Correct:**
```
server.hosts[2]: host1,host2
```

## Performance

Key folding impacts performance minimally:

**Encoding:**
- +5% time for collision detection
- -25% output size (fewer bytes)

**Decoding:**
- +10% time for path expansion
- Same memory usage

**Recommendation:** Enable by default, disable only if performance-critical and no nested objects.

## See Also

- [Nested Objects](./nested-objects.md) - Indentation-based nesting
- [Basic Tabular](./basic-tabular.md) - For arrays of objects
- [Quoting Rules](./quoting-rules.md) - Key name restrictions
