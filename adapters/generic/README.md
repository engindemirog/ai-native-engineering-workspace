# Adapter: Generic (any other AI tool)

No files to install. Wire any agent in three moves:

1. **Context:** if the tool auto-reads `AGENTS.md`, you're done. If not, paste `AGENTS.md` at the
   start of every session (and keep it ≤ 40 lines so this stays cheap).
2. **Workflows:** drive the process manually — open `workflows/<name>.md`, follow the steps, and
   paste the referenced `prompts/*.md` bodies with placeholders filled.
3. **Independence:** for the REVIEW step, open a completely fresh session/chat that receives only
   the diff and the spec — never the builder's conversation.

The verification contract is tool-independent by design: everything runs `./scripts/check`.

## Running the feature segments by hand

`workflows/segments.md` defines each segment's entry check, prompt, gate, and handoff. Without
slash commands you *are* the chainer — and the rule still holds: segments always stop.

| Segment | Open a session as | Paste | Before you paste, check | Stop when |
|---|---|---|---|---|
| ANALYZE | Analyst | `prompts/clarify.md`, then `prompts/spec.md` | no matching spec in `specs/active/` | you approved the spec and set `Status: Approved` |
| PLAN | Developer (new session) | `prompts/plan.md` | spec says `Status: Approved` | you filled `Approved by / on` in the plan |
| BUILD | Developer | `prompts/build.md` | plan's `Approved by / on` is filled; set spec `In progress` | `./scripts/check` output is green and shown |
| REVIEW | Reviewer (fresh session, diff + spec only) | `prompts/review.md` | a branch/diff exists | you have the findings report — then triage |
| VERIFY | QA (fresh session) | `prompts/verify.md` | triage is complete | the criterion ↔ evidence table is complete — then ship |

`./scripts/doctor` (and CI with `--strict`) checks that these status fields are consistent, so
the gates hold even when no tool enforces them.
