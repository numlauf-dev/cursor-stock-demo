# Do Ticket

Pull the full Jira/Linear ticket description for the referenced ticket and begin working on it.

## Instructions

1. Parse the ticket reference from the user input (e.g., `PROJ-123`, `LIN-456`, or a full Linear URL)
2. Use the Linear MCP tools to fetch the complete ticket details:
   - Call `mcp_linear_get_issue` with the ticket ID to retrieve:
     - Title
     - Description
     - Status
     - Assignee
     - Labels
     - Priority
     - Attachments
     - Related issues (use `includeRelations: true`)
3. Also fetch any comments on the ticket using `mcp_linear_list_comments`
4. Present the full ticket context in a clear, organized format
5. Ask the user what aspect of the ticket they'd like to work on, or begin implementing if the task is clear

## Usage

```
/do-ticket <ticket-id>
```

Examples:
- `/do-ticket LIN-123`
- `/do-ticket STOCK-45`
- `/do-ticket https://linear.app/team/issue/LIN-123`

