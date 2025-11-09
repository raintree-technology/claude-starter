#!/bin/bash
#
# Verification script for Claude Starter Kit
# Checks configuration, validates files, and reports issues
#

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "🔍 Claude Starter Kit Verification"
echo "===================================="
echo ""

# Check 1: Verify directory structure
echo "Checking directory structure..."
REQUIRED_DIRS=(".claude" ".claude/core" ".claude/core/agents" ".claude/core/commands" ".claude/examples" ".claude/docs" ".claude/plugin")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$PROJECT_ROOT/$dir" ]; then
        echo -e "${RED}ERROR: Missing directory: $dir${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}SUCCESS: Found: $dir${NC}"
    fi
done
echo ""

# Check 2: Verify core files exist
echo "Checking core files..."
CORE_FILES=(
    "README.md"
    "LICENSE"
    ".claude/settings.json"
    ".claude/plugin/plugin.json"
    ".claude/plugin/marketplace.json"
    ".claude/docs/README.md"
    ".claude/docs/quickstart.md"
    ".claude/docs/customization.md"
    ".claude/docs/quick-reference.md"
)
for file in "${CORE_FILES[@]}"; do
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        echo -e "${RED}ERROR: Missing file: $file${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}SUCCESS: Found: $file${NC}"
    fi
done
echo ""

# Check 3: Validate JSON files
echo "Validating JSON files..."
JSON_FILES=(
    ".claude/settings.json"
    ".claude/plugin/plugin.json"
    ".claude/plugin/marketplace.json"
)
for json_file in "${JSON_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$json_file" ]; then
        if python3 -m json.tool "$PROJECT_ROOT/$json_file" > /dev/null 2>&1; then
            echo -e "${GREEN}SUCCESS: Valid JSON: $json_file${NC}"
        else
            echo -e "${RED}ERROR: Invalid JSON: $json_file${NC}"
            ((ERRORS++))
        fi
    fi
done
echo ""

# Check 4: Count components
echo "📊 Counting components..."
AGENT_COUNT=$(find "$CLAUDE_DIR/core/agents" "$CLAUDE_DIR/examples/agents" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
COMMAND_COUNT=$(find "$CLAUDE_DIR/core/commands" "$CLAUDE_DIR/examples/commands" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
HOOK_COUNT=$(find "$CLAUDE_DIR/examples/hooks" -maxdepth 1 -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
SKILL_DIR_COUNT=$(find "$CLAUDE_DIR/examples/skills" -mindepth 2 -maxdepth 2 -type d 2>/dev/null | wc -l | tr -d ' ')

echo "  Agents: $AGENT_COUNT"
echo "  Commands: $COMMAND_COUNT"
echo "  Hooks: $HOOK_COUNT"
echo "  Skill directories: $SKILL_DIR_COUNT"
echo ""

# Check 5: Verify no placeholder content
echo "Checking for placeholder content..."
PLACEHOLDER_COUNT=$(grep -r "your-username\|Your Name\|TODO\|FIXME" "$CLAUDE_DIR" --exclude="*.sh" --exclude-dir=".cache" 2>/dev/null | wc -l | tr -d ' ')
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}WARNING: Found $PLACEHOLDER_COUNT placeholder references${NC}"
    echo "   Run: grep -r \"your-username\|Your Name\|TODO\|FIXME\" .claude/"
    ((WARNINGS++))
else
    echo -e "${GREEN}SUCCESS: No placeholders found${NC}"
fi
echo ""

# Check 6: Verify skill manifests exist
echo "Checking skill manifests..."
SKILL_DIRS=$(find "$CLAUDE_DIR/examples/skills" -mindepth 2 -maxdepth 2 -type d 2>/dev/null)
MISSING_MANIFESTS=0
for skill_dir in $SKILL_DIRS; do
    if [ ! -f "$skill_dir/skill.md" ] && [ ! -f "$skill_dir/SKILL.md" ] && [ ! -f "$skill_dir/Skill.md" ]; then
        echo -e "${RED}ERROR: Missing manifest in: $(basename $(dirname $skill_dir))/$(basename $skill_dir)${NC}"
        ((MISSING_MANIFESTS++))
    fi
done
if [ "$MISSING_MANIFESTS" -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: All skills have manifests${NC}"
else
    ((ERRORS += MISSING_MANIFESTS))
fi
echo ""

# Check 7: Verify agent YAML frontmatter
echo "Validating agent files..."
AGENT_FILES=$(find "$CLAUDE_DIR/core/agents" "$CLAUDE_DIR/examples/agents" -maxdepth 1 -name "*.md" 2>/dev/null)
for agent_file in $AGENT_FILES; do
    if head -1 "$agent_file" | grep -q "^---$"; then
        echo -e "${GREEN}SUCCESS: $(basename $agent_file) has YAML frontmatter${NC}"
    else
        echo -e "${YELLOW}WARNING: $(basename $agent_file) missing YAML frontmatter${NC}"
        ((WARNINGS++))
    fi
done
echo ""

# Check 8: Verify no broken internal links
echo "Checking for common broken links..."
if grep -r "\.claude/agents/docs" "$CLAUDE_DIR/core/agents" 2>/dev/null | grep -v "core/agents/docs" > /dev/null; then
    echo -e "${RED}ERROR: Found references to old agent docs path${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}SUCCESS: Agent doc references correct${NC}"
fi
echo ""

# Check 9: Verify .gitignore includes cache
echo "Checking .gitignore..."
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
    if grep -q "\.cache" "$PROJECT_ROOT/.gitignore"; then
        echo -e "${GREEN}SUCCESS: .gitignore includes .cache${NC}"
    else
        echo -e "${YELLOW}WARNING: .gitignore should include .cache directories${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}WARNING: No .gitignore file found${NC}"
    ((WARNINGS++))
fi
echo ""

# Check 10: Verify hook scripts are executable
echo "⚡ Checking hook executability..."
HOOK_FILES=$(find "$CLAUDE_DIR/examples/hooks" -maxdepth 1 -name "*.ts" 2>/dev/null)
NON_EXECUTABLE=0
for hook_file in $HOOK_FILES; do
    if [ ! -x "$hook_file" ]; then
        echo -e "${YELLOW}WARNING: Not executable: $(basename $hook_file)${NC}"
        ((NON_EXECUTABLE++))
    fi
done
if [ "$NON_EXECUTABLE" -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: All hooks are executable${NC}"
else
    echo -e "${YELLOW}WARNING: $NON_EXECUTABLE hooks need chmod +x${NC}"
    ((WARNINGS++))
fi
echo ""

# Final report
echo "======================================"
echo "📊 Verification Summary"
echo "======================================"
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: All checks passed${NC}"
    echo ""
    echo "Your Claude Starter Kit is ready for release."
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}WARNING: ${WARNINGS} warnings found${NC}"
    echo -e "${RED}ERROR: ${ERRORS} errors found${NC}"
    echo ""
    echo "Review warnings above. Configuration is functional but could be improved."
    exit 0
else
    echo -e "${YELLOW}WARNING: ${WARNINGS} warnings found${NC}"
    echo -e "${RED}ERROR: ${ERRORS} errors found${NC}"
    echo ""
    echo "Fix errors above before release."
    exit 1
fi
