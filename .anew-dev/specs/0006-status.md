# Spec 0006 — scripts/status: where every piece of work stands

- Status: In progress
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0006-plan.md`
- Self-critique: done (G-1–G-4 accepted, 2026-11-14)

## Intent
Today a person who wants to know "where is my work, and whose turn is it?" opens each spec and
plan and reads `Status:`, `Approved by / on`, `## Build evidence` and `## Triage` by hand.
Trainees and new teams get lost here, and it is also where two silent failures hide. A plan can
change after it was approved, and nobody sees it. A `CHECK GREEN @<sha>` can be cited after the
code it proved has changed.

`scripts/status` reads the files and answers on one screen. For each piece of work it shows the
stage, who acts next, and the next step. It also warns when approved content changed after
approval, and when the build evidence is older than the code it is meant to prove. It is
read-only and keeps no state of its own: the files stay the only source of truth. A later
screen (spec 0007 `scripts/gate`, then perhaps an editor extension) is built on its `--json`
output, not on its own parsing.

Success means one command tells a trainee what to do next, and the two silent failures become
visible.

Deliberately not done:
- writing any file (decisions stay with the human; writing them is spec 0007);
- turning the two warnings into doctor gates (a later decision, once status has field use);
- scanning `.anew-dev/`;
- an editor extension or a web screen.

## Requirements
1. **One row per piece of work** in `specs/active/` and `specs/done/`, numbered `NNNN-<name>.md`.
   Each row shows the number and name, the spec status, the plan status, the stage, who acts
   next, and the next step. Who acts next and the next step use the wording of
   `workflows/segments.md`. Shipped work comes last and shows only "shipped".
2. **The stage is derived from the files, never guessed.** The rules, in order:
   - spec `Draft` → ANALYZE, human: approve the spec;
   - spec `Approved` with no plan → PLAN, Developer;
   - a plan with no `Approved by / on` → human: approve the plan;
   - plan approved, spec still `Approved` → BUILD, Developer: start;
   - spec `In progress` with no `CHECK GREEN (full, …)` evidence line → BUILD, in progress;
   - full evidence and no review triage table → REVIEW (fresh session or read-only reviewer),
     then TRIAGE (human). REVIEW writes no file, so status says that it cannot tell whether the
     review has run (self-critique G-1);
   - the newest triage round holds a finding marked `real` whose Note cell names no fix (a
     `fix-<k>` with a `[plan NNNN/fix-<k>]` commit, or the sha of a commit carrying
     `[plan NNNN/fix-`) → Developer: fix round. Each finding is closed by its own note, whatever
     the order of the commits (A-1, A-3);
   - every real finding of the newest round fixed, and one of them Medium or higher → REVIEW
     again on the fix diff; all of them Low or Info → VERIFY, QA; a severity status cannot read
     from the id or the first two words of the Finding cell → "unclear" (A-1, A-3);
   - review triage done and no VERIFY round → VERIFY, QA;
   - the newest VERIFY round with no `real` finding → human: SHIP. A VERIFY round whose real
     findings are fixed goes back to VERIFY by the same rule as a review round (A-1);
   - a `###` heading under `## Triage` that is neither a review nor a VERIFY round → "unclear"
     (A-1);
   - a state that fits none of these is reported as "unclear: <what is missing>", never as a
     stage.
3. **Evidence older than the code.** The proving line is the last `CHECK GREEN (full, …) @<sha>`
   line in `## Build evidence`. If files outside `specs/` and `.anew-dev/` changed between `<sha>`
   and HEAD, the row warns "evidence is older than the code". This applies the rule of
   `docs/testing.md` rule 6. A `<sha>` that is not a commit in this repository gets its own
   warning (A-2: it need not be an ancestor of HEAD, as rule 6 allows).
4. **Approved content changed after approval.**
   - The approval point is the newest commit that set a new `Approved by / on` value, so a
     re-approval is a new baseline (A-2).
   - A later change to the spec's Intent, Requirements, User experience, Constraints or
     acceptance criterion text warns "changed after approval". So does a later change to the
     plan's Files, Ordered steps, Risks or Criterion ↔ test map.
   - These changes are not drift: status lines, ticked boxes, `## Build evidence`, `## Triage`,
     `## Amendments`, and criteria moved out per the template (a wrapped criterion is read as one
     line). Fenced blocks are approved content and are compared (A-2).
   - For the plan, the baseline is the newer of the approval point and the newest commit that
     added an `A-<n>` line while the approved sections were unchanged just before it (A-3). A
     change since then with a new uncommitted `A-<n>` line shows "amended (A-<n>)"; any other
     change warns, so an amendment covers neither later nor earlier unrecorded changes (A-2, A-3).
5. **Honest when it cannot tell** (invariant 8). These cases are named in the row, never shown as
   clean:
   - no git;
   - an approval not yet committed;
   - a spec with no plan file.
6. **`--json`** prints the same rows and warnings as one JSON document, for tools. Its shape is
   documented in `docs/commands.md` and stays stable within a minor version.
7. **Read-only.** status writes no file, needs no network, and uses only what doctor uses (POSIX
   sh, git, awk, sed, grep). Exit 0 whenever it could read the workspace, warnings included. Exit
   2 on an unknown argument.
8. **Release:** v1.25 on `main`, the first "current" release after the LTS line. Nothing goes to
   `lts/1.24`, because this is new behavior.

## User experience
- **Flow:** the user runs `./scripts/status` in the repo root and reads one table. Under the table
  are the warnings, each naming the file and what to do: re-approve, re-run check, or record an
  amendment. With `--json`, the same content goes to a tool.
- **States:**
  - **empty**: no specs, so status prints "no work yet — start with /new-feature or /analyze";
  - **normal**: the rows;
  - **unclear**: a row that names what is missing;
  - **no git**: a header line saying the two warnings cannot be checked;
  - **error**: an unknown argument prints the usage.
- **Design reference:** the mockup https://claude.ai/artifact/E8Qy6Eo3zRcxap5RZWd63X ("Sıra
  sende" panel) shows where this output is meant to go. The terminal table is the design for this
  spec.
- **Accessibility:** plain text with no colour-only meaning. Every warning is a word, not only a
  symbol.

## Constraints & out of scope
- The same shells as doctor (Linux, macOS, Windows Git Bash). Template users get it with v1.25.
- Out of scope: writing decisions (0007), role checks for strict mode (0007), doctor gates, the
  extension, and `.anew-dev/`.

## Acceptance criteria
- [ ] AC-1 — With no spec in `specs/active/` or `specs/done/`, status prints the empty-state line
  and exits 0.
- [ ] AC-2 — Each stage rule of Requirement 2 has a fixture that yields its stage, who acts and
  the next step: Draft, approved with no plan, plan awaiting approval, approved but not started,
  in progress without evidence, review pending, fix round, VERIFY, ship, shipped.
- [ ] AC-3 — A state outside the rules is reported as "unclear: …" with what is missing, never as
  a stage.
- [ ] AC-4 — A commit that touches a file outside `specs/` after the proving `@<sha>` warns that
  the evidence is older than the code. A commit that touches only `specs/` does not. An unknown
  `<sha>` gets its own warning.
- [ ] AC-5 — Changing a plan's Ordered steps, or a spec's criterion text, after the approval
  commit warns "changed after approval". The same change with a new `A-<n>` line shows "amended".
  Ticking boxes, a status change, new build evidence or a new triage table warn nothing.
- [ ] AC-6 — With no git, or with an approval that is not yet committed, the row says that the
  check could not run. It never shows clean.
- [ ] AC-7 — `--json` carries the same rows and warnings as the table, in the documented shape. An
  unknown argument exits 2 with the usage.
- [ ] AC-8 — A run leaves `git status --porcelain` unchanged.
- [ ] AC-9 — `./scripts/selftest` and `./scripts/doctor --strict` are green. `docs/commands.md`
  documents status, so doctor's coverage check passes. The CHANGELOG has a v1.25 entry and
  `.anew-version` is v1.25.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (here: doctor --strict + selftest, as for 0004/0005)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [ ] Docs updated (`docs/commands.md`, README script list, CHANGELOG)
- [ ] Spec moved to `.anew-dev/done/`

## Self-critique (approved 2026-11-14)
- **G-1 — REVIEW leaves no trace.** Between full evidence and the first triage table, status
  cannot know whether a review ran. It says "REVIEW → TRIAGE (a review writes no file)" instead of
  pretending. Recommendation: accept. Recording a review start would be a new rule.
- **G-2 — "first recorded" relies on git history.** A rebase or a squash moves the approval
  commit. After a squash-merge the approval commit is the merge commit, so a change before the
  merge is not seen. Recommendation: accept for 0006. The warning targets edits during work on a
  branch, which is where they happen.
- **G-3 — the free-form triage note.** A "fix commit noted" is read as a `fix-<n>` or a commit
  sha in the Note cell, the form the template asks for. A note in other words reads as open, so
  the error falls on the safe side. Recommendation: accept, and the documentation says so.
- **G-4 — the size limit.** 9 criteria is at the upper limit, but it is still one capability, read
  and report. Recommendation: keep it as one spec. 0007 carries the writing.
