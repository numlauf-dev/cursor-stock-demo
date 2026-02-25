---
name: create-implementation-checklist
description: Analyze a Linear/Jira ticket and generate a structured implementation checklist suitable for plan mode
disable-model-invocation: true
---
# Create Implementation Checklist

Analyze a Linear/Jira ticket and generate a structured implementation checklist suitable for plan mode.

## Instructions

1. Parse the ticket reference from the user input (e.g., `PROJ-123`, `LIN-456`, or a full Linear URL)

2. Fetch complete ticket context using Linear MCP:
   - Call `mcp_linear_get_issue` with `includeRelations: true` to get:
     - Title and full description
     - Acceptance criteria (if present in description)
     - Labels and priority
     - Blocking/related issues
   - Call `mcp_linear_list_comments` for additional context or clarifications

3. Analyze the codebase to understand:
   - Relevant existing files and patterns
   - Related components or services
   - Test coverage expectations

4. Generate a structured implementation checklist with:
   - **Prerequisites** - Any setup, dependencies, or blocking items
   - **Backend Implementation** - API endpoints, services, database changes, server-side logic
   - **Frontend Implementation** - Components, hooks, pages, UI/UX changes
   - **Testing Requirements** - Unit tests, integration tests, manual verification
   - **Edge Cases & Considerations** - Potential gotchas or alternative scenarios
   - **Definition of Done** - Clear criteria for completion

5. Output the checklist in a format ready for plan mode:

```markdown
## Implementation Checklist: [Ticket ID] - [Title]

### Prerequisites
- [ ] ...

### Backend Implementation
#### API & Routes
- [ ] Create/modify endpoint: `POST /api/v1/...`
- [ ] Add route handler in `src/routes/...`

#### Services & Controllers
- [ ] Implement business logic in `src/services/...`
- [ ] Add controller methods in `src/controllers/...`

#### Database
- [ ] Add/modify Prisma schema
- [ ] Create migration
- [ ] Update seed data (if applicable)

#### Files to Modify (Backend)
- `src/routes/...` - Description of changes
- `src/controllers/...` - Description of changes
- `src/services/...` - Description of changes

### Frontend Implementation
#### Components
- [ ] Create/modify component: `src/components/...`
- [ ] Add styling and responsive design

#### State & Hooks
- [ ] Update context in `src/context/...`
- [ ] Add/modify hooks in `src/hooks/...`

#### Pages & Navigation
- [ ] Update page in `src/pages/...`
- [ ] Add routing if needed

#### Files to Modify (Frontend)
- `src/components/...` - Description of changes
- `src/pages/...` - Description of changes
- `src/context/...` - Description of changes

### Testing
#### Backend Tests
- [ ] Unit tests for services
- [ ] API endpoint integration tests

#### Frontend Tests
- [ ] Component unit tests
- [ ] Integration tests for user flows

#### Manual Verification
- [ ] Test in browser with dev server

### Edge Cases
- ...

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Backend tests passing
- [ ] Frontend tests passing
- [ ] No linting errors
- [ ] API follows REST conventions
```

## Usage

```
/create-implementation-checklist <ticket-id>
```

Examples:
- `/create-implementation-checklist LIN-123`
- `/create-implementation-checklist STOCK-45`
