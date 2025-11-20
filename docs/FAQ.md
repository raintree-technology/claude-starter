# Frequently Asked Questions

## General

### What is claude-starter?

A zero-dependency template for Claude Code with complete TOON v2.0 format support. It provides skills, commands, and documentation for building Claude Code configurations with 30-60% token savings on tabular data.

### Do I need to install anything?

**For basic use:** No! Everything works through markdown instructions Claude reads.

**For performance:** Optionally install Zig to build the native TOON binary (20x faster than TypeScript).

```bash
brew install zig
cd .claude/utils/toon
zig build -Doptimize=ReleaseFast
```

### What version of TOON is supported?

**TOON v2.0** (2025-11-10) - 100% specification compliant.

This includes all features: multiple delimiters, key folding, path expansion, all three array types, strict mode, and more.

## TOON Format

### When should I use TOON vs JSON?

✅ **Use TOON when:**
- Arrays with ≥5 items
- ≥60% field uniformity across objects
- Tabular/structured data (APIs, logs, metrics, database results)
- Flat object structure
- Token efficiency matters

❌ **Keep JSON when:**
- Small arrays (<5 items)
- Deeply nested structures (>3 levels)
- Non-uniform data (<60% same fields)
- Prose or free-form text
- Human editing is priority

### Which delimiter should I use?

| Delimiter | Use When | Example |
|-----------|----------|---------|
| **Comma** (`,`) | General use, most compact | `1,Alice,admin` |
| **Tab** (`\t`) | TSV-like data, columnar alignment | `1\tAlice\tadmin` |
| **Pipe** (`\|`) | Data with commas, Markdown tables | `1\|Alice\|admin` |

**Recommendation:** Start with comma (default), switch to tab if data contains many commas, use pipe for Markdown compatibility.

### What is key folding?

Key folding flattens nested objects using dotted notation:

**Without key folding (JSON):**
```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

**With key folding (TOON):**
```
server.host: localhost
server.port: 8080
```

**Benefits:** 30-40% token savings on nested objects.

**Enable:** `/convert-to-toon data.json --key-folding`

### What are the three array types?

**1. Inline Primitive Arrays** (≤10 items, all primitives)
```
friends[3]: ana,luis,sam
scores[5]: 95,87,92,88,91
```

**2. Tabular Arrays** (uniform objects, ≥2 items)
```
[3]{id,name,role}:
  1,Alice,admin
  2,Bob,user
  3,Carol,user
```

**3. Expanded List Arrays** (non-uniform, complex nested)
```
items[2]:
  - {id: 1, name: "Complex item"}
  - {id: 2, data: [1,2,3]}
```

**Auto-detection:** The TOON formatter skill automatically selects the optimal format.

### How do I validate TOON format?

**Using Zig binary (recommended):**
```bash
./zig-out/bin/toon validate data.toon --strict
```

**Using command:**
```bash
/validate-toon data.toon
```

**Strict mode checks:**
- Indentation alignment (exact multiples)
- No tabs in indentation
- Array count matches actual rows
- Field width consistency
- No blank lines within arrays

## Skills

### Why isn't my skill activating?

**Check the `description` field** in your skill frontmatter:

❌ **Too vague:**
```yaml
description: Helps with coding
```

✅ **Specific keywords:**
```yaml
description: Expert in Next.js. Invoke when user mentions Next.js, App Router, server components, or React Server Components.
```

**Tips:**
- Include ALL relevant keywords users will say
- Include technology names, framework names, feature names
- Include action verbs (build, deploy, test, debug)
- Keep under 200 characters

### How do I test a skill?

1. Mention trigger keywords from the `description`
2. Check if skill activates (Claude will reference it)
3. Verify it provides helpful guidance
4. Test edge cases

**Example:**
```
User: "Help me build a Next.js API route"
[Skill should activate if description mentions "Next.js" and "API"]
```

### Can I have multiple skills active at once?

Yes! Claude can invoke multiple skills in a single response. Skills are complementary, not exclusive.

**Example:** Mentioning "build a Next.js API with Supabase" might activate both a Next.js skill and a Supabase skill.

## Commands

### Why isn't my command found?

**Check these:**

1. **Filename matches command name**
   - File: `.claude/commands/deploy.md`
   - Command: `/deploy` ✅

2. **File is in correct directory**
   - Must be in `.claude/commands/`
   - Not in subdirectories

3. **Restart Claude Code**
   - Commands are cached on startup

### How do I pass arguments to commands?

Commands receive arguments as `$1`, `$2`, etc. in bash blocks:

```markdown
# Deploy

Usage: /deploy [environment]

1. **Validate**
   ```bash
   ENV="${1:-staging}"  # Default to staging
   echo "Deploying to: $ENV"
   ```
```

**Invoke:**
```
/deploy production  # $1 = "production"
/deploy             # $1 = "" (uses default "staging")
```

### Can commands call other commands?

No, commands cannot directly call other commands. But you can:
- Use shared bash scripts
- Break into smaller reusable scripts
- Chain commands manually

## Hooks

### Why aren't my hooks running?

**Hooks are disabled by default.** Enable in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "echo 'File modified' >> .claude/hooks.log"
      }]
    }]
  }
}
```

### What's the correct hook format?

**Hooks are bash commands,** not TypeScript functions:

❌ **Wrong (TypeScript):**
```typescript
export async function validate(context) {
  return { level: 'error', message: 'Error!' };
}
```

✅ **Correct (bash):**
```json
{
  "hooks": [{
    "type": "command",
    "command": "npx prettier --check $FILE_PATH"
  }]
}
```

**Hook receives:**
- `$FILE_PATH` - path to modified file
- `$TOOL_NAME` - tool that was used (Edit, Write, etc.)
- JSON via stdin for complex data

**Hook returns:**
- Exit code 0 - success (allow)
- Exit code 2 - block operation
- Output to stderr - error message

### Should I use hooks?

**Use hooks for:**
- Automated quality checks (linting, formatting)
- Security scans
- Performance monitoring
- Automatic documentation updates

**Don't use hooks for:**
- Slow operations (>100ms)
- Operations requiring user input
- Everything (keep hooks minimal)

**Best practice:** Start without hooks, add only when needed.

## Zig Implementation

### Do I need Zig?

**No!** The instruction-based implementation works without Zig.

**Zig adds:**
- 20x performance boost (2ms vs 45ms for 1K items)
- Native binary (no Node.js required)
- Strict validation mode
- Production-ready tooling

**Install only if:**
- Converting large files (>1MB)
- Batch processing
- CI/CD pipelines
- Performance matters

### How do I build the Zig binary?

```bash
# Install Zig
brew install zig

# Build
cd .claude/utils/toon
zig build -Doptimize=ReleaseFast

# Verify
./zig-out/bin/toon --version
```

See `.claude/utils/toon/INSTALL.md` for detailed instructions.

### Which is faster, Zig or TypeScript?

**Zig is ~20x faster:**

| Operation | TypeScript | Zig | Speedup |
|-----------|-----------|-----|---------|
| Encode 1K items | 45ms | 2ms | 22.5x |
| Decode 1K items | 38ms | 1.8ms | 21.1x |
| Validate 1K items | 12ms | 0.8ms | 15x |

**For small files (<100 items):** Difference is negligible.
**For large files (>1K items):** Zig is noticeably faster.

## Troubleshooting

### TOON formatter skill not activating

**Try these keywords:**
- "large dataset", "optimize tokens"
- "transactions", "API response"
- "database query", "metrics", "logs"
- "convert to TOON", "tabular data"

**Or call explicitly:**
```
User: "Please use TOON format for this data"
```

### Low token savings

**Check uniformity:**
```bash
/analyze-tokens data.json --detailed
```

**TOON works best with:**
- ≥70% field uniformity
- Flat objects (not deeply nested)
- ≥5 items in array

**If uniformity is low (<60%):** Keep JSON.

### Zig build failing

**Common issues:**

1. **Zig not installed:**
   ```bash
   brew install zig
   ```

2. **Wrong Zig version:**
   ```bash
   zig version  # Must be ≥0.13.0
   brew upgrade zig
   ```

3. **Permission errors:**
   ```bash
   chmod +x .claude/utils/toon/enforce-toon.sh
   ```

### Documentation links broken

If you encounter broken links, it means the documentation is being restructured. Check:
- `.claude/docs/README.md` - Current documentation index
- `.claude/utils/toon/README.md` - TOON specification
- Main `README.md` - Project overview

## Best Practices

### When to use TOON

**Perfect for:**
- API documentation (endpoints, parameters)
- Transaction logs (events, payments)
- Performance metrics (routes, timings)
- Database results (query outputs)
- Configuration files (settings, options)

**Not recommended for:**
- Natural language text
- Deeply nested JSON (>3 levels)
- Frequently changing schemas
- Human-edited files

### Optimizing token usage

**Priority order:**
1. Use TOON for uniform arrays (≥5 items, ≥60% uniformity)
2. Enable key folding for nested objects
3. Choose appropriate delimiter (comma default, tab if many commas)
4. Use inline arrays for short primitive lists
5. Consider expanding arrays for non-uniform data

**Expected savings:**
- API docs: 40% savings
- Logs: 39% savings
- Metrics: 44% savings
- DB results: 41% savings

### Maintaining claude-starter

**Keep updated:**
- Pull latest TOON spec changes
- Update Zig implementation
- Add new examples as you discover patterns
- Share useful skills with community

**Customize:**
- Add your own skills for your tech stack
- Create commands for your workflows
- Build hooks for your quality standards
- Document your patterns

## Still Need Help?

- **Claude Code Docs:** https://code.claude.com/docs
- **TOON Spec:** https://github.com/toon-format/spec
- **Report Issues:** Create an issue in your repository
- **Community:** TOON format Discord (see toonformat.dev)

---

*Can't find your question? Check `.claude/docs/toon-guide.md` for TOON-specific questions or `.claude/docs/creating-components.md` for development questions.*
