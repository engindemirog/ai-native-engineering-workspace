# Adapters

Per-tool wiring. Install one with `./scripts/init <tool>` (it copies the files to the right place).

**The thin-adapter principle:** rules live ONCE, in `AGENTS.md` and `docs/`. An adapter never
duplicates a rule — it only (a) points the tool at `AGENTS.md` and (b) adds capabilities that are
genuinely tool-specific (slash commands, subagents, hooks, permission profiles). If you find
yourself writing a rule inside an adapter, you're creating tomorrow's contradiction — put it in
the core and point at it.

| Adapter | What you get |
|---|---|
| `claude-code/` | Pointer `CLAUDE.md` + segment commands (`/analyze` … `/verify`) + `/new-feature` chainer + other workflow commands + read-only `reviewer` subagent + permission denies + a hook that makes `specs/done/` physically immutable. Deepest integration. |
| `github-copilot/` | Pointer `copilot-instructions.md` + segment prompt files + `/new-feature` chainer + read-only `reviewer` custom agent + an immutability instruction for `specs/done/`. |
| `cursor/` | Pointer rule file + segment commands + `/new-feature` chainer. Review runs in a fresh chat. |
| `generic/` | Instructions for wiring any other agent, incl. a paste-by-hand table for the segments. |

All adapters expose the same five segments and the same chainer rule from `workflows/segments.md`
— *segments always stop; /new-feature flows only as far as the mode allows* — and none of them
restates it: they point.

Tools change fast; adapters are the only layer that ages. Updating one never touches the core.
