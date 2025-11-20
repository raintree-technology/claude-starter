# Documentation

Welcome to claude-starter - a complete TOON v2.0 implementation with zero dependencies.

## Quick Links

- **[TOON Format Guide](./toon-guide.md)** - Complete TOON v2.0 specification and usage
- **[Creating Components](./creating-components.md)** - Build skills, commands, and hooks
- **[Examples](./examples.md)** - Copy-paste starting points
- **[FAQ](./FAQ.md)** - Common questions answered

## What's in This Directory

### Core Guides

1. **toon-guide.md** - Complete TOON v2.0 Reference
   - TOON v2.0 specification (2025-11-10)
   - All three array formats (inline, tabular, expanded)
   - Multiple delimiters (comma, tab, pipe)
   - Key folding and path expansion
   - Strict mode validation
   - Canonical number formatting
   - Complete escape and quoting rules
   - ABNF grammar reference
   - Real-world examples with token savings

2. **creating-components.md** - Component Development Guide
   - How to create skills (auto-invoked expertise)
   - How to create commands (manual workflows)
   - How to create hooks (quality automation)
   - Complete examples and best practices
   - Claude Code integration patterns

3. **examples.md** - Quick-Start Templates
   - Copy-paste skill templates
   - Command workflow examples
   - Hook validation patterns
   - Real-world use cases

4. **FAQ.md** - Frequently Asked Questions
   - Common issues and solutions
   - Troubleshooting tips
   - Best practices
   - Performance optimization

## TOON v2.0 Features

This implementation supports **100% of TOON v2.0 specification**:

✅ **Array Formats**
- Inline primitive arrays: `friends[3]: ana,luis,sam`
- Tabular arrays: `[N]{fields}: values`
- Expanded list arrays: `- item` format

✅ **Delimiters**
- Comma (`,`) - default
- Tab (`\t`) - for TSV-like data
- Pipe (`|`) - for pipe-separated values

✅ **Key Folding** (v1.5+)
- Flatten nested objects: `server.host: localhost`
- Automatic collision detection
- Safe identifier validation

✅ **Path Expansion** (v1.5+)
- Decoder option to expand dotted keys
- Deep merge semantics
- Conflict resolution (strict/non-strict)

✅ **Strict Mode**
- Indentation alignment validation
- Array count/width checking
- Blank line detection
- Tab-in-indentation errors

✅ **Complete Specification**
- Canonical number format (no exponents, normalized zeros)
- Five escape sequences: `\\` `\"` `\n` `\r` `\t`
- Complete quoting rules
- ABNF grammar compliant
- Root form detection (array/primitive/object)

## Getting Started

### 1. Create Your First Skill

```bash
mkdir -p .claude/skills/my-domain/my-skill
# See creating-components.md for templates
```

### 2. Use TOON Format

```bash
# Check if JSON should use TOON
/analyze-tokens data.json

# Convert to TOON (30-60% savings)
/convert-to-toon data.json --delimiter comma --key-folding

# Or use Zig binary (20x faster)
cd .claude/utils/toon
zig build -Doptimize=ReleaseFast
./zig-out/bin/toon check data.json
./zig-out/bin/toon encode data.json --delimiter tab
```

### 3. Create a Command

```bash
# See examples.md for templates
cat > .claude/commands/my-command.md << 'EOF'
# My Command
...
EOF
```

## Documentation Structure

```
.claude/docs/
├── README.md                  # This file
├── toon-guide.md             # Complete TOON v2.0 guide
├── creating-components.md     # Skills, commands, hooks
├── examples.md               # Quick templates
└── FAQ.md                    # Common questions
```

## Extended TOON Documentation

For deep-dive TOON documentation, see `.claude/utils/toon/`:

- **README.md** - Complete TOON v2.0 specification
- **README_ZIG.md** - Zig implementation documentation
- **INSTALL.md** - Setup and build instructions
- **examples/** - Feature-specific examples
- **guides/** - Implementation guides
- **references/** - ABNF grammar, test cases

## Need Help?

- **Skills not activating?** Check `description` field in skill frontmatter
- **Commands not found?** Verify filename matches command name
- **Hooks not running?** Ensure enabled in `.claude/settings.json`
- **TOON questions?** See [toon-guide.md](./toon-guide.md)
- **Zig build issues?** See `.claude/utils/toon/INSTALL.md`

## Resources

- **Claude Code Docs:** https://code.claude.com/docs
- **TOON Format Spec:** https://github.com/toon-format/spec
- **TOON Website:** https://toonformat.dev
- **Project README:** ../../README.md
- **Project Instructions:** ../../CLAUDE.md

## Contributing

This is a template repository. Fork and customize for your needs!

Ideas:
- Share custom skills
- Improve Zig implementation
- Add more examples
- Better documentation
- Report bugs or edge cases

## Version Information

- **TOON Spec Version:** 2.0 (2025-11-10)
- **Claude Code Version:** ≥0.8.0
- **Zig Version:** ≥0.13.0 (optional, for performance)
- **Implementation Status:** 100% v2.0 compliant

---

**Zero dependencies • Instruction-based • 20x faster Zig implementation • Production-ready**
