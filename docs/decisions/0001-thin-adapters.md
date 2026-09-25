# ADR 0001 — Rules live in the core; adapters only point

- Status: Accepted
- Date: 2026-09-25

## Context
AI coding tools (Claude Code, Cursor, GitHub Copilot, others) each have their own way of loading
context, defining commands, and restricting tools — and those mechanisms change every few months.
The engineering rules ANEW encodes (no spec no code, independent review, evidence over claims)
change far more slowly. Writing rules inside per-tool files would mean the same rule in four
places, drifting apart with every tool update.

## Decision
Rules, processes, and prompt bodies live once, in the core (`AGENTS.md`, `docs/`, `workflows/`,
`prompts/`). An adapter may only (a) point the tool at `AGENTS.md` and (b) add capabilities that
are genuinely tool-specific: slash commands, subagents, hooks, permission profiles. Every adapter
command is a pointer to a workflow or a prompt, never a copy.

## Consequences
- Benefits: one source of truth; a tool update touches one adapter directory; a new tool is wired
  by copying `adapters/generic/` and adding pointers; contradictions between tools cannot arise.
- Costs: adapter files read as terse; a user opening `.claude/commands/plan.md` has to follow the
  pointer to `workflows/segments.md` to see the full behavior. Tool-specific enforcement
  (hooks, read-only agents) is uneven across tools, so the CI gate and the PR template carry the
  rules the tool cannot.

## Alternatives considered
- Full command text per tool: readable in place, but three copies of every rule; rejected.
- One adapter only (Claude Code): simplest, but excludes users on other tools; rejected.

## Revisit triggers
- A tool gains a native way to include shared Markdown by reference (then pointers get shorter).
- Adapter files start to accumulate rules again — a sign the core is missing a home for them.
