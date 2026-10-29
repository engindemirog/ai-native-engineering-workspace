# .anew-dev/

ANEW's own development records: the specs and plans that change the template itself.
They follow the same rules as a project's `specs/` (`specs/TEMPLATE.md`, `specs/plans/TEMPLATE.md`,
AGENTS.md invariant rules) but live here so the template's `specs/` stays empty for its users.

- `specs/NNNN-<name>.md` — one per piece of work; numbering is shared with `plans/`.
- `plans/NNNN-plan.md` — the approved plan, `Approved by / on` is the gate record.
- Shipped specs move to `done/` and are never edited again.
- `docs/testing.md` rule 6 (a ship commit touching only `specs/` inherits the full green) applies
  here to `.anew-dev/`: `git diff --name-only <green-sha> HEAD -- . ':!.anew-dev/'` prints nothing.

Template users: this folder is not part of your workspace — delete it after you create your repo.
