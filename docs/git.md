# Git

> **Template — adjust at bootstrap.** Defaults below are safe; loosen consciously, not accidentally.

## Branching
- `feature/<spec-no>-<short-name>` — **no branch without a spec.**
- Fixes: `fix/<spec-no>-<short-name>`; incidents: `incident/<date>-<short-name>`.

## Commits
- Conventional Commits, with a plan reference: `feat(catalog): paging endpoint [plan 0001/3]`.
- Agent commits follow the same standard: the agent writes the message, the human approves.

## Forbidden
- Direct commits to the default branch.
- Force push, history rewriting on shared branches. Undo = `git revert` (see recovery R-11).

## Trivial changes
<!-- Set at bootstrap. Applies only to requests the change-request triage rubric
     (workflows/change-request.md) classifies as TRIVIAL: no acceptance criterion changes, no shared code. -->
- Policy: **(1) PR + one reviewer, no spec** — default; alternatives: (2) direct commit allowed on a
  `trivial/<short-name>` branch · (3) everything goes through a mini-spec (`specs/TEMPLATE-mini.md`).
- Always: one narrow commit, `scripts/check` green. A second file or a new test means re-triage.

## Pull requests
- PR template checklist completed; `scripts/check` green in CI; squash-merge.
