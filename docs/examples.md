# Examples & Templates

Copy-paste ready examples for skills, commands, and hooks with TOON v2.0 support.

## Quick Start Templates

### 1. Basic Skill Template

**File:** `.claude/skills/my-domain/my-skill/skill.md`

```markdown
---
name: my-skill
description: Short description. Invoke when user mentions keyword1, keyword2, keyword3.
allowed-tools: Read, Write, Edit
model: sonnet
---

# My Skill

## Purpose
What this skill does.

## When to Use
- User mentions "keyword1"
- User asks about "keyword2"

## Process
1. Analyze requirements
2. Provide solution
3. Verify result

## Examples
[Working examples here]
```

**Customize:**
1. Replace `my-skill` with your skill ID
2. Add ALL trigger keywords to `description`
3. List only tools you need in `allowed-tools`
4. Fill in purpose, process, examples

---

### 2. Basic Command Template

**File:** `.claude/commands/my-command.md`

```markdown
# My Command

Brief description of what this does.

Usage: /my-command [args]

Execute the following workflow:

1. **Validate Input**
   ```bash
   if [[ -z "$1" ]]; then
     echo "Error: Argument required"
     exit 1
   fi
   ```

2. **Execute**
   ```bash
   echo "Running command with: $1"
   # Your logic here
   ```

3. **Report**
   ```bash
   echo "✓ Command completed"
   ```
```

**Customize:**
1. Replace `my-command` with command name (becomes `/my-command`)
2. Add argument validation
3. Implement your workflow
4. Add error handling

---

### 3. Basic Hook Configuration

**File:** `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "echo 'Modified: $FILE_PATH' >> .claude/activity.log"
      }]
    }]
  }
}
```

**Customize:**
1. Change `matcher` to target specific tools
2. Replace command with your validation
3. Add multiple hooks if needed

---

## Real-World Examples

### Example 1: API Development Workflow

#### Skill: API Builder

**File:** `.claude/skills/api/builder/skill.md`

```markdown
---
name: api-builder
description: REST API development expert. Invoke when user mentions API, endpoints, REST, routes, HTTP methods, request, response, or backend development.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# API Builder

## Purpose
Build production-ready REST APIs with best practices.

## When to Use
- Building new endpoints
- Designing API architecture
- Adding authentication
- Error handling questions

## Process

### 1. Analyze Existing Patterns
```bash
# Find existing API routes
grep -r "app\.\(get\|post\|put\|delete\)" src/
```

### 2. Design Endpoint
Follow REST principles:
- Proper HTTP methods (GET/POST/PUT/DELETE)
- Resource names (`/api/users` not `/api/getUsers`)
- Consistent error responses

### 3. Implement
```typescript
// Express example
app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Email and name are required'
      });
    }

    const user = await createUser({ email, name });
    res.status(201).json(user);

  } catch (error) {
    console.error('User creation failed:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to create user'
    });
  }
});
```

### 4. Add Tests
```typescript
describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('rejects missing fields', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
  });
});
```

### 5. Document with TOON
```
[5]{method,path,auth,rateLimit,description}:
  GET,/api/users,optional,100/min,List all users
  POST,/api/users,required,20/min,Create new user
  GET,/api/users/:id,optional,100/min,Get user by ID
  PUT,/api/users/:id,required,20/min,Update user
  DELETE,/api/users/:id,required,10/min,Delete user
```

## Examples

### Example 1: CRUD Endpoints
**Request:** "Build CRUD endpoints for products"

**Output:**
- GET /api/products - List products
- POST /api/products - Create product
- GET /api/products/:id - Get product
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

### Example 2: Authentication
**Request:** "Add JWT authentication"

**Output:**
- POST /api/auth/login - Login with credentials
- POST /api/auth/refresh - Refresh token
- POST /api/auth/logout - Invalidate token
- Middleware for protected routes

## Best Practices
- Use proper HTTP status codes
- Validate all inputs
- Handle errors consistently
- Rate limit endpoints
- Document with OpenAPI/TOON

## Resources
- REST API Design: https://restfulapi.net/
- HTTP Status Codes: https://httpstatuses.com/
```

#### Command: Generate API Endpoint

**File:** `.claude/commands/generate-endpoint.md`

```markdown
# Generate API Endpoint

Generate a complete REST API endpoint with validation, tests, and documentation.

Usage: /generate-endpoint <resource> <method> [--auth]

Execute the following workflow:

1. **Validate Arguments**
   ```bash
   RESOURCE="$1"
   METHOD="${2:-GET}"

   if [[ -z "$RESOURCE" ]]; then
     echo "Error: Resource name required"
     echo "Usage: /generate-endpoint <resource> <method> [--auth]"
     exit 1
   fi

   METHOD=$(echo "$METHOD" | tr '[:lower:]' '[:upper:]')

   if [[ ! "$METHOD" =~ ^(GET|POST|PUT|DELETE|PATCH)$ ]]; then
     echo "Error: Invalid method. Use GET, POST, PUT, DELETE, or PATCH"
     exit 1
   fi

   echo "✓ Generating $METHOD /api/$RESOURCE"
   ```

2. **Determine Endpoint Type**
   ```bash
   case $METHOD in
     GET)
       if [[ "$3" == "list" ]]; then
         TYPE="list"
         PATH="/api/$RESOURCE"
       else
         TYPE="get"
         PATH="/api/$RESOURCE/:id"
       fi
       ;;
     POST)
       TYPE="create"
       PATH="/api/$RESOURCE"
       ;;
     PUT|PATCH)
       TYPE="update"
       PATH="/api/$RESOURCE/:id"
       ;;
     DELETE)
       TYPE="delete"
       PATH="/api/$RESOURCE/:id"
       ;;
   esac

   echo "  Type: $TYPE"
   echo "  Path: $PATH"
   ```

3. **Generate Route File**
   ```bash
   ROUTE_FILE="src/routes/${RESOURCE}.ts"

   cat > "$ROUTE_FILE" << 'EOF'
import { Router } from 'express';

const router = Router();

// ${METHOD} ${PATH}
router.${METHOD_LOWER}('${ROUTE_PATH}', async (req, res) => {
  try {
    // TODO: Implement ${TYPE} logic

    res.status(200).json({ message: 'TODO: Implement' });
  } catch (error) {
    console.error('${RESOURCE} ${TYPE} failed:', error);
    res.status(500).json({ error: 'ServerError' });
  }
});

export default router;
EOF

   echo "✓ Created route: $ROUTE_FILE"
   ```

4. **Generate Test File**
   ```bash
   TEST_FILE="src/routes/${RESOURCE}.test.ts"

   cat > "$TEST_FILE" << 'EOF'
import request from 'supertest';
import app from '../app';

describe('${METHOD} ${PATH}', () => {
  it('should ${TYPE} ${RESOURCE}', async () => {
    const response = await request(app)
      .${METHOD_LOWER}('${PATH}')
      .send({});

    expect(response.status).toBe(200);
  });
});
EOF

   echo "✓ Created test: $TEST_FILE"
   ```

5. **Update Documentation**
   ```bash
   DOC_FILE="docs/api.md"

   # Append to TOON table
   echo "${METHOD},${PATH},${AUTH},100/min,${TYPE} ${RESOURCE}" >> "$DOC_FILE"

   echo "✓ Updated documentation"
   ```

6. **Summary**
   ```bash
   echo ""
   echo "✅ Endpoint generated successfully!"
   echo ""
   echo "Files created:"
   echo "  - $ROUTE_FILE"
   echo "  - $TEST_FILE"
   echo ""
   echo "Next steps:"
   echo "  1. Implement logic in $ROUTE_FILE"
   echo "  2. Add tests in $TEST_FILE"
   echo "  3. Run tests: npm test"
   ```
```

---

### Example 2: Data Processing with TOON

#### Skill: Data Optimizer

**File:** `.claude/skills/data/optimizer/skill.md`

```markdown
---
name: data-optimizer
description: Optimize large datasets for LLM context. Invoke when user mentions large data, optimize, tokens, compress, tabular data, CSV, JSON arrays, or data transformation.
allowed-tools: Read, Write, Edit, Bash
model: sonnet
---

# Data Optimizer

## Purpose
Transform large datasets into token-efficient formats using TOON v2.0.

## When to Use
- Large JSON files (>1MB)
- Arrays of uniform objects
- API response documentation
- Database query results
- CSV/TSV data conversion

## Process

### 1. Analyze Data
```bash
# Check file size and structure
FILE="$1"
SIZE=$(wc -c < "$FILE")
echo "File size: $((SIZE / 1024))KB"

# Count items if JSON array
ITEMS=$(jq 'length' "$FILE" 2>/dev/null || echo "0")
echo "Items: $ITEMS"
```

### 2. Calculate Uniformity
```bash
# Check field consistency
jq -r '
  if type == "array" and length > 0 then
    [.[] | keys] |
    (map(length) | add / length) as $avg_fields |
    (group_by(.) | map(length) | max) as $max_same |
    ($max_same / length * 100 | floor)
  else
    0
  end
' "$FILE"
```

### 3. Select Optimal Format
- **Uniformity ≥80%:** Tabular TOON with comma delimiter
- **Uniformity 60-80%:** Tabular TOON with tab delimiter (better alignment)
- **Has nested objects:** Enable key folding
- **Uniformity <60%:** Keep JSON or use expanded list

### 4. Convert
```bash
./claude/utils/toon/zig-out/bin/toon encode "$FILE" \
  --delimiter tab \
  --key-folding \
  > "${FILE%.json}.toon"
```

### 5. Report Savings
```bash
ORIGINAL=$(wc -c < "$FILE")
OPTIMIZED=$(wc -c < "${FILE%.json}.toon")
SAVED=$((ORIGINAL - OPTIMIZED))
PERCENT=$((SAVED * 100 / ORIGINAL))

echo "📊 Optimization Results:"
echo "  Original: $((ORIGINAL / 1024))KB"
echo "  Optimized: $((OPTIMIZED / 1024))KB"
echo "  Saved: $((SAVED / 1024))KB ($PERCENT%)"
```

## Examples

### Example 1: API Documentation
**Input:** 500 API endpoints in JSON
**Output:** TOON format
**Savings:** 42% (892KB → 518KB)

### Example 2: Transaction Logs
**Input:** 10,000 transaction records
**Output:** Pipe-delimited TOON
**Savings:** 39% (4.5MB → 2.7MB)

## Best Practices
- Always backup original data
- Verify round-trip conversion
- Use appropriate delimiter for content
- Enable strict mode for production

## Resources
- [TOON Guide](.claude/docs/toon-guide.md)
- [Token Calculator](.claude/commands/analyze-tokens.md)
```

#### Command: Batch Convert

**File:** `.claude/commands/batch-convert.md`

```markdown
# Batch Convert to TOON

Convert multiple JSON files to TOON format in batch.

Usage: /batch-convert <directory> [--delimiter comma|tab|pipe]

Execute the following workflow:

1. **Find JSON Files**
   ```bash
   DIR="${1:-.}"
   DELIMITER="${2:-comma}"

   if [[ ! -d "$DIR" ]]; then
     echo "Error: Directory not found: $DIR"
     exit 1
   fi

   FILES=$(find "$DIR" -name "*.json" -type f)
   COUNT=$(echo "$FILES" | wc -l)

   echo "Found $COUNT JSON files in $DIR"
   ```

2. **Convert Each File**
   ```bash
   CONVERTED=0
   FAILED=0

   while IFS= read -r file; do
     echo "Processing: $file"

     ./claude/utils/toon/zig-out/bin/toon encode "$file" \
       --delimiter "$DELIMITER" \
       > "${file%.json}.toon"

     if [[ $? -eq 0 ]]; then
       ((CONVERTED++))
       echo "  ✓ Converted"
     else
       ((FAILED++))
       echo "  ✗ Failed"
     fi
   done <<< "$FILES"
   ```

3. **Report Summary**
   ```bash
   echo ""
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo "📊 Batch Conversion Summary"
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo "Total files: $COUNT"
   echo "Converted: $CONVERTED"
   echo "Failed: $FAILED"
   echo "Success rate: $(($CONVERTED * 100 / $COUNT))%"
   ```
```

---

## Hook Examples

### Example 1: Automatic TOON Suggestion

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'if [[ \"$FILE_PATH\" =~ \\.json$ ]] && [[ $(wc -c < \"$FILE_PATH\") -gt 10240 ]]; then SIZE=$(wc -c < \"$FILE_PATH\"); echo \"💡 Tip: This JSON file is $(($SIZE / 1024))KB. Consider converting to TOON format for token savings: /convert-to-toon $FILE_PATH\" >&2; fi'"
      }]
    }]
  }
}
```

### Example 2: File Size Warning

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'SIZE=$(wc -c < \"$FILE_PATH\"); if [[ $SIZE -gt 102400 ]]; then echo \"⚠ Warning: File is $(($SIZE / 1024))KB. Consider splitting into smaller files.\" >&2; fi'"
      }]
    }]
  }
}
```

### Example 3: TOON Validation

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'if [[ \"$FILE_PATH\" =~ \\.toon$ ]]; then .claude/utils/toon/zig-out/bin/toon validate \"$FILE_PATH\" --strict || echo \"⚠ TOON validation failed\" >&2; fi'"
      }]
    }]
  }
}
```

---

## Common Patterns

### Pattern 1: Workflow Command

Template for multi-step workflows:

```markdown
# Workflow Name

Description

Usage: /workflow [args]

1. **Validate**
   - Check prerequisites
   - Validate inputs

2. **Process**
   - Main logic
   - Multiple steps

3. **Verify**
   - Check results
   - Report status

4. **Cleanup**
   - Temporary files
   - Final summary
```

### Pattern 2: Code Generator Skill

Template for code generation:

```markdown
---
name: generator-name
description: Generate X. Invoke when user mentions generate, create, scaffold, or X.
allowed-tools: Write, Edit, Grep, Glob
model: sonnet
---

# X Generator

## Process
1. **Analyze requirements** - Understand what to generate
2. **Check existing code** - Find patterns to follow
3. **Generate files** - Create with proper structure
4. **Update imports/exports** - Maintain consistency
5. **Create tests** - Ensure quality
```

### Pattern 3: Quality Check Hook

Template for validation hooks:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'if [[ condition ]]; then check-command \"$FILE_PATH\" || echo \"Validation failed\" >&2; fi'"
      }]
    }]
  }
}
```

---

## Tips & Best Practices

### Skills
- Include ALL trigger keywords users might say
- Provide clear, working examples
- Reference official documentation
- Keep under 900 lines

### Commands
- Validate inputs early
- Show progress for long operations
- Handle errors gracefully
- Report clear success/failure

### Hooks
- Keep fast (<100ms)
- Only validate relevant files
- Provide actionable messages
- Test before enabling

### TOON Integration
- Use `/analyze-tokens` before converting
- Choose delimiter based on content
- Enable key folding for nested objects
- Validate with strict mode for production

---

**Ready to customize? Copy a template and modify it for your needs!**
