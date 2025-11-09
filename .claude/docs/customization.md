# Customization Guide

Extend and configure Claude Starter Kit for your stack.

## Philosophy

- **core/** - Essential components (always enabled)
- **examples/** - Optional features (enable as needed)
- **presets/** - Predefined configurations
- **setup.sh** - Automated configuration

## Quick Setup

```bash
# Interactive with guided questions
./setup.sh --interactive

# Use a preset
./setup.sh --preset nextjs-full
./setup.sh --preset fullstack-saas

# Select specific technologies
./setup.sh --stack next,stripe,supabase

# Preview without changes
./setup.sh --check --preset fullstack-saas

# Auto-detect from package.json
./setup.sh
```

## Adding Components

### Automated Method

```bash
# Skills
./setup.sh --stack next,stripe,d3

# Hooks
/enable-hook quality-focused
/enable-hook security-focused
```

### Manual Method

```bash
# Enable an agent
cp examples/agents/type-generator.md core/agents/

# Enable skills
cp -r examples/skills/next core/skills/
cp -r examples/skills/stripe core/skills/

# Enable hooks (edit settings.json)
```

## Custom Components

### Custom Agent

Create `.claude/core/agents/my-agent.md`:

```yaml
---
name: my-agent
description: Use when [trigger]. Handles [capabilities].
tools: Read, Write, Edit, Bash, Grep
model: sonnet
---

## Purpose

What this agent does and when to use it.

## Capabilities

- Capability 1
- Capability 2

## Patterns

Best practices this agent follows.
```

### Custom Skill

Create `.claude/core/skills/my-skill/skill.md`:

```yaml
---
name: my-skill
description: Auto-invoked when [trigger]. Used for [use cases].
---

## When to Use

Describe when this skill should activate.

## Instructions

Detailed instructions for Claude.

## Examples

Show usage examples.
```

### Custom Command

Create `.claude/core/commands/my-command.md`:

```markdown
---
description: What this command does
---

# Implementation

Instructions for Claude to execute.

Use:
- Bash commands
- File operations
- Agent calls
- Workflows
```

## Configuring Hooks

### Enable Hooks

Edit `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/check_after_edit.ts"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/security_scan.ts"
          }
        ]
      }
    ]
  }
}
```

### Configure Thresholds

Edit `examples/hooks/config.ts`:

```typescript
export const config = {
  quality: {
    maxFileLines: 500,
    maxFunctionLines: 50,
    maxCyclomaticComplexity: 15,
  },
  security: {
    failOnCritical: true,
    failOnHigh: false,
  },
  accessibility: {
    checkWCAG: true,
    level: "AA",
  },
};
```

## Available Presets

| Preset | Components | Use Case |
|--------|-----------|----------|
| minimal | Core only (3 agents, 9 commands) | Framework-agnostic projects |
| nextjs-full | Next.js (8) + React (2) skills | Complete Next.js development |
| stripe-commerce | Next.js + React + Stripe skills | E-commerce platform |
| fullstack-saas | Next.js + React + Stripe + Supabase + DevOps | Production SaaS |
| react-focused | React skills + use-effect-less agent | React optimization |
| devops-complete | GitHub Actions + git hooks + Vercel | CI/CD automation |

### Creating Custom Presets

Create `.claude/presets/my-preset.json`:

```json
{
  "name": "my-preset",
  "description": "Custom configuration",
  "skills": ["next", "stripe", "d3"],
  "agents": [],
  "commands": [],
  "hooks": ["security_scan", "code_quality"],
  "env": {
    "FRAMEWORK": "nextjs",
    "ENABLE_STRIPE": "true"
  }
}
```

Apply: `./setup.sh --preset my-preset`

## Environment Configuration

```bash
# After setup
cp .env.example .env
# Edit with your values
```

### Required Variables

**Stripe:**
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

**Supabase:**
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

**Vercel:**
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

Validate: `/self-test`

## Best Practices

### Start Minimal

Don't enable everything. Start with core, add as needed.

### Enable by Framework

For Next.js:
```bash
./setup.sh --stack next,react
```

### Selective Hooks

Enable only what you need:

- **Always useful**: security_scan, check_after_edit
- **Team projects**: code_quality, architecture_check
- **Accessibility**: accessibility
- **React projects**: react_quality

### Version Control

**Gitignore:**
```
.claude/settings.local.json
.claude/**/.cache/
.claude/**/*.log
```

**Commit:**
```
.claude/core/
.claude/settings.json
```

## Troubleshooting

**Changes not taking effect**
- Restart Claude Code
- Clear cache: `rm -rf .claude/.cache`

**Conflicts between components**
- Check unique agent names
- Verify skill descriptions don't overlap
- Review hook ordering

**Performance issues**
- Reduce enabled hooks
- Use lighter model (haiku) for simple agents
- Disable unused skills

## Project-Specific Configuration

Create `.claude/CLAUDE.md`:

```markdown
# Project Memory

## Architecture
Describe patterns.

## Development Workflow
Common commands.

## Quality Standards
Requirements.
```

This persists context across Claude Code sessions.

## More Information

- [Quick Start](quickstart.md) - Installation
- [Workflows](workflows.md) - Git automation
- [Contributing](development/CONTRIBUTING.md) - How to contribute
