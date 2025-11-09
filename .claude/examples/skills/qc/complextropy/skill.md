---
name: Complextropy Analyzer
description: Analyzes files for optimal complexity using sophistication theory - refactors code that is too simple (low entropy) or too chaotic (high entropy, low sophistication) to achieve ideal "complextropy" where code has meaningful structure without being overly complex.
version: 1.0.0
dependencies: typescript>=5.0.0
---

# Complextropy Analyzer

## Overview

This skill applies **sophistication theory** from Kolmogorov complexity to analyze and refactor code files. It identifies code that falls into three categories:

1. **Too Simple** (Low Entropy): Overly simplistic code that lacks necessary structure
2. **Optimal Complextropy** (High Sophistication): Well-structured code with meaningful patterns
3. **Too Chaotic** (High Entropy, Low Sophistication): Random-looking code without discoverable patterns

The goal is to move code toward the **optimal complextropy zone** - the "middle picture" in the coffee cup analogy where structure is most interesting and maintainable.

## The First Law of Complexodynamics

Based on the principle that complexity follows a curve over time:

```
Low Entropy → High Complextropy → High Entropy
(too simple)   (optimal zone)     (too chaotic)
```

Code should exist in the **middle zone** where:
- Patterns are discoverable and meaningful
- Structure is neither too rigid nor too random
- The "sophistication" (Soph(x)) is maximized
- The code is compressible via patterns, but not trivial

## Core Concepts

### Sophistication (Soph(x))

For a string x, sophistication measures the length of the shortest program that describes a set S where:
- x is a member of S
- x appears "random" relative to S
- S captures all the non-random structure in x

### Complextropy

The resource-bounded sophistication that:
- Considers computational efficiency constraints
- Balances between simple patterns and generic randomness
- Maximizes at intermediate structural complexity

## When to Use This Skill

Apply this skill when:
- Files are too long (>500 lines) suggesting high entropy
- Code has excessive nesting or complexity metrics
- Patterns are hard to discover (low sophistication)
- Code is overly simplistic and needs better abstractions
- Refactoring existing code for maintainability
- Reviewing PRs for structural quality

## Analysis Dimensions

### 1. Kolmogorov Complexity Proxies

Estimate K(x) using computable proxies:
- **File size after minification** (removes whitespace noise)
- **Gzip compression ratio** (pattern discovery)
- **AST node count** (structural complexity)
- **Cyclomatic complexity** (decision point density)
- **Unique vs repeated token ratio** (redundancy measure)

### 2. Sophistication Indicators

High sophistication code exhibits:
- **Discoverable patterns**: Repeated structures with variations
- **Meaningful abstractions**: Functions/classes that capture domain concepts
- **Composability**: Small units that combine in predictable ways
- **Self-similarity**: Consistent style and patterns throughout
- **Information density**: High signal-to-noise ratio

Low sophistication (chaotic) code shows:
- **One-off solutions**: No pattern reuse
- **Copy-paste variations**: Similar code with minor differences
- **Irregular structure**: Inconsistent organization
- **High coupling**: Unpredictable dependencies
- **Magic values**: Unexplained constants scattered throughout

### 3. Entropy Metrics

- **Shannon entropy** of token distribution
- **Unique identifier count**
- **Branching factor** (avg paths per function)
- **Dependency graph complexity**

## Refactoring Strategies

### Moving from Low Entropy (Too Simple)

**Symptoms:**
- Single giant function (God function)
- Flat structure with no abstraction layers
- Inline everything
- No separation of concerns

**Fixes:**
- Extract meaningful functions/classes
- Introduce abstraction layers
- Create discoverable patterns
- Add domain-specific types

### Moving from High Entropy (Too Chaotic)

**Symptoms:**
- No discoverable patterns
- Every function solves problem differently
- Deep nesting (>4 levels)
- Unclear responsibility boundaries
- Spaghetti control flow

**Fixes:**
- Identify repeated patterns and extract
- Normalize similar code paths
- Reduce branching through polymorphism
- Introduce consistent error handling
- Create unified data flow patterns

### Achieving Optimal Complextropy

**Target characteristics:**
- **Compression ratio**: 60-75% (good pattern density)
- **Cyclomatic complexity**: 1-10 per function (manageable decision density)
- **Function length**: 10-50 lines (discoverable scope)
- **Nesting depth**: ≤3 levels (traceable logic)
- **Pattern reuse**: 70%+ of code follows 3-5 core patterns

## Analysis Process

### Step 1: Measure Current State

```typescript
interface ComplextropyMetrics {
  // Kolmogorov complexity proxies
  fileSize: number;
  compressedSize: number;
  compressionRatio: number;

  // Sophistication indicators
  patternCount: number;
  patternCoverage: number; // % of code following patterns
  abstractionLayers: number;

  // Entropy metrics
  uniqueTokens: number;
  totalTokens: number;
  cyclomaticComplexity: number;
  nestingDepth: number;

  // Derived scores
  sophisticationScore: number; // 0-100
  entropyScore: number; // 0-100
  complextropyZone: 'too-simple' | 'optimal' | 'too-chaotic';
}
```

### Step 2: Identify Issues

Categorize code segments by their position on the curve:

1. **Too Simple (Low Sophistication)**
   - Score: sophistication < 30
   - Action: Add abstractions

2. **Optimal Zone (High Sophistication)**
   - Score: 40 ≤ sophistication ≤ 70
   - Action: Minor refinements only

3. **Too Chaotic (High Entropy)**
   - Score: sophistication < 30 AND entropy > 70
   - Action: Extract patterns, normalize structure

### Step 3: Apply Targeted Refactoring

For each issue found:

```typescript
interface RefactoringAction {
  location: string; // File:line
  currentZone: ComplextropyZone;
  targetZone: 'optimal';
  strategy: RefactoringStrategy;
  estimatedImpact: {
    sophisticationDelta: number;
    entropyDelta: number;
    linesChanged: number;
  };
  codeExample: {
    before: string;
    after: string;
    explanation: string;
  };
}
```

### Step 4: Verify Improvement

After refactoring:
- Re-measure metrics
- Confirm movement toward optimal zone
- Ensure no regressions in other dimensions

## Output Format

Produce a detailed analysis report:

```markdown
# Complextropy Analysis Report

## File: [filename]

### Overall Metrics
- **Sophistication Score**: X/100
- **Entropy Score**: Y/100
- **Complextropy Zone**: [too-simple|optimal|too-chaotic]
- **Compression Ratio**: N%
- **Pattern Coverage**: N%

### Issues Found

#### [Location] - [Issue Type]
**Current State**: [Description]
**Sophistication**: X/100
**Recommended Action**: [Strategy]

**Before**:
```typescript
// Current code
```

**After**:
```typescript
// Refactored code
```

**Explanation**: [Why this improves sophistication]

### Summary

- Total issues: N
- Estimated sophistication gain: +X points
- Files to modify: N
```

## Practical Heuristics

### Quick Checks

1. **Gzip Test**: If compression ratio >80%, code is too repetitive
2. **Unique Token Test**: If unique/total ratio >70%, code is too chaotic
3. **Function Length**: If >100 lines, likely needs pattern extraction
4. **Copy-Paste Detection**: If same block appears 3+ times, extract pattern
5. **Nesting Depth**: If >3 levels, introduce early returns or extract functions

### Pattern Recognition

Look for these sophistication-building patterns:

1. **Strategy Pattern**: Multiple implementations of same interface
2. **Composition**: Small functions composed into larger workflows
3. **Pipeline Pattern**: Data flowing through transformation stages
4. **Factory Pattern**: Centralized object creation with variations
5. **Decorator Pattern**: Layered functionality additions

### Anti-Patterns (Entropy Builders)

Avoid these chaos-inducing patterns:

1. **God Functions**: 200+ line functions doing everything
2. **Callback Hell**: Deep nesting of async operations
3. **Copy-Paste Programming**: Duplicated logic with minor tweaks
4. **Magic Numbers**: Unexplained constants throughout
5. **Shotgun Surgery**: Changes requiring edits in 10+ places

## Integration with Clarity Codebase

### Special Considerations

1. **React Components**: Target 50-150 lines per component
2. **Server Actions**: Extract business logic to services
3. **API Routes**: Use consistent error handling patterns
4. **Database Queries**: Centralize in repositories
5. **Type Definitions**: Use canonical types from `/lib/types`

### Clarity-Specific Patterns

Recognize these project patterns as high-sophistication:

- **DAL Pattern**: `verifySession()`, `getUserId()` for auth
- **Repository Pattern**: Data access in `/lib/db/repositories`
- **Cache Components**: `'use cache'` with `cacheLife()`
- **Service Layer**: Business logic in `/lib/db/services`
- **Barrel Exports**: `from '@/lib/utils'` for clean imports

## Advanced: Resource-Bounded Sophistication

For complex files, consider **computational efficiency** constraints:

```typescript
interface ResourceBoundedMetrics {
  // Time complexity of understanding
  parseTime: number; // ms to parse AST
  comprehensionDepth: number; // avg jumps to understand function

  // Space complexity of mental model
  conceptCount: number; // unique abstractions
  dependencyFanout: number; // avg dependencies per module

  // Efficiency score
  sophisticationPerCost: number; // sophistication / (time + space)
}
```

Higher `sophisticationPerCost` = better code.

## References

- **Kolmogorov Complexity**: Length of shortest program to generate x
- **Sophistication**: Length of shortest program to generate set S containing x
- **Resource-Bounded Complexity**: Sophistication with efficiency constraints
- **Complextropy**: The "interesting middle zone" where sophistication peaks

## Success Criteria

A successful refactoring achieves:

1. ✅ Sophistication score: 40-70 (optimal zone)
2. ✅ Compression ratio: 60-75% (good patterns)
3. ✅ Pattern coverage: >70% (consistent structure)
4. ✅ Function length: <50 lines average
5. ✅ Nesting depth: ≤3 levels
6. ✅ Cyclomatic complexity: <10 per function
7. ✅ No decrease in functionality or type safety

## Example Usage

**User**: "Analyze lib/plaid/services/plaid-sync.ts for complextropy"

**Claude**:
1. Reads the 1,679-line file
2. Calculates sophistication metrics
3. Identifies it's in the "too-chaotic" zone (high entropy, low sophistication)
4. Proposes extracting 5-7 core patterns
5. Shows specific refactorings to move toward optimal zone
6. Estimates new sophistication score after changes

## Limitations

This skill analyzes **structural complexity**, not:
- Runtime performance (use profiling tools)
- Business logic correctness (use tests)
- Security vulnerabilities (use security-auditor skill)
- Type safety (use TypeScript compiler)

Focus is on **maintainability through optimal sophistication**.
