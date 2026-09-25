# Adapter: GitHub Copilot

Install: `./scripts/init github-copilot` — copies `copilot-instructions.md`, `prompts/`,
`agents/`, and `instructions/` into `.github/`.

What it adds on top of the core:

- **Pointer** (`copilot-instructions.md`): points Copilot at `AGENTS.md` (current versions also
  read `AGENTS.md` natively; this is belt-and-braces for older setups).
- **Segment prompt files** (`prompts/*.prompt.md`): `/analyze`, `/plan`, `/build`, `/review`,
  `/verify` in Copilot Chat — one per segment of `workflows/segments.md`, each a pointer that
  runs the segment and stops at its handoff. `/new-feature` is the chainer: lite chains with gate
  approvals, strict refuses and redirects.
  *Segments always stop; /new-feature flows only as far as the mode allows.*
- **Change requests** (`prompts/change.prompt.md`): `/change` — triage rubric of
  `workflows/change-request.md`, then the trivial or mini-spec lane by mode.
- **Read-only reviewer agent** (`agents/reviewer.agent.md`): a custom agent with no edit tools —
  the "producer never verifies its own work" rule at the tool level. Select it for `/review`.
- **Immutability instruction** (`instructions/specs-done.instructions.md`, applies to
  `specs/done/**`): advisory, not a hook; the CI gate (`scripts/doctor --strict`) and the PR
  template are the backstop.

Copilot's prompt-file and agent formats change between versions; if yours differs, adjust only
the files in this adapter — the core never changes.
