Enable a quality automation hook by automatically updating settings.json

Usage: `/enable-hook <hook-name>`

Available hooks:
- `check_after_edit` - TypeScript/lint/format validation after edits
- `security_scan` - Security vulnerability scanning
- `code_quality` - Code quality metrics and complexity analysis
- `architecture_check` - Architecture compliance and layer boundaries
- `react_quality` - React best practices and patterns
- `accessibility` - WCAG compliance and accessibility checks
- `import_organization` - Auto-organize and sort imports
- `bundle_size_check` - Bundle size monitoring and warnings
- `advanced_analysis` - Memory leaks, race conditions, cache usage
- `gwern-checklist` - Gwern-style quality checklist

Presets:
- `quality-focused` - Enable check_after_edit, code_quality, import_organization
- `security-focused` - Enable security_scan, architecture_check, advanced_analysis
- `react-focused` - Enable react_quality, accessibility, check_after_edit
- `all` - Enable all hooks

Execute the following workflow:

1. **Validate Hook Name**
   ```bash
   # Check if hook exists
   HOOK_NAME="$1"
   HOOK_FILE=".claude/examples/hooks/${HOOK_NAME}.ts"

   if [ ! -f "$HOOK_FILE" ]; then
     echo "❌ Hook not found: $HOOK_NAME"
     echo "Available hooks: check_after_edit, security_scan, code_quality, ..."
     exit 1
   fi
   ```

2. **Handle Presets**
   If user provides a preset name:
   ```bash
   case "$1" in
     "quality-focused")
       HOOKS=("check_after_edit" "code_quality" "import_organization")
       ;;
     "security-focused")
       HOOKS=("security_scan" "architecture_check" "advanced_analysis")
       ;;
     "react-focused")
       HOOKS=("react_quality" "accessibility" "check_after_edit")
       ;;
     "all")
       HOOKS=("check_after_edit" "security_scan" "code_quality" "architecture_check" "react_quality" "accessibility" "import_organization" "bundle_size_check" "advanced_analysis" "gwern-checklist")
       ;;
   esac
   ```

3. **Read Current Settings**
   ```bash
   # Read current settings.json
   cat .claude/settings.json
   ```

4. **Check if Hook Already Enabled**
   ```bash
   # Check if hook is already in settings
   if grep -q "$HOOK_NAME" .claude/settings.json; then
     echo "✓ Hook '$HOOK_NAME' is already enabled"
     exit 0
   fi
   ```

5. **Update settings.json**
   Use Node.js to properly update JSON:
   ```bash
   node -e "
   const fs = require('fs');
   const path = '.claude/settings.json';
   const settings = JSON.parse(fs.readFileSync(path, 'utf8'));

   // Initialize hooks structure if needed
   if (!settings.hooks) settings.hooks = {};
   if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

   // Check if PostToolUse array has the Edit|Write matcher
   let matcher = settings.hooks.PostToolUse.find(m => m.matcher === 'Edit|Write');

   if (!matcher) {
     matcher = {
       matcher: 'Edit|Write',
       hooks: []
     };
     settings.hooks.PostToolUse.push(matcher);
   }

   // Add the hook
   const hookPath = '\$CLAUDE_PROJECT_DIR/.claude/examples/hooks/$HOOK_NAME.ts';
   const hookExists = matcher.hooks.some(h => h.command === hookPath);

   if (!hookExists) {
     matcher.hooks.push({
       type: 'command',
       command: hookPath
     });

     fs.writeFileSync(path, JSON.stringify(settings, null, 2) + '\n');
     console.log('✓ Hook added successfully');
   } else {
     console.log('✓ Hook already enabled');
   }
   " "$HOOK_NAME"
   ```

6. **Verify Update**
   ```bash
   # Show the updated configuration
   echo ""
   echo "Updated settings.json:"
   cat .claude/settings.json | grep -A 10 "PostToolUse"
   ```

7. **Output Success Message**
   ```markdown
   ✅ Hook Enabled: $HOOK_NAME

   **What it does:**
   - check_after_edit: TypeScript/lint/format validation after edits
   - security_scan: Scans for vulnerabilities, secrets, XSS, SQL injection
   - code_quality: Checks complexity, function length, code smells
   - ... (description for the enabled hook)

   **Next steps:**
   - Edit a file to see the hook in action
   - Disable with: /disable-hook $HOOK_NAME
   - View all enabled hooks: /list-hooks

   **Note:** Restart Claude Code if hooks don't activate immediately.
   ```

**Error Handling**
- If hook name invalid: Show list of available hooks
- If settings.json corrupted: Backup and recreate with valid JSON
- If Node.js not available: Provide manual JSON editing instructions

**Examples**

Enable single hook:
```bash
/enable-hook security_scan
```

Enable preset:
```bash
/enable-hook quality-focused
# Enables: check_after_edit, code_quality, import_organization
```

Enable all hooks:
```bash
/enable-hook all
```

**Preset Configurations**

**quality-focused** (recommended for most projects):
- ✅ check_after_edit - Immediate feedback on TypeScript/lint/format
- ✅ code_quality - Complexity and code smell detection
- ✅ import_organization - Keep imports clean

**security-focused** (recommended for production apps):
- ✅ security_scan - Vulnerability and secret detection
- ✅ architecture_check - Layer boundary enforcement
- ✅ advanced_analysis - Memory leaks, race conditions

**react-focused** (recommended for React projects):
- ✅ react_quality - React best practices
- ✅ accessibility - WCAG compliance
- ✅ check_after_edit - TypeScript/lint/format

**all** (for maximum quality, may slow down edits):
- All 10 hooks enabled
- Comprehensive but potentially slower

**Companion Commands**

See also:
- `/disable-hook <name>` - Disable a specific hook
- `/list-hooks` - Show all enabled hooks
- `/hook-status` - Show detailed hook configuration
