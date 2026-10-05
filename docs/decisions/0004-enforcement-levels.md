# ADR 0004 — Every rule is labeled Documented, Validated or Enforced

- Status: Accepted
- Date: 2026-10-05

## Context
ANEW's rules are held by different mechanisms depending on the tool. Claude Code has hooks,
permission denies and tool-restricted subagents; GitHub Copilot has custom agents with tool lists
and path-scoped instructions; Cursor has rules and commands only; any other tool has nothing but
the prose and the scripts. Early README text described the strongest case as if it were the
general case ("impossible to break", "physically immutable"). A reader on Cursor would have
believed in protections that do not exist for them, and a gap nobody can see is a gap nobody
closes.

## Decision
Every rule is labeled with one of three levels, per tool, in the README table "How strongly is
each rule held?": **Documented** (written down; the agent is instructed), **Validated** (a script
detects a violation — `scripts/doctor` / `scripts/check`, locally and in CI), **Enforced** (the
tool physically prevents the action). Claims above the real level are not made. Where a level is
lower than it should be, the table says what would raise it (for example, branch protection with
`CODEOWNERS` review for "who approved").

## Consequences
- Benefits: trust is earned by honesty — the reader knows exactly what holds on their tool; gaps
  become visible and therefore fixable (this release closed two: shipped-spec immutability and
  adapter parity are now Validated in CI); adapter authors have a target per cell.
- Costs: the table must be re-verified whenever an adapter or script changes; some cells read
  "Documented" where marketing would prefer "Enforced"; the honest wording is longer.

## Alternatives considered
- Claim uniform enforcement and let users discover the differences: rejected — it is the failure
  mode this ADR exists to end.
- Only support tools where everything can be Enforced (Claude Code): rejected — excludes most
  users and contradicts ADR 0001.

## Revisit triggers
- A tool gains a mechanism that moves a cell up a level (then the table and this ADR update).
- A Validated check turns out to be bypassable in practice (then it is Documented until fixed).
