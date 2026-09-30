# Workflow: Bootstrap

**Goal:** adapt ANEW to *your* project — new or existing. Run once (rerunnable to revise).
**Prompt:** `prompts/bootstrap.md` · **Role:** Analyst (interview) → Developer (generation)

```
LANGUAGE → INSPECT → INTERVIEW → GENERATE → VERIFY → REPORT
```

0. **LANGUAGE.** The first question, asked in the language the human used to start the session:
   in which language to run the interview, and in which language to write the project documents
   (docs/, specs, plans, ADRs, reports). Two settings, because international teams often talk in
   one language and document in another. The agent recommends (proposal rule); the answer is
   permanent — recorded in `AGENTS.md` (`Language:` line) and `docs/conventions.md` ("Language").
   The ANEW core and every protocol field (`Status:` values, `Approved by / on:`, `Source:`,
   template headings) stay English so the gates and `scripts/doctor` keep working.
   **[GATE: human]**

1. **INSPECT.** The agent examines the working tree. Empty (only ANEW files) → greenfield flow.
   Contains code → adoption flow: detect stack(s), build system, test setup, and existing
   conventions *from the code*, to be confirmed rather than asked from scratch.

2. **INTERVIEW.** One topic at a time, every question carrying the agent's recommendation
   (proposal rule): product & domain terms, architecture style and module boundaries, forbidden
   dependencies, conventions that matter (data rules, error handling), testing expectations,
   security posture, git rules, **trivial-change policy** (what label/typo-level changes
   require — (1) PR + one reviewer, no spec [recommended: cheap safety net]; (2) direct commit
   allowed on a trivial branch; (3) everything goes through a mini-spec [strictest] — written to
   `docs/git.md` "Trivial changes"), and **operating mode (lite/strict)**.
   **[GATE: human]** — your answers are the input; nothing is assumed.

3. **GENERATE.** The agent fills `docs/*.md` from the interview, writes `scripts/check.conf`
   (build/test/lint commands for your stack), sets the Mode and Language lines in `AGENTS.md`, and rewrites
   `AGENTS.md`'s project summary — **keeping the invariant rules block verbatim**, keeping the
   "Start work" and "Language" sentences of the Operating mode section (values filled in), and
   keeping the file ≤ 40 lines. For existing repos it may also propose toolchain steps for `.github/workflows/check.yml`.

4. **VERIFY.** Run `./scripts/doctor` (structure + configuration) and `./scripts/check`
   (must pass; in an empty greenfield it may be a no-op with a note). Context quiz: open a *fresh*
   session and ask a project question (e.g. "what type do money fields use?") — the agent must
   answer from files. If it can't, the docs aren't teaching; fix them.

5. **REPORT.** What was generated, what was assumed, what still needs a human decision.
   **[GATE: human]** — you approve the workspace before the first feature starts.
   The report ends with a handoff line that matches the chosen mode — never a generic pointer
   to the segment commands: **lite** → `Next: /new-feature "<feature>"` (it chains the segments
   and asks at each gate); **strict** → `Next: /analyze "<feature>"` in an Analyst session.
   Changing an existing behavior → `/change "<request> <work item>"` in either mode.
