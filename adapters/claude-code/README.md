# Adapter: Claude Code

Install: `./scripts/init claude-code` — copies `CLAUDE.md` and `.claude/` to the repo root.

What it adds on top of the core:

- **Segment commands** (`.claude/commands/`): `/analyze`, `/plan`, `/build`, `/review`, `/verify`
  — one per segment of `workflows/segments.md`. Each checks its entry condition (spec
  `Status: Approved`, plan `Approved by / on`, build evidence, triage), does its segment, and
  **always stops** with a handoff line naming the next command. Handoffs travel through files.
- **Chainer**: `/new-feature` reads the Mode from `AGENTS.md`. In `lite` it runs the segments in
  order and asks at each gate (spec, plan, triage, ship); in `strict` it refuses and redirects to
  the segment commands, one role per session. The rule:
  *Segments always stop; /new-feature flows only as far as the mode allows.*
- **Change requests**: `/change` — runs the triage rubric of `workflows/change-request.md`
  (bug / trivial / change) with a reasoned verdict, then the lane the behavior demands; in strict
  mode it stops after the mini-spec, in lite it chains with gate approvals.
- **Other commands**: `/bootstrap`, `/fix-bug`, `/refactor`, `/adr`, `/recover` — each loads the
  matching workflow and honors the operating mode. All commands are thin by design: they point to
  `workflows/` and `prompts/`, they don't restate them.
- **Read-only reviewer subagent** (`.claude/agents/reviewer.md`): the "producer never verifies its
  own work" rule made *impossible to break* — the subagent has no Edit/Write tools.
- **Permission denies** (`.claude/settings.json`): force push, hard reset, `git rebase`, `rm -rf`
  blocked by the tool, not by politeness.
- **Immutability hook** (`.claude/hooks/protect-shipped.sh`): Edit/Write/MultiEdit/NotebookEdit
  under `specs/done/` are physically rejected. A shell redirect is not caught — the CI gate
  (`scripts/doctor --strict`) and review are the backstop.

All defaults are adjustable — see "Adapting it" in the root README.
