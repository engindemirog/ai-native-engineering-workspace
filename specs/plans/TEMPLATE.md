# Plan NNNN — <spec short name>
<!-- Content in the document language from AGENTS.md; labels, Status values and "Approved by / on" stay English (protocol). -->

- Spec: `specs/active/NNNN-<name>.md`
- Status: Awaiting approval | Approved | Superseded
- Approved by / on: — <!-- This line IS the plan gate record: "<name>, <YYYY-MM-DD>", written
  at the end of /plan on human approval. While it is empty ("—"), /build refuses to start. -->

## Files to change or add
<!-- Path by path. This list is the blast radius; silent additions are plan drift (R-07). -->

## Ordered steps
<!-- Which layer/part first and why. Keep steps commit-sized. A plan over ~150 lines means the
     spec is too big (prompts/plan.md, SIZE). -->

## Risks & open questions
<!-- Each with YOUR recommendation and rationale (proposal rule). Unresolved questions block build.
     Environment: doctor's per-profile verdict on the planner's machine and every unmet step
     prerequisite, each with a recommendation (R-13). /build compares its own verdict to this line. -->

## Criterion ↔ test map
<!-- Profile: fast or full — the check.conf step whose selector runs the test
     (docs/testing.md, Two speeds, rule 4). -->
| Acceptance criterion | Proven by | Profile |
|---|---|---|
| AC-1 | | |
| AC-2 | | |

## Build evidence
<!-- Written by BUILD, read by REVIEW and VERIFY: pointer lines, never saved output
     (docs/testing.md, Evidence policy). One line each, with the commit it holds for:
     CHECK GREEN (full, <n> steps, <t> s) @<sha>   — or the CI run link with its SHA
     RESIDUE CLEAN (full, 2 runs) @<sha> · RESIDUE CLEAN (fast, 2 runs) @<sha>
       — only when scripts/check.conf changed in this work; RESIDUE FOUND goes to the human. -->

## Amendments
<!-- Approved changes after the plan gate (review triage, R-07), never silent. One line each:
     A-1 — <what changes: files, steps> — <why; source: review round n / R-07> — <name>, <YYYY-MM-DD> -->

## Triage
<!-- The triage record (workflows/feature-development.md, step 7) — here, because in lite there is
     no PR yet at triage time; the PR description links this section. One table per review or
     VERIFY round, written at the gate:
     ### Review round <n> — <name>, <YYYY-MM-DD>
     | Finding | Verdict (real / noise / defer / investigate) | Note (fix commit, rationale, B-<n>, A-<n>) | -->
