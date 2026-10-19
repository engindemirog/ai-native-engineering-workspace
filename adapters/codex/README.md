# Adapter: Codex

Install: `./scripts/init codex` — copies the commands, as Codex skills, to `.agents/skills/`
in the repo root.

What it adds on top of the core:

- **Pointer: none needed.** Codex reads `AGENTS.md` natively, so ANEW's context channel works
  with no wiring at all. This adapter only delivers the commands.
- **Commands as skills** (`skills/<name>/SKILL.md`): the same twelve commands as every other
  adapter — segments `$analyze`, `$plan`, `$build`, `$review`, `$verify`; the chainer
  `$new-feature`; `$change`; and `$bootstrap`, `$fix-bug`, `$refactor`, `$adr`, `$recover`. Each is
  the same pointer as the Cursor command. *Segments always stop; /new-feature flows only as far
  as the mode allows.*
- **Explicit only** (`skills/<name>/agents/openai.yaml`): `allow_implicit_invocation: false`, so
  Codex never starts a gated stage on its own because a request sounds like one. Type the skill
  (`$plan 0003`) or pick it from `/skills`; the text after the name is the argument.
- **Project-level:** the skills live in the repository (`.agents/skills/`) and travel with it, so
  the whole team gets them on clone. Commit them like any other adapter file.

Codex has no read-only reviewer subagent and no hook layer here, so two rules are honored
procedurally:
- **Independent review:** run `$review` in a **fresh Codex session** that sees only the diff and
  the spec — never the builder's session.
- **Immutable `specs/done/`:** nothing rejects the edit in the tool; `scripts/doctor --strict` in
  CI and the PR template are the backstop.

Older Codex versions offered user-level custom prompts (`~/.codex/prompts/`); they are deprecated
in favor of skills and this adapter does not use them.

Codex's skill format changes between versions; if yours differs, adjust only the files in this
adapter — the core never changes.
