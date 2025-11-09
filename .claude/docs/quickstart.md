# Quick Start

Get running in 5 minutes.

## Installation

### Option 1: Automated Setup (Recommended)

```bash
# Clone the starter kit
git clone https://github.com/raintree-technology/claude-starter
cd claude-starter

# Run setup in your project
cd /path/to/your/project
/path/to/claude-starter/setup.sh --interactive
```

The script auto-detects your framework and dependencies, copies relevant skills, and generates `.env.example`.

### Option 2: Preset Configuration

```bash
./setup.sh --preset nextjs-full        # Next.js full stack
./setup.sh --preset stripe-commerce    # E-commerce with Stripe
./setup.sh --preset fullstack-saas     # Next.js + Stripe + Supabase + DevOps
```

See [Preset System](../presets/README.md) for all presets.

### Option 3: Manual Setup

```bash
cp -r /path/to/claude-starter/.claude /path/to/your/project/
cd /path/to/your/project
```

## Verify

```bash
claude
/self-test    # Validates setup
```

## Core Commands

```bash
/build-safe     # Lint → typecheck → test → build
/sync-types     # Sync database types (Supabase/Drizzle)
/db-migrate     # Run database migrations
/commit         # Generate conventional commit message
/create-pr      # Create PR with auto-generated description
/release        # Create release with changelog
```

## Core Agents (Auto-activate)

- **security-auditor** - Scans auth, encryption, PII handling
- **database-architect** - Schema design and migrations
- **api-builder** - API endpoint creation

## Enable Optional Features

### Add Skills

```bash
# Automated
./setup.sh --stack next,stripe,supabase

# Manual
cp -r .claude/examples/skills/next .claude/core/skills/
```

### Add Hooks

```bash
/enable-hook quality-focused    # TypeScript, lint, format
/enable-hook security-focused   # Security scans
/enable-hook react-focused      # React best practices
```

### Add Agents

```bash
cp .claude/examples/agents/type-generator.md .claude/core/agents/
```

## Next Steps

- Browse `examples/` for available components
- Read [Customization](customization.md) for advanced config
- See [Workflows](workflows.md) for git automation

## Troubleshooting

**Commands not found**
- Verify `.claude/` in project root
- Restart Claude Code

**Agents not activating**
- Check YAML frontmatter is valid
- Try explicit: "Use the [agent-name] agent to..."

**Setup script fails**
- Check source directory exists
- Verify permissions
- Run `./setup.sh --check --preset <name>` to preview
