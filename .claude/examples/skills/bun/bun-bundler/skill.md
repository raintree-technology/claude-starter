---
name: bun-bundler
description: Use when bundling JavaScript/TypeScript for production, configuring loaders, plugins, or creating executables. Invoke for bun build, minification, code splitting, or build optimization questions.
allowed-tools: Read, Grep, Glob
---

# Bun Bundler Expert

## Purpose

Expert knowledge of Bun's built-in bundler. Covers production builds, minification, loaders, plugins, code splitting, and executable generation. **100x faster than Webpack**.

## When to Use

Invoke this skill when:
- Building for production (`bun build`)
- Bundling JavaScript/TypeScript
- Configuring loaders (CSS, images, JSON)
- Creating plugins
- Minifying code
- Code splitting and tree shaking
- Creating standalone executables
- Optimizing bundle size
- Migrating from Webpack/esbuild

## Documentation Available

**Location**: `./docs/bun/bundler/`

**Coverage** (11 files):
- `bun build` command
- Loaders (built-in and custom)
- Plugins API
- Minification and optimization
- Code splitting
- CSS bundling
- Macros (compile-time execution)
- Executables and bytecode
- Source maps
- esbuild compatibility

## Related Skills

- **bun-runtime**: For running bundled code
- **bun-package-manager**: For managing build dependencies

## Best Practices

- **Use bun build** - 100x faster than Webpack
- **Enable minification** - Reduce bundle size
- **Use code splitting** - Load only what's needed
- **Tree shake** - Remove unused code
- **Generate source maps** - For debugging
- **Create executables** - For distribution
- **Use macros** - For compile-time optimizations
- **Configure loaders** - For assets and special files

## Examples

### Example 1: Basic Bundling

**Question**: "How do I bundle my app for production?"

**Response**:
```bash
# Simple bundle
bun build ./src/index.ts --outdir ./dist

# With minification
bun build ./src/index.ts --outdir ./dist --minify

# Multiple entry points
bun build ./src/index.ts ./src/admin.ts --outdir ./dist

# Bundle to single file
bun build ./src/index.ts --outfile ./dist/bundle.js

# With source maps
bun build ./src/index.ts --outdir ./dist --sourcemap=external
```

**Output**:
```
dist/
├── index.js        # Bundled code
├── index.js.map    # Source map
└── chunk-abc.js    # Code split chunk
```

**Performance**: Bun builds are **100x faster than Webpack**!

**References**:
- See: `docs/bun/bundler/build.md`

### Example 2: Build Configuration

**Question**: "How do I configure the bundler?"

**Response**:

**Using build API**:
```typescript
// build.ts
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',

  // Minification
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },

  // Code splitting
  splitting: true,

  // Target
  target: 'browser', // or 'node' or 'bun'

  // External modules (don't bundle)
  external: ['react', 'react-dom'],

  // Source maps
  sourcemap: 'external',

  // Naming pattern
  naming: '[dir]/[name].[ext]',

  // Public path
  publicPath: '/assets/',
})
```

**Run build**:
```bash
bun run build.ts
```

**References**:
- See: `docs/bun/bundler/api.md`

### Example 3: Loaders

**Question**: "How do I bundle CSS, images, and other assets?"

**Response**:

**Built-in loaders**:
```typescript
// Bun automatically handles:
import './styles.css'        // CSS
import logo from './logo.png' // Images (base64 or file)
import data from './data.json' // JSON
import text from './file.txt' // Text files
```

**CSS bundling**:
```bash
bun build ./src/index.ts --outdir ./dist

# CSS is automatically extracted to separate files
# dist/index.css
```

**Custom loader**:
```typescript
// Build config with custom loader
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',

  // Custom loader for .svg files
  loader: {
    '.svg': 'text', // Load as text
    // or 'file', 'dataurl', 'json'
  },
})
```

**References**:
- See: `docs/bun/bundler/loaders.md`

### Example 4: Plugins

**Question**: "How do I create a bundler plugin?"

**Response**:
```typescript
// my-plugin.ts
import type { BunPlugin } from 'bun'

const myPlugin: BunPlugin = {
  name: 'my-plugin',

  setup(build) {
    // Transform .custom files
    build.onLoad({ filter: /\.custom$/ }, async (args) => {
      const text = await Bun.file(args.path).text()

      return {
        contents: `export default ${JSON.stringify(text)}`,
        loader: 'js',
      }
    })

    // Resolve custom imports
    build.onResolve({ filter: /^custom:/ }, (args) => {
      return {
        path: args.path.replace('custom:', './'),
        namespace: 'custom',
      }
    })
  },
}

// Use plugin
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [myPlugin],
})
```

**References**:
- See: `docs/bun/bundler/plugins.md`

### Example 5: Standalone Executable

**Question**: "How do I create a standalone executable?"

**Response**:
```bash
# Create executable (includes Bun runtime)
bun build ./src/cli.ts --compile --outfile ./mycli

# Run executable (no Bun needed!)
./mycli

# For different platforms
bun build ./src/cli.ts --compile --target=bun-windows-x64 --outfile ./mycli.exe
bun build ./src/cli.ts --compile --target=bun-linux-x64 --outfile ./mycli
bun build ./src/cli.ts --compile --target=bun-darwin-arm64 --outfile ./mycli
```

**Targets**:
- `bun-windows-x64`
- `bun-linux-x64`
- `bun-darwin-x64` (Intel Mac)
- `bun-darwin-arm64` (M1/M2 Mac)

**References**:
- See: `docs/bun/bundler/executables.md`

## Macros

**Compile-time code execution**:
```typescript
// macro.ts
export function add(a: number, b: number) {
  return a + b
} with { type: 'macro' }

// usage.ts
import { add } from './macro.ts' with { type: 'macro' }

// This runs at compile time!
const result = add(2, 3) // Replaced with: const result = 5
```

**Use cases**:
- Environment variable inlining
- Compile-time computations
- Code generation
- Build-time optimizations

**References**:
- See: `docs/bun/bundler/macros.md`

## Minification

```bash
# Enable all minification
bun build ./src/index.ts --outdir ./dist --minify

# Selective minification
bun build ./src/index.ts --outdir ./dist --minify-whitespace --minify-identifiers --minify-syntax
```

**Minification types**:
- **whitespace**: Remove unnecessary whitespace
- **identifiers**: Shorten variable names
- **syntax**: Simplify syntax (e.g., `if` to ternary)

## Code Splitting

```typescript
// Automatic code splitting
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  splitting: true, // Enable code splitting
})

// Manual chunks
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  splitting: true,

  // Define manual chunks
  chunk: {
    vendor: ['react', 'react-dom'],
    utils: ['./src/utils/**'],
  },
})
```

**Output**:
```
dist/
├── index.js
├── vendor.js    # Shared vendor code
└── utils.js     # Shared utility code
```

## Target Environments

```typescript
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',

  target: 'browser', // Browser bundle
  // or 'node'        // Node.js bundle
  // or 'bun'         // Bun-specific bundle
})
```

## Externals

**Don't bundle certain packages**:
```typescript
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  external: ['react', 'react-dom'], // Don't bundle these
})
```

## Search Helpers

```bash
# Find build docs
grep -r "build\|bundle" docs/bun/bundler/

# Find plugin docs
grep -r "plugin\|loader" docs/bun/bundler/

# Find minification docs
grep -r "minify\|optimize" docs/bun/bundler/

# List all bundler docs
ls docs/bun/bundler/
```

## Common Issues

- **Large bundle size**: Not tree-shaking or minifying
  - Solution: Enable minification, check externals

- **Missing dependencies**: Dependency not bundled
  - Solution: Remove from `external` list

- **Source maps not working**: Incorrect source map config
  - Solution: Use `sourcemap: 'external'` or `'inline'`

- **Slow builds**: Large codebase or complex transforms
  - Solution: Use code splitting, check plugins

## Migration from Webpack

| Webpack | Bun | Notes |
|---------|-----|-------|
| `webpack.config.js` | `Bun.build()` API | Simpler config |
| Loaders | Built-in loaders | Most common loaders included |
| Plugins | Plugin API | Similar concept |
| Dev server | `bun --watch` | Built-in watch mode |

**Webpack features in Bun**:
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification
- ✅ Source maps
- ✅ Asset bundling
- ❌ HMR (use `--hot` instead)

## Performance

**Benchmarks**:
- **100x faster than Webpack**
- **10x faster than esbuild**
- Near-instant incremental builds
- Parallel compilation

## Notes

- Documentation covers latest Bun version
- Bun bundler is built on JavaScriptCore
- File paths reference local documentation cache
- For latest updates, check https://bun.sh/docs/bundler
