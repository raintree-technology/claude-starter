#!/bin/bash

# Claude Code Skill Builder
# Interactive tool to create well-structured skills based on official documentation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
EXAMPLES_DIR="$SCRIPT_DIR/examples"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Claude Code Skill Builder                          ║${NC}"
echo -e "${BLUE}║        Create professional skills interactively            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to prompt user input
prompt() {
    local prompt_text="$1"
    local var_name="$2"
    local default_value="$3"

    if [ -n "$default_value" ]; then
        echo -n -e "${GREEN}$prompt_text [$default_value]: ${NC}"
    else
        echo -n -e "${GREEN}$prompt_text: ${NC}"
    fi

    read -r user_input

    if [ -z "$user_input" ] && [ -n "$default_value" ]; then
        user_input="$default_value"
    fi

    eval "$var_name='$user_input'"
}

# Function to validate skill name
validate_skill_name() {
    local name="$1"

    # Check if lowercase with hyphens only
    if ! [[ "$name" =~ ^[a-z0-9-]+$ ]]; then
        echo -e "${RED}Error: Skill name must be lowercase with hyphens only (e.g., my-skill-name)${NC}"
        return 1
    fi

    # Check length (max 64 characters per docs)
    if [ ${#name} -gt 64 ]; then
        echo -e "${RED}Error: Skill name must be 64 characters or less${NC}"
        return 1
    fi

    return 0
}

# Function to validate description
validate_description() {
    local desc="$1"

    # Check length (max 1024 characters per docs)
    if [ ${#desc} -gt 1024 ]; then
        echo -e "${RED}Error: Description must be 1024 characters or less${NC}"
        return 1
    fi

    # Check if description mentions when to use it
    if ! [[ "$desc" =~ [Ww]hen|[Uu]se|[Ff]or ]]; then
        echo -e "${YELLOW}Warning: Description should explain WHEN to use this skill${NC}"
        echo -e "${YELLOW}Example: 'Use this skill when you need to...'${NC}"
    fi

    return 0
}

# Step 1: Choose skill type
echo -e "${BLUE}Step 1: Choose Skill Type${NC}"
echo "1) Simple skill (instructions only)"
echo "2) Skill with scripts"
echo "3) Skill with reference materials"
echo "4) Complex skill (scripts + materials + code)"
echo ""
prompt "Select skill type (1-4)" skill_type "1"

# Step 2: Skill name
echo ""
echo -e "${BLUE}Step 2: Skill Name${NC}"
echo "Must be lowercase with hyphens, max 64 characters"
echo "Example: code-reviewer, api-builder, test-generator"
echo ""

while true; do
    prompt "Skill name" skill_name

    if [ -z "$skill_name" ]; then
        echo -e "${RED}Skill name cannot be empty${NC}"
        continue
    fi

    if validate_skill_name "$skill_name"; then
        break
    fi
done

# Step 3: Description
echo ""
echo -e "${BLUE}Step 3: Skill Description${NC}"
echo "Describe what this skill does AND when to use it (max 1024 chars)"
echo "This is critical - Claude uses this to decide when to invoke the skill"
echo ""
echo "Good example: 'Use when reviewing code for security vulnerabilities, performance"
echo "              issues, and best practices. Automatically checks for common bugs.'"
echo ""

while true; do
    prompt "Description" skill_description

    if [ -z "$skill_description" ]; then
        echo -e "${RED}Description cannot be empty${NC}"
        continue
    fi

    if validate_description "$skill_description"; then
        break
    fi
done

# Step 4: Choose scope (personal vs project)
echo ""
echo -e "${BLUE}Step 4: Skill Scope${NC}"
echo "1) Personal skill (~/.claude/skills/) - Available across all your projects"
echo "2) Project skill (.claude/skills/) - Shared with team, version controlled"
echo ""
prompt "Select scope (1-2)" skill_scope "2"

if [ "$skill_scope" = "1" ]; then
    SKILLS_DIR="$HOME/.claude/skills/$skill_name"
else
    SKILLS_DIR=".claude/skills/$skill_name"
fi

# Step 5: Tool restrictions
echo ""
echo -e "${BLUE}Step 5: Tool Restrictions (Optional)${NC}"
echo "Limit which tools Claude can use when executing this skill"
echo "Leave blank to allow all tools"
echo ""
echo "Available tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch"
echo "Example: Read, Grep, Glob (for read-only analysis skills)"
echo ""
prompt "Allowed tools (comma-separated, or blank for all)" allowed_tools ""

# Step 6: Model preference
echo ""
echo -e "${BLUE}Step 6: Model Preference (Optional)${NC}"
echo "1) Default (inherit from session)"
echo "2) Sonnet (balanced - good for most tasks)"
echo "3) Opus (most capable - complex reasoning)"
echo "4) Haiku (fast and efficient - simple tasks)"
echo ""
prompt "Select model (1-4)" model_choice "1"

case "$model_choice" in
    2) model="sonnet" ;;
    3) model="opus" ;;
    4) model="haiku" ;;
    *) model="" ;;
esac

# Step 7: Additional features based on skill type
include_scripts=false
include_materials=false

if [ "$skill_type" = "2" ] || [ "$skill_type" = "4" ]; then
    include_scripts=true
fi

if [ "$skill_type" = "3" ] || [ "$skill_type" = "4" ]; then
    include_materials=true
fi

# Create skill directory
echo ""
echo -e "${BLUE}Creating skill at: ${SKILLS_DIR}${NC}"
mkdir -p "$SKILLS_DIR"

# Create SKILL.md with frontmatter
cat > "$SKILLS_DIR/SKILL.md" << EOF
---
name: $skill_name
description: $skill_description
EOF

# Add optional frontmatter fields
if [ -n "$allowed_tools" ]; then
    echo "allowed-tools: $allowed_tools" >> "$SKILLS_DIR/SKILL.md"
fi

if [ -n "$model" ]; then
    echo "model: $model" >> "$SKILLS_DIR/SKILL.md"
fi

cat >> "$SKILLS_DIR/SKILL.md" << 'EOF'
---

# Skill Instructions

## Purpose

[Explain what this skill does and why it's useful]

## When to Use

This skill should be invoked when:
- [Trigger condition 1]
- [Trigger condition 2]
- [Trigger condition 3]

## Process

1. **Step 1**: [First action to take]
   - [Detail or substep]

2. **Step 2**: [Second action to take]
   - [Detail or substep]

3. **Step 3**: [Final action]
   - [Detail or substep]

## Output Format

[Describe what output or results this skill should produce]

## Best Practices

- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

## Examples

### Example 1: [Scenario name]

**Input**: [What the user provides]

**Process**: [How the skill handles it]

**Output**: [What the skill produces]

## Error Handling

- **[Error type]**: [How to handle]
- **[Error type]**: [How to handle]

## Notes

[Any additional context, warnings, or tips]
EOF

# Create supporting directories and files
if [ "$include_scripts" = true ]; then
    mkdir -p "$SKILLS_DIR/scripts"
    cat > "$SKILLS_DIR/scripts/example.sh" << 'EOF'
#!/bin/bash
# Example script for this skill
# Claude can execute this script when needed

echo "Script executed successfully"
EOF
    chmod +x "$SKILLS_DIR/scripts/example.sh"
    echo -e "${GREEN}✓ Created scripts/ directory with example script${NC}"
fi

if [ "$include_materials" = true ]; then
    mkdir -p "$SKILLS_DIR/materials"
    cat > "$SKILLS_DIR/materials/README.md" << 'EOF'
# Reference Materials

Place reference materials here:
- Templates
- Style guides
- Documentation
- Brand assets
- Data files
EOF
    echo -e "${GREEN}✓ Created materials/ directory${NC}"
fi

# Create .gitignore if needed
if [ "$skill_scope" = "2" ]; then
    cat > "$SKILLS_DIR/.gitignore" << 'EOF'
# Ignore local overrides and sensitive data
*.local.*
.env
secrets/
EOF
    echo -e "${GREEN}✓ Created .gitignore${NC}"
fi

# Create README for the skill
cat > "$SKILLS_DIR/README.md" << EOF
# $skill_name

$skill_description

## Installation

### Personal Installation
\`\`\`bash
# Copy to personal skills directory
cp -r . ~/.claude/skills/$skill_name
\`\`\`

### Project Installation
\`\`\`bash
# Already in .claude/skills/ - commit to git for team sharing
git add .claude/skills/$skill_name
git commit -m "Add $skill_name skill"
\`\`\`

## Usage

This skill is automatically invoked by Claude when relevant. You can also explicitly request it:

\`\`\`
Use the $skill_name skill to [describe task]
\`\`\`

## Testing

Test the skill by requesting tasks that match its description:

\`\`\`
[Example user request that should trigger this skill]
\`\`\`

## Configuration

Edit \`SKILL.md\` to customize:
- Description (when to invoke)
- Allowed tools
- Model preference
- Instructions

## Troubleshooting

### Skill Not Being Invoked

1. Check description includes clear trigger terms
2. Verify YAML frontmatter is valid
3. Restart Claude Code session
4. Use \`/skills\` to check if skill is loaded

### Permission Issues

If Claude asks for permission repeatedly, add tools to \`allowed-tools\` in frontmatter.

## Files

- \`SKILL.md\` - Main skill definition with frontmatter and instructions
$([ "$include_scripts" = true ] && echo "- \`scripts/\` - Executable scripts for automation")
$([ "$include_materials" = true ] && echo "- \`materials/\` - Reference materials and templates")
- \`README.md\` - This file

## License

[Add your license here]
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Skill created successfully!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Edit the skill instructions:"
echo -e "   ${YELLOW}$SKILLS_DIR/SKILL.md${NC}"
echo ""
echo "2. Test the skill:"
echo "   - Restart Claude Code"
echo "   - Request a task matching the description"
echo "   - Run: /skills (to verify it's loaded)"
echo ""
echo "3. Refine the description if Claude doesn't invoke it automatically"
echo ""

if [ "$include_scripts" = true ]; then
    echo "4. Add your scripts to:"
    echo -e "   ${YELLOW}$SKILLS_DIR/scripts/${NC}"
    echo ""
fi

if [ "$include_materials" = true ]; then
    echo "5. Add reference materials to:"
    echo -e "   ${YELLOW}$SKILLS_DIR/materials/${NC}"
    echo ""
fi

if [ "$skill_scope" = "2" ]; then
    echo -e "${BLUE}Git Integration:${NC}"
    echo "  git add $SKILLS_DIR"
    echo "  git commit -m 'Add $skill_name skill'"
    echo ""
fi

echo -e "${BLUE}Documentation:${NC}"
echo "  View: $SKILLS_DIR/README.md"
echo ""
echo -e "${GREEN}Happy skill building! 🚀${NC}"
