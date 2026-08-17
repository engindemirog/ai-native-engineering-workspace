# Adapter: Cursor

Install: `./scripts/init cursor` — copies the rule file to `.cursor/rules/`.

Note: current Cursor versions read `AGENTS.md` natively, so the rule is a thin pointer for
completeness. Cursor has no subagent/hook layer; run the REVIEW step in a **fresh chat** that
reads only the diff + spec, using `prompts/review.md`.
