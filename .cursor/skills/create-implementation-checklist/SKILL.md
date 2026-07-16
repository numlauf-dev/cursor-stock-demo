---
name: create-implementation-checklist
description: Builds a structured implementation checklist from a Linear issue for plan mode, using ticket context and codebase analysis. Use when planning work from a ticket ID or URL, or when the user asks for an implementation checklist from Linear.
---

# Create Implementation Checklist

Analyze a Linear issue and produce a structured implementation checklist suitable for plan mode.

## Instructions

1. **Parse the ticket reference** from the user input (e.g. `PROJ-123`, `LIN-456`, or a full Linear URL).

2. **Fetch ticket context** via Linear MCP (`user-linear` server):
   - Read tool schemas before calling if parameters are unclear.
   - `get_issue` with `id`, `includeRelations: true` — title, full description, acceptance criteria if in body, labels, priority, blocking/related issues.
   - `list_comments` with `issueId` for clarifications and thread context.

3. **Analyze the codebase** for:
   - Relevant files and patterns
   - Related components or services
   - Test expectations

4. **Emit the checklist** with sections: Prerequisites, Backend Implementation, Frontend Implementation, Testing, Edge Cases, Definition of Done.

5. **Output template** (adapt paths to this repo — `backend/`, `frontend/`, or `src/` as applicable):

```markdown
## Implementation Checklist: [Ticket ID] - [Title]

### Prerequisites
- [ ] ...

### Backend Implementation
#### API & Routes
- [ ] Create/modify endpoint: `POST /api/v1/...`
- [ ] Add route handler in `...`

#### Services & Controllers
- [ ] Implement logic in `...`
- [ ] Controller changes in `...`

#### Database
- [ ] Schema/migrations if applicable
- [ ] Seed updates if applicable

#### Files to Modify (Backend)
- `path` — summary

### Frontend Implementation
#### Components
- [ ] Create/modify components

#### State & Hooks
- [ ] Context/hooks as needed

#### Pages & Navigation
- [ ] Pages and routing

#### Files to Modify (Frontend)
- `path` — summary

### Testing
#### Backend Tests
- [ ] Unit/integration tests for new API behavior

#### Frontend Tests
- [ ] Component/integration tests as appropriate

#### Manual Verification
- [ ] Browser / E2E checks if needed

### Edge Cases
- ...

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Tests passing
- [ ] No new lint issues
- [ ] API follows REST conventions (`.cursorrules`)
- [ ] Currency display uses `formatCurrency` where applicable
```

Keep checkboxes concrete and tied to real paths discovered in the repo.
