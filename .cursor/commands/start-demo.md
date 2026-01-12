# Start Demo

Prepare a clean demo environment by creating a new demo-run branch and starting the application.

## ⚠️ CRITICAL: Protect Commands Folder

**NEVER delete, modify, or overwrite files in `.cursor/commands/`**

Before making ANY changes, verify the commands folder exists:
```bash
ls -la .cursor/commands/
```

These files must survive all git operations:
- `code-review.md`
- `create-implementation-checklist.md`
- `do-ticket.md`
- `reset-demo.md`
- `start-demo.md`
- `validate-implementation.md`

Note: `.cursor/commands/` is untracked by git, so git operations (checkout, reset, clean) should not affect it. However, always verify after git operations.

## Task

0. **Optional Pre-flight Checks** (can be skipped for quick start):
   - Verify dependencies are installed: Check if `node_modules` exists, if not run `npm install`
   - Check environment: Verify `.env` file exists (or `.env.example` can be copied)
   - Database: If using Prisma, ensure migrations are up to date: `npm run db:migrate` (optional, can skip if demo doesn't need DB)

1. **Ensure we're up to date with origin main**:
   - If there are uncommitted changes, stash them first: `git stash push -m "startdemo: stashing changes"`
   - If currently on a different branch, switch to main: `git checkout main`
   - Fetch latest from origin: `git fetch origin` (continue even if this fails - might be offline)
   - Pull latest changes: `git pull origin main` (continue even if this fails - might be offline or already up to date)
   - **Do NOT run `git clean`** - this could delete untracked files including commands

2. **Create a new demo-run branch**:
   - Check if `demo-run` branch already exists locally: `git branch --list demo-run`
   - If it exists, create a new branch with timestamp: `demo-run-YYYYMMDD-HHMMSS` (use current date/time)
   - Use `git checkout -b demo-run` (or `git checkout -b demo-run-YYYYMMDD-HHMMSS` if demo-run exists)
   - This ensures each demo starts from a fresh branch based on latest main

3. **Verify commands folder survived git operations**:
   ```bash
   ls .cursor/commands/
   ```
   - If commands are missing, STOP and restore from backup before continuing

4. **Kill processes on ports 3000-3009**:
   - Kill any processes using ports 3000-3009 to ensure clean start
   - On macOS: `lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008,3009 | xargs kill -9 2>/dev/null || true`
   - The `2>/dev/null || true` ensures no error if ports are already free

5. **Start the application**:
   - Start the backend server in development mode: `npm run server:dev &` (runs in background)
   - Start the frontend dev server: `npm run dev &` (runs in background)
   - Both should run concurrently
   - Wait 3-5 seconds for servers to start, then verify they're running:
     - Check backend: `curl http://localhost:3000/health` or `lsof -ti:3000`
     - Check frontend: `lsof -ti:5173`
   - If servers fail to start, check logs and report errors

## Example Flow

```
# Current branch: feature-xyz with uncommitted changes

$ ls .cursor/commands/  # Verify commands exist FIRST
$ git stash push -m "startdemo: stashing changes"
$ git checkout main
$ git fetch origin
$ git pull origin main
$ ls .cursor/commands/  # Verify commands still exist
$ git branch --list demo-run  # exists
$ git checkout -b demo-run-20241102-143052
$ lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008,3009 | xargs kill -9
$ npm run server:dev &
$ npm run dev &
```

## Important Notes

- **🚫 NEVER run `git clean -fd`** - this deletes untracked files including `.cursor/commands/`
- Always creates a fresh demo branch from latest main
- Stashes any uncommitted work to prevent loss
- Automatically handles existing demo-run branches by appending timestamps
- Cleans up ports 3000-3009 before starting
- Starts both backend and frontend servers
- Servers run in background - user can manually open browser
- To return to previous work after demo: `git checkout - && git stash pop`
- Backend runs on port 3000, frontend on port 5173 (Vite default)
- If database migrations are needed, run `npm run db:migrate` before starting servers
- If Prisma client needs regeneration, run `npm run db:generate`

## Output

After completing the steps, provide:
- Confirmation that `.cursor/commands/` has all 6 command files
- Current branch name
- Backend server URL (http://localhost:3000)
- Frontend server URL (http://localhost:5173)
- Instructions to open browser manually
