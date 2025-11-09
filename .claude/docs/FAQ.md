# Frequently Asked Questions

Advanced features and detailed explanations for the Claude Starter Kit.

## Table of Contents

- [Why are commands markdown files instead of executable scripts?](#why-are-commands-markdown-files-instead-of-executable-scripts)
- [Skill Builder: YAML Frontmatter Auto-Generation](#skill-builder-yaml-frontmatter-auto-generation)
- [Hook Caching: Persistence and Cache Management](#hook-caching-persistence-and-cache-management)
- [Multi-Agent Coordination Patterns](#multi-agent-coordination-patterns)
- [Conventional Commits: Pre-Commit Hook Enforcement](#conventional-commits-pre-commit-hook-enforcement)
- [Skill Conflicts: Priority and Resolution](#skill-conflicts-priority-and-resolution)

---

## Why are commands markdown files instead of executable scripts?

**Short answer:** Claude Code commands are instructions for Claude, not shell scripts.

**How it works:**
- You type `/commit` in Claude Code
- Claude reads `.claude/core/commands/commit.md`
- Claude follows the instructions in that file
- Claude executes bash commands, reads files, edits code as instructed

**Why this design?**
- **Flexibility**: Claude can adapt to your codebase structure
- **Intelligence**: Claude makes context-aware decisions (e.g., what files to commit)
- **Context-aware**: Claude sees your full project state and history
- **Natural language**: Commands can include complex logic written in plain English

**For executable validation:**
- Use `./quick-validate.sh` (wrapper for `.claude/scripts/verify.sh`)
- This is an actual bash script you can run directly
- Scripts in `.claude/scripts/` are executable utilities

**Pattern:**
- **Commands** (`.claude/*/commands/*.md`): Instructions for Claude to follow (markdown)
- **Scripts** (`.claude/scripts/*.sh`): Executable bash files for automation
- **Hooks** (`.claude/examples/hooks/*.ts`): TypeScript files that run automatically

**Example:**
```bash
# This won't work (commands aren't scripts):
$ .claude/core/commands/commit.md
bash: permission denied

# Instead, use in Claude Code:
# Type: /commit
# Claude reads the markdown and executes the workflow

# For validation, use actual scripts:
$ ./quick-validate.sh
✓ Settings valid
✓ All core files present
...
```

---

## Skill Builder: YAML Frontmatter Auto-Generation

The `skill-builder` meta-skill (`.claude/examples/skills/meta/skill-builder/skill.md`) **does** generate YAML frontmatter automatically when creating new skills:

```yaml
---
name: skill-name
description: Clear description of what and when (critical for auto-invocation)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---
```

**Key capabilities:**
- Auto-generates name from user's request
- Creates description with invocation triggers
- Sets up directory structure (`category/skill-name/skill.md`)
- Includes README.md with installation instructions
- Provides example content based on skill type (code-reviewer, api-builder, test-generator, etc.)

**Usage:** Mention "create a skill for X" and the skill-builder automatically activates.

---

## Hook Caching: Persistence and Cache Management

The hook caching system (`.claude/examples/hooks/cache.ts`) provides performance optimization:

### Cache Persistence

- **Cache location**: `.claude/examples/hooks/.cache/` (file-based)
- **TTL (Time To Live)**: Configurable per hook in `.claude/examples/hooks/config.ts`
- **Default TTL**: 5 minutes for most checks, 1 hour for expensive operations
- **Persistence**: Survives Claude Code restarts (persisted to disk)

### Cache Key Structure

```typescript
cacheKey = hash(filePath + fileContent + hookName + hookVersion)
```

### Clearing Cache

- **Manual**: Delete `.claude/examples/hooks/.cache/` directory
- **Programmatic**: Use `cache.clear()` in hooks
- **Note**: The `/clear-cache` command (`.claude/examples/commands/clear-cache.md`) clears build caches (node_modules/.cache, .next, etc.), not hook caches

### Cache Invalidation

- File content changes → new hash → cache miss
- Hook version changes → cache miss
- TTL expires → cache miss

---

## Multi-Agent Coordination Patterns

The `chief-of-staff` and `research-agent` demonstrate multi-agent patterns:

### Pattern 1: Hierarchical Delegation (chief-of-staff)

```
Chief Agent
├── Financial Analyst Sub-Agent (budget analysis)
├── Recruiter Sub-Agent (hiring workflows)
└── Coordinator (orchestrates sub-agents)
```

### Pattern 2: Research Coordination (research-agent)

```
Research Lead
├── Define research questions
├── Spawn specialized researchers
├── Aggregate findings
└── Synthesize report
```

### Coordination Mechanisms

1. **Explicit handoffs**: Main agent delegates specific tasks
2. **Context sharing**: Sub-agents receive scoped context
3. **Result aggregation**: Main agent synthesizes outputs
4. **Sequential execution**: Sub-agents run in order, each building on previous results

**Documentation location:** See agent markdown files for detailed workflows:
- `.claude/examples/agents/chief-of-staff/`
- `.claude/examples/agents/research-agent/`

---

## Conventional Commits: Pre-Commit Hook Enforcement

**Yes, there is enforcement available** through the `git-hooks-architect` skill:

### Setup Process

1. Enable git-hooks skill: `cp -r .claude/examples/skills/devops/git-hooks-architect .claude/core/skills/`
2. Ask Claude: "Set up git hooks with commitlint"
3. Skill configures:
   - Husky for git hooks
   - commitlint for message validation
   - lint-staged for pre-commit checks

### Validation Rules (commitlint.config.js)

```javascript
{
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'perf', 'style',
      'test', 'docs', 'build', 'ci', 'chore'
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72]
  }
}
```

### Pre-Commit Validation Flow

1. User attempts commit
2. Husky triggers commit-msg hook
3. commitlint validates message format
4. Commit succeeds or fails with helpful error

### Example Enforcement

```bash
git commit -m "updated stuff"
# Error: Subject must start with type (feat, fix, etc.)

git commit -m "feat(auth): add two-factor authentication"
# Success: Valid conventional commit
```

**Bypass option:** `git commit --no-verify` (for emergencies only)

---

## Skill Conflicts: Priority and Resolution

### Current Behavior

Skills do NOT conflict. Multiple skills for the same framework can coexist.

### Invocation Priority

1. **Most specific description wins**: Skill with more specific keywords in description
2. **Manual invocation**: User can explicitly reference skill name
3. **Context relevance**: Claude chooses based on conversation context

### Example Scenario

```
User: "Help me with Next.js caching"

Available skills:
- next-cache-architect (description: "Next.js caching strategies...")
- next-app-router (description: "Next.js App Router including caching...")

Result: next-cache-architect invoked (more specific)
```

### Why No Priority System Exists

- Skills are domain-specific, not overlapping
- Claude's invocation is context-aware
- Users can explicitly invoke: "Use the next-cache-architect skill to..."

### Best Practice for Skill Authors

- Write precise, unique descriptions
- Include specific trigger keywords
- Avoid generic descriptions like "Helps with Next.js"

### Handling True Conflicts

If two skills genuinely overlap:

1. Merge them into one comprehensive skill
2. Keep one enabled, disable the other (don't copy to core/)
3. Use agent description to route: "Use X skill for Y, Z skill for W"

---

## Repository Size

This is a template repository users clone:

- **Git clone size**: ~12 MB
- **Tracked files**: 2.4 MB
- **Recent optimization**: Removed Aptos skills (1.1 MB, Nov 2024)
- **Balance**: Comprehensive examples vs reasonable clone size

**Size breakdown:**
- `.claude/` directory: 2.4 MB
- `.git/` directory: 12 MB
- Root files: < 100 KB

---

## User Workflow (Typical Journey)

### Modern Workflow (Recommended)

1. **Clone**: `git clone https://github.com/raintree-technology/claude-starter`
2. **Navigate to project**: `cd /my-project`
3. **Run setup**: `/path/to/claude-starter/setup.sh --interactive`
4. **Configure environment**: `cp .env.example .env` and fill in values
5. **Validate**: `/self-test` to check configuration
6. **Start coding**: `claude` to begin
7. **Commit config**: Git commit `.claude/core/`, `.claude/settings.json`
8. **Gitignore**: `.env`, `.claude/settings.local.json`, `.claude/**/.cache/`

### Classic Workflow (Manual)

1. **Clone**: `git clone https://github.com/raintree-technology/claude-starter`
2. **Copy**: `cp -r claude-starter/.claude /my-project/`
3. **Use immediately**: Core commands and agents work
4. **Enable as needed**: `cp -r .claude/examples/skills/X .claude/core/skills/`
5. **Configure hooks**: `/enable-hook quality-focused`
6. **Customize**: Modify agents/commands for specific stack
7. **Commit**: `.claude/core/`, `.claude/settings.json` (version control)
8. **Gitignore**: `.claude/settings.local.json`, `.claude/**/.cache/`

---

## Recent Changes (November 2024)

1. **Removed Aptos skills** (10 skills, 1.1 MB) - Size optimization
2. **Added git workflow automation**:
   - Commands: `/commit`, `/create-pr`, `/release`
   - Skills: github-actions-architect, git-hooks-architect, vercel-deploy-architect
   - Workflows: ci.yml, deploy.yml, release.yml
   - Templates: PR template, CODEOWNERS
3. **Documentation**: Added `.claude/docs/workflows.md` (comprehensive guide)
4. **Updated README**: New "Git Workflows" section
5. **Skill organization overhaul**:
   - Removed 5 empty Stripe placeholder directories
   - Created 3 new categories: devops/, tools/, meta/
   - Reorganized 7 top-level skills into categories
   - Total: 39 skills across 12 organized categories
6. **Hook activation automation**:
   - Added `/enable-hook` command with presets
   - Automatic settings.json updating
   - Support for individual hooks or presets (quality-focused, security-focused, react-focused, all)
7. **Setup validation**:
   - Added `/self-test` command for comprehensive validation
   - 13-step validation including directory structure, settings, agents, commands, skills, hooks, framework detection, environment configuration
   - Auto-fix mode with `--fix` flag
8. **Automated setup system**:
   - Interactive setup script (`setup.sh`) with framework auto-detection
   - 6 preset configurations (minimal, nextjs-full, stripe-commerce, fullstack-saas, react-focused, devops-complete)
   - Environment template (`.env.example`) with all integrations documented
   - Stack-based selection (--stack next,stripe,supabase)
   - Integration detection from package.json
   - Setup wizard with guided Q&A

---

**For more information, see the main [CLAUDE.md](../../CLAUDE.md) file or explore the codebase using Glob/Grep.**
