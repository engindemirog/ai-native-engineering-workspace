# Decisions (ADRs)

Every significant, hard-to-reverse choice gets an ADR from `TEMPLATE.md`, numbered sequentially
(`0001-...md`). Decisions are never edited after acceptance — superseded ones get a new ADR and a
status update. The one exception is an editorial correction that leaves the decision's meaning
unchanged (wording, a broken link); it is recorded in the ADR as `- Revised: <date> — <why>`.
Capture the decision *when it's made*: the rationale is the part that evaporates.

Two owners, two places (ANEW-0010):
- **This project's decisions** — `docs/decisions/NNNN-<slug>.md`, numbered from 0001; the next
  number is the highest here + 1.
- **ANEW's own decisions** — `docs/decisions/anew/ANEW-NNNN-<slug>.md`, the reasons behind the
  workspace's rules. They come with the template and its upgrades; a project never edits or
  renumbers them. A project decision that refines or overrides one says so and links it.

Use `prompts/adr.md` to draft one with your AI, or `/adr` in Claude Code.
