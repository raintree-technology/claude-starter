#!/bin/bash

# Convert existing documentation or prompts into Claude Code skills
# Helps migrate from custom prompts, slash commands, or documentation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Skill Converter                                     ║${NC}"
echo -e "${BLUE}║        Convert existing content to Claude Code skills     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <input-file> [output-skill-name]"
    echo ""
    echo "Converts existing content to a Claude Code skill:"
    echo "  • Markdown files"
    echo "  • Text prompts"
    echo "  • Slash command files"
    echo "  • Documentation"
    echo ""
    echo "Example:"
    echo "  $0 my-prompt.md code-reviewer"
    echo "  $0 docs/api-guide.md api-builder"
    echo ""
    exit 1
fi

INPUT_FILE="$1"
SKILL_NAME="${2:-converted-skill}"

# Validate input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}Error: Input file not found: $INPUT_FILE${NC}"
    exit 1
fi

# Validate skill name
if ! [[ "$SKILL_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}Error: Skill name must be lowercase with hyphens only${NC}"
    exit 1
fi

echo -e "${BLUE}Input file: ${NC}$INPUT_FILE"
echo -e "${BLUE}Skill name: ${NC}$SKILL_NAME"
echo ""

# Read the input content
CONTENT=$(cat "$INPUT_FILE")

# Try to extract useful information
echo -e "${YELLOW}Analyzing content...${NC}"
echo ""

# Check if it already has frontmatter
HAS_FRONTMATTER=false
if echo "$CONTENT" | head -1 | grep -q "^---$"; then
    HAS_FRONTMATTER=true
    echo -e "${GREEN}✓ Existing frontmatter detected${NC}"
fi

# Prompt for description if not in frontmatter
echo ""
echo -e "${BLUE}Skill Configuration${NC}"
echo ""

# Get description
echo "The description determines when Claude invokes this skill."
echo "Include what it does AND when to use it."
echo ""
read -p "Enter skill description (max 1024 chars): " DESCRIPTION

while [ ${#DESCRIPTION} -gt 1024 ]; do
    echo -e "${RED}Description too long (${#DESCRIPTION} chars). Max 1024.${NC}"
    read -p "Enter shorter description: " DESCRIPTION
done

# Choose scope
echo ""
echo "Choose skill scope:"
echo "1) Personal (~/.claude/skills/)"
echo "2) Project (.claude/skills/)"
read -p "Select (1-2): " SCOPE

if [ "$SCOPE" = "1" ]; then
    SKILL_DIR="$HOME/.claude/skills/$SKILL_NAME"
else
    SKILL_DIR=".claude/skills/$SKILL_NAME"
fi

# Ask about tool restrictions
echo ""
echo "Restrict tools? (Optional)"
echo "Leave blank to allow all tools"
echo "Example: Read, Grep, Glob"
read -p "Allowed tools: " ALLOWED_TOOLS

# Create skill directory
mkdir -p "$SKILL_DIR"

# Create SKILL.md
echo -e "${YELLOW}Creating SKILL.md...${NC}"

cat > "$SKILL_DIR/SKILL.md" << EOF
---
name: $SKILL_NAME
description: $DESCRIPTION
EOF

if [ -n "$ALLOWED_TOOLS" ]; then
    echo "allowed-tools: $ALLOWED_TOOLS" >> "$SKILL_DIR/SKILL.md"
fi

cat >> "$SKILL_DIR/SKILL.md" << 'ENDFRONT'
---

ENDFRONT

# If original had frontmatter, strip it before adding content
if [ "$HAS_FRONTMATTER" = true ]; then
    # Skip frontmatter and add rest
    awk '/^---$/{count++; if(count==2){flag=1; next}} flag' "$INPUT_FILE" >> "$SKILL_DIR/SKILL.md"
else
    # Add all content
    cat "$INPUT_FILE" >> "$SKILL_DIR/SKILL.md"
fi

# Add sections if they're missing
SKILL_CONTENT=$(cat "$SKILL_DIR/SKILL.md")

if ! echo "$SKILL_CONTENT" | grep -qi "when to use"; then
    cat >> "$SKILL_DIR/SKILL.md" << 'EOF'

## When to Use

This skill should be invoked when:
- [Add specific trigger condition 1]
- [Add specific trigger condition 2]
- [Add specific trigger condition 3]

EOF
fi

if ! echo "$SKILL_CONTENT" | grep -qi "example"; then
    cat >> "$SKILL_DIR/SKILL.md" << 'EOF'

## Examples

### Example 1: [Scenario name]

**Input**: [What the user provides]

**Process**: [How to handle it]

**Output**: [What to produce]

EOF
fi

# Create README
cat > "$SKILL_DIR/README.md" << EOF
# $SKILL_NAME

$DESCRIPTION

## Installation

### Personal Installation
\`\`\`bash
cp -r . ~/.claude/skills/$SKILL_NAME
\`\`\`

### Project Installation
\`\`\`bash
git add .claude/skills/$SKILL_NAME
git commit -m "Add $SKILL_NAME skill"
\`\`\`

## Usage

This skill is automatically invoked by Claude when relevant.

## Source

Converted from: $INPUT_FILE

## Customization

Edit \`SKILL.md\` to refine:
1. Description (add specific trigger keywords)
2. Instructions
3. Examples
4. Tool restrictions

## Testing

Test with requests that match the description:
\`\`\`
[Add example user request here]
\`\`\`

## Troubleshooting

If the skill isn't invoked automatically:
1. Make description more specific with trigger keywords
2. Restart Claude Code
3. Verify with: \`/skills\`
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Skill created successfully!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Location:${NC} $SKILL_DIR"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Review and refine the skill:"
echo -e "   ${YELLOW}$SKILL_DIR/SKILL.md${NC}"
echo ""
echo "2. Add 'When to Use' conditions"
echo "3. Add concrete examples"
echo "4. Test trigger keywords in description"
echo ""
echo "5. Validate:"
echo -e "   ${YELLOW}./utils/validate-skill.sh $SKILL_DIR${NC}"
echo ""
echo "6. Test with Claude Code"
echo ""
echo -e "${GREEN}Conversion complete! 🚀${NC}"
