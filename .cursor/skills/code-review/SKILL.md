---
name: code-review
description: Conducts thorough code reviews for the stock trading demo with security, API, and testing checklists. Use when reviewing PRs or diffs, auditing changes, or when the user asks for a code review.
---

# Code Review

Act as a senior software engineer reviewing the stock trading demo application.

## Review checklist

### Security
- Check for vulnerabilities (SQL injection, XSS, authentication bypass)
- Verify sensitive data is not exposed in logs or error messages
- Ensure API endpoints have proper authentication/authorization
- Validate user inputs are sanitized

### Error handling
- Verify edge cases are covered
- Check errors return appropriate HTTP status codes
- Ensure messages are user-friendly without leaking sensitive info
- Verify try/catch (or equivalent) is used appropriately

### Code quality
- Follow project conventions (see `.cursor/rules/`)
- Check for duplication
- Verify functions are single-purpose and well-named
- Look for performance issues (N+1 queries, unnecessary loops)

### API design
- Verify REST conventions (see the `backend-rest-api` rule in `.cursor/rules/`)
- Appropriate HTTP methods and consistent URL patterns (`/api/v1/resource`)
- Validate request/response formats

### Frontend/backend integration
- API contracts match between client and server
- Error responses handled properly
- Data formatting is consistent (currency: the `frontend-format-currency` rule — `formatCurrency` from `frontend/utils/calculations.js`)

### Testing
- Tests exist for new behavior
- Edge cases covered
- Patterns match existing tests

## Output format

Provide actionable feedback with:
- **File and line references** (e.g. `src/services/csvExportService.js:45`)
- **Severity**: Critical / Major / Minor
- **Issue** with context
- **Suggested fixes** with code examples when useful
- **Impact** if relevant

Focus on maintainability, security, performance, and project rules.
