---
name: create-implementation-checklist
description: Builds a structured implementation checklist from a ticket (pasted content or, if available, a Linear ID/URL) for plan mode, using ticket context and codebase analysis. Use when planning work from a ticket ID or URL, pasted ticket details, or when the user asks for an implementation checklist.
---

# Create Implementation Checklist

Analyze a ticket and produce a structured implementation checklist suitable for plan mode. The ticket can come from pasted content or, when available, the Linear MCP.

## Instructions

1. **Resolve the ticket source** (in this order):
   - **Pasted content** — If the user pasted ticket details (title, description, acceptance criteria, comments), use them directly. This is the primary path in environments without a Linear connection.
   - **Linear MCP (optional fast path)** — Else, if the user gave a Linear ID/URL (e.g. `PROJ-123`, `LIN-456`, or a full Linear URL) **and** the `user-linear` MCP server is available:
     - Read tool schemas before calling if parameters are unclear.
     - `get_issue` with `id`, `includeRelations: true` — title, full description, acceptance criteria if in body, labels, priority, blocking/related issues.
     - `list_comments` with `issueId` for clarifications and thread context.
   - **Ask** — Else (a reference was given but no Linear MCP is available), ask the user to paste the ticket details (Title, Status/Priority, Description, Acceptance Criteria, Comments).

2. **Analyze the codebase** for:
   - Relevant files and patterns
   - Related components or services
   - Test expectations

3. **Emit the checklist** with sections: Prerequisites, Backend Implementation, Frontend Implementation, Testing, Edge Cases, Definition of Done.

4. **Output template** (adapt paths to this repo — `backend/`, `frontend/`, or `src/` as applicable):

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
