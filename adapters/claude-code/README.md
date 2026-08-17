# Adapter: Claude Code

Install: `./scripts/init claude-code` — copies `CLAUDE.md` and `.claude/` to the repo root.

What it adds on top of the core:

- **Slash commands** (`.claude/commands/`): `/bootstrap`, `/new-feature`, `/fix-bug`, `/refactor`,
  `/review`, `/verify`, `/adr`, `/recover` — each one loads the matching workflow and honors the
  operating mode. Thin by design: they point to `workflows/` and `prompts/`, they don't restate them.
- **Read-only reviewer subagent** (`.claude/agents/reviewer.md`): the "producer never verifies its
  own work" rule made *impossible to break* — the subagent has no Edit/Write tools.
- **Permission denies** (`.claude/settings.json`): force push, hard reset, `rm -rf` blocked by
  the tool, not by politeness.
- **Immutability hook** (`.claude/hooks/protect-shipped.sh`): edits under `specs/done/` are
  physically rejected.

All defaults are adjustable — see "Adapting it" in the root README.
