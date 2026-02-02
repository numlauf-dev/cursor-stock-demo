---
name: create-pr
description: Create well-structured GitHub Pull Requests using gh CLI. Use when the user wants to create a PR, submit changes for review, open a pull request, or push changes to GitHub for review.
---

# Create GitHub Pull Request

Creates or updates GitHub PRs using the gh CLI with proper validation and best practices.

## Prerequisites

- **GitHub CLI (gh)** must be installed
- User must be authenticated with `gh auth login`
- Git repository must have a remote configured

## Workflow Checklist

Copy and track progress:

```
PR Creation Progress:
- [ ] Verify gh CLI authentication
- [ ] Check current branch (not main/master)
- [ ] Push branch to remote
- [ ] Check for existing PR
- [ ] Gather PR details from user
- [ ] Create or update PR
- [ ] Open PR in browser
```

## Step-by-Step Process

### Step 1: Verify Authentication

```bash
gh auth status
```

If not authenticated, instruct user to run `gh auth login`.

### Step 2: Check Current Branch

```bash
git branch --show-current
```

**Important**: Cannot create PR from `main` or `master`. If on protected branch, stop and inform user.

### Step 3: Push Branch to Remote

```bash
git push -u origin <current-branch>
```

### Step 4: Check for Existing PR

```bash
gh pr list --head <current-branch> --json number,title,url
```

- If PR exists → Update flow (Step 6)
- If no PR → Create flow (Step 5)

### Step 5: Create New PR

Ask user for:
- **Title**: Suggest last commit message as default (`git log -1 --pretty=%s`)
- **Description**: Optional detailed description
- **Base branch**: Default to `main`
- **Draft**: Yes/No

Show preview, then create:

```bash
gh pr create --title "<title>" --body "<description>" --base <base-branch> [--draft]
```

### Step 6: Update Existing PR

```bash
gh pr edit <pr-number> --title "<title>" --body "<description>"
```

### Step 7: Open in Browser

```bash
gh pr view --web
```

## PR Title Best Practices

Use conventional commit format:
- `feat(scope): add new feature`
- `fix(scope): resolve bug description`
- `docs: update documentation`
- `refactor(scope): improve code structure`
- `test: add missing tests`

Use imperative mood: "Add feature" not "Added feature"

## PR Description Template

```markdown
## Summary
Brief description of changes

## Why
Motivation and context

## How
High-level approach (if complex)

## Testing
How to verify the changes

## Related Issues
Closes #123
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Not authenticated | Run `gh auth login` |
| On main/master | Checkout a feature branch first |
| No remote | Run `git remote add origin <url>` |
| PR already exists | Offer to update instead of create |
| Push rejected | Pull latest changes first |
