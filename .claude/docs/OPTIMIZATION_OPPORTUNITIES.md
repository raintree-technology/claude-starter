# Practice What You Preach: Optimization Opportunities

Analysis of claude-starter codebase for opportunities to apply our own token optimization principles (MCP progressive disclosure + TOON format).

---

## ✅ Already Optimized

### 1. CLAUDE.md - **COMPLETED**
- **Before**: 980 lines
- **After**: 371 lines
- **Savings**: 62% reduction (609 lines)
- **Method**: Progressive disclosure - moved detailed tables to FAQ.md, condensed inventory to summary counts

### 2. README.md - **COMPLETED**
- **Before**: 323 lines
- **After**: 128 lines
- **Savings**: 60% reduction (195 lines)
- **Method**: Eliminated redundancy, consolidated sections, moved details to docs

---

## ✅ Completed Optimizations

### 1. Large Skills - Applied Progressive Disclosure

**Completed optimizations:**

| File | Before | After | Savings | Status |
|------|--------|-------|---------|--------|
| `core/agents/api-builder.md` | 3,068 | N/A | N/A | ✅ Already optimized with reference docs |
| `skills/next/nextjs-16-audit/skill.md` | 2,250 | 283 | 87% | ✅ **COMPLETE** |
| `skills/resend/resend-email-architect/skill.md` | 1,590 | 356 | 78% | ✅ **COMPLETE** |
| `skills/next/next-api-architect/skill.md` | 1,263 | 345 | 73% | ✅ **COMPLETE** |
| `skills/supabase/supabase-expert/skill.md` | 1,655 | N/A | N/A | ✅ Already has 6 separate guide files |

**Total impact:**
- **Before**: 5,103 lines (in the 3 optimized skills)
- **After**: 965 lines
- **Saved**: 4,138 lines (81% reduction)
- **Token savings**: ~16,552 tokens per skill load (4,138 lines × 4 tokens/line)

**Implementation notes:**
- All placeholder docs removed - production ready only
- Skills reference existing documentation (`resources/`, `docs/resend/`, `/lib/api/README.md`)
- No broken links - all references point to real files
- Maintained full functionality while reducing token load

**Pattern applied (now consistent across all):**

```markdown
---
name: skill-name
description: ...
---

**Reference Documentation:** `.claude/examples/skills/category/skill-name/docs/reference.md`

# Skill Name

## Core Patterns
[Essential patterns only - 200-400 lines]

## Common Use Cases
[5-10 examples]

## When to Use
[Triggers]

*For complete API reference, code examples, and advanced patterns, see reference documentation.*
```

**Estimated savings**: 5,000+ lines → 2,000 lines (60% reduction)

---

### 2. README Files - Consolidate and Link

**Large READMEs that could be streamlined:**

| File | Lines | Issue |
|------|-------|-------|
| `examples/hooks/README.md` | 608 | Installation instructions + full config examples |
| `examples/patterns/output-styles/README.md` | 432 | Multiple style guides in one file |
| `examples/agents/research-agent/README.md` | 422 | Detailed workflow explanations |
| `examples/skills/meta/skill-builder/README.md` | 379 | Complete tutorial + examples |

**Recommendation:**
- Keep README to 100-150 lines (overview, quick start, links)
- Move tutorials to `docs/TUTORIAL.md`
- Move examples to `examples/` subdirectory
- Move configuration to `docs/CONFIGURATION.md`

**Pattern:**
```markdown
# Component Name

Brief description (1-2 sentences).

## Quick Start
[3-5 essential steps]

## Features
- Feature 1
- Feature 2
- Feature 3

## Documentation
- [Installation](docs/INSTALLATION.md)
- [Configuration](docs/CONFIGURATION.md)
- [Examples](examples/)
- [API Reference](docs/API.md)

## Usage
[One simple example]
```

**Estimated savings**: 2,000+ lines → 800 lines (60% reduction)

---

### 3. Apply TOON to Example Data

**Opportunity**: Create example datasets in TOON format to demonstrate the technology

**Current state**:
- TOON library exists in `.claude/utils/toon/`
- Has `examples.ts` and `demo.ts`
- No actual `.toon` files to demonstrate the format

**Recommendation**: Create example `.toon` files

```bash
.claude/examples/data/
├── README.md                   # "Example datasets in TOON format"
├── financial-accounts.toon     # 20 accounts (58% smaller than JSON)
├── transactions.toon           # 500 transactions (54% smaller)
├── users.toon                  # 100 users (61% smaller)
└── comparison.md               # Side-by-side JSON vs TOON
```

**Benefits**:
- Dogfooding your own technology
- Provides copy-paste examples for users
- Demonstrates real-world token savings
- Can be used in tests and demos

**Estimated creation effort**: 1-2 hours
**Value**: High - makes TOON more tangible

---

### 4. Skill Categories - Use TOON for Inventory

**Current state**: `.claude/examples/README.md` lists all skills in markdown tables

**Opportunity**: Demonstrate TOON for structured data

**Before (markdown table)**:
```markdown
| Skill | File Path | Purpose |
|-------|-----------|---------|
| next-app-router | `.claude/examples/skills/next/next-app-router/skill.md` | Next.js App Router architecture |
| next-pages-router | `.claude/examples/skills/next/next-pages-router/skill.md` | Next.js Pages Router patterns |
...
```

**After (TOON format + reference)**:
```markdown
## Skills Inventory

See [skills-inventory.toon](skills-inventory.toon) for complete catalog.

Summary: 39 skills across 12 categories (Next.js: 8, React: 2, Stripe: 5...)

**Token efficiency**:
- Markdown table: ~1,200 tokens
- TOON format: ~480 tokens (60% savings)
```

**Estimated savings**: 600+ tokens every time Claude reads examples/README.md

---

### 5. Hook Documentation - Extract Configuration

**Current**: `.claude/examples/hooks/README.md` (608 lines) mixes:
- Conceptual overview
- Installation instructions
- Complete configuration examples for all 10 hooks
- Settings.json patterns
- Troubleshooting

**Recommendation**: Split into:
```
.claude/examples/hooks/
├── README.md              # 150 lines: Overview + quick start
├── docs/
│   ├── INSTALLATION.md    # Setup instructions
│   ├── CONFIGURATION.md   # All settings.json patterns
│   └── HOOKS_REFERENCE.md # Complete hook catalog
└── [hook files]
```

**Pattern (progressive disclosure)**:
```markdown
# Quality Automation Hooks

Post-tool-use hooks for automated quality checks.

## Quick Start
/enable-hook quality-focused

## Available Hooks
10 hooks available. See [HOOKS_REFERENCE.md](docs/HOOKS_REFERENCE.md) for complete catalog.

## Documentation
- [Installation Guide](docs/INSTALLATION.md)
- [Configuration](docs/CONFIGURATION.md)
- [Hook Reference](docs/HOOKS_REFERENCE.md)
```

**Estimated savings**: 608 lines → 150 lines (75% reduction in frequently-loaded file)

---

## 📊 Overall Impact Summary

| Category | Current Lines | Optimized Lines | Savings | Impact |
|----------|--------------|-----------------|---------|--------|
| CLAUDE.md | 980 | 371 | 62% | ✅ Done |
| README.md | 323 | 128 | 60% | ✅ Done |
| Large skills | ~10,000 | ~4,000 | 60% | High |
| READMEs | ~2,500 | ~1,000 | 60% | Medium |
| Hooks README | 608 | 150 | 75% | Medium |
| Examples README | ~300 | ~150 | 50% | Low |
| **TOTAL** | **~14,700** | **~5,800** | **60%** | **Very High** |

---

## 🎯 Priority Recommendations

### High Priority (Do First)

1. **Split large skills** (nextjs-16-audit, resend, next-api-architect)
   - Follow api-builder pattern (already exists)
   - Move detailed examples/API docs to separate files
   - Keep core skill under 500 lines

2. **Optimize hooks README**
   - Extract configuration to separate doc
   - Keep main README under 150 lines
   - High-frequency file (users read when enabling hooks)

### Medium Priority (Do Next)

3. **Create TOON example datasets**
   - Dogfood your own technology
   - Provides tangible examples for users
   - Demonstrates real-world savings

4. **Consolidate skill README files**
   - Follow consistent pattern across all skills
   - Link to detailed docs instead of embedding

### Low Priority (Nice to Have)

5. **Convert examples/README.md inventory to TOON**
   - Demonstrates TOON for metadata
   - Small but symbolic win

---

## 🛠️ Implementation Pattern

**For each large skill/README:**

1. **Identify sections**
   ```bash
   grep "^##" large-file.md
   ```

2. **Categorize content**
   - **Core** (always needed): Patterns, when to use, quick examples
   - **Reference** (on-demand): API docs, complete examples, edge cases
   - **Tutorial** (occasional): Step-by-step guides, deep dives

3. **Split files**
   ```
   skill-name/
   ├── skill.md           # Core (300-500 lines)
   ├── README.md          # Overview (100-150 lines)
   └── docs/
       ├── reference.md   # API reference
       ├── examples.md    # Complete examples
       └── tutorial.md    # Step-by-step guide
   ```

4. **Update main file**
   ```markdown
   # Skill Name

   [Core content]

   **Reference Documentation:**
   - [API Reference](docs/reference.md)
   - [Complete Examples](docs/examples.md)
   - [Tutorial](docs/tutorial.md)
   ```

---

## 💡 Why This Matters

**You're teaching MCP optimization and TOON**:
- MCP principle: Progressive disclosure (load only what you need)
- TOON principle: Schema hoisting (declare structure once)

**But some of your docs violate these principles**:
- ❌ Large monolithic skill files (load everything upfront)
- ❌ Repeated table structures in READMEs (no schema hoisting)
- ❌ No TOON example data (not dogfooding)

**After optimization**:
- ✅ Skills load core patterns, reference docs on-demand
- ✅ READMEs are concise with links to details
- ✅ Example datasets demonstrate TOON format
- ✅ **Practice what you preach**

---

## 📈 Estimated ROI

**Developer experience**:
- Faster Claude Code startup (less context loaded)
- Easier to find information (progressive disclosure)
- Clear examples of your own technologies

**Token savings** (conservative estimate):
- Claude loads large skills: ~10,000 lines → ~4,000 lines
- **60% reduction** = ~6,000 lines saved
- At ~4 tokens/line = **24,000 tokens saved** per Claude session
- For a template loaded frequently, this compounds

**Credibility**:
- "They practice what they preach" → increased trust
- Concrete TOON examples → easier adoption
- Progressive disclosure pattern → clear implementation reference

---

## 🚀 Next Steps

1. Pick ONE large skill (recommend: `nextjs-16-audit` - most bloated)
2. Apply progressive disclosure pattern
3. Document the process
4. Use that as template for others
5. Update CLAUDE.md with new pattern documentation

**Time investment**: ~30 min per skill x 5 skills = 2.5 hours
**Payoff**: 60% reduction in frequently-loaded content + credibility boost

---

*Generated: 2025-11-08*
*Based on: Comprehensive codebase analysis of claude-starter repository*
