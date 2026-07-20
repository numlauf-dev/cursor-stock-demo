---
name: do-ticket
description: Fetches a ticket by pasted content or, if available, a Linear ID/URL, surfaces full context and comments, then helps execute the work. Use when starting work from a ticket reference (e.g. PROJ-123, LIN-456), pasted ticket details, or when the user says do ticket / work this issue.
---

# Do Ticket

Pull the full ticket for the referenced work item and use it to drive implementation. The ticket can come from pasted content or, when available, the Linear MCP.

## Ticket source (resolve in this order)

1. **Pasted content** — If the user pasted ticket details (title, description, acceptance criteria, comments), use them directly. This is the primary path in environments without a Linear connection.
2. **Linear MCP (optional fast path)** — Else, if the user gave a Linear ID/URL **and** the `user-linear` MCP server is available:
   - Read the tool schema under the MCP descriptors folder if parameters are unclear.
   - Call `get_issue` with `id` set to the ticket identifier and `includeRelations: true` for relations.
   - Retrieve: title, description, status, assignee, labels, priority, attachments, related/blocking issues.
   - Call `list_comments` with `issueId` set to the same identifier (paginate if needed).
3. **Ask** — Else (a reference was given but no Linear MCP is available), ask the user to paste the ticket details using the template below.

### Paste template

```md
Title:
Status / Priority:
Description:
Acceptance Criteria:
Comments (optional):
```

## Instructions

1. **Resolve the ticket** using the source precedence above.
2. **Present** title, status, priority, description, acceptance signals, labels, relations, and comment highlights in a clear structure.
3. **Next step**: If scope is obvious, start implementation; otherwise ask which part to tackle first.

## Examples

- Ticket id: `LIN-123`, `STOCK-45`
- Full URL: `https://linear.app/<team>/issue/LIN-123`
- Pasted ticket body following the template above
