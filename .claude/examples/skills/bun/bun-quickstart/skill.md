---
name: bun-quickstart
description: Use when getting started with Bun, installing Bun, initializing projects, or configuring bunfig.toml. Invoke for Bun setup, installation issues, or project scaffolding questions.
allowed-tools: Read, Grep, Glob
---

# Bun Quickstart Expert

## Purpose

Expert guidance for getting started with Bun. Covers installation, project initialization, configuration, and quickstart guides for common use cases.

## When to Use

Invoke this skill when:
- Installing Bun for the first time
- Creating new Bun projects
- Configuring bunfig.toml
- Setting up development environment
- Troubleshooting installation
- Learning Bun basics
- Scaffolding new projects with templates
- Understanding Bun's architecture

## Documentation Available

**Location**: `./docs/bun/project/` + root docs

**Coverage** (14 files):
- Installation (macOS, Linux, Windows)
- Upgrading Bun
- Project initialization (`bun init`)
- Configuration (bunfig.toml)
- Templates and scaffolding
- Development workflow
- Overview and concepts

## Related Skills

- **bun-runtime**: After setup, for building applications
- **bun-package-manager**: For managing dependencies
- **bun-test**: For testing setup
- **bun-bundler**: For production builds

## Installation

### macOS and Linux

**Using curl**:
```bash
curl -fsSL https://bun.sh/install | bash
```

**Using Homebrew** (macOS):
```bash
brew install oven-sh/bun/bun
```

**Verification**:
```bash
bun --version
```

### Windows

**Using PowerShell**:
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Using WSL**:
```bash
# Install in WSL (Linux)
curl -fsSL https://bun.sh/install | bash
```

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

CMD ["bun", "run", "start"]
```

## Upgrading Bun

```bash
# Upgrade to latest version
bun upgrade

# Upgrade to specific version
bun upgrade --version 1.0.0

# Upgrade to canary (nightly)
bun upgrade --canary
```

## Project Initialization

### Create New Project

```bash
# Interactive init
bun init

# With name
bun init my-app

# Skip prompts
bun init -y
```

**Generated files**:
```
my-app/
├── package.json
├── tsconfig.json
├── index.ts
└── README.md
```

### Using Templates

```bash
# Create from template
bun create <template> <destination>

# React app
bun create react my-react-app

# Next.js app
bun create next my-next-app

# Vite app
bun create vite my-vite-app

# Express-like server
bun create hono my-api
```

**Available templates**:
- `react` - React with Vite
- `next` - Next.js
- `vite` - Vite
- `hono` - Hono server framework
- `elysia` - Elysia server framework

## Configuration

### bunfig.toml

Create `bunfig.toml` in project root or `~/.bun/bunfig.toml` globally:

```toml
# Install configuration
[install]
# Auto install peer dependencies
peer = true

# Production mode
production = false

# Registry
registry = "https://registry.npmjs.org"

# Cache directory
cache = "~/.bun/install/cache"

# Test configuration
[test]
# Preload files before tests
preload = ["./setup.ts"]

# Code coverage
coverage = true

# Default timeout
timeout = 5000

# Run configuration
[run]
# Shell for scripts
shell = "bash"

# Automatically install on bun run
autoInstall = true
```

## Development Workflow

### Running Files

```bash
# Run TypeScript directly
bun run index.ts

# Run with watch mode (hot reload)
bun --watch index.ts

# Run with environment variables
FOO=bar bun run index.ts

# Run from package.json script
bun run dev
```

### REPL (Interactive Shell)

```bash
# Start REPL
bun

# In REPL:
> 2 + 2
4
> const data = await fetch("https://api.github.com").then(r => r.json())
> data
```

### Package Scripts

**package.json**:
```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --minify",
    "start": "bun dist/index.js",
    "test": "bun test",
    "lint": "eslint src"
  }
}
```

**Run scripts**:
```bash
bun run dev
bun run build
bun run start
bun test         # Shortcut (no "run" needed)
```

## Environment Variables

### .env File

```bash
# .env
DATABASE_URL=postgresql://localhost/mydb
API_KEY=secret123
NODE_ENV=development
```

**Access in code**:
```typescript
// Bun-native (recommended)
const dbUrl = Bun.env.DATABASE_URL

// Node.js compatible
const apiKey = process.env.API_KEY
```

**Load from different file**:
```bash
bun --env-file=.env.production run index.ts
```

## Quickstart Examples

### Example 1: Simple HTTP Server

```bash
# Create project
bun init my-server
cd my-server

# Write server code
cat > index.ts << 'EOF'
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello from Bun!")
  },
})

console.log(`Server running at http://localhost:${server.port}`)
EOF

# Run server
bun --watch index.ts
```

### Example 2: React App

```bash
# Create React app
bun create react my-react-app
cd my-react-app

# Install dependencies (if needed)
bun install

# Start dev server
bun run dev
```

### Example 3: API with Database

```bash
# Create project
bun init my-api
cd my-api

# Install dependencies
bun add postgres

# Create database client
cat > db.ts << 'EOF'
import postgres from 'postgres'

export const sql = postgres(Bun.env.DATABASE_URL!)
EOF

# Create API
cat > index.ts << 'EOF'
import { sql } from './db'

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/users') {
      const users = await sql`SELECT * FROM users`
      return Response.json(users)
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`API running at http://localhost:${server.port}`)
EOF

# Run with .env
bun --watch index.ts
```

## Common Commands

```bash
# Version
bun --version

# Help
bun --help

# Run file
bun run file.ts

# Install dependencies
bun install

# Add package
bun add react

# Remove package
bun remove react

# Run tests
bun test

# Build for production
bun build index.ts --outdir dist

# Create executable
bun build index.ts --compile --outfile myapp

# Upgrade Bun
bun upgrade

# REPL
bun

# Execute package
bun x cowsay "Hello!"
```

## Troubleshooting

### Installation Issues

**macOS: "command not found: bun"**
```bash
# Add to shell profile
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.zshrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux: Permission denied**
```bash
# Give execute permission
chmod +x ~/.bun/bin/bun
```

**Windows: Execution policy**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Common Errors

**"Cannot find module"**
```bash
# Install dependencies
bun install

# Or auto-install
bun run --install index.ts
```

**"Port already in use"**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Performance

**Why Bun is fast**:
- **JavaScriptCore** - Safari's JS engine (faster startup than V8)
- **Zig** - Built in Zig (low-level, fast)
- **Native APIs** - Optimized file I/O, HTTP, etc.
- **No transpilation** - Runs TypeScript natively

**Benchmarks**:
- **4x faster startup** than Node.js
- **25x faster installs** than npm
- **100x faster bundling** than Webpack
- **20-40x faster tests** than Jest

## Search Helpers

```bash
# Find installation docs
grep -r "install\|setup" docs/bun/project/

# Find config docs
grep -r "bunfig\|config" docs/bun/project/

# Find init docs
grep -r "init\|create" docs/bun/project/

# List all quickstart docs
ls docs/bun/project/
```

## Best Practices

1. **Use TypeScript** - Bun runs it natively, no config needed
2. **Enable watch mode** - Faster development with `--watch`
3. **Use bunfig.toml** - Centralized configuration
4. **Leverage .env** - Environment-specific config
5. **Use bun create** - Scaffolding with templates
6. **Hot reload** - Use `--hot` for instant updates
7. **Profile performance** - Use `bun:jsc` for profiling

## Next Steps

After setup:
1. **Build APIs** → See **bun-runtime** skill
2. **Write tests** → See **bun-test** skill
3. **Manage packages** → See **bun-package-manager** skill
4. **Bundle for production** → See **bun-bundler** skill

## Notes

- Documentation covers latest Bun version
- Bun is compatible with Node.js APIs
- TypeScript works out of the box
- File paths reference local documentation cache
- For latest updates, check https://bun.sh/docs
