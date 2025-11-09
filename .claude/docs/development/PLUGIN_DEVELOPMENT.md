# Plugin Development Guide

This guide explains how to extend, customize, and develop the Claude Starter Kit plugin.

## 📚 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [Creating Agents](#creating-agents)
- [Creating Skills](#creating-skills)
- [Creating Hooks](#creating-hooks)
- [Creating Commands](#creating-commands)
- [Testing](#testing)
- [Publishing](#publishing)

## 🏗️ Architecture Overview

The Claude Starter Kit follows this structure:

```
claude-starter/
├── .claude-plugin/           # Plugin packaging
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Marketplace config
├── .claude/                 # Core functionality
│   ├── agents/             # Specialized sub-agents
│   │   ├── *.md           # Agent definitions
│   │   └── docs/          # Agent reference docs
│   ├── skills/            # Auto-invoked capabilities
│   │   └── */SKILL.md     # Skill definitions
│   ├── hooks/             # Event automation
│   │   ├── *.ts          # Hook scripts
│   │   ├── config.ts     # Configuration
│   │   └── README.md     # Hook documentation
│   ├── commands/          # Slash commands
│   │   └── *.md          # Command definitions
│   ├── docs/              # Documentation
│   ├── settings.json      # Claude Code configuration
│   └── CLAUDE.md          # Project memory
├── README.md              # Main documentation
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # Contribution guide
└── LICENSE                # MIT license
```

### Component Types

| Component | Purpose | Auto-invoked? | Format |
|-----------|---------|---------------|--------|
| **Agents** | Complex task delegation | Yes (by description) | Markdown with YAML |
| **Skills** | Domain-specific capabilities | Yes (by description) | Markdown with YAML |
| **Hooks** | Event-triggered automation | Yes (on events) | TypeScript/Bash |
| **Commands** | User-invoked shortcuts | No (explicit `/cmd`) | Markdown with YAML |

## 🛠️ Development Setup

### Prerequisites

- Claude Code >= 0.8.0
- Node.js >= 18
- TypeScript >= 5.0
- Bun/npm/yarn

### Local Setup

```bash
# Clone the repository
git clone https://github.com/raintree-technology/claude-starter.git
cd claude-starter

# Create a test project
mkdir ../test-project
cd ../test-project
npm init -y

# Install as local plugin
cd ../test-project
# In Claude Code:
/plugin marketplace add /path/to/claude-starter
/plugin install claude-starter@local
```

### Development Workflow

1. Make changes in `claude-starter/.claude/`
2. Restart Claude Code to reload
3. Test in your test project
4. Iterate until working
5. Document your changes
6. Submit PR

## 🤖 Creating Agents

Agents are specialized AI assistants that Claude delegates complex tasks to.

### Agent Template

Create `.claude/agents/my-agent.md`:

```markdown
---
name: my-agent
description: PROACTIVELY use when [trigger condition]. Specialist for [capabilities]. Auto-invoked for: "keyword1", "keyword2", "keyword3".
tools: Read, Write, Edit, Bash, Grep
model: sonnet
---

**Reference Documentation:** `.claude/agents/docs/my-agent-ref.md`

You are a specialist for [domain].

## Core Responsibilities

### Primary Function
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

### Key Patterns
```[language]
// Example pattern 1
```

### Best Practices
- [Practice 1]
- [Practice 2]

## Templates

### Template 1: [Name]

```[language]
// Code template
```

## Communication Style
- [How to interact with users]
- [What to explain]
- [When to reference standards]
```

### Agent Reference Documentation

Create `.claude/agents/docs/my-agent-ref.md`:

```markdown
# My Agent Reference

## Overview
Detailed explanation of what this agent does.

## When to Use
- [Specific scenario 1]
- [Specific scenario 2]

## Key Features
- [Feature 1 with example]
- [Feature 2 with example]

## Common Patterns
### Pattern 1
[Explanation + code example]

## Examples
### Example 1: [Scenario]
[Full walkthrough]

## Troubleshooting
- **Issue**: [Common issue]
  **Solution**: [How to fix]
```

### Agent Best Practices

#### Description Writing
```yaml
# ✅ GOOD - Specific triggers and keywords
description: PROACTIVELY use when creating REST APIs, GraphQL endpoints, or microservices. Specialist for API design, rate limiting, authentication, error handling, and OpenAPI documentation. Auto-invoked for: "create API", "add endpoint", "API route", "REST service", "GraphQL resolver".

# ❌ BAD - Too vague
description: Helps with APIs
```

#### Tool Selection
```yaml
# Read-only agent (analysis, review)
tools: Read, Grep, Glob

# Write-capable agent (generation, modification)
tools: Read, Write, Edit, Grep, Glob

# Full-access agent (with execution)
tools: Read, Write, Edit, Bash, Grep, Glob
```

#### Model Selection
```yaml
# Fast, efficient (simple tasks)
model: haiku

# Balanced (most tasks)
model: sonnet

# Most capable (complex reasoning)
model: opus

# Inherit from session (default)
# (omit model field)
```

## ⚡ Creating Skills

Skills are auto-invoked capabilities that Claude uses based on context.

### Skill Template

Create `.claude/skills/category/skill-name/SKILL.md`:

```markdown
---
name: skill-name
description: Use when [trigger]. Handles [capabilities]. Auto-invoked for [use cases].
allowed-tools: Read, Write, Edit  # Optional - restrict tools
model: sonnet  # Optional - specific model
---

# Skill Name

## Purpose
Clear explanation of what this skill does and why it's useful.

## When to Use

This skill should be invoked when:
- [Specific trigger 1]
- [Specific trigger 2]
- [Specific trigger 3]

## Process

1. **Step 1**: [Action]
   - [Detail]
   - [Detail]

2. **Step 2**: [Action]
   - [Detail]

3. **Step 3**: [Action]

## Output Format

[How results are presented]

## Best Practices

- [Practice 1]
- [Practice 2]

## Examples

### Example 1: [Scenario]

**Input**: [User request]

**Process**: [How skill handles it]

**Output**: [Result]

## Error Handling

- **[Error type]**: [How to handle]

## Notes

[Additional context, warnings, tips]
```

### Skill Best Practices

#### Description Requirements
- **Max 1024 characters**
- Include WHAT the skill does
- Include WHEN to use it
- List specific trigger keywords
- Be action-oriented

```yaml
# ✅ GOOD
description: Use when analyzing performance bottlenecks, profiling code execution, or optimizing algorithms. Identifies O(n²) loops, redundant computations, memory leaks, and suggests optimizations. Auto-invoked for: "slow code", "performance issue", "optimize", "profiling", "bottleneck".

# ❌ BAD
description: Performance stuff
```

#### Scope Guidelines
- **One capability per skill** - Don't make "do everything" skills
- **Domain-specific** - Focus on a specific library/framework/pattern
- **Clear boundaries** - Easy to understand when to use

#### Testing Skills
```bash
# 1. Verify it loads
/skills

# 2. Test explicit invocation
Use the [skill-name] skill to [task]

# 3. Test auto-invocation
[Natural request with trigger keywords]

# 4. Verify correct skill activated
# Check Claude's response mentions the skill
```

## 🪝 Creating Hooks

Hooks are automated scripts that run on specific events.

### Hook Template

Create `.claude/hooks/my-hook.ts`:

```typescript
#!/usr/bin/env bun

/**
 * My Hook
 *
 * Description: What this hook does
 * Event: PostToolUse (or other event)
 * Blocks on: What conditions cause failure
 */

import { config } from './config';

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXIT_ERROR = 2;
const EXIT_CONFIG_ERROR = 3;

interface HookInput {
  tool: string;
  parameters: Record<string, any>;
  result: {
    success: boolean;
    output?: string;
    error?: string;
  };
}

async function main() {
  try {
    // Read input from stdin
    const input: HookInput = await Bun.stdin.json();

    // Check if this hook should run
    if (!config.myHook.enabled) {
      process.exit(EXIT_SUCCESS);
    }

    // Extract file path from parameters
    const filePath = input.parameters.file_path;
    if (!filePath) {
      process.exit(EXIT_SUCCESS);
    }

    console.log(`🔍 Running my hook on ${filePath}...`);

    // Perform checks
    const issues = await performChecks(filePath);

    // Report results
    if (issues.length === 0) {
      console.log('✅ All checks passed!');
      process.exit(EXIT_SUCCESS);
    } else {
      console.log(`❌ Found ${issues.length} issue(s):`);
      issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`);
      });
      process.exit(config.myHook.failOnIssues ? EXIT_FAILURE : EXIT_SUCCESS);
    }

  } catch (error) {
    console.error('❌ Hook error:', error);
    process.exit(EXIT_ERROR);
  }
}

async function performChecks(filePath: string): Promise<string[]> {
  const issues: string[] = [];

  // Read file content
  const content = await Bun.file(filePath).text();

  // Perform your checks
  if (content.includes('bad-pattern')) {
    issues.push(`Line X: Bad pattern detected`);
  }

  return issues;
}

main();
```

### Hook Configuration

Add to `.claude/hooks/config.ts`:

```typescript
export const config = {
  // ... existing config ...

  myHook: {
    enabled: true,
    failOnIssues: true,
    threshold: 10,
    patterns: {
      badPattern: /bad-pattern/g,
    },
  },
};
```

### Hook Registration

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/my-hook.ts"
          }
        ]
      }
    ]
  }
}
```

### Hook Best Practices

#### Exit Codes
- **0**: Success (checks passed)
- **1**: Failure (checks failed, should block)
- **2**: Error (hook crashed)
- **3**: Configuration error

#### Performance
- Run expensive checks conditionally
- Use parallel execution when possible
- Cache results when appropriate
- Fail fast on critical issues

#### Output Format
```typescript
// Use clear symbols
console.log('✅ Success');
console.log('❌ Error');
console.log('⚠️  Warning');
console.log('ℹ️  Info');

// Provide context
console.log(`  Line ${lineNum}: ${message}`);
console.log(`  💡 Suggestion: ${howToFix}`);

// Show timing
console.log(`⏱️  Check completed in ${duration}ms`);
```

## 📝 Creating Commands

Commands are user-invoked shortcuts for common workflows.

### Command Template

Create `.claude/commands/my-command.md`:

```markdown
---
description: Clear, concise description of what this command does
argument-hint: [optional-arg] <required-arg>
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Bash
---

[Command instructions go here]

Use $ARGUMENTS to access all arguments.
Use $1, $2, $3 for individual positional arguments.

Reference files with @path/to/file
Execute bash commands with !command

Example:
The user requested: $ARGUMENTS

First, let's check the current state:
!git status

Now let's perform the operation...
```

### Command Best Practices

#### Dynamic Content
```markdown
# Access arguments
User wants to process: $ARGUMENTS
First argument: $1
Second argument: $2

# Reference files (includes file content)
Here are the project dependencies:
@package.json

# Execute bash (includes command output)
Current git status:
!git status

Project structure:
!find . -type f -name "*.ts" | head -20
```

#### Argument Handling
```yaml
# No arguments
description: Clear all caches

# Optional arguments
description: Run tests with optional filter
argument-hint: [test-pattern]

# Required arguments
description: Create new component
argument-hint: <component-name>

# Multiple arguments
description: Deploy to environment
argument-hint: <environment> [version]
```

## 🧪 Testing

### Manual Testing

```bash
# Test agent
Use the [agent-name] agent to [specific task]

# Test skill (explicit)
Use the [skill-name] skill to [task]

# Test skill (auto-invocation)
[Request with trigger keywords from description]

# Test hook
# Make an edit, check console output

# Test command
/command-name arg1 arg2
```

### Automated Testing (Optional)

Create `tests/my-agent.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';

describe('MyAgent', () => {
  it('should have valid YAML frontmatter', async () => {
    const content = await Bun.file('.claude/agents/my-agent.md').text();
    expect(content).toContain('---');
    expect(content).toContain('name: my-agent');
  });

  it('should include trigger keywords', async () => {
    const content = await Bun.file('.claude/agents/my-agent.md').text();
    expect(content).toContain('Auto-invoked for:');
  });
});
```

## 📦 Publishing

### Version Bumping

```bash
# Update version in files:
# - .claude-plugin/plugin.json
# - .claude-plugin/marketplace.json
# - CHANGELOG.md

# Commit version bump
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin main --tags
```

### Release Process

1. **Update CHANGELOG.md**: Move items from `[Unreleased]` to new version section
2. **Update plugin.json**: Bump version number
3. **Update marketplace.json**: Update version and component counts
4. **Create Git tag**: `git tag v1.1.0`
5. **Push changes**: `git push origin main --tags`
6. **Create GitHub Release**: Document changes, attach assets
7. **Announce**: Share in community channels

### Distribution

Users can install via:

```bash
# From marketplace
/plugin marketplace add raintree-technology/claude-starter
/plugin install claude-starter

# From specific version
/plugin install claude-starter@1.1.0

# From local development
/plugin marketplace add /path/to/claude-starter
/plugin install claude-starter@local
```

## 📚 Additional Resources

- [Claude Code Official Docs](https://code.claude.com/docs)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents.md)
- [Skills Documentation](https://code.claude.com/docs/en/skills.md)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks-guide.md)
- [Plugin Reference](https://code.claude.com/docs/en/plugins-reference.md)

## 💡 Tips and Tricks

### Description Writing
- Include "PROACTIVELY use" for agents that should be auto-invoked
- List 3-5 specific trigger keywords
- Be explicit about capabilities
- Use action verbs

### Testing Auto-Invocation
1. Start with explicit invocation
2. Verify functionality works
3. Test with natural language containing trigger keywords
4. Refine description if not auto-invoking
5. Restart Claude Code after description changes

### Performance Optimization
- Use `model: haiku` for simple agents/skills
- Restrict tools with `allowed-tools` when possible
- Enable parallel execution in hooks config
- Cache expensive computations
- Use file-scoped lint instead of project-wide

### Debugging
```bash
# Run Claude Code with debug output
claude --debug

# Check if components loaded
/agents     # List agents
/skills     # List skills
/plugins    # List plugins

# Test hooks manually
echo '{"tool":"Edit","parameters":{"file_path":"test.ts"},"result":{"success":true}}' | .claude/hooks/my-hook.ts
```

---

For additional support, see the documentation links above.
