#!/bin/bash

# Skill Validation Utility
# Validates Claude Code skills against official documentation requirements

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Function to print error
error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
    ((ERRORS++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
    ((WARNINGS++))
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print info
info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if skill path provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-skill-directory>"
    echo "Example: $0 ~/.claude/skills/my-skill"
    exit 1
fi

SKILL_DIR="$1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Claude Code Skill Validator                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Validating skill at: $SKILL_DIR"
echo ""

# Check if directory exists
if [ ! -d "$SKILL_DIR" ]; then
    error "Directory does not exist: $SKILL_DIR"
    exit 1
fi

# Check if SKILL.md exists
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
    error "SKILL.md file not found"
    exit 1
else
    success "SKILL.md file exists"
fi

# Validate YAML frontmatter
echo ""
info "Validating YAML frontmatter..."

SKILL_CONTENT=$(cat "$SKILL_DIR/SKILL.md")

# Check for frontmatter delimiters
if ! echo "$SKILL_CONTENT" | head -1 | grep -q "^---$"; then
    error "Missing opening frontmatter delimiter (---)"
else
    success "Opening frontmatter delimiter found"
fi

# Extract frontmatter
FRONTMATTER=$(awk '/^---$/{flag=!flag;next}flag' "$SKILL_DIR/SKILL.md" | head -n 100)

# Validate required fields
echo ""
info "Checking required fields..."

# Check for name field
if echo "$FRONTMATTER" | grep -q "^name:"; then
    SKILL_NAME=$(echo "$FRONTMATTER" | grep "^name:" | head -1 | sed 's/name: *//')

    # Validate name format
    if [[ ! "$SKILL_NAME" =~ ^[a-z0-9-]+$ ]]; then
        error "Skill name must be lowercase with hyphens only: $SKILL_NAME"
    elif [ ${#SKILL_NAME} -gt 64 ]; then
        error "Skill name exceeds 64 characters: ${#SKILL_NAME} chars"
    else
        success "Valid skill name: $SKILL_NAME"
    fi
else
    error "Missing required 'name' field in frontmatter"
fi

# Check for description field
if echo "$FRONTMATTER" | grep -q "^description:"; then
    DESCRIPTION=$(echo "$FRONTMATTER" | grep "^description:" | head -1 | sed 's/description: *//')

    if [ -z "$DESCRIPTION" ]; then
        error "Description field is empty"
    elif [ ${#DESCRIPTION} -gt 1024 ]; then
        error "Description exceeds 1024 characters: ${#DESCRIPTION} chars"
    else
        success "Description field present (${#DESCRIPTION} chars)"

        # Check if description mentions when to use
        if [[ ! "$DESCRIPTION" =~ [Ww]hen|[Uu]se|[Ff]or ]]; then
            warning "Description should explain WHEN to use this skill"
            info "  Example: 'Use when reviewing code for...' or 'For analyzing...'"
        else
            success "Description includes usage context"
        fi
    fi
else
    error "Missing required 'description' field in frontmatter"
fi

# Validate optional fields
echo ""
info "Checking optional fields..."

# Check allowed-tools if present
if echo "$FRONTMATTER" | grep -q "^allowed-tools:"; then
    ALLOWED_TOOLS=$(echo "$FRONTMATTER" | grep "^allowed-tools:" | sed 's/allowed-tools: *//')

    VALID_TOOLS=("Read" "Write" "Edit" "Bash" "Grep" "Glob" "WebFetch" "WebSearch" "Task" "NotebookEdit" "Skill" "SlashCommand")

    # Parse comma-separated tools
    IFS=',' read -ra TOOLS <<< "$ALLOWED_TOOLS"
    INVALID_TOOLS=()

    for tool in "${TOOLS[@]}"; do
        tool=$(echo "$tool" | xargs) # trim whitespace
        if [[ ! " ${VALID_TOOLS[@]} " =~ " ${tool} " ]]; then
            INVALID_TOOLS+=("$tool")
        fi
    done

    if [ ${#INVALID_TOOLS[@]} -gt 0 ]; then
        warning "Unknown tools in allowed-tools: ${INVALID_TOOLS[*]}"
        info "  Valid tools: ${VALID_TOOLS[*]}"
    else
        success "Valid allowed-tools configuration"
    fi
fi

# Check model if present
if echo "$FRONTMATTER" | grep -q "^model:"; then
    MODEL=$(echo "$FRONTMATTER" | grep "^model:" | head -1 | sed 's/model: *//')

    VALID_MODELS=("sonnet" "opus" "haiku")

    if [[ " ${VALID_MODELS[@]} " =~ " ${MODEL} " ]]; then
        success "Valid model: $MODEL"
    else
        warning "Unknown model: $MODEL (valid: ${VALID_MODELS[*]})"
    fi
fi

# Validate file structure
echo ""
info "Checking file structure..."

# Check for markdown content after frontmatter
CONTENT_LINES=$(awk '/^---$/{count++; if(count==2){flag=1; next}} flag' "$SKILL_DIR/SKILL.md" | wc -l | xargs)

if [ "$CONTENT_LINES" -lt 10 ]; then
    warning "Skill instructions seem short ($CONTENT_LINES lines). Consider adding more detail."
else
    success "Skill instructions present ($CONTENT_LINES lines)"
fi

# Check for common sections
CONTENT=$(awk '/^---$/{count++; if(count==2){flag=1; next}} flag' "$SKILL_DIR/SKILL.md")

if echo "$CONTENT" | grep -qi "purpose"; then
    success "Purpose section found"
else
    warning "Consider adding a 'Purpose' section"
fi

if echo "$CONTENT" | grep -qi "when to use"; then
    success "When to Use section found"
else
    warning "Consider adding a 'When to Use' section"
fi

if echo "$CONTENT" | grep -qi "example"; then
    success "Examples section found"
else
    warning "Consider adding examples for clarity"
fi

# Check for supporting files
echo ""
info "Checking supporting files..."

if [ -d "$SKILL_DIR/scripts" ]; then
    SCRIPT_COUNT=$(find "$SKILL_DIR/scripts" -type f | wc -l | xargs)
    success "Scripts directory found ($SCRIPT_COUNT files)"

    # Check if scripts are executable
    NON_EXECUTABLE=$(find "$SKILL_DIR/scripts" -type f -name "*.sh" ! -executable | wc -l | xargs)
    if [ "$NON_EXECUTABLE" -gt 0 ]; then
        warning "$NON_EXECUTABLE shell script(s) not executable. Run: chmod +x script.sh"
    fi
fi

if [ -d "$SKILL_DIR/materials" ]; then
    MATERIAL_COUNT=$(find "$SKILL_DIR/materials" -type f | wc -l | xargs)
    success "Materials directory found ($MATERIAL_COUNT files)"
fi

if [ -f "$SKILL_DIR/README.md" ]; then
    success "README.md found"
else
    warning "No README.md file. Consider adding documentation for users."
fi

# Check file paths for Windows compatibility
echo ""
info "Checking file paths..."

BACKSLASH_COUNT=$(grep -r '\\' "$SKILL_DIR/SKILL.md" 2>/dev/null | grep -v "^\s*//" | wc -l | xargs)
if [ "$BACKSLASH_COUNT" -gt 0 ]; then
    warning "Found backslashes in paths. Use forward slashes for cross-platform compatibility."
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Validation Summary                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Perfect! No issues found.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found. Skill is valid but could be improved.${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo ""
    echo "Please fix the errors before using this skill."
    exit 1
fi
