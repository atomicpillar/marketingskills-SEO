# AGENTS.md

Guidelines for AI agents working in this repository.

## Repository Overview

This repository contains **Agent Skills** for AI agents following the [Agent Skills specification](https://agentskills.io/specification.md). Skills install to `.agents/skills/` (the cross-agent standard). This repo also serves as a **Claude Code plugin marketplace** via `.claude-plugin/marketplace.json`.

- **Name**: Marketing Skills
- **GitHub**: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
- **Creator**: Corey Haines
- **License**: MIT

## Repository Structure

```
marketingskills/
├── .claude-plugin/
│   └── marketplace.json   # Claude Code plugin marketplace manifest
├── skills/                # Agent Skills
│   └── skill-name/
│       └── SKILL.md       # Required skill file
├── tools/
│   ├── clis/              # Zero-dependency Node.js CLI tools (51 tools)
│   ├── composio/          # Composio integration layer (quick start + toolkit mapping)
│   ├── integrations/      # API integration guides per tool
│   └── REGISTRY.md        # Tool index with capabilities
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Build / Lint / Test Commands

**Skills** are content-only (no build step). Verify manually:
- YAML frontmatter is valid
- `name` field matches directory name exactly
- `name` is 1-64 chars, lowercase alphanumeric and hyphens only
- `description` is 1-1024 characters

**CLI tools** (`tools/clis/*.js`) are zero-dependency Node.js scripts (Node 18+). Verify with:
```bash
node --check tools/clis/<name>.js   # Syntax check
node tools/clis/<name>.js           # Show usage (no args = help)
node tools/clis/<name>.js <cmd> --dry-run  # Preview request without sending
```

## Versioning

Two version layers, with different rules:

**Repo release version** — `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version`, and the `VERSIONS.md` changelog headings all share one x.y.z number:

- **x** — repo-wide changes (restructures, spec changes, breaking changes)
- **y** — new skill(s) added
- **z** — updates to existing skills

Do not bump y for content added to an existing skill, no matter how substantial — that's a z release (e.g. a new reference file in ad-creative is 2.8.0 → 2.8.1, not 2.9.0).

**Per-skill version** — `metadata.version` in each SKILL.md, mirrored in the `VERSIONS.md` table. Bump on ANY shipped change to that skill: the update check compares `VERSIONS.md` against users' local skill metadata, so an unbumped change is invisible to installed users. Minor for new capability or description triggers, patch for fixes and clarifications.

Bump the repo release version in the same PR that ships the change (2.7.0 and 2.8.0 shipped without touching plugin.json/marketplace.json and needed a catch-up later).

## Agent Skills Specification

Skills follow the [Agent Skills spec](https://agentskills.io/specification.md).

### Required Frontmatter

```yaml
---
name: skill-name
description: What this skill does and when to use it. Include trigger phrases.
---
```

### Frontmatter Field Constraints

| Field         | Required | Constraints                                                      |
|---------------|----------|------------------------------------------------------------------|
| `name`        | Yes      | 1-64 chars, lowercase `a-z`, numbers, hyphens. Must match dir.   |
| `description` | Yes      | 1-1024 chars. Describe what it does and when to use it.          |
| `license`     | No       | License name (default: MIT)                                      |
| `metadata`    | No       | Key-value pairs (author, version, etc.)                          |

### Name Field Rules

- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens (`--`)
- Must match parent directory name exactly

**Valid**: `cro`, `emails`, `ab-testing`
**Invalid**: `Page-CRO`, `-page`, `page--cro`

### Optional Skill Directories

```
skills/skill-name/
├── SKILL.md        # Required - main instructions (<500 lines)
├── references/     # Optional - detailed docs loaded on demand
├── scripts/        # Optional - executable code
└── assets/         # Optional - templates, data files
```

## Writing Style Guidelines

### Structure

- Keep `SKILL.md` under 500 lines (move details to `references/`)
- Use H2 (`##`) for main sections, H3 (`###`) for subsections
- Use bullet points and numbered lists liberally
- Short paragraphs (2-4 sentences max)

### Tone

- Direct and instructional
- Second person ("You are a conversion rate optimization expert")
- Professional but approachable

### Formatting

- Bold (`**text**`) for key terms
- Code blocks for examples and templates
- Tables for reference data
- No excessive emojis

### Clarity Principles

- Clarity over cleverness
- Specific over vague
- Active voice over passive
- One idea per section

### Description Field Best Practices

The `description` is critical for skill discovery. Include:
1. What the skill does
2. When to use it (trigger phrases)
3. Related skills for scope boundaries

```yaml
description: When the user wants to optimize conversions on any marketing page. Use when the user says "CRO," "conversion rate optimization," "this page isn't converting." For signup flows, see signup.
```

## Claude Code Plugin

This repo also serves as a plugin marketplace. The manifest at `.claude-plugin/marketplace.json` lists all skills for installation via:

```bash
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills
```

See [Claude Code plugins documentation](https://code.claude.com/docs/en/plugins.md) for details.

## Git Workflow

### Branch Naming

- New skills: `feature/skill-name`
- Improvements: `fix/skill-name-description`
- Documentation: `docs/description`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add skill-name skill`
- `fix: improve clarity in cro`
- `docs: update README`

### Pull Request Checklist

- [ ] `name` matches directory name exactly
- [ ] `name` follows naming rules (lowercase, hyphens, no `--`)
- [ ] `description` is 1-1024 chars with trigger phrases
- [ ] `SKILL.md` is under 500 lines
- [ ] No sensitive data or credentials

## Tool Integrations

This repository includes a tools registry for agent-compatible marketing tools.

- **Tool discovery**: Read `tools/REGISTRY.md` to see available tools and their capabilities
- **Integration details**: See `tools/integrations/{tool}.md` for API endpoints, auth, and common operations
- **MCP-enabled tools**: ga4, stripe, mailchimp, google-ads, resend, zapier, zoominfo, clay, supermetrics, coupler, outreach, crossbeam, introw, composio
- **Composio** (integration layer): Adds MCP access to OAuth-heavy tools without native MCP servers (HubSpot, Salesforce, Meta Ads, LinkedIn Ads, Google Sheets, Slack, etc.). See `tools/integrations/composio.md`

### Registry Structure

```
tools/
├── REGISTRY.md              # Index of all tools with capabilities
└── integrations/            # Detailed integration guides
    ├── ga4.md
    ├── stripe.md
    ├── rewardful.md
    └── ...
```

### When to Use Tools

Skills reference relevant tools for implementation. For example:
- `referrals` skill → rewardful, tolt, dub-co, mention-me guides
- `analytics` skill → ga4, mixpanel, segment guides
- `emails` skill → customer-io, mailchimp, resend guides
- `ads` skill → google-ads, meta-ads, linkedin-ads guides

For tools without native MCP servers (HubSpot, Salesforce, Meta Ads, LinkedIn Ads, Google Sheets, Slack, Notion), Composio provides MCP access via a single server. See `tools/integrations/composio.md` for setup and `tools/composio/marketing-tools.md` for the full toolkit mapping.

## Checking for Updates

When using any skill from this repository:

1. **Once per session**, on first skill use, check for updates:
   - Fetch `VERSIONS.md` from GitHub: https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/VERSIONS.md
   - Compare versions against local skill files

2. **Only prompt if meaningful**:
   - 2 or more skills have updates, OR
   - Any skill has a major version bump (e.g., 1.x to 2.x)

3. **Non-blocking notification** at end of response:
   ```
   ---
   Skills update available: X marketing skills have updates.
   Say "update skills" to update automatically, or run `git pull` in your marketingskills folder.
   ```

4. **If user says "update skills"**:
   - Run `git pull` in the marketingskills directory
   - Confirm what was updated

## Skill Categories

See `README.md` for the current list of skills organized by category. When adding new skills, follow the naming patterns of existing skills in that category.

## Task Observer — Self-Improving Skill Library

This repo carries a vendored copy of **task-observer** ("One Skill to Rule
Them All", github.com/rebelytics/one-skill-to-rule-them-all, CC BY 4.0) at
`skills/task-observer/`. Unlike every other skill here, it isn't a marketing
skill — it's a meta-skill that watches work sessions in this repo and turns
recurring friction, corrections, and judgement calls into proposed
improvements to the *other* skills (and to itself), logged for human review
before anything is installed. It is the mechanism by which this skill
library is meant to keep improving itself from real use, not just from
deliberate editing sessions like this one.

**Caveat, stated plainly (from its own README):** task-observer's core
`SKILL.md` is written with Claude Code / Cowork concepts baked in directly
(CLAUDE.md activation, session-start hooks, `skill-updates/` staging) —
unlike the rest of this repo's skills, it is not fully cross-agent-portable
out of the box. It is vendored as-is (unmodified, per its CC BY 4.0 terms
and its own self-referential upstream-update mechanism) rather than rewritten
to fit this repo's cross-agent style. If you're running this repo's skills
from Codex, Cursor, or another non-Claude agent, this one specific skill may
need local adaptation; the rest of the library is unaffected.

**Workspace — pinned inside this repo, not a user-global path.** This repo
is checked out fresh per session in some environments (Claude Code on the
web/cloud), so the usual recommendation (`~/.claude/projects/<id>/`) would
not survive between sessions here. Instead, the workspace is pinned to this
repo's own root, resolved dynamically (never hardcoded, since the clone
path varies by environment):

```bash
d="$(git rev-parse --show-toplevel)/skill-observations"
```

This directory is **committed to the repo** (`skill-observations/` at the
root — `observation-log/`, `cross-cutting-principles.md`,
`last-review-date.txt`) so it persists across fresh clones and sessions
exactly the way the rest of this repo does — attach this repo in a new
session and the observation history comes with it.

**Activation instruction** (tier 3 from `skills/task-observer/references/environments.md`
— configuration-instruction level; add a harness session-start hook too if
your environment supports one, for the enforced tier):

> Before the first tool call of any session in this repo — and before
> writing or proposing a plan — invoke the **task-observer** skill and run
> its Session Start Protocol, with the workspace resolved as
> `$(git rev-parse --show-toplevel)/skill-observations`. After completing
> each task, list the observation records written this session and report
> a one-line summary. Log-and-defer is the default: observations are
> proposals for the next review, not an invitation to edit a skill
> in-session, except for the explicit triggers `skills/task-observer/SKILL.md`
> names under "Acting on Observations."

See `skills/task-observer/SKILL.md` for the full protocol and
`skills/task-observer/references/` for everything it loads on demand.

## Claude Code-Specific Enhancements

These patterns are **Claude Code only** and must not be added to `SKILL.md` files directly, as skills are designed to be cross-agent compatible (Codex, Cursor, Windsurf, etc.). Apply them locally in your own project's `.claude/skills/` overrides instead.

### Dynamic content injection with `!`command``

Claude Code supports embedding shell commands in SKILL.md using `` !`command` `` syntax. When the skill is invoked, Claude Code runs the command and injects the output inline — the model sees the result, not the instruction.

**Most useful application: auto-inject the product marketing context file**

Instead of every skill telling the agent "go check if `.agents/product-marketing.md` exists and read it," you can inject it automatically:

```markdown
Product context: !`cat .agents/product-marketing.md 2>/dev/null || echo "No product context file found — ask the user about their product before proceeding."`
```

Place this at the top of a skill's body (after frontmatter) to make context available immediately without any file-reading step.

**Other useful injections:**

```markdown
# Inject today's date for recency-sensitive skills
Today's date: !`date +%Y-%m-%d`

# Inject current git branch (useful for workflow skills)
Current branch: !`git branch --show-current 2>/dev/null`

# Inject recent commits for context
Recent commits: !`git log --oneline -5 2>/dev/null`
```

**Why this is Claude Code-only**: Other agents that load skills will see the literal `` !`command` `` string rather than executing it, which would appear as garbled instructions. Keep cross-agent skill files free of this syntax.
