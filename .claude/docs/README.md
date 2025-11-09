# Documentation

Production-ready Claude Code configuration with automated setup, quality hooks, and 39 framework skills.

## Quick Links

- [Quick Start](quickstart.md) - Install and configure in 5 minutes
- [Customization](customization.md) - Extend with skills, agents, hooks
- [Workflows](workflows.md) - Git automation and CI/CD

## Getting Started

```bash
# Automated setup with framework detection
./setup.sh --interactive

# Or use a preset
./setup.sh --preset nextjs-full
./setup.sh --preset fullstack-saas

# Validate setup
/self-test
```

## Architecture

```
.claude/
├── core/              # Always enabled (3 agents, 9 commands)
├── examples/          # Opt-in (6 agents, 39 skills, 10 hooks)
├── presets/           # 6 predefined configurations
└── settings.json      # Hook configuration
```

## Core Components (Always Available)

**Agents:** security-auditor, database-architect, api-builder
**Commands:** /build-safe, /sync-types, /db-migrate, /health-check, /commit, /create-pr, /release, /enable-hook, /self-test

## Optional Features

**Enable by framework:**
```bash
./setup.sh --stack next,stripe,supabase
```

**Enable quality hooks:**
```bash
/enable-hook quality-focused
```

**Browse available:**
```bash
ls examples/skills    # 39 skills across 12 categories
ls examples/agents    # 6 specialized agents
ls examples/hooks     # 10 quality automation hooks
```

## Documentation

- [Quick Start](quickstart.md) - Installation
- [Customization](customization.md) - Configuration
- [Workflows](workflows.md) - Git automation
- [Contributing](development/CONTRIBUTING.md) - How to contribute

## Support

- [GitHub Issues](https://github.com/raintree-technology/claude-starter/issues)
- [Claude Code Docs](https://docs.claude.com/en/docs/claude-code/)
