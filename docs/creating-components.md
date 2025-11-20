# Creating Components

Complete guide to building skills, commands, and hooks for Claude Code with TOON v2.0 support.

## Component Types

| Type | Purpose | Invocation | Size Limit |
|------|---------|------------|------------|
| **Skill** | Domain expertise | Auto (keywords) | < 900 lines |
| **Command** | Manual workflows | `/command-name` | < 250 lines |
| **Hook** | Quality automation | Auto (after tools) | Keep fast |

## Skills

### What is a Skill?

Skills provide domain expertise and activate automatically when users mention trigger keywords in the `description` field.

### File Structure

```
.claude/skills/{category}/{skill-name}/skill.md
```

Example: `.claude/skills/data/toon-formatter/skill.md`

### Complete Skill Template

```markdown
---
name: skill-identifier
description: Concise description with TRIGGER KEYWORDS that users will say
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# Skill Name

## Purpose
What this skill does and why it exists.

## When to Use
- Trigger condition 1 (mention specific keywords)
- Trigger condition 2
- Trigger condition 3

## Process

### 1. Analyze
Use Read/Grep to understand the current state:
```bash
# Example analysis command
grep -r "pattern" src/
```

### 2. Plan
Determine the best approach based on:
- Current architecture
- Best practices
- User requirements

### 3. Implement
Use Write/Edit to make changes:
- Follow established patterns
- Maintain consistency
- Add necessary tests

### 4. Verify
Confirm the solution works:
- Run tests
- Check output
- Validate against requirements

## Examples

### Example 1: Basic Usage
\`\`\`
Input: User request
Process: How skill handles it
Output: Expected result
\`\`\`

### Example 2: Advanced Usage
\`\`\`
Input: Complex scenario
Process: Multi-step handling
Output: Comprehensive solution
\`\`\`

## Best Practices
- Practice 1
- Practice 2
- Practice 3

## Common Pitfalls
- Pitfall 1 and how to avoid it
- Pitfall 2 and how to avoid it

## Resources
- [Official Documentation](https://example.com)
- [Related Guide](link)
```

### Real Example: TOON Formatter

```markdown
---
name: toon-formatter
description: Auto-detect tabular data and convert to TOON format. Invoke when user mentions data, arrays, tables, logs, transactions, metrics, analytics, API responses, or token optimization.
allowed-tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# TOON Format Converter

## Purpose
Automatically detect suitable tabular data and convert to TOON v2.0 format for 30-60% token savings.

## When to Use
- User mentions "optimize tokens", "TOON format", "tabular data"
- Working with arrays of uniform objects (≥5 items, ≥60% uniformity)
- API documentation, logs, metrics, database results
- User says "large dataset", "convert to TOON"

## Process

### 1. Analyze Data Structure
```bash
# Check if data is suitable for TOON
cat data.json | jq 'if type == "array" then length else 0 end'
```

Criteria for TOON:
- Array with ≥5 items
- Objects with ≥60% field uniformity
- Flat structure (not deeply nested)

### 2. Select Format Type
Choose based on data:
- **Inline arrays:** Primitives only, ≤10 items → `friends[3]: a,b,c`
- **Tabular arrays:** Uniform objects → `[N]{fields}: values`
- **Keep JSON:** Non-uniform, nested, or small arrays

### 3. Select Delimiter
- **Comma (default):** General use, most compact
- **Tab:** Data with many commas, columnar alignment
- **Pipe:** Markdown compatibility, visual clarity

### 4. Apply Key Folding (if beneficial)
For nested objects:
```
server.host: localhost
server.port: 8080
```
Instead of:
```json
{"server": {"host": "localhost", "port": 8080}}
```

### 5. Show Token Savings
Report:
- Original tokens: X
- TOON tokens: Y
- Savings: Z% (A tokens)

## Examples

### Example 1: API Endpoints
**Input:**
```json
[
  {"method": "GET", "path": "/api/users", "auth": "required"},
  {"method": "POST", "path": "/api/users", "auth": "required"}
]
```

**Output (TOON):**
```
[2]{method,path,auth}:
  GET,/api/users,required
  POST,/api/users,required
```

**Savings:** 40% (48 tokens)

### Example 2: With Key Folding
**Input:**
```json
{
  "server": {"host": "localhost", "port": 8080},
  "database": {"host": "db.example.com", "port": 5432}
}
```

**Output (TOON):**
```
server.host: localhost
server.port: 8080
database.host: db.example.com
database.port: 5432
```

**Savings:** 35% (32 tokens)

## Best Practices
- Always check uniformity before converting (≥60% threshold)
- Use `/analyze-tokens` command to verify savings
- Prefer comma delimiter unless data has many commas
- Enable key folding for nested config objects
- Keep original JSON for non-uniform data

## Common Pitfalls
- Converting small arrays (<5 items) - minimal savings
- Using TOON for deeply nested objects (>3 levels) - harder to read
- Not escaping delimiters in values - causes parsing errors
- Forcing TOON on non-uniform data - loses readability

## Resources
- [TOON v2.0 Specification](.claude/utils/toon/README.md)
- [TOON User Guide](.claude/docs/toon-guide.md)
- [Token Savings Examples](.claude/utils/toon/examples/)
```

### Skill Frontmatter Reference

**Required Fields:**
- `name`: Unique identifier (lowercase-with-hyphens)
- `description`: When to invoke (include ALL trigger keywords)
- `allowed-tools`: Tools this skill can use
- `model`: Claude model (sonnet, opus, haiku)

**Description Best Practices:**
✅ **Good:** "Expert in Next.js. Invoke when user mentions Next.js, App Router, server components, server actions, or React Server Components."

❌ **Bad:** "Helps with Next.js development." (too vague, missing keywords)

**Tool Selection:**
- `Read`: Read files
- `Write`: Create new files
- `Edit`: Modify existing files
- `Grep`: Search file contents
- `Glob`: Find files by pattern
- `Bash`: Run shell commands

Only request tools you actually use!

## Commands

### What is a Command?

Commands are manual workflows invoked with `/command-name`. They execute step-by-step procedures.

### File Structure

```
.claude/commands/{command-name}.md
```

File name becomes command: `deploy.md` → `/deploy`

### Complete Command Template

```markdown
# Command Name

Brief description of what this command does.

Usage: /command-name [arg1] [arg2] [--flag]

Execute the following workflow:

1. **Step Name**
   ```bash
   # Bash commands that execute
   ARG="${1:-default}"
   echo "Processing: $ARG"
   ```
   - Explanation of what this step does
   - Validation or checks performed

2. **Next Step**
   ```bash
   # More commands
   if [[ condition ]]; then
     action
   fi
   ```
   - What happens here
   - Expected outcomes

3. **Final Step**
   ```bash
   # Completion
   echo "✓ Command completed successfully"
   ```
   - Summary
   - Next steps for user
```

### Real Example: Convert to TOON

```markdown
# Convert to TOON

Convert JSON file to TOON v2.0 format with automatic optimization.

Usage: /convert-to-toon <file> [--delimiter comma|tab|pipe] [--key-folding] [--strict]

Execute the following workflow:

1. **Validate Input**
   ```bash
   FILE="$1"

   if [[ -z "$FILE" ]]; then
     echo "Error: File path required"
     echo "Usage: /convert-to-toon <file> [--delimiter comma|tab|pipe] [--key-folding]"
     exit 1
   fi

   if [[ ! -f "$FILE" ]]; then
     echo "Error: File not found: $FILE"
     exit 1
   fi

   if [[ ! "$FILE" =~ \.json$ ]]; then
     echo "Warning: File does not have .json extension"
     echo "Continue? (y/n)"
   fi

   echo "✓ Input validated: $FILE"
   ```

2. **Analyze Data Structure**
   ```bash
   # Check if suitable for TOON
   ITEM_COUNT=$(jq 'if type == "array" then length else 0 end' "$FILE")

   if [[ $ITEM_COUNT -lt 5 ]]; then
     echo "⚠ Warning: Only $ITEM_COUNT items. TOON works best with ≥5 items."
     echo "Continue anyway? (y/n)"
   fi

   # Calculate uniformity
   UNIFORMITY=$(jq -r '
     if type == "array" and length > 0 then
       [.[] | keys] | add | unique | length
     else
       0
     end
   ' "$FILE")

   echo "📊 Analysis:"
   echo "  - Items: $ITEM_COUNT"
   echo "  - Unique fields: $UNIFORMITY"
   ```

3. **Parse Options**
   ```bash
   DELIMITER="comma"
   KEY_FOLDING=""
   STRICT=""

   for arg in "$@"; do
     case $arg in
       --delimiter)
         shift
         DELIMITER="$1"
         shift
         ;;
       --key-folding)
         KEY_FOLDING="--key-folding"
         shift
         ;;
       --strict)
         STRICT="--strict"
         shift
         ;;
     esac
   done

   echo "⚙ Options:"
   echo "  - Delimiter: $DELIMITER"
   echo "  - Key folding: ${KEY_FOLDING:-disabled}"
   echo "  - Strict mode: ${STRICT:-disabled}"
   ```

4. **Convert with Zig Binary**
   ```bash
   # Check if Zig binary exists
   TOON_BIN=".claude/utils/toon/zig-out/bin/toon"

   if [[ ! -f "$TOON_BIN" ]]; then
     echo "❌ Zig binary not found. Build it first:"
     echo "   cd .claude/utils/toon && zig build -Doptimize=ReleaseFast"
     exit 1
   fi

   # Convert
   OUTPUT_FILE="${FILE%.json}.toon"

   $TOON_BIN encode "$FILE" \
     --delimiter "$DELIMITER" \
     $KEY_FOLDING \
     $STRICT \
     > "$OUTPUT_FILE"

   if [[ $? -eq 0 ]]; then
     echo "✓ Converted successfully"
   else
     echo "❌ Conversion failed"
     exit 1
   fi
   ```

5. **Calculate Savings**
   ```bash
   # Compare token counts (approximate: 1 token ≈ 4 chars)
   JSON_SIZE=$(wc -c < "$FILE")
   TOON_SIZE=$(wc -c < "$OUTPUT_FILE")

   JSON_TOKENS=$((JSON_SIZE / 4))
   TOON_TOKENS=$((TOON_SIZE / 4))
   SAVED=$((JSON_TOKENS - TOON_TOKENS))
   PERCENT=$((SAVED * 100 / JSON_TOKENS))

   echo ""
   echo "📊 Token Savings:"
   echo "  - JSON: ~$JSON_TOKENS tokens"
   echo "  - TOON: ~$TOON_TOKENS tokens"
   echo "  - Saved: ~$SAVED tokens ($PERCENT%)"
   echo ""
   echo "✅ Output written to: $OUTPUT_FILE"
   ```

6. **Show Preview**
   ```bash
   echo "Preview (first 10 lines):"
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
   head -n 10 "$OUTPUT_FILE"
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo ""
   echo "To validate: /validate-toon $OUTPUT_FILE"
   ```
```

### Command Best Practices

**Structure:**
1. Validate all inputs early
2. Show progress at each step
3. Handle errors gracefully
4. Provide clear success/failure messages
5. Suggest next steps

**Error Handling:**
```bash
# Check exit codes
if [[ $? -ne 0 ]]; then
  echo "Error: Command failed"
  exit 1
fi

# Use set -e for strict mode
set -e  # Exit on any error
npm test
npm build
```

**User Feedback:**
```bash
echo "▸ Running tests..."
npm test
echo "✓ Tests passed"

echo "⚠ Warning: Large file detected"
echo "✅ Success: All operations completed"
echo "❌ Error: Operation failed"
```

## Hooks

### What is a Hook?

Hooks run automatically after tool operations (Write, Edit, etc.) to validate or enhance changes.

### File Structure

Hooks are **bash commands**, not TypeScript files. Configure in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "echo 'File modified: $FILE_PATH' >> .claude/hooks.log"
      }]
    }]
  }
}
```

### Hook Environment Variables

Hooks receive:
- `$FILE_PATH` - Path to modified file
- `$TOOL_NAME` - Tool that was used (Write, Edit, etc.)
- JSON via stdin for complex data

### Hook Exit Codes

- `0` - Success (allow operation)
- `2` - Block operation
- Other - Warning

### Example Hook: File Size Check

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'SIZE=$(wc -c < \"$FILE_PATH\"); if [[ $SIZE -gt 102400 ]]; then echo \"⚠ Warning: File is $(($SIZE / 1024))KB\" >&2; fi'"
      }]
    }]
  }
}
```

### Example Hook: Prettier Format

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write \"$FILE_PATH\""
      }]
    }]
  }
}
```

### Hook Best Practices

✅ **DO:**
- Keep hooks fast (<100ms)
- Provide actionable error messages
- Use appropriate exit codes
- Test thoroughly before enabling

❌ **DON'T:**
- Run slow operations (full test suites)
- Block legitimate operations
- Use hooks for everything
- Forget to handle errors

## Component Sizing

| Component | Recommended | Warning | Maximum |
|-----------|-------------|---------|---------|
| Skill | < 600 lines | 600 lines | 900 lines |
| Command | < 100 lines | 150 lines | 250 lines |
| Hook | < 50 lines | - | Keep fast |

If too large:
- **Skills:** Split into multiple skills, link to external docs
- **Commands:** Extract to scripts, split into sub-commands
- **Hooks:** Simplify checks, call external tools

## Testing Components

### Testing Skills
1. Mention trigger keywords
2. Verify skill activates
3. Check it provides correct guidance
4. Test edge cases

### Testing Commands
```bash
# Test with various inputs
/command arg1
/command arg1 arg2
/command --flag

# Test error cases
/command          # No args
/command invalid  # Bad args
```

### Testing Hooks
1. Enable hook in settings.json
2. Make changes that trigger it
3. Verify hook runs correctly
4. Check performance (should be fast)

## Resources

- **Claude Code Docs:** https://code.claude.com/docs
- **TOON v2.0 Guide:** `.claude/docs/toon-guide.md`
- **Examples:** `.claude/docs/examples.md`
- **FAQ:** `.claude/docs/FAQ.md`

---

**Ready to build your own components? Start with a skill!**
