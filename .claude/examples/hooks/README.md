# Claude Code Hooks

This directory contains hooks that run automatically during Claude Code sessions to ensure code quality, security, and best practices.

## 📋 Table of Contents

- [Available Hooks](#available-hooks)
- [Configuration](#configuration)
- [Exit Codes](#exit-codes)
- [Setup](#setup)
- [Troubleshooting](#troubleshooting)

## Available Hooks

### 1. Type/Lint/Format Checks (`check_after_edit.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- ✅ TypeScript type checking (configurable)
- ✅ Biome lint checking (file or project scope)
- ✅ Biome format checking with auto-fix
- ✅ File length validation (max 500 lines by default)
- ✅ Runs checks in parallel for speed
- ✅ Captures and reports actual durations

**Configuration** (see `config.ts`):
- `config.typecheck.enabled` - Enable TypeScript checks
- `config.lint.enabled` - Enable lint checks
- `config.lint.scope` - "file" or "project" scope
- `config.format.enabled` - Enable format checks
- `config.format.autoFix` - Auto-fix formatting issues
- `config.parallel.enabled` - Run checks in parallel

**Example output**:
```
🔍 Running checks after Edit on components/example.tsx...
✅ File length OK (150 lines)
  → TypeScript...
✅ TypeScript passed
  → Biome lint...
✅ Lint passed
  → Biome format...
✅ Format passed
⏱️  Total check time: 234.56ms
✅ All checks passed!
```

### 2. Import Organization (`import_organization.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- 📦 Detects unused imports
- 📦 Auto-sorts and organizes imports
- 📦 Uses Biome's import organization features

**Configuration**:
- `config.imports.enabled` - Enable import checks
- `config.imports.autoSort` - Auto-sort imports
- `config.imports.failOnUnused` - Fail if unused imports found
- `config.imports.failOnUnorganized` - Fail if imports are disorganized

**Example output**:
```
📦 Checking imports in lib/utils/helpers.ts...
  → Checking for unused imports...
✅ No unused imports
  → Organizing imports...
✅ Imports organized
✅ All import checks passed!
```

### 3. Bundle Size Check (`bundle_size_check.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- 📊 Checks file size in KB
- 📊 Warns if file is getting large
- 📊 Fails if file exceeds threshold
- 📊 Different thresholds for components vs regular files

**Configuration**:
- `config.bundleSize.enabled` - Enable bundle size checks
- `config.bundleSize.maxFileSizeKb` - Max file size (default: 100KB)
- `config.bundleSize.maxComponentSizeKb` - Max component size (default: 50KB)
- `config.bundleSize.warnThresholdKb` - Warning threshold (default: 30KB)
- `config.bundleSize.failOnExceed` - Fail if threshold exceeded

**Example output**:
```
📊 Checking file size for components/Dashboard.tsx...
  → File size: 45.32 KB (456 lines)
  → Component file (max: 50 KB)
✅ File size is acceptable
✅ Bundle size check passed!
```

### 4. Security Scan (`security_scan.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- 🔒 Detects hardcoded secrets (API keys, tokens, passwords)
- 🔒 Identifies unsafe patterns (eval, exec, innerHTML)
- 🔒 Checks for dangerous HTML (dangerouslySetInnerHTML without sanitization)
- 🔒 Detects console statements (optional)
- 🔒 Categorizes by severity (critical/high/medium/low)

**Detected patterns**:
- API keys, access keys, auth tokens
- AWS Access Keys, GitHub tokens, Slack tokens
- Stripe/payment keys
- eval(), Function() constructor
- Direct innerHTML assignment
- dangerouslySetInnerHTML without DOMPurify

**Configuration**:
- `config.security.enabled` - Enable security scanning
- `config.security.failOnCritical` - Fail on critical issues
- `config.security.failOnHigh` - Fail on high severity issues
- `config.security.warnOnMedium` - Warn on medium severity issues
- `config.security.checks.hardcodedSecrets` - Check for secrets
- `config.security.checks.unsafePatterns` - Check for unsafe code
- `config.security.checks.dangerousHtml` - Check for XSS risks
- `config.security.checks.consoleStatements` - Check for console.*

**Example output**:
```
🔒 Running security scan on lib/api/client.ts...

🚨 CRITICAL (1 issue):
   Line 45: Potential hardcoded API key
   → const apiKey = "sk_live_abc123..."

⚠️  HIGH (2 issues):
   Line 78: Use of eval() - potential code injection risk
   Line 92: Direct innerHTML assignment - XSS risk

❌ Security scan failed. Please address critical/high issues above.
```

### 5. Code Quality (`code_quality.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- 🎯 Analyzes cyclomatic complexity
- 🎯 Checks function length
- 🎯 Detects long parameter lists
- 🎯 Identifies deep nesting
- 🎯 Checks for circular dependencies (requires madge)
- 🎯 Flags code smells (TODO comments, 'any' types)
- 🔧 **NEW**: Detects utility reimplementation (formatDate, debounce, etc.)
- 🔧 **NEW**: Suggests using `@/lib/utils` instead of recreating utilities

**Configuration**:
- `config.quality.enabled` - Enable quality checks
- `config.quality.maxFunctionLines` - Max lines per function (default: 50)
- `config.quality.maxCyclomaticComplexity` - Max complexity (default: 15)
- `config.quality.maxParameterCount` - Max parameters (default: 4)
- `config.quality.maxNestingDepth` - Max nesting level (default: 3)
- `config.quality.enableCircularDependencyCheck` - Check for circular deps
- `config.projectInfrastructure.enforceUtilImports` - Detect utility reimplementation

**Example output**:
```
🎯 Running code quality checks on lib/services/processor.ts...
  → Analyzed 8 functions
  → Checking circular dependencies...

⚠️  WARNINGS (3):
   Line 45: Function 'processData' is too long (78 lines, max: 50)
   Line 123: Function 'calculateMetrics' has high complexity (18, max: 15)
   Line 201: Function 'transformResults' has 6 parameters (max: 4)

ℹ️  INFO: 5 suggestions
✅ Code quality checks passed
```

### 6. Architecture Check (`architecture_check.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- 🏗️ Enforces layer boundaries (components, hooks, utils, services)
- 🏗️ Validates naming conventions (PascalCase, camelCase, UPPER_SNAKE_CASE)
- 🏗️ Prevents utils from importing from features/components
- 🏗️ Ensures React components are PascalCase
- 🏗️ Validates hook names start with 'use'
- 🏗️ Checks constants are UPPER_SNAKE_CASE
- 📚 **NEW**: Detects reimplementation of types from `@/lib/types`
- 📚 **NEW**: Suggests using project types (User, Account, ApiResponse, etc.)

**Configuration**:
- `config.architecture.enabled` - Enable architecture checks
- `config.architecture.enforceLayerBoundaries` - Check import violations
- `config.architecture.enforceNamingConventions` - Validate naming patterns
- `config.architecture.layers` - Define allowed imports per layer
- `config.projectInfrastructure.enforceTypeImports` - Detect type reimplementation
- `config.projectInfrastructure.allowedDuplicatePatterns` - Paths where reimplementation is OK

**Example output**:
```
🏗️  Running architecture checks on lib/api/users.ts...

❌ ERRORS (1):
   Line 12: Utils importing from components
   💡 Move shared logic to utils, not the other way around

⚠️  WARNINGS (4):
   Line 45: React component 'myComponent' should be PascalCase
   💡 Rename to 'MyComponent'
   Line 67: Reimplementing types that may exist in lib/types
   💡 Check if this type exists in @/lib/types before creating it
   Line 78: Constant 'apiKey' should be UPPER_SNAKE_CASE
   💡 Consider renaming to 'API_KEY'
   Line 89: Reimplementing types that may exist in lib/types
   💡 Check if this type exists in @/lib/types (ApiResponse, PaginatedResponse)

❌ Architecture checks failed. Please fix the errors above.
```

### 7. React Quality (`react_quality.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- ⚛️ Validates component prop types
- ⚛️ Warns on 'any' types in props
- ⚛️ Checks useEffect/useMemo/useCallback dependencies
- ⚛️ Detects inline functions in JSX (performance)
- ⚛️ Finds missing keys in .map()
- ⚛️ Suggests React.memo for large components
- ⚛️ Detects objects/arrays in dependency arrays
- ⚛️ Flags inline styles

**Configuration**:
- `config.react.enabled` - Enable React checks
- `config.react.enforcePropTypes` - Require typed props
- `config.react.warnOnAnyProps` - Warn on 'any' in props
- `config.react.checkHookDependencies` - Validate hook deps
- `config.react.detectPerformanceIssues` - Find performance anti-patterns
- `config.react.maxComponentLines` - Max lines before suggesting memo

**Example output**:
```
⚛️  Running React quality checks on components/Dashboard.tsx...

❌ ERRORS (1):
   Line 67: Array .map() without key prop
   💡 Add unique key prop to prevent rendering issues

⚠️  WARNINGS (3):
   Line 23: Component 'Dashboard' uses 'any' for props type
   💡 Define a proper interface or type for component props
   Line 45: Object or array literal in dependency array
   💡 Objects/arrays recreate on every render. Use useMemo or move outside component
   Line 89: useEffect missing dependency array
   💡 Add dependency array to prevent infinite loops

ℹ️  INFO: 5 performance suggestions
✅ React quality checks passed
```

### 8. Accessibility (`accessibility.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- ♿ Checks for missing alt text on images
- ♿ Validates aria-labels on interactive elements
- ♿ Ensures keyboard navigation support
- ♿ Detects autoplay media
- ♿ Checks heading hierarchy
- ♿ Warns on vague link text ("click here")
- ♿ Integrates with eslint-plugin-jsx-a11y if available

**Detected issues**:
- Images without alt attributes (WCAG 1.1.1)
- Icon buttons without aria-label (WCAG 4.1.2)
- Form inputs without labels (WCAG 1.3.1)
- onClick without keyboard handlers (WCAG 2.1.1)
- Missing role/tabIndex on interactive elements
- Color-only information (WCAG 1.4.1)
- Autoplaying media (WCAG 1.4.2)

**Configuration**:
- `config.accessibility.enabled` - Enable a11y checks
- `config.accessibility.requireAltText` - Enforce alt on images
- `config.accessibility.requireAriaLabels` - Require labels
- `config.accessibility.checkKeyboardNav` - Check keyboard support
- `config.accessibility.failOnViolations` - Block on errors

**Example output**:
```
♿ Running accessibility checks on components/Gallery.tsx...

❌ ERRORS (2):
   Line 34: Image missing alt attribute
   📖 WCAG 2.1 Level A (1.1.1)
   💡 Add alt="" for decorative images or descriptive alt text
   Line 56: Icon button missing aria-label
   📖 WCAG 2.1 Level A (4.1.2)
   💡 Add aria-label="descriptive text" to icon-only buttons

⚠️  WARNINGS (3):
   Line 78: onClick on non-interactive element without keyboard handler
   💡 Add onKeyDown handler or use a <button> element
   Line 92: Form input missing label or aria-label
   💡 Add a <label> element or aria-label attribute

ℹ️  INFO: 2 accessibility suggestions
✅ Accessibility checks passed (warnings only)
```

### 9. Advanced Analysis (`advanced_analysis.ts`)

**Event**: `PostToolUse` (runs after `Edit` or `Write` tool calls)

**What it does**:
- 🔬 Detects memory leak patterns
- 🔬 Identifies race conditions
- 🔬 Validates type narrowing and guards
- 🔬 Checks async/await patterns
- 🔬 Finds unclosed event listeners
- 🔬 Detects Promise.all vs allSettled issues
- 🔬 Validates JSON.parse safety
- 🔬 Checks unsafe type assertions
- 💾 **NEW**: Detects manual caching (should use `@/lib/cache`)
- 💾 **NEW**: Suggests Redis/KV for distributed state
- 💾 **NEW**: Validates cache key formatting and TTL usage

**Memory leak detection**:
- addEventListener without removeEventListener
- setInterval/setTimeout without cleanup
- Subscriptions without unsubscribe
- DOM refs not cleared
- Large closures capturing unnecessary vars

**Race condition detection**:
- Promise.all with mutations
- Missing await on async calls
- State updates after async without cleanup check
- Sequential awaits that could be parallel
- Promise.all vs Promise.allSettled

**Type safety validation**:
- Unsafe type assertions (as)
- Non-null assertions (!)
- Missing type guards
- Array access without bounds check
- JSON.parse without try-catch
- parseInt without radix

**Configuration**:
- `config.advanced.enabled` - Enable advanced analysis
- `config.advanced.detectMemoryLeaks` - Check for leaks
- `config.advanced.detectRaceConditions` - Check async patterns
- `config.advanced.validateTypeNarrowing` - Validate type guards
- `config.advanced.checkAsyncPatterns` - Check Promise usage
- `config.projectInfrastructure.enforceCacheUsage` - Detect manual caching
- `config.projectInfrastructure.enforceRedisUsage` - Suggest Redis for distributed state

**Example output**:
```
🔬 Running advanced analysis on lib/services/data.ts...

❌ ERRORS (1):
   Line 23 [memory]: addEventListener in useEffect without cleanup
   💡 Return cleanup function: return () => element.removeEventListener(...)

⚠️  WARNINGS (5):
   Memory (3):
     Line 45: Subscription without unsubscribe in cleanup
     Line 67: Timer/interval created without storing ID for cleanup
     Line 89: In-memory Map cache - project has centralized caching
   Async/Concurrency (1):
     Line 112: State update after async operation without cleanup check
   Type Safety (1):
     Line 134: Type assertion (as) bypasses type checking

ℹ️  INFO: 4 suggestions for improved safety
  Line 89: Use @/lib/cache (Redis-backed) for persistent, distributed caching
  Line 145: In-memory queue may not work in distributed/serverless environments
✅ Advanced analysis passed
```

## Project Infrastructure Validation

**NEW in this version**: All hooks now validate that your code uses existing project infrastructure instead of reimplementing common patterns.

### What Gets Checked:

1. **Type Imports** (`architecture_check.ts`)
   - Detects: `interface User`, `interface ApiResponse`, `type AccountData`
   - Suggests: Use `@/lib/types` (User, Account, ApiResponse, etc.)
   - Files checked: All TypeScript files except allowed patterns

2. **Utility Imports** (`code_quality.ts`)
   - Detects: `function formatDate`, `function debounce`, `function cn`, custom Error classes
   - Suggests: Use `@/lib/utils/formatters`, `@/lib/utils/async`, `@/lib/utils/errors`
   - Files checked: All code files except components, tests

3. **Cache/Redis Usage** (`advanced_analysis.ts`)
   - Detects: `new Map()` for caching, `setTimeout` for expiration, in-memory queues
   - Suggests: Use `@/lib/cache` (Redis-backed) for distributed caching
   - Validates: Cache keys use `buildCacheKey()`, TTL is specified
   - Files checked: All service/API files

### Allowed Reimplementation:

Configure `allowedDuplicatePatterns` in `config.ts`:
```typescript
{
  projectInfrastructure: {
    allowedDuplicatePatterns: [
      "components/",    // UI components can have local utils
      "app/api/",       // API routes can have local helpers
      "__tests__/",     // Test files can have test helpers
      ".claude/hooks/", // Hooks themselves are OK
    ]
  }
}
```

### Benefits:

- ✅ Prevents code duplication
- ✅ Enforces consistent patterns
- ✅ Helps new developers find existing utilities
- ✅ Reduces bundle size (no duplicate implementations)
- ✅ Ensures Redis is used for distributed state

## Configuration

### Central Config File (`config.ts`)

All hooks share a central configuration file that allows you to customize:

- **File patterns** - Which files each hook targets
- **Quality thresholds** - Max file lines, function lines, complexity, etc.
- **Enable/disable checks** - Turn individual checks on/off
- **Severity settings** - Block vs warn on different issues
- **Parallel execution** - Run checks concurrently
- **Output settings** - Verbosity, duration display, etc.

**Example configuration**:

```typescript
export const config: HookConfig = {
  quality: {
    enabled: true,
    maxFileLines: 500,
    maxFunctionLines: 50,
    maxCyclomaticComplexity: 15,
    maxParameterCount: 4,
    maxNestingDepth: 3,
  },

  typecheck: {
    enabled: true,
    failOnError: true,
  },

  security: {
    enabled: true,
    failOnCritical: true,
    failOnHigh: true,
  },

  // ... more options
};
```

### Registering Hooks

Hooks are registered in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/check_after_edit.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/import_organization.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/bundle_size_check.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/security_scan.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/code_quality.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/architecture_check.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/react_quality.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/accessibility.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/advanced_analysis.ts"
          }
        ]
      }
    ]
  }
}
```

**Note**: You can selectively enable only the hooks you need. Start with the core ones and add more as needed.

## Exit Codes

All hooks use standardized exit codes:

- **0** - Success (all checks passed)
- **1** - Check failure (issues found that block)
- **2** - Unexpected error (hook crashed)
- **3** - Configuration error (invalid setup)

## Setup

### 1. Make hooks executable

```bash
chmod +x .claude/hooks/*.ts
```

### 2. Install optional dependencies

For circular dependency detection:
```bash
npm install -g madge
```

### 3. Configure hooks

Edit `.claude/hooks/config.ts` to customize thresholds and behavior.

### 4. Register hooks

Add hooks to `.claude/settings.json` (see example above).

## Troubleshooting

### Hook is not running

1. Check if hook is registered in `.claude/settings.json`
2. Verify hook file is executable: `ls -la .claude/hooks/`
3. Check Claude Code output for hook errors

### Hook failing unexpectedly

1. Run the hook manually: `./.claude/hooks/check_after_edit.ts < test_input.json`
2. Check hook logs in your logger output
3. Verify configuration in `config.ts`

### Disable a specific check

Edit `config.ts` and set the check's `enabled` field to `false`:

```typescript
export const config = {
  security: {
    enabled: false, // Disable security scanning
  },
  // ...
};
```

### Temporarily disable all hooks

1. Run `/hooks` in Claude Code
2. Or rename `.claude/settings.json` temporarily

## Performance Tips

1. **Enable parallel execution**: Set `config.parallel.enabled = true`
2. **Use file scope for lint**: Set `config.lint.scope = "file"`
3. **Disable expensive checks**: Turn off circular dependency checks for large projects
4. **Adjust thresholds**: Increase limits if checks are too strict

## Further Reading

- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Biome Documentation](https://biomejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
