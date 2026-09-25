# Adapter: Cursor

Install: `./scripts/init cursor` — copies the rule file to `.cursor/rules/` and the segment
commands to `.cursor/commands/`.

What it adds on top of the core:

- **Rule pointer** (`rules/anew.mdc`, always applied): points Cursor at `AGENTS.md`.
- **Segment commands** (`commands/`): `/analyze`, `/plan`, `/build`, `/review`, `/verify` — one
  file per segment of `workflows/segments.md`, each a pointer that runs the segment and stops at
  its handoff. `/new-feature` is the chainer: lite chains with gate approvals, strict refuses and
  redirects. *Segments always stop; /new-feature flows only as far as the mode allows.*
- **Change requests** (`commands/change.md`): `/change` — triage rubric of
  `workflows/change-request.md`, then the trivial or mini-spec lane by mode.

Cursor has no read-only subagent or hook layer, so two rules are honored procedurally:
- **Independent review:** run `/review` in a **fresh chat** that reads only the diff + spec.
- **Immutable `specs/done/`:** no hook can reject the edit; the CI gate (`scripts/doctor --strict`)
  and the PR template are the backstop.

Cursor's command and rule formats change between versions; if yours differs, adjust only the
files in this adapter — the core never changes.
