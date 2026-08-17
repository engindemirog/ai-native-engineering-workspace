# Adapter: Generic (any other AI tool)

No files to install. Wire any agent in three moves:

1. **Context:** if the tool auto-reads `AGENTS.md`, you're done. If not, paste `AGENTS.md` at the
   start of every session (and keep it ≤ 40 lines so this stays cheap).
2. **Workflows:** drive the process manually — open `workflows/<name>.md`, follow the steps, and
   paste the referenced `prompts/*.md` bodies with placeholders filled.
3. **Independence:** for the REVIEW step, open a completely fresh session/chat that receives only
   the diff and the spec — never the builder's conversation.

The verification contract is tool-independent by design: everything runs `./scripts/check`.
