# devrecap

> Automated brag document generator — collect GitHub PRs, commits, and Jira issues to produce quarterly career performance documents.

Track and communicate the real impact of your work. Built for software engineers who want to keep a visible record of their deliveries without spending hours writing retrospectives.

## What it generates

For each quarter or sprint, two documents are produced:

| File | Purpose |
|------|---------|
| `docs/{year}/Q{n}-{year}.md` | Full brag document — PRs, metrics, epics, technical highlights |
| `docs/{year}/Q{n}-{year}-checkin.md` | Concise 4-section summary for 1:1s and performance reviews |

## Requirements

- Node.js 24+
- [GitHub CLI](https://cli.github.com/) (`gh`) — authenticated with your account
- An Atlassian Cloud account (Jira) — optional, for cross-referencing issues

## Quickstart

```bash
# 1. Clone and install
git clone https://github.com/your-username/devrecap.git
cd devrecap
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your GitHub username and org

# 3. Collect GitHub data
npm run collect -- Q2-2026

# 4. Query Jira (via Claude Code or GitHub Copilot — see below)
# Then ask your AI assistant to generate the documents
```

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
GH_USER=your-github-username
GH_ORG=your-github-org        # use your username for personal repos
JIRA_PROJECT=YOUR_PROJECT_KEY
JIRA_ACCOUNT_ID=your-jira-account-id
JIRA_SITE_URL=https://your-org.atlassian.net
```

> `.env` is gitignored. Do not commit it.

## Atlassian MCP Setup

Connect your AI assistant to Jira using the [Atlassian Rovo MCP Server](https://support.atlassian.com/atlassian-rovo-mcp-server/).
Authentication uses OAuth 2.1 — a browser window opens on first use.

### GitHub Copilot (VS Code)

`.mcp.json` is already included in this repo. VS Code detects it automatically.

To add manually via Command Palette:
1. `MCP: Add Server`
2. Select **HTTP**
3. URL: `https://mcp.atlassian.com/v1/mcp`
4. Name: `atlassian`

### Claude Code

Add to your `~/.claude.json` (global config):

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

Or via CLI:

```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp
claude mcp list   # should show: atlassian — Connected
```

**Fallback** for older Claude Code versions:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.atlassian.com/v1/mcp"]
    }
  }
}
```

## Full workflow

### Step 1 — Collect GitHub data

```bash
npm run collect -- Q2-2026
# or for a custom date range:
npm run collect -- sprint-42 --start 2026-01-13 --end 2026-01-24
```

Saves raw data to `data/github/Q2-2026.json`.

### Step 2 — Collect Jira data (via AI assistant)

Using Claude Code or GitHub Copilot with the Atlassian MCP configured, run a
query like:

> "Search Jira for all issues assigned to me in project `PROJ` with status Done,
> updated between 2026-04-01 and 2026-06-30. Save the result to
> `data/jira/Q2-2026.json`."

### Step 3 — Fill in additional context

Edit `prompts/questions.md` with your perspective on the period:

- Main deliveries and why they mattered
- Any blockers or replanned items
- Learnings and adjustments
- Specific metrics to highlight

This file gives the AI context that is not captured in raw GitHub/Jira data.

### Step 4 — Generate documents

In VS Code, open a Copilot Chat and type:

```
/generate-brag Q2-2026
```

Or in Claude Code:

> "Run the prompt at `.github/prompts/generate-brag.prompt.md` for period Q2-2026."

The assistant will read `data/github/Q2-2026.json`, `data/jira/Q2-2026.json`, and
`prompts/questions.md`, then write both documents to `docs/2026/`.

See the [Output formats](#output-formats) section below for the expected templates.

## Project structure

```
src/
  collect-github.ts   # GitHub data collection
  types.ts            # TypeScript interfaces
  lib/                # Config, period, and github modules

data/                 # gitignored — raw JSON (structure tracked via .gitkeep)
  github/
  jira/

docs/                 # generated brag documents (commit these!)
  2026/
    Q1-2026.md
    Q1-2026-checkin.md

prompts/
  questions.md        # fill before generating — your context for the period

.github/
  workflows/
    ci.yml            # GitHub Actions: typecheck + lint + tests on push/PR
  skills/
    generate-brag/    # /generate-brag slash command for Copilot Chat
      SKILL.md
      assets/

.env.example          # config template
.mcp.json             # VS Code / GitHub Copilot MCP config
.claude/
  settings.json       # Claude Code MCP config + project context
  skills/
    generate-brag -> ../../.github/skills/generate-brag  # symlink
.vscode/
  settings.json       # VS Code settings — copilot instructions
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run collect -- Q{n}-{year}` | Collect GitHub data for a quarter |
| `npm run collect -- sprint-N --start DATE --end DATE` | Collect for a custom range |
| `npm run typecheck` | TypeScript type check |

## Output formats

### Brag Document — `Q{n}-{year}.md`

```markdown
# Brag Document — Q{n} {year}
**Period:** {start date} → {end date}
**Author:** Your Name | Your Company

## Executive Summary
3–4 sentences on the quarter's main themes and business impact.

## Deliveries by Epic / Initiative
### {Epic name}
- What was delivered and its impact
- Related closed issues
- Relevant PRs

## Merged Pull Requests ({total})
Table or list with: repo, title, date, link

## Metrics
- PRs merged: X (Y repos)
- Commits: X
- Issues closed: X
- Story points: X
- Code reviews: X

## Technical Highlights
Architectural decisions, complex problems solved, quality improvements.

## Learning & Growth
New technologies, mentorship given/received, documentation produced.
```

### Check-in Summary — `Q{n}-{year}-checkin.md`

A concise 4-section format for 1:1s and performance conversations:

```markdown
# Performance Check-in — Q{n} {year}

## What was delivered and why?
State WHAT was delivered + WHY it matters (impact, connection to team priorities).
Example: "Completed the full RFI flow, eliminating manual compliance operations."

## What is in progress, blocked, or was replanned?
Be explicit about blockers and replanning with context.
Example: "Delivery X was delayed because tool access was only granted mid-month."

## What did you notice or adjust?
Learnings, changes in approach, feedback absorbed.
Example: "Noticed that aligning API contracts before frontend work starts
accelerates the cycle — started creating type-only PRs early."

## What do you need to align or request support on?
Concrete asks: priorities, unblocking, validations.
Example: "Need to validate the relative priority between X and Y for Q3."
```

**Tips for a good check-in:**
- Be specific — point to concrete examples
- Connect deliveries to team or business outcomes
- Name blockers and what is being done about them
- Make asks clear and actionable

## Jira JQL templates

Replace placeholders with your values from `.env`:

```
# Completed issues this quarter
project = YOUR_PROJECT_KEY
  AND assignee = "YOUR_JIRA_ACCOUNT_ID"
  AND statusCategory = Done
  AND updated >= "YYYY-MM-DD"
  AND updated <= "YYYY-MM-DD"
ORDER BY updated ASC

# In-progress issues
project = YOUR_PROJECT_KEY
  AND assignee = "YOUR_JIRA_ACCOUNT_ID"
  AND statusCategory != Done
  AND updated >= "YYYY-MM-DD"
ORDER BY updated DESC
```

> **Tips:**
> - Use `statusCategory = Done` (not `status = "Done"`) — safer across board configurations
> - Use `updated` (not `resolved`) to catch all activity in the period
> - Your Jira Account ID is in your Atlassian profile URL

## Sprint workflow

```bash
# Collect at the end of each sprint
npm run collect -- sprint-42 --start YYYY-MM-DD --end YYYY-MM-DD

# Commit the raw data
git add data/github/sprint-42.json data/jira/sprint-42.json
git commit -m "chore(data): Sprint 42 — X issues, Y PRs merged"
```

## License

Apache 2.0 — Copyright 2026 [Rômulo Santos](https://github.com/romulosantos).  
Any use, fork, or distribution must preserve this copyright notice.
