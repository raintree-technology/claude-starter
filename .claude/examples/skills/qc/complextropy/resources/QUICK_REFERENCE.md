# Complextropy Quick Reference

## The Coffee Cup Analogy

```
Unmixed Coffee        Swirling Tendrils      Fully Mixed
(too simple)          (optimal!)             (too chaotic)
     |                      |                      |
Low Entropy ──────► High Complextropy ──────► High Entropy
Soph: 20                Soph: 60               Soph: 25
```

## Target Metrics

| Metric | Optimal Range | Meaning |
|--------|--------------|---------|
| **Sophistication Score** | 40-70 | Sweet spot between simple and chaotic |
| **Compression Ratio** | 60-75% | Good pattern density |
| **Pattern Coverage** | >70% | Most code follows consistent patterns |
| **Cyclomatic Complexity** | <10/function | Manageable decision density |
| **Nesting Depth** | ≤3 levels | Traceable logic flow |
| **Function Length** | 10-50 lines | Discoverable scope |

## The Three Zones

### 🔵 Too Simple (Soph < 40, Entropy < 50)

**Symptoms:**
- Single giant function (God function)
- No abstraction layers
- Everything inline
- Flat structure

**Fix Strategies:**
- Extract functions
- Add abstraction layers
- Create domain types
- Introduce patterns

**Example:**
```typescript
// BEFORE: All logic in one place
function doEverything(data: any) {
  // 500 lines of mixed concerns
}

// AFTER: Discoverable structure
function processData(data: Data): Result {
  const validated = validate(data);
  const transformed = transform(validated);
  return calculate(transformed);
}
```

### 🟢 Optimal (Soph 40-70)

**Characteristics:**
- Discoverable patterns
- Meaningful abstractions
- Composable units
- Consistent style
- High signal/noise ratio

**Actions:**
- Minor refinements only
- Maintain current structure
- Document patterns

### 🔴 Too Chaotic (Soph < 40, Entropy > 50)

**Symptoms:**
- No discoverable patterns
- Deep nesting (>3 levels)
- Every problem solved differently
- Copy-paste with variations
- Magic values everywhere

**Fix Strategies:**
- Extract repeated patterns
- Normalize structure
- Reduce nesting (early returns)
- Consolidate error handling
- Extract constants

**Example:**
```typescript
// BEFORE: Deep nesting, no pattern
if (a) {
  if (b) {
    if (c) {
      if (d) {
        // logic
      }
    }
  }
}

// AFTER: Early returns, flat structure
if (!a) return;
if (!b) return;
if (!c) return;
if (!d) return;
// logic
```

## Quick Checks

### 1. Gzip Test
```bash
gzip -c file.ts | wc -c
```
- Ratio >80% → Too repetitive (too simple)
- Ratio <40% → Too random (too chaotic)
- Ratio 60-75% → Optimal pattern density

### 2. Unique Token Test
```typescript
uniqueTokens / totalTokens
```
- <30% → Too repetitive
- >70% → Too random
- 30-50% → Good balance

### 3. Function Length Test
- >100 lines → Extract patterns
- <10 lines (everywhere) → Maybe over-abstracted
- 10-50 lines → Usually optimal

### 4. Nesting Depth Test
```typescript
function check() {
  if (...) {         // Level 1
    if (...) {       // Level 2
      if (...) {     // Level 3
        if (...) {   // Level 4 - TOO DEEP!
```
- ≤3 levels → Good
- >3 levels → Refactor with early returns

### 5. Copy-Paste Test
Same block appears 3+ times → Extract pattern

## Pattern Recognition

### High-Sophistication Patterns

✅ **Strategy Pattern**
```typescript
const handlers = {
  typeA: handleA,
  typeB: handleB,
};
```

✅ **Composition**
```typescript
const result = pipe(
  validate,
  transform,
  calculate
)(data);
```

✅ **Early Returns**
```typescript
if (!valid) return error;
if (!authorized) return error;
// happy path
```

### Low-Sophistication Anti-Patterns

❌ **God Function**
```typescript
function doEverything() {
  // 500 lines
}
```

❌ **Callback Hell**
```typescript
a(() => {
  b(() => {
    c(() => {
      d(() => {
        // ...
      });
    });
  });
});
```

❌ **Copy-Paste Programming**
```typescript
// Same logic 10 times with minor tweaks
```

## Refactoring Priority

### High Priority (Soph < 30)
- File is in wrong zone (too simple or too chaotic)
- Major structural issues
- Refactor immediately

### Medium Priority (Soph 30-40)
- Approaching problematic zone
- Some structural issues
- Refactor when convenient

### Low Priority (Soph > 40)
- In or near optimal zone
- Minor refinements only
- Optional improvements

## Complexity Metrics Formulas

### Sophistication Score
```
sophisticationScore =
  compressionScore * 0.3 +
  patternScore * 0.3 +
  nestingScore * 0.2 +
  complexityScore * 0.2
```

### Entropy Score
```
entropyScore =
  shannonEntropy * 0.5 +
  uniqueTokenRatio * 0.5
```

### Zone Determination
```
if (soph >= 40 && soph <= 70):
  zone = "optimal"
elif (soph < 40 && entropy < 50):
  zone = "too-simple"
else:
  zone = "too-chaotic"
```

## Common Refactorings by Zone

### Too Simple → Optimal
1. Extract functions from God function
2. Introduce abstraction layers
3. Create domain-specific types
4. Add design patterns
5. Separate concerns

### Too Chaotic → Optimal
1. Extract repeated patterns
2. Normalize similar code paths
3. Reduce nesting with early returns
4. Unify error handling
5. Extract magic values to constants
6. Consolidate similar functions

## Interpreting Reports

```markdown
Sophistication Score: 28/100  ← LOW = needs work
Entropy Score: 75/100         ← HIGH = chaotic
Complextropy Zone: too-chaotic ← ACTION NEEDED
```

**Action**: Focus on reducing entropy by extracting patterns

```markdown
Sophistication Score: 55/100  ← GOOD
Entropy Score: 45/100         ← BALANCED
Complextropy Zone: optimal    ← MAINTAIN
```

**Action**: Minor refinements only

## Theory TL;DR

- **Kolmogorov Complexity**: Shortest program to generate output
- **Sophistication**: Shortest program to generate *pattern* that output follows
- **Complextropy**: Resource-bounded sophistication (considers efficiency)
- **Goal**: Maximize sophistication = discoverable patterns without chaos

## When to Use

✅ **Good use cases:**
- Large files (>500 lines)
- Before major refactoring
- Code review preparation
- Establishing patterns
- Complexity reduction

❌ **Not for:**
- Runtime performance (use profiler)
- Correctness (use tests)
- Security (use security-auditor)
- Type safety (use TypeScript)

## Remember

> "The goal is not to minimize complexity, but to maximize sophistication -
> to create code that is complex enough to solve the problem, but structured
> enough to be understood."

**Optimal code exists in the interesting middle zone where patterns are discoverable.**
