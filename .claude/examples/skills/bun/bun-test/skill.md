---
name: bun-test
description: Use when writing tests with Bun's built-in test runner, creating mocks, assertions, snapshots, or measuring code coverage. Invoke for Bun testing questions, test configuration, or debugging test failures.
allowed-tools: Read, Grep, Glob
---

# Bun Test Runner Expert

## Purpose

Expert knowledge of Bun's built-in test runner. Covers test writing, assertions, mocking, snapshots, code coverage, and test configuration. **20-40x faster than Jest**.

## When to Use

Invoke this skill when:
- Writing tests with `bun test`
- Using assertions (`expect`, `toBe`, `toEqual`)
- Creating mocks or spies
- Generating snapshots
- Measuring code coverage
- Configuring test runners
- Debugging test failures
- Migrating from Jest/Vitest to Bun
- Setting up CI/CD testing

## Documentation Available

**Location**: `./docs/bun/test/`

**Coverage** (11 files):
- Writing tests (`test`, `describe`, `it`)
- Assertions (`expect` matchers)
- Mocks and spies
- Snapshot testing
- Code coverage reports
- Test lifecycle (`beforeAll`, `afterEach`, etc.)
- DOM testing
- Test configuration
- Watch mode
- Test reporters

## Related Skills

- **bun-runtime**: For testing servers and APIs built with Bun.serve
- **bun-package-manager**: For installing test dependencies
- **bun-quickstart**: For project setup with tests

## Best Practices

- **Use bun:test import** - Native test module
- **Write focused tests** - Use `.only` for debugging
- **Use describe blocks** - Organize related tests
- **Leverage --watch mode** - Faster feedback loop
- **Mock external dependencies** - Keep tests fast and isolated
- **Use snapshots sparingly** - Prefer explicit assertions
- **Measure coverage** - Aim for >80% coverage
- **Run tests in parallel** - Default behavior, much faster

## Examples

### Example 1: Basic Test Structure

**Question**: "How do I write tests with Bun?"

**Response**:
```typescript
// math.test.ts
import { describe, test, expect } from "bun:test"

describe("Math operations", () => {
  test("addition", () => {
    expect(2 + 2).toBe(4)
  })

  test("subtraction", () => {
    expect(10 - 3).toBe(7)
  })

  test("multiplication", () => {
    expect(3 * 4).toBe(12)
  })

  test("division", () => {
    expect(10 / 2).toBe(5)
  })
})
```

**Run tests**:
```bash
bun test                    # Run all tests
bun test math.test.ts       # Run specific file
bun test --watch            # Watch mode
bun test --coverage         # With coverage
```

**Performance**: Bun test is **20-40x faster than Jest**!

**References**:
- See: `docs/bun/test/writing.md`

### Example 2: Async Tests

**Question**: "How do I test async code?"

**Response**:
```typescript
import { test, expect } from "bun:test"

// Async/await
test("async test", async () => {
  const result = await fetchData()
  expect(result).toBe("data")
})

// Promise-based
test("promise test", () => {
  return fetchData().then(result => {
    expect(result).toBe("data")
  })
})

// With timeout
test("slow test", async () => {
  await slowOperation()
  expect(true).toBe(true)
}, 10000) // 10 second timeout
```

**References**:
- See: `docs/bun/test/writing.md`

### Example 3: Mocking

**Question**: "How do I create mocks?"

**Response**:
```typescript
import { test, expect, mock, spyOn } from "bun:test"

// Create mock function
test("mock function", () => {
  const mockFn = mock(() => "mocked!")

  expect(mockFn()).toBe("mocked!")
  expect(mockFn).toHaveBeenCalled()
  expect(mockFn).toHaveBeenCalledTimes(1)
})

// Mock with implementation
test("mock with args", () => {
  const add = mock((a: number, b: number) => a + b)

  expect(add(2, 3)).toBe(5)
  expect(add).toHaveBeenCalledWith(2, 3)
})

// Spy on object method
test("spy on method", () => {
  const obj = {
    getValue: () => "original",
  }

  const spy = spyOn(obj, "getValue")
  spy.mockReturnValue("mocked")

  expect(obj.getValue()).toBe("mocked")
  expect(spy).toHaveBeenCalled()

  spy.mockRestore() // Restore original
})

// Mock module
test("mock module", async () => {
  const { mock } = await import("bun:test")

  mock.module("./api", () => ({
    fetchUser: mock(() => ({ id: 1, name: "Test" })),
  }))

  const { fetchUser } = await import("./api")
  const user = await fetchUser()

  expect(user.name).toBe("Test")
})
```

**References**:
- See: `docs/bun/test/mocks.md`

### Example 4: Lifecycle Hooks

**Question**: "How do I set up/tear down tests?"

**Response**:
```typescript
import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll } from "bun:test"

describe("Database tests", () => {
  let db: Database

  // Run once before all tests
  beforeAll(async () => {
    db = await connectDatabase()
  })

  // Run before each test
  beforeEach(async () => {
    await db.clear()
  })

  // Run after each test
  afterEach(async () => {
    await db.rollback()
  })

  // Run once after all tests
  afterAll(async () => {
    await db.disconnect()
  })

  test("insert user", async () => {
    await db.insert({ name: "Alice" })
    const users = await db.getAll()
    expect(users).toHaveLength(1)
  })

  test("delete user", async () => {
    await db.insert({ name: "Bob" })
    await db.delete("Bob")
    const users = await db.getAll()
    expect(users).toHaveLength(0)
  })
})
```

**References**:
- See: `docs/bun/test/lifecycle.md`

### Example 5: Snapshot Testing

**Question**: "How do I use snapshots?"

**Response**:
```typescript
import { test, expect } from "bun:test"

test("component renders correctly", () => {
  const component = {
    type: "div",
    props: { className: "container" },
    children: ["Hello World"],
  }

  expect(component).toMatchSnapshot()
})

// Update snapshots with:
// bun test --update-snapshots
```

**Snapshots are saved to** `__snapshots__/` directory.

**References**:
- See: `docs/bun/test/snapshots.md`

## Common Matchers

### Equality
```typescript
expect(value).toBe(expected)           // Strict equality (===)
expect(value).toEqual(expected)        // Deep equality
expect(value).toStrictEqual(expected)  // Strict deep equality
```

### Truthiness
```typescript
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()
```

### Numbers
```typescript
expect(value).toBeGreaterThan(3)
expect(value).toBeGreaterThanOrEqual(3)
expect(value).toBeLessThan(10)
expect(value).toBeLessThanOrEqual(10)
expect(value).toBeCloseTo(0.3) // For floats
```

### Strings
```typescript
expect(str).toMatch(/pattern/)
expect(str).toContain("substring")
```

### Arrays/Objects
```typescript
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(obj).toHaveProperty("key")
expect(obj).toHaveProperty("nested.key", value)
```

### Functions
```typescript
expect(fn).toThrow()
expect(fn).toThrow("error message")
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
```

### Negation
```typescript
expect(value).not.toBe(other)
```

## Code Coverage

```bash
# Generate coverage report
bun test --coverage

# With specific threshold
bun test --coverage --coverage-threshold=80

# Output to file
bun test --coverage --coverage-reporter=lcov
```

**Coverage output**:
```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   87.5  |   75.0   |   90.0  |   87.5
 math.ts            |   100   |   100    |   100   |   100
 utils.ts           |   75    |   50     |   80    |   75
```

## Test Configuration

```typescript
// bunfig.toml
[test]
preload = ["./setup.ts"]  # Files to load before tests
coverage = true
coverageThreshold = 80
timeout = 5000            # Default timeout (ms)
```

## Watch Mode

```bash
# Watch mode (re-run on changes)
bun test --watch

# Watch specific files
bun test --watch math.test.ts
```

## Search Helpers

```bash
# Find test examples
grep -r "test\|describe\|expect" docs/bun/test/

# Find mock documentation
grep -r "mock\|spy" docs/bun/test/

# Find coverage docs
grep -r "coverage" docs/bun/test/

# List all test docs
ls docs/bun/test/
```

## Common Errors

- **Test timeout**: Async test takes too long
  - Solution: Increase timeout or fix slow code

- **Mock not working**: Module not properly mocked
  - Solution: Use `mock.module()` before importing

- **Snapshot mismatch**: Component output changed
  - Solution: Review changes, update with `--update-snapshots`

## Migration from Jest

Bun test is **mostly compatible with Jest**:

| Jest | Bun | Compatible? |
|------|-----|-------------|
| `describe/test/it` | ✅ Same | Yes |
| `expect` matchers | ✅ Same | Yes |
| `beforeAll/afterEach` | ✅ Same | Yes |
| `jest.fn()` | `mock()` | Slightly different |
| `jest.spyOn()` | `spyOn()` | Yes |
| Snapshot testing | ✅ Same | Yes |

**Migration steps**:
1. Replace `jest.fn()` with `mock()`
2. Change imports from `jest` to `bun:test`
3. Run `bun test` instead of `jest`

## Performance

- **20-40x faster than Jest**
- Tests run in parallel by default
- No transpilation needed (native TypeScript)
- Instant watch mode (no cache)

## Notes

- Documentation covers latest Bun version
- Bun test is built on JavaScriptCore (same as Safari)
- File paths reference local documentation cache
- For latest updates, check https://bun.sh/docs/cli/test
