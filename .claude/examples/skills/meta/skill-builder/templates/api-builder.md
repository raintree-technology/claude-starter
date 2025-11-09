---
name: api-builder
description: Use when creating REST or GraphQL API endpoints. Implements proper routing, validation, error handling, authentication, and follows API best practices.
model: sonnet
---

# API Builder Skill

## Purpose

This skill helps build production-ready API endpoints with:
- Proper HTTP methods and status codes
- Request validation
- Error handling
- Authentication/authorization
- Rate limiting
- API documentation

## When to Use

This skill should be invoked when:
- Creating new API endpoints
- Implementing REST or GraphQL APIs
- Adding API authentication
- Building API middleware
- Documenting API endpoints

## Process

1. **Define API Structure**
   - Determine HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Design URL path structure
   - Define request/response schemas
   - Specify authentication requirements

2. **Implement Validation**
   - Validate request body
   - Validate query parameters
   - Validate path parameters
   - Validate headers
   - Return appropriate error messages

3. **Add Error Handling**
   - Catch and handle errors gracefully
   - Return proper HTTP status codes
   - Provide helpful error messages
   - Log errors appropriately

4. **Implement Authentication**
   - Add authentication middleware
   - Verify tokens/sessions
   - Check user permissions
   - Handle unauthorized access

5. **Add Documentation**
   - Document request format
   - Document response format
   - Provide example requests
   - List possible error codes

## Output Format

For each endpoint, provide:

```typescript
// Route definition
// Method: POST
// Path: /api/v1/users
// Auth: Required (Bearer token)

interface CreateUserRequest {
  email: string;
  name: string;
  role?: 'user' | 'admin';
}

interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

// Error responses:
// 400 - Validation error
// 401 - Unauthorized
// 409 - User already exists
// 500 - Internal server error
```

## Best Practices

- Use semantic HTTP methods
- Version your APIs (/api/v1/)
- Always validate input
- Return consistent error formats
- Use proper status codes
- Implement rate limiting
- Add request logging
- Document all endpoints

## Examples

### Example 1: Create User Endpoint

**Input**: "Create an API endpoint to register new users"

**Process**:
1. Define POST /api/v1/users endpoint
2. Add email/password validation
3. Hash password before storage
4. Implement duplicate email check
5. Return user object with token

**Output**: Complete endpoint with validation, error handling, and tests

### Example 2: List Resources with Pagination

**Input**: "Create endpoint to list products with filtering"

**Process**:
1. Define GET /api/v1/products endpoint
2. Add pagination (page, limit)
3. Add filtering (category, price range)
4. Add sorting options
5. Return paginated results with metadata

## Error Handling

- **Invalid input**: Return 400 with validation errors
- **Not found**: Return 404 with helpful message
- **Server error**: Return 500 and log error
- **Rate limit**: Return 429 with retry-after header

## Notes

- Follow REST principles for REST APIs
- Use GraphQL schema for GraphQL APIs
- Consider API versioning from the start
- Implement proper CORS headers
- Add OpenAPI/Swagger documentation
