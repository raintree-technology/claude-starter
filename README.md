# Claude Starter Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/raintree-technology/claude-starter/workflows/CI/badge.svg)](https://github.com/raintree-technology/claude-starter/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-%3E%3D0.8.0-blue)](https://claude.com/claude-code)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.claude/docs/development/CONTRIBUTING.md)

Production-ready Claude Code configuration. Start minimal, scale as needed.

## Installation

```bash
git clone https://github.com/raintree-technology/claude-starter
cd /path/to/your/project
/path/to/claude-starter/setup.sh --interactive
```

**Presets** (6 available in `.claude/presets/`):
```bash
./setup.sh --preset nextjs-full      # Next.js full stack
./setup.sh --preset fullstack-saas   # Next.js + Stripe + Supabase + DevOps
./setup.sh --preset minimal          # Core components only
./setup.sh --preset react-focused    # React development
./setup.sh --preset stripe-commerce  # E-commerce with Stripe
./setup.sh --preset devops-complete  # DevOps automation
./setup.sh --help                    # All options
```

**Validate setup:**
```bash
./quick-validate.sh                  # Verify configuration works
```

**Manual:**
```bash
cp -r /path/to/claude-starter/.claude /path/to/your/project/
```

## What's Included

**Core (Always Active)**
- 3 agents: Security auditor, database architect, API builder
- 9 commands: `/build-safe`, `/commit`, `/create-pr`, `/release`, `/sync-types`, `/db-migrate`, `/health-check`, `/enable-hook`, `/self-test`

**Optional (60+ Features)** - [Full catalog](.claude/examples/README.md)
- Frameworks: Next.js (9), React (2), Bun (5)
- Integrations: Stripe (5), Supabase (1), D3 (5), Shelby (4), Resend (1)
- Tools: 6 agents, 10 hooks, 7 commands
- Meta: Skill builder, MCP optimization, TOON format, Complextropy QC

## Structure

```
.claude/
├── core/              # Active by default
│   ├── agents/        # Security, database, API
│   └── commands/      # Build, git, validation
├── examples/          # Copy as needed
│   ├── skills/        # Framework expertise
│   ├── hooks/         # Quality automation
│   └── agents/        # Specialized helpers
└── settings.json      # Minimal config
```

## Token Optimization

**MCP Optimization**: 98%+ reduction (150K → 2K tokens)
- [Anthropic Engineering Blog](https://www.anthropic.com/engineering/code-execution-with-mcp)
- Progressive tool loading, context-efficient filtering, privacy-preserving workflows

**TOON Format**: 40-60% reduction for structured data
- Schema hoisting (declare once, not per row)
- Minimal syntax, streaming support for 10K+ records
- [Documentation](.claude/docs/toon/README.md)

## Automation & Quality

**Git Workflows:**
- `/commit` - Conventional commits from staged changes
- `/create-pr` - Auto-generate PR with labels, issue links
- `/release` - Semantic versioning, changelog, npm publishing
- 3 CI/CD workflows included

**Quality Automation:**
- Component size validation (agents <500 lines, skills <900 lines, commands <250 lines)
- 10 optional hooks for code quality, security, accessibility
- `/enable-hook` command for easy activation

[Complete guide](.claude/docs/workflows.md)

## Notable Features

**Advanced Agent Systems:**
- **Chief of Staff** - Multi-agent system with financial analyst, recruiter, and strategic planning
- **Research Agent** - Hierarchical research with lead/subagent coordination
- **Skill Builder** - Meta-skill for creating new skills with templates and validation

**Framework Expertise:**
- **Next.js 16 Audit** - Automated migration and best practices validation
- **Streaming Architect** - React Suspense and streaming patterns
- **Form Actions** - Server actions and progressive enhancement

**Developer Tools:**
- **MCP Optimization** - 98%+ token reduction patterns
- **Complextropy** - Code complexity metrics and quality scoring
- **TOON Format** - 40-60% reduction for structured data

## Documentation

- [Quick Start](.claude/docs/quickstart.md)
- [Customization](.claude/docs/customization.md)
- [Feature Catalog](.claude/examples/README.md)
- [Contributing](.claude/docs/development/CONTRIBUTING.md)
- [Optimization Guide](.claude/docs/development/OPTIMIZATION_GUIDE.md)

## Requirements

- Claude Code >= 0.8.0
- Node.js >= 18 (for hooks)

## License

MIT - See [LICENSE](LICENSE)

## Support

- [GitHub Issues](https://github.com/raintree-technology/claude-starter/issues)
- [Documentation](.claude/docs/)
