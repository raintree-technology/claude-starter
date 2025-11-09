# Skill Builder Quick Start

Get started building Claude Code skills in 5 minutes.

## 1. Build Your First Skill (2 minutes)

```bash
cd skill-builder
./build-skill.sh
```

Follow the prompts:
- **Skill type**: Choose 1 (Simple) for your first skill
- **Name**: Use lowercase-with-hyphens (e.g., `my-helper`)
- **Description**: Explain what it does AND when to use it
- **Scope**: Choose 2 (Project) to share with your team
- **Tools**: Press Enter to allow all tools
- **Model**: Choose 1 (Default)

## 2. Edit the Skill (2 minutes)

The builder created a template. Now customize it:

```bash
# Open the SKILL.md file
code .claude/skills/my-helper/SKILL.md
# or
vim .claude/skills/my-helper/SKILL.md
```

Fill in:
1. **Purpose**: What does this skill accomplish?
2. **When to Use**: List 3-5 specific trigger conditions
3. **Process**: Step-by-step workflow
4. **Examples**: At least 1 concrete example

## 3. Validate It (30 seconds)

```bash
./utils/validate-skill.sh .claude/skills/my-helper
```

Fix any errors or warnings shown.

## 4. Test It (30 seconds)

```bash
# Restart Claude Code
claude

# In Claude, request something matching your description
# Example: If your skill is for API building:
"Create a REST API endpoint for user registration"
```

## 5. Refine It (Optional)

If Claude doesn't invoke your skill automatically:

1. Make the description more specific
2. Add trigger keywords users would naturally say
3. Restart Claude Code
4. Test again

## Example: Creating a "Bug Finder" Skill

```bash
./build-skill.sh

# Prompts:
# Type: 1
# Name: bug-finder
# Description: Use when searching for bugs, common errors, or code issues. Identifies null checks, error handling problems, and edge cases.
# Scope: 2
# Tools: Read, Grep, Glob
# Model: 2 (Sonnet)
```

Then edit `.claude/skills/bug-finder/SKILL.md` and add:

```markdown
## When to Use

This skill should be invoked when:
- User asks "find bugs" or "check for errors"
- Reviewing code for issues
- Looking for null pointer errors
- Checking error handling
- Finding edge case problems

## Process

1. Scan for null/undefined checks
2. Verify error handling in try-catch
3. Check array bounds
4. Look for division by zero
5. Find unhandled promise rejections
```

Save, validate, and test!

## Common Patterns

### Read-Only Analysis Skill
```yaml
allowed-tools: Read, Grep, Glob
```

### Code Generation Skill
```yaml
# Needs to create/modify files
# Omit allowed-tools or include: Read, Write, Edit
```

### Script-Based Automation
```yaml
allowed-tools: Bash, Read
```

## Need Help?

- Read the full [README.md](./README.md)
- Check [templates/](./templates/) for examples
- View [examples/](./examples/) for complete skills
- See [official docs](../docs/claude/skills/overview.md)

## Next Steps

1. Create a few skills for your common tasks
2. Share project skills with your team via git
3. Use templates as starting points
4. Build complex skills with scripts and materials

Happy skill building! 🚀
