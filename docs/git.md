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

## Pull requests
- PR template checklist completed; `scripts/check` green in CI; squash-merge.
