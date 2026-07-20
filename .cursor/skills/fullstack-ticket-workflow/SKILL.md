---
name: fullstack-ticket-workflow
description: Orchestrates a full-stack ticket workflow for the stock demo (pasted ticket supported; Jira/Linear optional): fetch ticket context, create an implementation checklist, fork backend/frontend plans, propose parallel subagents, and pause for approval before execution. Use when the user wants to plan and parallelize a ticket end-to-end.
---

# Fullstack Ticket Workflow

Use this skill to turn a ticket into parallel-safe backend and frontend execution plans. The ticket can come from pasted content or, when available, the Jira (Atlassian) or Linear MCP. This is a planning workflow first: do not modify product code or launch implementation subagents until the user approves the generated plans.

## Workflow

1. **Fetch ticket context**
   - Accept the ticket from pasted content, or parse a Jira issue key/URL or Linear ID/URL from the user message.
   - If no ticket content or reference is provided, ask for one before continuing (a pasted ticket is fine).
   - Apply the `do-ticket` workflow: resolve the ticket source (pasted content first, then Jira/Linear MCP when available) and gather details, description, comments, acceptance criteria, labels, assignee, priority, and related issues.

2. **Create an implementation checklist**
   - Apply `create-implementation-checklist`.
   - Analyze the repo before drafting the checklist.
   - Include prerequisites, backend work, frontend work, testing, edge cases, and definition of done.

3. **Create a unified source plan**
   - Save the unified plan to `.cursor/plans/<ticket-lowercase>.plan.md`.
   - Include ticket summary, acceptance criteria, API contract if applicable, backend tasks, frontend tasks, test plan, and edge cases.
   - Include YAML frontmatter compatible with `fork-plan`: `name`, `overview`, `todos`, and `isProject`.
   - If the ticket touches both backend and frontend, define the shared API contract explicitly: method, path, query/body params, response JSON, and error states.
   - If the API contract is ambiguous, draft a proposed contract and call it out as an assumption in the plan.

4. **Fork the plan**
   - Apply `fork-plan`.
   - Create `.cursor/plans/<ticket-lowercase>-backend.plan.md`.
   - Create `.cursor/plans/<ticket-lowercase>-frontend.plan.md`.
   - Ensure both child plans share the same API contract.
   - Ensure no file paths overlap unless explicitly marked as shared.
   - If the ticket is clearly backend-only or frontend-only, do not force a fork; create one scoped plan and explain why parallel execution is not useful.

5. **Recommend subagents**
   - Backend implementation: `backend-implementation`
   - Frontend implementation: `frontend-implementer`
   - Backend security follow-up: `api-security-auditor`
   - Use `best-of-n-runner` only when isolated worktrees are desired.

6. **Pause before execution**
   - Do not launch implementation subagents automatically.
   - Present the ticket summary, generated plan paths, backend/frontend task counts, proposed subagents, shared API contract, and any shared risks.
   - Ask: `Proceed with parallel execution?`

## Execution Prompt Templates

Use these prompts only after the user approves execution.

Launch backend and frontend implementation subagents in a single parallel tool call when both plans exist. Keep each prompt scoped to its plan so the agents do not edit overlapping files.

### Backend

```md
Execute `.cursor/plans/<ticket>-backend.plan.md`.

Stay within the backend scope. Use the `backend-implementation` agent conventions and the `scaffold-api-endpoint` skill where relevant. Do not modify frontend files. Report files changed, tests run, and any blockers.
```

### Frontend

```md
Execute `.cursor/plans/<ticket>-frontend.plan.md`.

Stay within the frontend scope. Use the `frontend-implementer` agent conventions and the `scaffold-ui-component` skill where relevant. Do not modify backend files. Report files changed, verification run, and any blockers.
```

## Output Format

```md
## Ticket
<id> - <title>

## Shared Contract
<method/path and short response-shape summary, or "N/A">

## Plans Created
- Unified: `.cursor/plans/...`
- Backend: `.cursor/plans/...`
- Frontend: `.cursor/plans/...`

## Proposed Parallel Execution
- Backend: `backend-implementation`
- Frontend: `frontend-implementer`
- Follow-up: `api-security-auditor`

## Risks / Assumptions
- <shared dependency, unclear contract, or "None">

## Approval Needed
Proceed with parallel execution?
```
