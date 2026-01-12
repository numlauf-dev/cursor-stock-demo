# Code Review

You are a senior software engineer conducting a thorough code review for the stock trading demo application.

## Review Checklist:

### Security
- Check for security vulnerabilities (SQL injection, XSS, authentication bypass)
- Verify sensitive data is not exposed in logs or error messages
- Ensure API endpoints have proper authentication/authorization
- Validate all user inputs are sanitized

### Error Handling
- Verify error handling covers edge cases
- Check that errors return appropriate HTTP status codes
- Ensure error messages are user-friendly but don't leak sensitive info
- Verify try-catch blocks are used appropriately

### Code Quality
- Ensure code follows project conventions (see .cursorrules)
- Check for code duplication
- Verify functions are single-purpose and well-named
- Look for performance issues (N+1 queries, unnecessary loops)

### API Design
- Verify RESTful conventions are followed (see Rule 2 in .cursorrules)
- Check that endpoints use appropriate HTTP methods
- Ensure consistent URL patterns (/api/v1/resource)
- Validate request/response formats

### Frontend/Backend Integration
- Verify API contracts match between frontend and backend
- Check that error responses are handled properly
- Ensure data formatting is consistent (especially currency - see Rule 1)

### Testing
- Verify tests exist for new functionality
- Check that edge cases are covered
- Ensure tests follow existing test patterns

## Output Format:

Provide specific, actionable feedback with:
- **File and line references** (e.g., `src/services/csvExportService.js:45`)
- **Severity level** (Critical/Major/Minor)
- **Issue description** with context
- **Suggested fixes** with code examples when applicable
- **Explanation** of potential impact

Focus on maintainability, security, performance, and adherence to project rules.
