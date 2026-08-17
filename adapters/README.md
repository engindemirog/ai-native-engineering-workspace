# Adapters

Per-tool wiring. Install one with `./scripts/init <tool>` (it copies the files to the right place).

**The thin-adapter principle:** rules live ONCE, in `AGENTS.md` and `docs/`. An adapter never
duplicates a rule — it only (a) points the tool at `AGENTS.md` and (b) adds capabilities that are
genuinely tool-specific (slash commands, subagents, hooks, permission profiles). If you find
yourself writing a rule inside an adapter, you're creating tomorrow's contradiction — put it in
the core and point at it.

| Adapter | What you get |
|---|---|
| `claude-code/` | Pointer `CLAUDE.md` + slash commands for every workflow + read-only `reviewer` subagent + permission denies + a hook that makes `specs/done/` physically immutable. Deepest integration. |
| `github-copilot/` | Pointer `copilot-instructions.md`. (Copilot also reads `AGENTS.md` natively in current versions.) |
| `cursor/` | Pointer rule file. (Cursor also reads `AGENTS.md` natively in current versions.) |
| `generic/` | Instructions for wiring any other agent. |

Tools change fast; adapters are the only layer that ages. Updating one never touches the core.
