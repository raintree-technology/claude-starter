---
name: test-generator
description: Use when creating unit tests, integration tests, or end-to-end tests. Generates comprehensive test suites with edge cases, mocks, and assertions.
allowed-tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# Test Generator Skill

## Purpose

This skill generates comprehensive test suites including:
- Unit tests for functions and classes
- Integration tests for modules
- End-to-end tests for user flows
- Mock data and fixtures
- Edge case coverage

## When to Use

This skill should be invoked when:
- Writing tests for new code
- Adding tests to untested code
- Improving test coverage
- Creating test fixtures
- Setting up testing infrastructure

## Process

1. **Analyze Code Under Test**
   - Identify functions/methods to test
   - Determine dependencies
   - Find edge cases
   - Identify error conditions

2. **Design Test Cases**
   - Happy path scenarios
   - Edge cases
   - Error conditions
   - Boundary values
   - Invalid inputs

3. **Create Mocks and Fixtures**
   - Mock external dependencies
   - Create test data
   - Setup test environment
   - Teardown after tests

4. **Write Assertions**
   - Verify return values
   - Check side effects
   - Assert error handling
   - Validate state changes

5. **Organize Tests**
   - Group related tests
   - Use descriptive names
   - Add setup/teardown
   - Document test purpose

## Output Format

```typescript
describe('FunctionName', () => {
  describe('when [condition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = ...;
      const expected = ...;

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => { ... });
    it('should handle empty input', () => { ... });
    it('should handle invalid input', () => { ... });
  });

  describe('error handling', () => {
    it('should throw error when [condition]', () => { ... });
  });
});
```

## Best Practices

- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Test one thing per test
- Include edge cases
- Test error conditions
- Keep tests independent
- Use meaningful assertions
- Avoid test interdependence

## Examples

### Example 1: Unit Test for Pure Function

**Input**: "Generate tests for calculateDiscount function"

**Process**:
1. Analyze function signature
2. Identify edge cases (0%, 100%, negative)
3. Test boundary values
4. Test invalid inputs

**Output**:
```typescript
describe('calculateDiscount', () => {
  it('should calculate 10% discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it('should return original price for 0% discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('should handle 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('should throw error for negative discount', () => {
    expect(() => calculateDiscount(100, -10)).toThrow();
  });

  it('should throw error for discount > 100', () => {
    expect(() => calculateDiscount(100, 150)).toThrow();
  });
});
```

### Example 2: Integration Test with Mocks

**Input**: "Test user service that calls database and email service"

**Process**:
1. Mock database calls
2. Mock email service
3. Test success path
4. Test failure scenarios
5. Verify mock calls

**Output**: Complete test suite with mocks and assertions

## Error Handling

- **No testable code**: Request code to test
- **Complex dependencies**: Create appropriate mocks
- **Unknown test framework**: Ask for framework preference

## Notes

- Adjust test style to match project conventions
- Use project's existing test framework
- Generate realistic test data
- Consider test performance
- Aim for high coverage on critical paths
