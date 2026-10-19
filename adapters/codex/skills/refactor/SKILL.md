---
name: refactor
description: "ANEW Run the refactor workflow (structure changes, behavior provably preserved). Run explicitly: $refactor."
---
Read AGENTS.md and workflows/refactor.md. Run the workflow for what is described after the skill name.
./scripts/check must be green before starting. If the area lacks tests, characterization tests
come first. Zero test edits — a needed test edit means behavior changed: stop and tell me.
