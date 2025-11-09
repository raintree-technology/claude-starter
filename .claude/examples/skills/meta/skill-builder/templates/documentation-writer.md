---
name: documentation-writer
description: Use when creating or updating technical documentation, README files, API docs, or inline code comments. Follows documentation best practices and clear writing principles.
allowed-tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# Documentation Writer Skill

## Purpose

This skill creates clear, comprehensive technical documentation including:
- README files
- API documentation
- Code comments
- Architecture docs
- User guides
- Developer onboarding docs

## When to Use

This skill should be invoked when:
- Creating project README files
- Documenting APIs
- Writing developer guides
- Adding code comments
- Creating architecture documentation
- Updating outdated docs

## Process

1. **Understand the Audience**
   - Identify who will read this
   - Determine their knowledge level
   - Consider their goals

2. **Structure the Content**
   - Start with overview
   - Add table of contents
   - Organize logically
   - Use clear headings

3. **Write Clear Content**
   - Use simple language
   - Provide examples
   - Include code snippets
   - Add visual aids if helpful

4. **Add Practical Elements**
   - Installation instructions
   - Usage examples
   - Common issues/solutions
   - Links to related docs

5. **Review and Refine**
   - Check for clarity
   - Verify accuracy
   - Test code examples
   - Fix formatting

## Output Format

### README Structure
```markdown
# Project Name

Brief description of what this project does

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

```bash
# Installation commands
```

## Usage

```javascript
// Usage examples
```

## API Reference

### FunctionName

Description of function

**Parameters:**
- `param1` (type): Description
- `param2` (type): Description

**Returns:** Description of return value

**Example:**
```javascript
// Example usage
```

## Contributing

How to contribute to the project

## License

License information
```

## Best Practices

- Write for humans, not machines
- Use concrete examples
- Keep it up-to-date
- Use consistent formatting
- Include a table of contents
- Add badges for status/version
- Link to related resources
- Use proper markdown formatting

## Examples

### Example 1: README for Library

**Input**: "Create README for authentication library"

**Process**:
1. Describe what it does
2. Show installation steps
3. Provide usage examples
4. Document API methods
5. Add troubleshooting section

**Output**: Complete README with all sections

### Example 2: API Documentation

**Input**: "Document REST API endpoints"

**Process**:
1. List all endpoints
2. Show request/response format
3. Include authentication details
4. Provide curl examples
5. Document error codes

**Output**: Comprehensive API docs

### Example 3: Code Comments

**Input**: "Add comments to complex function"

**Process**:
1. Explain function purpose
2. Document parameters
3. Describe return value
4. Note side effects
5. Add usage example

**Output**:
```javascript
/**
 * Calculates the total price including tax and discount
 *
 * @param {number} basePrice - The original price before modifications
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param {number} discountPercent - Discount as percentage (0-100)
 * @returns {number} Final price after tax and discount
 * @throws {Error} If any parameter is negative
 *
 * @example
 * calculateTotal(100, 0.08, 10) // Returns 97.2
 * // Base: $100, Discount: -$10 = $90, Tax: +$7.2 = $97.2
 */
function calculateTotal(basePrice, taxRate, discountPercent) {
  // Implementation
}
```

## Error Handling

- **Missing context**: Ask for more details about the project
- **Technical terms unclear**: Request clarification
- **Multiple audiences**: Create separate docs for each

## Notes

- Documentation is code - keep it in version control
- Update docs when code changes
- Use examples from actual use cases
- Consider internationalization needs
- Add diagrams for complex concepts
- Keep security considerations in mind
