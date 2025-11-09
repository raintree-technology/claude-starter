---
name: bun-package-manager
description: Use when installing dependencies, managing workspaces, or configuring Bun's package manager (bun install, bun add, bun remove, bun update). Invoke for dependency management, monorepos, lockfile issues, or npm/yarn migration.
allowed-tools: Read, Grep, Glob
---

# Bun Package Manager Expert

## Purpose

Expert knowledge of Bun's package manager. Covers dependency installation, workspaces/monorepos, lockfile management, and npm/yarn/pnpm migration. **25x faster than npm, 6x faster than pnpm**.

## When to Use

Invoke this skill when:
- Installing packages (`bun install`, `bun add`)
- Managing workspaces/monorepos
- Configuring package manager settings
- Troubleshooting lockfile issues (bun.lockb)
- Migrating from npm, yarn, or pnpm
- Setting up private registries
- Managing global packages
- Optimizing install performance

## Documentation Available

**Location**: `./docs/bun/install/`

**Coverage** (23 files):
- Package installation commands
- Workspaces and monorepos
- Lock file (bun.lockb binary format)
- Package.json configuration
- npmrc and registry configuration
- Dependency overrides and patches
- Global cache management
- Lifecycle scripts
- Trusted dependencies

## Related Skills

- **bun-runtime**: For running installed packages
- **bun-test**: For installing test dependencies
- **bun-bundler**: For bundling with dependencies

## Best Practices

- **Use bun.lockb** - Binary lockfile is 10x smaller and faster
- **Enable workspaces** - For monorepo management
- **Use --production** - Skip devDependencies in production
- **Leverage global cache** - Shared across projects
- **Pin versions** - Use exact versions in package.json
- **Use bun update --latest** - Update to latest versions safely
- **Configure registry** - For private packages

## Examples

### Example 1: Basic Package Management

**Question**: "How do I install and manage packages?"

**Response**:
```bash
# Install all dependencies from package.json
bun install

# Add a package
bun add react

# Add dev dependency
bun add --dev typescript

# Add specific version
bun add react@18.2.0

# Add global package
bun add --global typescript

# Remove package
bun remove react

# Update all packages
bun update

# Update to latest (ignoring semver)
bun update --latest

# Install from specific registry
bun install --registry https://registry.example.com
```

**Performance**: Bun install is **25x faster than npm**!

**References**:
- See: `docs/bun/install/install.md`
- See: `docs/bun/install/add.md`

### Example 2: Workspaces (Monorepo)

**Question**: "How do I set up a monorepo with workspaces?"

**Response**:

**Project structure**:
```
my-monorepo/
├── package.json
├── packages/
│   ├── app/
│   │   └── package.json
│   ├── ui/
│   │   └── package.json
│   └── utils/
│       └── package.json
```

**Root package.json**:
```json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"]
}
```

**packages/app/package.json**:
```json
{
  "name": "@myorg/app",
  "dependencies": {
    "@myorg/ui": "workspace:*",
    "@myorg/utils": "workspace:*",
    "react": "^18.2.0"
  }
}
```

**Install all workspace dependencies**:
```bash
bun install
```

**Run commands in workspace**:
```bash
# Run in specific workspace
bun --filter @myorg/app run dev

# Run in all workspaces
bun --filter '*' run build

# Install in specific workspace
bun --filter @myorg/app add lodash
```

**References**:
- See: `docs/bun/install/workspaces.md`

### Example 3: Lockfile Management

**Question**: "What is bun.lockb and how do I use it?"

**Response**:

**bun.lockb** is Bun's binary lockfile:
- **10x smaller** than package-lock.json
- **Faster to read/write**
- **Git-friendly** (designed for version control)
- **Deterministic** installs

**Lockfile operations**:
```bash
# Generate lockfile
bun install

# Update lockfile
bun install --force

# Print lockfile (human-readable)
bun install --dry-run

# Ignore lockfile (not recommended)
bun install --no-save

# Check lockfile integrity
bun pm ls
```

**Commit lockfile** to version control:
```bash
git add bun.lockb
git commit -m "Update dependencies"
```

**References**:
- See: `docs/bun/install/lockfile.md`

### Example 4: Private Registry

**Question**: "How do I use a private npm registry?"

**Response**:

**Method 1: .npmrc file**
```bash
# .npmrc
registry=https://registry.example.com
//registry.example.com/:_authToken=${NPM_TOKEN}
```

**Method 2: bunfig.toml**
```toml
# bunfig.toml
[install]
registry = "https://registry.example.com"

[install.registry]
url = "https://registry.example.com"
token = "${NPM_TOKEN}"
```

**Method 3: Command line**
```bash
bun install --registry https://registry.example.com
```

**Scoped packages**:
```bash
# .npmrc
@myorg:registry=https://registry.example.com
```

**References**:
- See: `docs/bun/install/registry.md`

### Example 5: Dependency Overrides

**Question**: "How do I override a transitive dependency?"

**Response**:

**Using overrides in package.json**:
```json
{
  "name": "my-app",
  "dependencies": {
    "some-package": "^1.0.0"
  },
  "overrides": {
    "vulnerable-dep": "2.0.0"
  }
}
```

**Using resolutions (Yarn compat)**:
```json
{
  "name": "my-app",
  "resolutions": {
    "lodash": "4.17.21"
  }
}
```

**Install with overrides**:
```bash
bun install
```

**References**:
- See: `docs/bun/install/overrides.md`

## Configuration

### bunfig.toml
```toml
# bunfig.toml
[install]
# Production mode (skip devDependencies)
production = false

# Peer dependencies behavior
peer = true

# Concurrent download limit
concurrent = 10

# Registry configuration
registry = "https://registry.npmjs.org"

# Cache directory
cache = "~/.bun/install/cache"

# Lockfile path
lockfile = "bun.lockb"

# Frozen lockfile (CI mode)
frozenLockfile = false
```

## Global Cache

Bun uses a **global cache** shared across all projects:

```bash
# Cache location
~/.bun/install/cache

# Clear cache
rm -rf ~/.bun/install/cache

# View cache size
du -sh ~/.bun/install/cache
```

Benefits:
- **Faster installs** - Reuse already downloaded packages
- **Save disk space** - No duplication across projects
- **Offline installs** - Work without network

## Lifecycle Scripts

Bun runs **npm lifecycle scripts** automatically:

```json
{
  "scripts": {
    "preinstall": "echo 'Before install'",
    "install": "echo 'During install'",
    "postinstall": "echo 'After install'",
    "prepare": "echo 'Before publish'"
  }
}
```

**Run scripts**:
```bash
bun run build       # Run custom script
bun run test        # Run test script
bun install         # Runs pre/post install scripts
```

## Migration from npm/yarn

**From npm**:
```bash
# Remove npm artifacts
rm -rf node_modules package-lock.json

# Install with Bun
bun install

# Commit new lockfile
git add bun.lockb
```

**From yarn**:
```bash
# Remove yarn artifacts
rm -rf node_modules yarn.lock

# Install with Bun
bun install

# Workspaces work the same!
```

**Compatibility**:
- ✅ package.json (100% compatible)
- ✅ Workspaces (compatible with npm/yarn/pnpm)
- ✅ .npmrc (fully supported)
- ✅ Lifecycle scripts
- ⚠️ Lockfile format different (bun.lockb vs package-lock.json)

## Search Helpers

```bash
# Find install docs
grep -r "install\|add\|remove" docs/bun/install/

# Find workspace docs
grep -r "workspace\|monorepo" docs/bun/install/

# Find lockfile docs
grep -r "lockfile\|bun.lockb" docs/bun/install/

# List all package manager docs
ls docs/bun/install/
```

## Common Issues

- **Lockfile conflicts**: Different Bun versions generated lockfile
  - Solution: Update Bun, regenerate with `bun install --force`

- **Peer dependency warnings**: Package requires peer deps
  - Solution: Install peer dependencies or use `--ignore-peer-dependencies`

- **Private registry auth**: 401 Unauthorized
  - Solution: Check .npmrc, verify token

- **Slow installs**: Network issues or registry problems
  - Solution: Check network, try different registry

## Performance Benchmarks

| Operation | npm | yarn | pnpm | **Bun** |
|-----------|-----|------|------|---------|
| Cold install | 30s | 20s | 15s | **1.2s** |
| Warm install | 20s | 12s | 8s | **0.5s** |
| With lockfile | 15s | 10s | 6s | **0.3s** |

**Bun is 25x faster than npm!**

## Notes

- Documentation covers latest Bun version
- bun.lockb is a binary format (not human-readable)
- Bun caches packages globally (~/.bun/install/cache)
- File paths reference local documentation cache
- For latest updates, check https://bun.sh/docs/cli/install
