# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Repository Purpose

This is the **claude-starter** repository - a template/starter kit for Claude Code configuration. It contains production-ready `.claude/` configuration that users copy into their projects. This is NOT an application to run, but a collection of reusable Claude Code components.

**Key features:**
- Automated setup script with framework detection
- 6 preset configurations for common stacks
- Environment template system
- Interactive configuration wizard
- Self-validation and health checking

## Quick Start (2 Minutes)

New to claude-starter? Start here:

**Essential Commands:**
- `/commit` - Generate conventional commit messages
- `/create-pr` - Auto-generate PR title/description
- `/build-safe` - Type-safe build validation
- `/enable-hook` - Enable quality automation

**Key Patterns:**
- **Core vs Examples**: Core (always on) vs Examples (opt-in)
- **Enable features**: `cp -r .claude/examples/skills/next .claude/core/skills/`
- **Settings**: `.claude/settings.json` (hooks disabled by default)
- **Validate**: `./quick-validate.sh` (verify setup works)

**Common Tasks:**
- [Add new skill](#adding-a-new-skill)
- [Enable hooks](#enabling-optional-features)
- [Test changes](#testing-changes)
- [Component structure](#architecture)

**Deep Dive (by topic):**
- [Architecture](#architecture) - Two-tier structure, component types
- [Development Patterns](#development-patterns) - Skill, command, agent creation
- [File Organization](#file-organization) - Directory structure
- [Testing](#testing-changes) - Validation workflows

---

## Architecture

### Two-Tier Structure: Core vs Examples

The architecture follows an **opt-in philosophy**:

- **`.claude/core/`** - Essential components enabled by default (minimal, always active)
- **`.claude/examples/`** - Optional components users copy as needed (~50+ features)
- **`setup.sh`** - Automated setup script (framework detection, presets, interactive mode)
- **`.claude/presets/`** - Predefined configurations for common stacks
- **`.env.example`** - Environment template with all integrations

Users have three setup paths:
1. **Automated** - Run `./setup.sh --interactive` for guided setup
2. **Preset** - Run `./setup.sh --preset <name>` for instant configuration
3. **Manual** - Copy `.claude/` and configure by hand

Core components work immediately. Optional features are enabled via setup script or manual copy from `examples/` to `core/`.

### Component Types

**Agents** (`.claude/{core,examples}/agents/*.md`):
- YAML frontmatter defines name, description, triggers
- Auto-invoked based on description keywords
- Markdown files with procedural instructions
- 3 core agents (always enabled) + 6 example agents (optional)

**Commands** (`.claude/{core,examples}/commands/*.md`):
- Markdown files invoked as `/command-name`
- Procedural instructions for Claude to execute
- Step-by-step bash commands with validation
- 9 core commands (always available) + 7 example commands (optional)

**Skills** (`.claude/examples/skills/*/skill.md`):
- Specialized knowledge domains with YAML frontmatter
- Auto-invoked when user mentions framework/library
- Organized by technology stack
- 39 skills across 12 categories

**Hooks** (`.claude/examples/hooks/*.ts`):
- TypeScript files that run after tool use (PostToolUse event)
- Quality automation: linting, security, architecture checks
- Configured in `.claude/settings.json`
- 10 hooks + 2 utility files (cache, config)

## Component Inventory Summary

**Core (Always Enabled):**
- 3 agents: `security-auditor`, `database-architect`, `api-builder`
- 9 commands: `/build-safe`, `/commit`, `/create-pr`, `/release`, `/sync-types`, `/db-migrate`, `/health-check`, `/enable-hook`, `/self-test`

**Optional (Examples):**
- 6 agents: `type-generator`, `use-effect-less`, `plaid-expert`, `writer`, `chief-of-staff`, `research-agent`
- 7 commands: `/clear-cache`, `/use-effect-less`, `/review-pr`, `/code-review`, `/link-review`, `/model-check`, `/new-agent`
- 39 skills: Next.js (8), React (2), Stripe (5), Supabase (1), D3 (5), Bun (5), Shelby (4), DevOps (3), Tools (3), Meta (1), Other (2)
- 10 hooks: `check_after_edit`, `security_scan`, `code_quality`, `architecture_check`, `react_quality`, `accessibility`, `import_organization`, `bundle_size_check`, `advanced_analysis`, `gwern-checklist`

**Infrastructure:**
- 3 GitHub workflows: `ci.yml`, `deploy.yml`, `release.yml`
- 12 documentation files in `.claude/docs/`
- 2 output style patterns
- 6 preset configurations

*For complete component details, use Glob/Grep to explore `.claude/core/` and `.claude/examples/` directories.*

## Configuration Philosophy

**Minimal by default, maximum flexibility:**

1. **Core components** - Framework-agnostic, work with any stack
2. **Examples** - Framework-specific expertise (Next.js, React, Stripe, etc.)
3. **Enable by copying** - `cp -r examples/skills/next core/skills/`
4. **Settings minimal** - Hooks disabled by default in `.claude/settings.json`

### Settings Pattern

Default `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": []
  },
  "comment": "Minimal starter. Copy from examples/ as needed."
}
```

Enable hooks by updating settings:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/security_scan.ts"
      }]
    }]
  }
}
```

## Development Patterns

### Skill Creation Pattern

Reference: `.claude/examples/skills/meta/skill-builder/skill.md`

```markdown
---
name: skill-name
description: Clear WHAT and WHEN to invoke (critical for auto-invocation)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# Skill Name

## Purpose
[What it does]

## When to Use
- Specific trigger 1
- Specific trigger 2

## Process
1. Step 1
2. Step 2

## Examples
[Real-world scenarios]
```

**Critical:** The `description` field determines when Claude invokes the skill. Include specific keywords users will say.

### Command Creation Pattern

Commands are procedural markdown:

```markdown
Command description and usage

Usage: /command-name [args]

Execute the following workflow:

1. **Step Name**
   ```bash
   # Commands to run
   git status
   ```
   - Validation checks
   - Error handling

2. **Next Step**
   ...
```

### Agent Creation Pattern

Agents are like skills but with different invocation:

```markdown
---
name: agent-name
description: When to invoke (keywords that trigger agent)
---

# Agent Name

[Procedural instructions for Claude to follow]
```

### Hook Creation Pattern

Hooks are TypeScript files that export validation logic:

```typescript
// .claude/examples/hooks/example.ts
export async function validate(context) {
  // Check for issues
  if (issue) {
    return {
      level: 'error',
      message: 'Issue description'
    }
  }
}
```

### Component Size and Structure Standards

**Critical Rule**: Keep components focused and maintainable by enforcing size limits and proper separation of concerns.

#### Agent Files (<500 lines)

**Maximum**: 500 lines per agent file
**Rationale**: Agents are loaded into context on every invocation - excessive size impacts performance

**Structure**:
- Agent file: Operational patterns and decision trees only
- Reference docs: Detailed examples, API references, migration guides

**Example**: `api-builder.md`
- Agent: 456 lines (patterns, templates, checklists)
- Reference: 626 lines (`.claude/core/agents/docs/api-builder-ref.md`)

**When to split**:
- Agent file exceeds 500 lines
- Contains extensive reference material
- Has detailed migration guides or API documentation

**Pattern**:
```yaml
---
name: agent-name
description: [...]
---

**Reference Documentation:** `.claude/core/agents/docs/agent-name-ref.md`

[Operational instructions only - decision trees, templates, key patterns]

## Advanced Patterns

For detailed reference on [topics], see reference documentation.
```

#### Skill Files (<900 lines)

**Maximum**: 900 lines per skill file
**Warning threshold**: 600 lines (skill is acceptable but consider refactoring)
**Rationale**: Skills should be focused and comprehensive while remaining maintainable

**When to split**:
- Skill exceeds 900 lines
- Covers multiple distinct use cases that could be separated
- Contains extensive examples that could be externalized

**Solution**: Create focused sub-skills or extract extensive examples to separate documentation

#### Command Files (<250 lines)

**Maximum**: 250 lines per command file
**Rationale**: Commands should be concise workflows, not scripts

**Structure**:
- Workflow description
- Step-by-step instructions
- Example output format
- Auto-fix guidance (if applicable)

**When exceeding**:
- Extract verbose bash scripts to helper scripts
- Create workflow summary with step references
- Move detailed examples to documentation

#### Documentation Files

**Guidelines**:
- Max 400 lines per doc file
- Split comprehensive guides into focused topics
- Eliminate redundancy across files
- Use progressive disclosure (essential → advanced)

**Structure**:
- README: Overview + quick links (< 100 lines)
- Quick start: Installation + basic usage (< 150 lines)
- Customization: Configuration + extension (< 400 lines)
- Reference: Detailed API/patterns (separate files)

#### Monitoring Size Compliance

**During development**:
```bash
# Check agent sizes
find .claude/core/agents -name "*.md" -not -path "*/docs/*" -exec wc -l {} \; | awk '$1 > 500 {print "⚠️ "$2" exceeds 500 lines ("$1")"}'

# Check skill sizes
find .claude/examples/skills -name "skill.md" -o -name "SKILL.md" | xargs wc -l | awk '$1 > 900 {print "⚠️ "$2" exceeds 900 lines ("$1")"}'

# Check command sizes
find .claude/core/commands -name "*.md" -exec wc -l {} \; | awk '$1 > 250 {print "⚠️ "$2" exceeds 250 lines ("$1")"}'
```

**In CI/CD** (optional):
```yaml
# .github/workflows/validate-components.yml
- name: Validate component sizes
  run: |
    ./scripts/validate-component-sizes.sh
```

## File Organization

```
claude-starter/
├── setup.sh                   # Automated setup script
├── .env.example              # Environment template
│
├── .claude/
│   ├── core/                 # Always enabled
│   │   ├── agents/          # 3 core agents
│   │   └── commands/        # 9 core commands
│   ├── examples/             # Optional components
│   │   ├── agents/          # 6 example agents
│   │   ├── commands/        # 7 example commands
│   │   ├── skills/          # 39 skills across 12 categories
│   │   ├── hooks/           # 10 quality automation hooks + 2 utilities
│   │   └── patterns/        # 2 output style patterns
│   ├── presets/              # 6 preset configurations
│   ├── docs/                # 12 documentation files
│   ├── plugin/              # 2 plugin config files
│   ├── scripts/             # 1 verification script
│   └── settings.json       # Minimal configuration
│
└── .github/
    ├── workflows/           # 3 CI/CD workflows
    ├── CODEOWNERS          # Reviewer assignment
    └── pull_request_template.md
```

## Common Development Tasks

### Adding a New Skill

```bash
# 1. Create skill directory
mkdir -p .claude/examples/skills/category/skill-name

# 2. Create skill.md with YAML frontmatter
cat > .claude/examples/skills/category/skill-name/skill.md << 'EOF'
---
name: skill-name
description: What it does and when to invoke
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---
# Skill Name
[Content...]
EOF

# 3. Update .claude/examples/README.md to list the skill
```

### Enabling Optional Features

**Automated (recommended):**
```bash
./setup.sh --interactive
# or
./setup.sh --stack stripe,supabase

# Enable hooks
/enable-hook quality-focused
```

**Manual:**
```bash
# Enable a skill
cp -r .claude/examples/skills/stripe .claude/core/skills/

# Enable a hook
/enable-hook security_scan
```

## Testing Changes

Since this is a template, test by:

1. **Test setup script**: `./setup.sh --help`
2. **Test preset application**: `./setup.sh --preset minimal`
3. **Test core commands**: `/build-safe`, `/commit`, `/self-test`
4. **Test agents**: Trigger with relevant keywords
5. **Test skills**: Mention framework names
6. **Validate setup**: `/self-test`

## Important Conventions

### Naming
- **Agents**: `lowercase-with-hyphens.md`
- **Commands**: `lowercase-with-hyphens.md` (invoked as `/command-name`)
- **Skills**: Directory `skill-name/` with `skill.md` inside
- **Hooks**: `snake_case.ts`

### YAML Frontmatter (Skills/Agents)
```yaml
---
name: skill-name               # Required, lowercase-with-hyphens
description: What and when     # Required, critical for invocation
allowed-tools: [list]         # Optional, restricts tool access
model: sonnet                  # Optional, sonnet/opus/haiku
---
```

### Conventional Commits
All commits in this repo follow:
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ci`, `chore`

## Key Files Reference

| File | Purpose |
|------|---------|
| `README.md` | Main user documentation, features, installation |
| `CLAUDE.md` | This file - development guide for Claude instances |
| `.claude/settings.json` | Minimal configuration (hooks disabled) |
| `.claude/core/` | Always-enabled components (agents, commands) |
| `.claude/examples/` | Opt-in library (skills, hooks, patterns) |
| `.gitignore` | Excludes .claude/settings.local.json, node_modules, etc. |

## Git Workflow Automation

Recently added comprehensive git automation (Nov 2024):

**Commands Added:**
- `/commit` - Analyzes staged changes, generates conventional commit messages
- `/create-pr` - Auto-generates PR title/description from commits, links issues, adds labels
- `/release` - Semantic versioning, changelog generation, GitHub releases, npm publishing

**Skills Added:**
- `github-actions-architect` - Generate CI/CD workflow files with best practices
- `git-hooks-architect` - Configure Husky, lint-staged, commitlint
- `vercel-deploy-architect` - Vercel deployment configuration and optimization

All git automation uses **conventional commits** format.

## Token Optimization Features

### MCP Optimization
- **Location**: `.claude/examples/skills/tools/mcp-optimization/`
- **Savings**: 98%+ reduction (150K → 2K tokens)
- **Source**: [Anthropic, Nov 2024](https://www.anthropic.com/engineering/code-execution-with-mcp)
- **Patterns**: Progressive tool loading, context-efficient filtering, privacy-preserving workflows

### TOON Format
- **Location**: `.claude/utils/toon/` and `.claude/docs/toon/`
- **Savings**: 40-60% reduction for structured data
- **Use cases**: Claude API context optimization, large dataset exports
- **Documentation**: See `.claude/docs/toon/README.md` for complete guide

## References for Common Patterns

- **Skill template**: `.claude/examples/skills/meta/skill-builder/skill.md`
- **Command template**: `.claude/core/commands/commit.md` (well-structured example)
- **Agent template**: `.claude/core/agents/security-auditor.md`
- **Hook template**: `.claude/examples/hooks/security_scan.ts`
- **Workflow template**: `.github/workflows/ci.yml`
- **Settings example**: `.claude/examples/hooks/README.md` (shows configuration)

---

**For detailed component listings, FAQs, and advanced features, explore the filesystem using Glob/Grep or read the inline documentation in each component file.**
