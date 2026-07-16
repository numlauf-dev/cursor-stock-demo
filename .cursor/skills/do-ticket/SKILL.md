---
name: do-ticket
description: Fetches a Linear issue by ID or URL, surfaces full context and comments, then helps execute the work. Use when starting work from a ticket reference (e.g. PROJ-123, LIN-456), or when the user says do ticket / work this issue.
---

# Do Ticket

Pull the full Linear issue for the referenced ticket and use it to drive implementation.

## Instructions

1. **Parse the reference** from the user message: e.g. `PROJ-123`, `LIN-456`, or a full Linear URL.

2. **Fetch the issue** via Linear MCP (`user-linear` server):
   - Before calling tools, read the tool schema under the MCP descriptors folder if needed.
   - Call `get_issue` with `id` set to the ticket identifier and `includeRelations: true` for relations.
   - Retrieve: title, description, status, assignee, labels, priority, attachments, related/blocking issues.

3. **Fetch comments** with `list_comments` and `issueId` set to the same identifier (paginate if needed).

4. **Present** title, status, priority, description, acceptance signals, labels, relations, and comment highlights in a clear structure.

5. **Next step**: If scope is obvious, start implementation; otherwise ask which part to tackle first.

## Examples

- Ticket id: `LIN-123`, `STOCK-45`
- Full URL: `https://linear.app/<team>/issue/LIN-123`
