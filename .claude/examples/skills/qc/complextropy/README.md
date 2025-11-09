# Complextropy Analyzer Skill

This skill applies **sophistication theory** from Kolmogorov complexity to analyze and refactor code files, helping you achieve optimal "complextropy" - the sweet spot between overly simple and chaotically complex code.

## The Theory

Based on Scott Aaronson's "First Law of Complexodynamics":

> Complexity doesn't increase monotonically - it increases to a maximum and then decreases.

Similar to the coffee cup example:
- **Initial state** (unmixed): Low entropy, low complexity
- **Middle state** (swirling): High complexity, interesting patterns
- **Final state** (fully mixed): High entropy, but simple again

The goal is to keep code in the **middle zone** where sophistication is maximized.

## What This Skill Does

1. **Analyzes files** using multiple complexity metrics:
   - Kolmogorov complexity proxies (compression ratios)
   - Sophistication indicators (pattern discovery)
   - Entropy metrics (randomness measures)

2. **Identifies the complexity zone**:
   - **Too Simple**: Lacks necessary structure (extract abstractions)
   - **Optimal**: Well-structured with discoverable patterns (maintain)
   - **Too Chaotic**: Random-looking, no patterns (normalize structure)

3. **Provides refactoring recommendations** with:
   - Specific issues found
   - Before/after code examples
   - Estimated sophistication improvement
   - Priority levels

## Usage

### Invoke the skill

```
complextropy
```

Then specify the file to analyze:

```
Analyze lib/plaid/services/plaid-sync.ts for complextropy
```

### Output

You'll receive a detailed report showing:
- Current sophistication score (0-100)
- Complexity zone position
- Detected patterns
- Specific refactoring actions
- Estimated improvements

## Key Metrics

### Sophistication Score (0-100)

Measures how well the code balances structure vs randomness:
- **0-30**: Too simple or too chaotic (needs work)
- **40-70**: Optimal zone (good code!)
- **70-100**: Very structured but potentially over-engineered

### Complextropy Zones

1. **Too Simple** (Low Sophistication, Low Entropy)
   - God functions
   - No abstractions
   - Flat structure
   - **Fix**: Extract patterns, add layers

2. **Optimal** (High Sophistication)
   - Discoverable patterns
   - Appropriate abstractions
   - Consistent structure
   - **Fix**: Minor refinements only

3. **Too Chaotic** (High Entropy, Low Sophistication)
   - Deep nesting
   - No pattern reuse
   - Irregular structure
   - **Fix**: Normalize, extract patterns

## Examples

### Example 1: Too Simple Code

```typescript
// BEFORE: Sophistication score 25 (too simple)
function processData(data: any) {
  // 500 lines of inline logic
  // No abstractions
  // Everything in one function
}
```

```typescript
// AFTER: Sophistication score 55 (optimal)
function processData(data: ProcessedData): Result {
  const validated = validateData(data);
  const transformed = transformData(validated);
  const enriched = enrichData(transformed);
  return calculateResult(enriched);
}
// Each helper follows same pattern
// Discoverable structure
// Appropriate abstraction layers
```

**Impact**: +30 sophistication points

### Example 2: Too Chaotic Code

```typescript
// BEFORE: Sophistication score 28 (too chaotic)
if (type === 'A') {
  if (status === 'active') {
    if (amount > 100) {
      if (currency === 'USD') {
        // Deep nesting
        // No pattern
      }
    }
  }
}
// Different pattern for type 'B'
// Different pattern for type 'C'
// No consistency
```

```typescript
// AFTER: Sophistication score 58 (optimal)
const handlers = {
  A: handleTypeA,
  B: handleTypeB,
  C: handleTypeC,
};

function handleTypeA(data: TypeAData): Result {
  if (!isActive(data.status)) return early();
  if (!meetsThreshold(data.amount)) return early();
  if (!isValidCurrency(data.currency)) return early();
  return process(data);
}
// Same pattern for all types
// Early returns reduce nesting
// Discoverable structure
```

**Impact**: +30 sophistication points

## When to Use

Use this skill when:
- Files exceed 500 lines
- Code reviews suggest "hard to follow"
- Cyclomatic complexity is high
- Copy-paste patterns emerge
- Refactoring existing code
- Establishing coding standards

## Integration with Clarity

This skill recognizes Clarity-specific patterns as high-sophistication:

- **DAL Pattern**: `verifySession()`, `getUserId()`
- **Repository Pattern**: Data access in `/lib/db/repositories`
- **Cache Components**: `'use cache'` with `cacheLife()`
- **Service Layer**: Business logic in `/lib/db/services`
- **Barrel Exports**: `from '@/lib/utils'`

## Theory References

- **Kolmogorov Complexity**: K(x) = length of shortest program to generate x
- **Sophistication**: Soph(x) = length of shortest program to generate set S containing x as "random" member
- **Resource-Bounded Sophistication**: Sophistication with computational efficiency constraints
- **Complextropy**: The "interesting middle zone" where sophistication peaks

## Files in This Skill

- `skill.md`: Full theory and instructions
- `resources/metrics.ts`: Metrics calculation algorithms
- `resources/analyzer.ts`: Analysis engine and report generator
- `README.md`: This file

## Limitations

This skill analyzes **structural complexity**, not:
- Runtime performance (use profiling)
- Business logic correctness (use tests)
- Security vulnerabilities (use security-auditor)
- Type safety (use TypeScript compiler)

Focus is on **maintainability through optimal sophistication**.

## Credits

Based on Scott Aaronson's blog post "The First Law of Complexodynamics" exploring the non-monotonic nature of complexity in physical and computational systems.
