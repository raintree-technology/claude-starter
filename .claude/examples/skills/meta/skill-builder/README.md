# Claude Code Skill Builder

A comprehensive toolkit for creating professional Claude Code skills based on official documentation and best practices.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Tools](#tools)
- [Templates](#templates)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The Skill Builder helps you create well-structured, production-ready skills for Claude Code. Skills are model-invoked capabilities that Claude automatically uses when relevant to the task at hand.

### What are Skills?

From the official Claude Code documentation:

- **Skills** are modular, organized folders containing instructions, scripts, and resources
- **Model-invoked**: Claude autonomously decides when to use them based on their description
- **Three types**: Personal (`~/.claude/skills/`), Project (`.claude/skills/`), and Plugin skills

## Features

- **Interactive Builder**: Step-by-step CLI wizard for creating skills
- **Templates**: Pre-built templates for common skill types
- **Validation**: Automated validation against official requirements
- **Best Practices**: Built-in checks for descriptions, naming, and structure
- **Examples**: Ready-to-use example skills

## Quick Start

### 1. Build a New Skill

```bash
cd skill-builder
./build-skill.sh
```

The interactive wizard will guide you through:
1. Choosing skill type (simple, with scripts, with materials, or complex)
2. Naming your skill (lowercase-with-hyphens, max 64 chars)
3. Writing an effective description (what it does + when to use it)
4. Selecting scope (personal or project)
5. Configuring tool restrictions (optional)
6. Setting model preference (optional)

### 2. Validate Your Skill

```bash
./utils/validate-skill.sh ~/.claude/skills/my-skill
```

The validator checks:
- YAML frontmatter syntax
- Required fields (name, description)
- Field format and length limits
- File structure
- Common best practices

### 3. Test Your Skill

1. Restart Claude Code to load the new skill
2. Request a task matching the skill's description
3. Run `/skills` to verify it's loaded
4. Refine the description if Claude doesn't invoke it automatically

## Tools

### build-skill.sh

Interactive skill builder that creates a complete skill structure.

**Usage:**
```bash
./build-skill.sh
```

**What it creates:**
- `SKILL.md` with proper frontmatter and instructions template
- `README.md` with usage documentation
- `scripts/` directory (if requested)
- `materials/` directory (if requested)
- `.gitignore` for project skills

### validate-skill.sh

Validates skills against official Claude Code requirements.

**Usage:**
```bash
./utils/validate-skill.sh <path-to-skill>
```

**What it checks:**
- ✓ SKILL.md file exists
- ✓ Valid YAML frontmatter
- ✓ Required fields present (name, description)
- ✓ Name format (lowercase, hyphens, max 64 chars)
- ✓ Description length (max 1024 chars)
- ✓ Description includes usage context
- ✓ Valid tool names
- ✓ Valid model selection
- ✓ Instruction content present
- ✓ Supporting files structure

## Templates

Pre-built templates for common skill types:

### code-reviewer.md
Reviews code for security, performance, and quality issues.

**Use case**: Pull request reviews, security audits, code quality checks

**Tools**: Read, Grep, Glob (read-only)

### api-builder.md
Creates REST or GraphQL API endpoints with proper validation and error handling.

**Use case**: Building new endpoints, implementing APIs, adding authentication

**Tools**: All (needs to create files)

### test-generator.md
Generates comprehensive test suites with edge cases and mocks.

**Use case**: Writing unit tests, integration tests, improving coverage

**Tools**: Read, Write, Edit, Grep, Glob

### documentation-writer.md
Creates technical documentation, READMEs, and API docs.

**Use case**: Project documentation, API docs, developer guides

**Tools**: Read, Write, Edit, Grep, Glob

### Using Templates

Copy a template to start with a pre-configured skill:

```bash
# Create from template
cp templates/code-reviewer.md ~/.claude/skills/my-reviewer/SKILL.md

# Edit and customize
$EDITOR ~/.claude/skills/my-reviewer/SKILL.md
```

## Best Practices

Based on official Claude Code documentation:

### 1. Write Effective Descriptions

**Critical**: The description determines when Claude invokes your skill.

✅ **Good:**
```yaml
description: Use when reviewing code for security vulnerabilities, performance issues, and best practices. Automatically checks for common bugs.
```

❌ **Bad:**
```yaml
description: Reviews code
```

**Tips:**
- Explain WHAT the skill does
- Explain WHEN to use it
- Include trigger keywords
- Be specific about the use case
- Keep under 1024 characters

### 2. Name Your Skill Properly

**Rules:**
- Lowercase only
- Use hyphens for spaces
- Max 64 characters
- Descriptive and clear

**Examples:**
- `code-reviewer`
- `api-builder`
- `test-generator`
- `database-migration-helper`

### 3. Structure Your Instructions

Include these sections in SKILL.md:

1. **Purpose**: What the skill does and why it's useful
2. **When to Use**: Specific trigger conditions
3. **Process**: Step-by-step workflow
4. **Output Format**: What results to produce
5. **Best Practices**: Guidelines for using the skill
6. **Examples**: Concrete usage scenarios
7. **Error Handling**: How to handle common issues

### 4. Use Tool Restrictions Wisely

Limit tools for security-sensitive workflows:

```yaml
# Read-only analysis skill
allowed-tools: Read, Grep, Glob

# Can modify files
allowed-tools: Read, Write, Edit

# Full access (omit field)
# allowed-tools:
```

### 5. Choose the Right Scope

**Personal Skills** (`~/.claude/skills/`)
- Experimental capabilities
- Individual workflows
- Personal preferences

**Project Skills** (`.claude/skills/`)
- Team-shared
- Version controlled
- Standardized processes

## Examples

### Example 1: Security Auditor

```bash
./build-skill.sh
# Follow prompts:
# Type: 1 (Simple)
# Name: security-auditor
# Description: Use when auditing code for security vulnerabilities including SQL injection, XSS, CSRF, and authentication issues.
# Scope: 2 (Project)
# Tools: Read, Grep, Glob
# Model: 2 (Sonnet)
```

### Example 2: Database Migration Generator

```bash
./build-skill.sh
# Follow prompts:
# Type: 2 (With scripts)
# Name: db-migration-generator
# Description: Use when creating database migration files. Generates SQL migrations with proper up/down scripts and safety checks.
# Scope: 2 (Project)
# Tools: (leave blank for all)
# Model: 1 (Default)
```

### Example 3: Brand Style Checker

```bash
./build-skill.sh
# Follow prompts:
# Type: 3 (With materials)
# Name: brand-style-checker
# Description: Use when checking content for brand voice and style guide compliance. Ensures consistent terminology and tone.
# Scope: 1 (Personal)
# Tools: Read, Grep
# Model: 2 (Sonnet)

# Then add brand guidelines to materials/
```

## Troubleshooting

### Skill Not Being Invoked

**Problem**: Claude doesn't use your skill automatically

**Solutions:**
1. Check description includes clear trigger words
2. Restart Claude Code session
3. Run `/skills` to verify skill is loaded
4. Test with explicit request: "Use the [skill-name] skill to..."
5. Refine description to be more specific

### YAML Parsing Errors

**Problem**: "Invalid frontmatter" error

**Solutions:**
1. Check for proper `---` delimiters
2. Ensure proper YAML syntax (no tabs, proper spacing)
3. Quote strings with special characters
4. Run validation: `./utils/validate-skill.sh path/to/skill`

### Permission Prompts

**Problem**: Claude asks for permission repeatedly

**Solutions:**
1. Add tools to `allowed-tools` in frontmatter
2. Use `/permissions` to allow specific tools
3. Consider if skill really needs those tools

### Invalid Tool Names

**Problem**: Validation fails on tool names

**Valid tools:**
- Read, Write, Edit
- Bash, Grep, Glob
- WebFetch, WebSearch
- Task, Skill, SlashCommand
- NotebookEdit

### Skill Name Conflicts

**Problem**: Multiple skills with same name

**Solutions:**
1. Project skills override personal skills
2. Use namespacing: `team-code-reviewer` vs `personal-code-reviewer`
3. Check with: `find ~/.claude/skills .claude/skills -name "SKILL.md"`

## File Structure

```
skill-builder/
├── build-skill.sh          # Interactive skill builder
├── README.md               # This file
├── templates/              # Pre-built skill templates
│   ├── code-reviewer.md
│   ├── api-builder.md
│   ├── test-generator.md
│   └── documentation-writer.md
├── utils/                  # Validation and helper tools
│   └── validate-skill.sh
└── examples/               # Example skills
    └── (coming soon)
```

## Resources

### Official Documentation

- [Skills Overview](../docs/claude/skills/overview.md)
- [Create Skills Through Conversation](../docs/claude/tutorials/create-skill-through-conversation.md)
- [Hooks Documentation](../docs/claude/hooks/overview.md)
- [Settings Documentation](../docs/claude/api/settings.md)

### Related Tools

- `/skills` - View loaded skills in Claude Code
- `/agents` - Manage subagents (different from skills)
- `/memory` - Edit CLAUDE.md files
- `/permissions` - Manage tool access

## Contributing

To add new templates or improve the builder:

1. Add templates to `templates/` directory
2. Update this README with template description
3. Test with validator
4. Submit improvements

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Claude Code community**

For issues or suggestions, see: https://github.com/anthropics/claude-code/issues
