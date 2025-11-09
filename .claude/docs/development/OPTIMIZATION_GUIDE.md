# Skill Optimization Guide

**How to apply progressive disclosure to large skills and documentation**

This guide helps you optimize Claude Code skills, agents, and documentation using the same principles we teach: **MCP progressive disclosure** and **TOON efficiency**.

---

## When to Optimize

### Size Thresholds

| Component | Optimize When | Target Size | Move To |
|-----------|---------------|-------------|---------|
| Skills | >800 lines | 300-500 lines | `docs/` subdirectory |
| Agents | >800 lines | 300-500 lines | `docs/` subdirectory |
| READMEs | >200 lines | 100-150 lines | Separate docs |
| Commands | >400 lines | 200-300 lines | Reference doc |

### Signs You Need to Optimize

- ❌ Skill file has 100+ code examples
- ❌ Scrolling to find core patterns takes >10 seconds
- ❌ README has complete API reference embedded
- ❌ File has "Advanced", "Edge Cases", "Complete Reference" sections
- ❌ Multiple framework versions covered in one file

---

## Progressive Disclosure Principle

**Concept** (from MCP optimization):
> Load only what's needed. Keep detailed references external.

**Applied to skills**:
- **Core skill**: Patterns you use 80% of the time
- **Reference docs**: Complete API coverage, edge cases, advanced patterns

**Benefits**:
- ✅ Faster Claude Code startup (less context loaded)
- ✅ Easier to scan and find patterns
- ✅ Reference docs loaded on-demand
- ✅ Follows your own teaching (practice what you preach)

---

## The Optimization Process

### Step 1: Analyze Current Structure

```bash
# Count lines
wc -l skill.md

# Identify sections
grep "^##" skill.md

# Find long code blocks
grep -n "^\`\`\`" skill.md
```

**Categorize content**:

| Category | Keep in Core | Move to Reference |
|----------|--------------|-------------------|
| **Core patterns** | ✅ 5-10 most common | ❌ All 30+ patterns |
| **Examples** | ✅ 3-5 quick examples | ❌ Complete catalog |
| **API reference** | ✅ Key methods only | ❌ Full API docs |
| **Edge cases** | ❌ None | ✅ All edge cases |
| **Advanced patterns** | ❌ None | ✅ All advanced |
| **Migration guides** | ❌ None | ✅ Full migration |

---

### Step 2: Create Directory Structure

```bash
# For a skill named "framework-expert"
cd .claude/examples/skills/category/framework-expert/

# Create docs directory
mkdir -p docs

# Create reference files
touch docs/complete-reference.md
touch docs/examples.md
touch docs/advanced-patterns.md
```

**Standard structure**:
```
framework-expert/
├── skill.md              # Core patterns (300-500 lines)
├── README.md             # Overview (100-150 lines)
└── docs/
    ├── complete-reference.md  # Full API coverage
    ├── examples.md            # All examples
    ├── advanced-patterns.md   # Advanced use cases
    └── migration-guide.md     # Version migrations (if applicable)
```

---

### Step 3: Split Content

#### Extract Core Patterns (Keep in skill.md)

**Criteria for "core"**:
- Used in 80% of projects
- Needed for basic functionality
- Referenced in quick start
- Simple, no edge cases

**Example core patterns** (Next.js):
```markdown
## Core Patterns

### Pattern 1: Basic API Route
[Simple GET/POST example]

### Pattern 2: Authenticated Route
[Auth wrapper example]

### Pattern 3: Rate Limited Endpoint
[Rate limit example]

[5-10 total patterns]
```

#### Move to Reference Docs

**To `complete-reference.md`**:
- All API methods and parameters
- Complete option listings
- TypeScript types and interfaces
- Configuration reference

**To `examples.md`**:
- Real-world complete examples
- Full application code
- Integration examples
- Multi-step workflows

**To `advanced-patterns.md`**:
- Edge case handling
- Performance optimization
- Custom configurations
- Framework-specific tricks

**To `migration-guide.md`** (if applicable):
- Version upgrade steps
- Breaking changes
- Code transformations
- Deprecation warnings

---

### Step 4: Update skill.md with Links

Add reference documentation section at top:

```markdown
---
name: skill-name
description: Clear description with trigger keywords
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

**Reference Documentation:**
- [Complete API Reference](docs/complete-reference.md) - All methods, parameters, types
- [Code Examples](docs/examples.md) - Real-world implementations
- [Advanced Patterns](docs/advanced-patterns.md) - Edge cases, optimizations
- [Migration Guide](docs/migration-guide.md) - Version upgrade guide

# Skill Name

Brief description (2-3 sentences explaining what this skill does and when to use it).

## Core Patterns

[5-10 essential patterns]

## Quick Examples

[3-5 minimal working examples]

## When to Use

- Trigger phrase 1
- Trigger phrase 2
- Trigger phrase 3

---

*For complete API reference, all examples, and advanced patterns, see reference documentation above.*
```

---

### Step 5: Validate

**Check line counts**:
```bash
wc -l skill.md  # Should be 300-500
wc -l docs/*.md # Can be any size
```

**Verify structure**:
- [ ] YAML frontmatter preserved
- [ ] Reference links work
- [ ] Core patterns are complete (runnable)
- [ ] Quick examples are minimal
- [ ] No "see reference" in middle of patterns
- [ ] Clear separation: core vs reference

**Test functionality**:
```bash
# Skills should still auto-invoke
# Try mentioning trigger phrases in conversation

# Commands should still work
/command-name --help

# Agents should still activate
# Use description keywords
```

---

## Template: Optimized skill.md

Use this as your starting template:

```markdown
---
name: skill-name
description: What it does and when to invoke (include trigger keywords)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

**Reference Documentation:**
- [Complete Reference](docs/complete-reference.md)
- [Examples](docs/examples.md)
- [Advanced Patterns](docs/advanced-patterns.md)

# Skill Name

Brief 2-3 sentence description of what this skill provides and when to use it.

## Core Patterns

### Pattern 1: [Most Common Use Case]

**When to use**: [Scenario]

**Implementation**:
```language
// Minimal working example
[10-20 lines of code]
```

**Key points**:
- Point 1
- Point 2

---

### Pattern 2: [Second Most Common]

[Same structure]

---

[Repeat for 5-10 core patterns]

---

## Quick Examples

### Example 1: [Simple Scenario]
```language
// Complete minimal example
[15-30 lines]
```

### Example 2: [Another Common Scenario]
```language
[15-30 lines]
```

[3-5 quick examples total]

---

## When to Use

This skill automatically activates when you:
- Mention trigger phrase 1
- Mention trigger phrase 2
- Mention trigger phrase 3

Or invoke manually: "Use the [skill-name] skill to..."

---

## Related Skills

- [Related Skill 1](../related-skill-1/skill.md)
- [Related Skill 2](../related-skill-2/skill.md)

---

*For complete API reference, all code examples, advanced patterns, and edge case handling, see reference documentation links at the top.*
```

---

## Template: complete-reference.md

```markdown
# [Skill Name] - Complete API Reference

Complete reference documentation for [skill-name].

**Note**: This is reference documentation. For core patterns and quick start, see [skill.md](../skill.md).

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Methods](#methods)
3. [Types](#types)
4. [Configuration](#configuration)
5. [Error Handling](#error-handling)

---

## API Overview

[Complete API coverage]

## Methods

### method1()

**Signature**:
```typescript
function method1(params: Type): ReturnType
```

**Parameters**:
- `param1` (type): Description
- `param2` (type): Description

**Returns**: Description

**Example**:
```typescript
[Complete example]
```

[Repeat for all methods]

---

## Types

[All TypeScript interfaces, types, enums]

---

## Configuration

[All configuration options with defaults]

---

## Error Handling

[Complete error reference]

---

*Back to [Core Skill](../skill.md)*
```

---

## Real-World Example: nextjs-16-audit

### Before Optimization (2,250 lines)

```markdown
# Next.js 16 Audit Skill

[Complete audit checklist - 400 lines]
[All React 19 patterns - 500 lines]
[Migration steps - 600 lines]
[Edge cases - 300 lines]
[Examples - 450 lines]
```

**Problems**:
- Claude loads 2,250 lines every time
- Hard to find core audit steps
- Mixes basic and advanced
- ~9,000 tokens loaded

### After Optimization

**skill.md (500 lines)**:
```markdown
---
name: nextjs-16-audit
description: Audit Next.js apps for Next.js 16 + React 19 compliance...
---

**Reference Documentation:**
- [Complete Audit Checklist](docs/complete-audit.md)
- [Migration Guide](docs/migration-guide.md)
- [React 19 Patterns](docs/react-19-patterns.md)

# Next.js 16 Audit

Quick audit for Next.js 16 + React 19 compliance.

## Core Audit Steps

[10 key checks - 200 lines]

## Common Issues

[5 most common problems - 150 lines]

## Quick Fixes

[5 quick fix patterns - 150 lines]
```

**docs/complete-audit.md (1,000 lines)**:
- All audit steps
- Edge cases
- Framework internals

**docs/migration-guide.md (600 lines)**:
- Step-by-step migration
- Breaking changes
- Code transformations

**docs/react-19-patterns.md (650 lines)**:
- All React 19 patterns
- Server Components
- Async patterns

**Impact**:
- Core skill: 500 lines (~2,000 tokens)
- Reference (loaded on-demand): 2,250 lines
- **Savings: 77% reduction in initial load**

---

## Measuring Success

### Before Optimization

```bash
# Measure token usage
wc -l skill.md
# 2250 lines × 4 tokens/line = ~9,000 tokens
```

### After Optimization

```bash
# Core skill
wc -l skill.md
# 500 lines × 4 tokens/line = ~2,000 tokens

# Reference docs (loaded on-demand)
wc -l docs/*.md
# Total: 2,250 lines (not loaded unless needed)
```

### Token Savings Calculation

```
Before: 9,000 tokens (always loaded)
After:  2,000 tokens (core) + 0 tokens (reference not loaded)
Savings: 7,000 tokens (78% reduction)
```

For skills loaded frequently, this compounds:
- 10 skill loads per day × 7,000 tokens = **70,000 tokens saved/day**
- 365 days × 70,000 tokens = **25.5M tokens saved/year**

---

## Common Mistakes to Avoid

### ❌ Don't Do This

1. **Moving too much to reference**
   ```markdown
   ## Core Patterns
   See [reference](docs/reference.md) for all patterns.
   ```
   *Problem*: Core should be self-sufficient

2. **Keeping everything in core**
   ```markdown
   skill.md still 2,000 lines after "optimization"
   ```
   *Problem*: Defeats the purpose

3. **Breaking up working examples**
   ```markdown
   Example starts in skill.md, continues in reference
   ```
   *Problem*: Examples should be complete

4. **No links to reference docs**
   ```markdown
   Moved content but forgot to link it
   ```
   *Problem*: Content is now orphaned

### ✅ Do This Instead

1. **Keep core self-sufficient**
   ```markdown
   ## Core Patterns
   [5-10 complete, runnable patterns]
   ```

2. **Target 300-500 lines for core**
   ```bash
   wc -l skill.md  # Should be 300-500
   ```

3. **Complete examples in both places**
   - Core: Minimal working examples
   - Reference: Complete real-world examples

4. **Always link to reference docs**
   ```markdown
   **Reference Documentation:**
   - [Link 1](docs/...)
   - [Link 2](docs/...)
   ```

---

## FAQ

**Q: What if a skill is only 600 lines?**
A: Probably fine. Optimize when >800 lines.

**Q: Should I split commands too?**
A: Yes, same pattern. Keep core procedural steps, move detailed explanations to reference.

**Q: What about agents?**
A: Yes! Agents can be large too. Same optimization applies.

**Q: Do reference docs need YAML frontmatter?**
A: No, only the main skill.md needs frontmatter.

**Q: Can I have multiple reference docs?**
A: Yes! Organize by topic (examples.md, advanced.md, migration.md, etc.)

**Q: What if content doesn't fit categories?**
A: Use judgment. Core = used often. Reference = used rarely or for edge cases.

---

## Checklist: Optimizing a Skill

```markdown
- [ ] Analyzed current structure (grep "^##" skill.md)
- [ ] Counted lines (wc -l skill.md)
- [ ] Created docs/ directory
- [ ] Identified core patterns (5-10 most common)
- [ ] Identified quick examples (3-5 minimal)
- [ ] Moved advanced content to docs/advanced-patterns.md
- [ ] Moved complete examples to docs/examples.md
- [ ] Moved API reference to docs/complete-reference.md
- [ ] Added reference links to skill.md
- [ ] Updated README.md if needed
- [ ] Verified core skill is 300-500 lines
- [ ] Tested that skill still works
- [ ] Verified links work
- [ ] Calculated token savings
```

---

## Next Steps

After optimizing a skill:

1. **Document the savings**
   ```markdown
   Before: X lines
   After: Y lines
   Savings: Z% reduction
   ```

2. **Update OPTIMIZATION_OPPORTUNITIES.md**
   Mark the skill as complete

3. **Use as template**
   Apply same pattern to other large skills

4. **Measure impact**
   Track Claude Code startup time improvement

---

## Resources

- [OPTIMIZATION_OPPORTUNITIES.md](../OPTIMIZATION_OPPORTUNITIES.md) - Full analysis
- [FAQ.md](../FAQ.md) - Advanced features and patterns
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

---

*This guide itself practices progressive disclosure - it's ~300 lines focused on the optimization process. Complete examples are in the skills we've already optimized.*
