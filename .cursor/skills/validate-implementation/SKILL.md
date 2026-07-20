---
name: validate-implementation
description: Validates that an implementation matches requirements and project standards before sign-off. Use after finishing a feature, when checking a plan against code, or when the user asks to validate an implementation.
---

# Validate Implementation

Review the implementation against requirements and project standards.

## Validation checklist

### Requirements coverage
- All plan/ticket requirements are implemented
- Edge cases handled
- User stories / acceptance criteria met

### Project standards
- Follows the project rules in `.cursor/rules/` (`frontend-format-currency`: currency via `formatCurrency`; `backend-rest-api`: REST conventions)
- Naming and file organization match the project

### Integration
- New code fits the existing codebase
- Dependencies imported correctly
- No unintended breaking changes

### Documentation
- Comments where complexity warrants them
- API changes documented as appropriate for this repo

## Output format

- **Status**: Complete / Needs work / Missing (use clear labels; emoji optional)
- **Requirements**: Which are met vs missing
- **Issues**: Specific problems with file references
- **Recommendations**: What to fix or improve
