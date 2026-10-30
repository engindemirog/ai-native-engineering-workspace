# /refactor — Run the refactor workflow (structure changes, behavior provably preserved)

Read AGENTS.md and workflows/refactor.md. Run the workflow for what is described after the command.
./scripts/check must be green before starting. If the area lacks tests, characterization tests
come first. Zero test edits — a needed test edit means behavior changed: stop and tell me.
The mini-spec gets the self-critique pass of prompts/spec.md; set `Self-critique: done` after my approval.
Stop at every human gate, one decision per gate message (workflows/segments.md, Contract, Gate).
