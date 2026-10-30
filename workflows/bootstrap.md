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
   (proposal rule): product & domain terms, **stack & versions** (greenfield; adoption confirms
   what INSPECT found), architecture style and module boundaries (the forbidden module
   dependencies included; third-party library policy lives in `docs/security.md` "Dependencies"),
   conventions that matter (data rules, error handling), testing expectations,
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
   **Greenfield:** the commands need code, which rule 1 forbids here, so `check.conf` holds the
   planned steps and their `requires` lines as comments; the walking skeleton (step 5)
   activates them. The output is committed on `chore/bootstrap` (`docs/git.md`).

4. **VERIFY.** Run `./scripts/doctor` (structure + configuration) and `./scripts/check`
   (must pass; in an empty greenfield it may be a no-op with a note), then the residue test
   (`./scripts/residue`, both profiles; `docs/testing.md`, Resource hygiene). The agent runs it
   and the gate shows one line, `Residue: clean (fast + full)`. RESIDUE FOUND comes with the
   leaking step and a proposed fix, and means not done. The human is never asked to run it or to
   idle the machine. Greenfield: `RESIDUE NOT MEASURED`; the work that adds the first steps runs
   it then.
   Environment: a step that needs something of the machine (a toolchain version, a container
   runtime, a service) gets a `requires` line in `check.conf` — the project names its own tool,
   ANEW assumes none. The gate shows doctor's per-profile verdict; a profile that is not runnable
   on this machine is called out with a recommendation (fix the environment / that profile in CI
   only / change the step) and the human decides (R-13) — before the first feature, not at its BUILD.
   Greenfield: at the walking skeleton's PLAN gate, the first moment the steps exist.
   `check fails on the check.conf errors above` is not an environment gap: fix the conf.
   Context quiz: open a *fresh* session and ask a project question (e.g. "what type do money
   fields use?") — the agent must answer from files. If it can't, the docs aren't teaching; fix them.

5. **REPORT.** What was generated, what was assumed, what still needs a human decision.
   It asks whether a remote and CI exist; if not, where a full green comes from (a local full
   run, `docs/testing.md` rule 6) and how `chore/bootstrap` is merged. A decision the human
   defers goes to `specs/backlog.md` with `Source: bootstrap <YYYY-MM-DD>`. Greenfield: it names
   the first spec, a **walking skeleton** — the smallest end-to-end slice that creates the
   toolchain and activates the `check.conf` steps; its PLAN gate carries doctor's per-profile
   verdict (R-13), its BUILD runs the residue test.
   **[GATE: human]** — you approve the workspace before the first feature starts.
   The report ends with a handoff line that matches the chosen mode — never a generic pointer
   to the segment commands: **lite** → `Next: /new-feature "<feature>"` (it chains the segments
   and asks at each gate); **strict** → `Next: /analyze "<feature>"` in an Analyst session.
   Changing an existing behavior → `/change "<request> <work item>"` in either mode.
