---
name: do-ticket
description: Fetches a ticket by pasted content or, if available, a Jira issue key/URL (Atlassian MCP) or Linear ID/URL, surfaces full context and comments, then helps execute the work. Use when starting work from a ticket reference (e.g. PROJ-123, LIN-456), a Jira URL, pasted ticket details, or when the user says do ticket / work this issue.
---

# Do Ticket

Pull the full ticket for the referenced work item and use it to drive implementation. The ticket can come from pasted content or, when available, the Jira (Atlassian) or Linear MCP.

## Ticket source (resolve in this order)

1. **Pasted content** — If the user pasted ticket details (title, description, acceptance criteria, comments), use them directly. This is the most robust path and works with no external connection.
2. **Jira MCP (Atlassian)** — Else, if the user gave a Jira issue key (e.g. `PROJ-123`) or a Jira URL (`https://<site>.atlassian.net/browse/PROJ-123`) **and** the Atlassian MCP server is available and authenticated:
   - Resolve the `cloudId` for the site if needed (e.g. via `getAccessibleAtlassianResources`); read tool schemas if parameters are unclear.
   - Call `getJiraIssue` with `cloudId` and `issueIdOrKey` set to the key; request fields covering summary, description, status, assignee, labels, priority, and comments.
   - If comments are not returned inline, fetch them separately, or use `searchJiraIssuesUsingJql` to pull related issues when useful.
3. **Linear MCP (optional)** — Else, if the user gave a Linear ID/URL **and** the `user-linear` MCP server is available:
   - Read the tool schema under the MCP descriptors folder if parameters are unclear.
   - Call `get_issue` with `id` set to the ticket identifier and `includeRelations: true` for relations.
   - Call `list_comments` with `issueId` set to the same identifier (paginate if needed).
4. **Ask** — Else (a reference was given but no matching MCP is available, or the identifier is ambiguous), ask the user to paste the ticket details using the template below.

> Note: bare keys like `PROJ-123` look the same for Jira and Linear. Prefer the MCP that is actually available/authenticated; if both are present, ask which system the ticket lives in.

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

- Jira key: `PROJ-123`, `STOCK-45`
- Jira URL: `https://<site>.atlassian.net/browse/PROJ-123`
- Linear id / URL: `LIN-123`, `https://linear.app/<team>/issue/LIN-123`
- Pasted ticket body following the template above
