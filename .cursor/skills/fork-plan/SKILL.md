---
name: fork-plan
description: Optional tool to split a unified implementation plan into separate backend and frontend plan files. Use ONLY when the backend/frontend seam is genuinely clean and the API contract is locked. The default ticket workflow runs a single fullstack implementer (see fullstack-ticket-workflow); reach for this only for explicit layered parallelization.
---

# Fork Plan

> Optional / advanced. The default `fullstack-ticket-workflow` builds a ticket as one vertical slice with a single `feature-implementer`, which avoids the coordination overhead of splitting a feature across two agents. Use this skill only when the backend and frontend are genuinely independent surfaces with a locked contract, and the user explicitly wants layered parallel execution. Most single tickets do not bisect cleanly — do not force a fork.

Split a unified `.plan.md` into two parallel-safe plans — one backend, one frontend — that can be executed concurrently (e.g., via two `best-of-n-runner` subagents).

## Instructions

### 1. Locate the Source Plan

- If the user provides a path or plan name, read that file.
- Otherwise look in `.cursor/plans/` for the most recently modified `.plan.md`.
- If ambiguous, ask which plan to fork.

Read the full plan file. Parse:
- YAML frontmatter (`name`, `overview`, `todos`, `isProject`)
- Markdown body (Current State, Implementation steps, Key Decisions, Edge Cases)

### 2. Identify the API Contract

Scan the source plan and any linked ticket (pasted, Jira, or Linear) for the **shared interface** between backend and frontend. This is typically:
- REST endpoint path, method, query params
- Request/response JSON schema
- Error status codes and shapes

Extract this into a standalone section that both child plans will reference. If the source plan doesn't contain an explicit contract, construct one from the endpoint descriptions and acceptance criteria.

### 3. Classify Every Todo and Implementation Step

Walk each todo and its corresponding implementation section. Classify as:

| Category | Heuristic |
|----------|-----------|
| **backend** | Touches `backend/`, `tests/` (API tests), creates routes/controllers/services/validators, modifies `server.js` |
| **frontend** | Touches `frontend/`, creates components/hooks/pages/services/context, modifies `App.jsx` |
| **shared** | Installs dependencies in root `package.json`, modifies shared config, or is a prerequisite for both sides |

**Shared items**: duplicate into both plans as a prerequisite, or assign to whichever side is the natural owner (e.g., a new npm dependency used only by the frontend goes into the FE plan).

### 4. Generate the Backend Plan

Create `.cursor/plans/<ticket>-backend.plan.md` with:

**Frontmatter:**
```yaml
---
name: "<Ticket ID> Backend"
overview: "<1-2 sentence summary of backend scope. End with: 'Implements the server side of the API contract shared with the frontend plan.'"
todos:
  - id: <be-kebab-id>
    content: <task description>
    status: pending
  # ... one todo per implementation step
isProject: false
---
```

**Markdown body sections:**

1. **API Contract** — the shared contract extracted in step 2. Rendered as endpoint signature + JSON response schema + error codes. This section must be identical in both plans.

2. **Current State** — backend-only context (existing routes, controllers, services, test coverage).

3. **Implementation** — numbered steps covering only backend work. Each step must reference concrete file paths. Follow the same level of detail as the source plan.

4. **Key Decisions** — backend-specific architectural choices.

5. **Edge Cases** — backend error handling, validation, provider failures.

6. **Testing** — backend test additions/modifications with file paths.

### 5. Generate the Frontend Plan

Create `.cursor/plans/<ticket>-frontend.plan.md` with the same structure, scoped to frontend:

**Frontmatter:** Same pattern, `name: "<Ticket ID> Frontend"`, todos prefixed `fe-`.

**Markdown body sections:**

1. **API Contract** — identical copy of the shared contract from step 2. Add a note: *"The backend plan implements this contract. For local development, mock responses matching this schema if the backend isn't running yet."*

2. **Current State** — frontend-only context (existing pages, components, hooks, services).

3. **Implementation** — numbered steps for components, hooks, services, pages. Each step references concrete file paths.

4. **Key Decisions** — frontend-specific choices (library, component structure, state management).

5. **Edge Cases** — loading/empty/error UI states, offline behavior.

6. **Testing** — frontend test additions and manual verification steps.

### 6. Parallel-Safety Checklist

Before writing the files, verify:

- [ ] No file path appears in both plans (except `package.json` for independent dependency additions)
- [ ] The API contract section is identical in both plans
- [ ] Each plan is self-contained — an agent can execute it without reading the other plan
- [ ] Shared prerequisites are assigned to the correct plan or duplicated with a note
- [ ] Todo IDs are globally unique across both plans (`be-` and `fe-` prefixes)
- [ ] Both plans reference the project rules in `.cursor/rules/` (`frontend-format-currency`: `formatCurrency` where applicable; `backend-rest-api`: REST conventions for BE)

### 7. Write Output

Write both plan files to `.cursor/plans/`. Report to the user:

- Paths of the two new plan files
- Count of todos in each
- Any shared items that were duplicated and why
- Confirmation that no file paths overlap between plans
- Suggested next step: launch two `best-of-n-runner` subagents, one per plan

## Naming Convention

```
.cursor/plans/<ticket-lowercase>-backend.plan.md
.cursor/plans/<ticket-lowercase>-frontend.plan.md
```

Examples:
- `demo-19-backend.plan.md` / `demo-19-frontend.plan.md`
- `sol-5-backend.plan.md` / `sol-5-frontend.plan.md`

## Usage

```
fork the plan for DEMO-19
split .cursor/plans/demo-19.plan.md into backend and frontend
```
