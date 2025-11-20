# Nested Objects

TOON supports nested objects using indentation-based syntax.

## Basic Syntax

**JSON:**
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

**TOON:**
```
server:
  host: localhost
  port: 8080
```

## Indentation Rules

- Default: **2 spaces** per level
- Must be consistent multiples
- No tabs (strict mode error)

**Correct:**
```
level1:
  level2:
    level3: value
```
(2, 4, 6 spaces)

**Wrong:**
```
level1:
 level2:  ❌ 1 space (not multiple of 2)
   level3: value
```

## Multiple Nesting Levels

**JSON:**
```json
{
  "app": {
    "server": {
      "host": "localhost",
      "port": 8080
    },
    "database": {
      "host": "db.example.com",
      "port": 5432
    }
  }
}
```

**TOON:**
```
app:
  server:
    host: localhost
    port: 8080
  database:
    host: db.example.com
    port: 5432
```

## Key Folding vs. Nested

For 2-3 levels, key folding is more compact:

**Nested (traditional):**
```
server:
  host: localhost
  port: 8080
```
≈ 24 tokens

**Key folding:**
```
server.host: localhost
server.port: 8080
```
≈ 18 tokens

**Savings: 25%**

See [Key Folding](./key-folding.md) for details.

## Arrays Within Objects

**JSON:**
```json
{
  "user": {
    "name": "Alice",
    "roles": ["admin", "editor"]
  }
}
```

**TOON:**
```
user:
  name: Alice
  roles[2]: admin,editor
```

## Objects Within Arrays

**JSON:**
```json
{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ]
}
```

**TOON (tabular):**
```
[2]{name,age}:
  Alice,30
  Bob,25
```

## Complex Nesting

**JSON:**
```json
{
  "config": {
    "server": {
      "ssl": {
        "enabled": true,
        "cert": "/path/to/cert.pem",
        "key": "/path/to/key.pem"
      }
    }
  }
}
```

**TOON (nested):**
```
config:
  server:
    ssl:
      enabled: true
      cert: /path/to/cert.pem
      key: /path/to/key.pem
```

**TOON (key folded - more compact):**
```
config.server.ssl.enabled: true
config.server.ssl.cert: /path/to/cert.pem
config.server.ssl.key: /path/to/key.pem
```

## See Also

- [Key Folding](./key-folding.md) - Flatten nested objects
- [Basic Tabular](./basic-tabular.md) - Arrays of objects
- [Strict Mode](./strict-mode.md) - Indentation validation
