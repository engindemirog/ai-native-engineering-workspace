# Adapter: GitHub Copilot

Install: `./scripts/init github-copilot` — copies `copilot-instructions.md` to `.github/`.

Note: current Copilot versions read `AGENTS.md` natively, so this pointer is a belt-and-braces
measure for older setups. Copilot has no subagent/hook layer; the independent-review rule is
honored procedurally: run the REVIEW step in a **fresh chat** that reads only the diff + spec,
using `prompts/review.md`.
