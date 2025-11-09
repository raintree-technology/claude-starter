# Contributing to Claude Starter Kit

Thank you for your interest in contributing! This guide will help you get started.

## Ways to Contribute

- **New Agents**: Specialized agents for specific domains (GraphQL, Prisma, etc.)
- **New Skills**: Additional library/framework skills (Vue, Svelte, Angular, etc.)
- **Hook Improvements**: Enhanced checks, better error messages, new patterns
- **Command Additions**: Useful slash commands for common workflows
- **Documentation**: Improvements, examples, tutorials
- **Bug Fixes**: Issues, edge cases, error handling
- **Performance**: Optimization, caching, parallelization

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/raintree-technology/claude-starter.git
cd claude-starter
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make Your Changes

Follow the appropriate guide based on what you're adding:

#### Adding a New Agent

1. Create agent file: `.claude/agents/your-agent.md`
2. Add reference documentation: `.claude/agents/docs/your-agent-ref.md`
3. Include YAML frontmatter:

```yaml
---
name: your-agent
description: PROACTIVELY use when [trigger]. Specialist for [capabilities]. Auto-invoked for: "keyword1", "keyword2", "keyword3".
tools: Read, Write, Edit, Bash, Grep
model: sonnet
---
```

4. Write comprehensive instructions with examples
5. Test by invoking explicitly first, then testing auto-invocation

#### Adding a New Skill

1. Create skill directory: `.claude/skills/category/skill-name/`
2. Add `SKILL.md` or `skill.md` with YAML frontmatter:

```yaml
---
name: skill-name
description: Use when [trigger]. Auto-invoked for [use cases]. Handles [capabilities].
allowed-tools: Read, Write, Edit  # Optional, only if restrictions needed
model: sonnet  # Optional
---
```

3. Include clear "When to Use" section with 3+ trigger conditions
4. Add examples showing input → process → output
5. Test with explicit invocation first

#### Adding a New Hook

1. Create hook script: `.claude/hooks/your-hook.ts`
2. Use TypeScript with proper types
3. Follow exit code conventions:
   - 0: Success
   - 1: Check failure (blocks)
   - 2: Unexpected error
   - 3: Configuration error

4. Add configuration options to `.claude/hooks/config.ts`
5. Update `.claude/hooks/README.md` with documentation
6. Register in `.claude/settings.json`

#### Adding a New Command

1. Create command file: `.claude/commands/your-command.md`
2. Add YAML frontmatter:

```yaml
---
description: Clear description of what this command does
argument-hint: [optional-arg] <required-arg>  # Optional
disable-model-invocation: true  # Optional, prevents auto-invocation
---
```

3. Write command instructions
4. Use `$ARGUMENTS`, `$1`, `$2` for parameters
5. Use `@path/to/file` to reference files
6. Use `!command` to execute bash and include output

### 4. Test Your Changes

```bash
# Test in a sample project
cd /path/to/test-project

# Add as local marketplace
/plugin marketplace add /path/to/claude-starter

# Install locally
/plugin install claude-starter@local

# Restart Claude Code
# Test your changes
```

#### Testing Agents
```
# Try explicit invocation
Use the [agent-name] agent to [task description]

# Then test auto-invocation with trigger keywords
[natural request that should trigger the agent]
```

#### Testing Skills
```
# Check if loaded
/skills

# Test with trigger phrase from description
[request containing trigger keywords]
```

#### Testing Hooks
```
# Make an edit that should trigger the hook
# Check output in Claude Code console
# Verify exit codes and error messages
```

#### Testing Commands
```
/your-command arg1 arg2
```

### 5. Update Documentation

- Add entry to `CHANGELOG.md` under `[Unreleased]`
- Update `README.md` if adding major features
- Add examples to relevant documentation
- Update `.claude-plugin/plugin.json` component counts if needed

### 6. Commit and Push

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add GraphQL API agent

- Created graphql-agent.md with schema validation
- Added reference documentation
- Includes auto-invocation for 'GraphQL', 'schema', 'resolver'
- Tested with sample project"

# Push to your fork
git push origin feature/your-feature-name
```

### 7. Create Pull Request

1. Go to https://github.com/raintree-technology/claude-starter
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template (see below)
5. Submit the pull request

## Pull Request Template

```markdown
## Description
Brief description of what this PR adds/fixes.

## Type of Change
- [ ] New agent
- [ ] New skill
- [ ] New hook
- [ ] New command
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement

## Component Details
**Name**: component-name
**Category**: agents/skills/hooks/commands
**Trigger Keywords**: keyword1, keyword2, keyword3 (for agents/skills)

## Testing
- [ ] Tested explicit invocation
- [ ] Tested auto-invocation (for agents/skills)
- [ ] Verified in sample project
- [ ] No breaking changes to existing components
- [ ] Documentation updated

## Checklist
- [ ] YAML frontmatter is valid
- [ ] Description includes trigger keywords
- [ ] Examples provided
- [ ] Added to CHANGELOG.md
- [ ] Component count updated in plugin.json (if applicable)
- [ ] No sensitive data (API keys, tokens) in code

## Screenshots / Examples
Paste examples of your component in action.
```

## Style Guidelines

### Agent/Skill Descriptions
- **Start with action**: "PROACTIVELY use when..." or "Use when..."
- **Be specific**: Include exact trigger keywords
- **List capabilities**: What it does and how
- **Max 1024 chars**: Be comprehensive but concise

Good example:
```
PROACTIVELY use when creating GraphQL APIs, schemas, or resolvers. Specialist for GraphQL schema design, query optimization, resolver patterns, and type generation. Auto-invoked for: "GraphQL API", "create schema", "add resolver", "GraphQL query", "mutation", "subscription".
```

Bad example:
```
Helps with GraphQL.
```

### Code Style
- **TypeScript**: Use strict mode, no `any` types
- **Formatting**: Follow project's Biome configuration
- **Comments**: Explain "why", not "what"
- **Error handling**: Always handle errors gracefully
- **Logging**: Use structured logging with context

### Documentation
- **Clear headings**: Use proper hierarchy
- **Code examples**: Always include examples
- **Commands**: Show exact commands to run
- **Links**: Use relative links for internal docs

## 🐛 Reporting Bugs

### Before Reporting
1. Check [existing issues](https://github.com/raintree-technology/claude-starter/issues)
2. Try with latest version
3. Test with `/health-check` command
4. Check Claude Code version (>= 0.8.0)

### Bug Report Template

```markdown
## Bug Description
Clear description of the issue.

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Claude Code version: [run `claude --version`]
- Node.js version: [run `node --version`]
- OS: [macOS/Linux/Windows]
- Plugin version: [check plugin.json]

## Component
- [ ] Agent (name: ___)
- [ ] Skill (name: ___)
- [ ] Hook (name: ___)
- [ ] Command (name: ___)
- [ ] Other

## Logs
Paste relevant error messages or logs.
```

## Feature Requests

We welcome feature requests! Please provide:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: How you envision it working
3. **Alternatives**: Other approaches you've considered
4. **Examples**: Similar features in other tools
5. **Priority**: How important is this to you?

## Code Review Process

1. **Automated Checks**: Must pass (if GitHub Actions enabled)
2. **Manual Review**: Maintainer reviews code quality
3. **Testing**: Verify functionality in test project
4. **Documentation**: Ensure docs are clear and complete
5. **Approval**: Maintainer approves and merges

## Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Thanked in the Claude Code community

## Questions

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions

## Code of Conduct

Be respectful, inclusive, and professional. We are all here to build something great together.

---

Thank you for contributing to Claude Starter Kit.
