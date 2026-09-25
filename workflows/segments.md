# Segments — the feature workflow, one stage at a time

A **segment** is one stage of `feature-development.md` run as a unit: it checks its entry
condition, does its work with the referenced prompt, stops at its gate, and ends with a
**handoff** written to files. Segments are tool-independent; each adapter only maps a trigger
(slash command, prompt file, or "paste this") onto a segment. Rules live here, once.

**Segments always stop; /new-feature flows only as far as the mode allows.**

## Contract (every segment)

1. **Entry check** — verify the condition below from *files*, never from chat. Hard checks
   refuse with the exact message; soft checks warn and ask whether to proceed.
2. **Work** — run the workflow steps with the referenced prompt as written.
3. **Gate** — stop and wait for the human where marked. Nothing is applied without approval.
4. **Handoff** — finish with a summary that names the artifact, its status, and the line
   `Next: <segment> — <who runs it>`. Then **stop**. Never start the next segment.

Handoffs travel through files and status fields (`docs/roles/README.md`): the spec's `Status`
(`specs/TEMPLATE.md`), the plan's `Approved by / on` line (`specs/plans/TEMPLATE.md`), the diff,
the review report. The next role starts a **new session** and reads them.

## The five segments

| Segment | Role | Steps | Entry check | Prompt(s) | Gate | Sets | Handoff |
|---|---|---|---|---|---|---|---|
| **ANALYZE** | Analyst | 1–2 | *Hard:* no twin — if a spec in `specs/active/` matches the request, offer to resume it; never open a second spec for the same work. New number = highest in `active/`, `done/`, `plans/` + 1. | `prompts/clarify.md`, then `prompts/spec.md` (incl. self-critique) | Spec approval (always, in every mode — it is PLAN's entry condition; lite folds clarify into the draft) | spec `Status: Approved` | "no open questions remain" · `Next: PLAN — Developer` |
| **PLAN** | Developer | 3–4 | *Hard:* spec has `Status: Approved` (or `In progress` when revising mid-work). Else refuse: **"Spec not approved — run ANALYZE or get approval first."** If a plan file exists, offer to revise it. | `prompts/plan.md` | Plan approval; never start building | plan `Status: Approved` + `Approved by / on: <name>, <YYYY-MM-DD>` (ask for the name; propose `git config user.name`) | `Next: BUILD — Developer` |
| **BUILD** | Developer | 5 | *Hard:* plan's `Approved by / on` holds a name and date (empty, `—`, or comment only = not approved). Else refuse: **"Plan not approved — run PLAN and get the approval recorded first."** | `prompts/build.md` | — (deviation → R-07) | spec `Status: In progress` before the first change; if already `In progress`, resume from the plan's next unfinished step | changed files vs. plan list + real `./scripts/check` output · `Next: INDEPENDENT REVIEW — fresh session / read-only reviewer` |
| **REVIEW** | Reviewer | 6 | *Soft:* a branch/diff with commits and a spec `In progress` exist. | `prompts/review.md` | — | nothing (read-only) | findings verbatim, no softening · `Next: TRIAGE — human (real / noise / investigate); then Developer fix rounds, then VERIFY` |
| **VERIFY** | QA | 9 | *Soft:* triage is complete — every finding real (fixed), noise (rationale written), or investigate. | `prompts/verify.md` | — | nothing (no production code) | criterion ↔ evidence table · `Next: SHIP — human (DoD, PR, merge, move spec to specs/done/, Status: Shipped)` |

Steps 7 (triage) and 10 (ship) belong to the human; step 8 (fix rounds) is the Developer applying
triage with `prompts/build.md §fixes`, followed by REVIEW again on the fix diff.

## The chainer

`/new-feature` (or its equivalent in another tool) is **not** a segment. It reads `Mode` from
`AGENTS.md` first:

- **strict** — refuse before any stage: *"Mode is strict: stages are role-owned. Analyst starts
  with ANALYZE; subsequent roles run PLAN, BUILD, REVIEW, VERIFY in their own sessions."*
- **lite** — run the segments in order with their entry checks intact, stopping at four gates:
  spec approval · plan approval · triage · ship. Before opening a spec, look for an existing one
  that matches the request; if found, report its status and the plan's approval line and resume
  from the next gate — never a twin spec.
- **unset** — stop; bootstrap has not run.

## Enforcement outside the agent

`./scripts/doctor` warns on a plan whose spec is not Approved / In progress / Shipped, and on a
spec `In progress` whose plan has no recorded approval. `./scripts/doctor --strict` turns those
warnings into failures — CI runs it that way, so the gates hold whichever tool produced the PR.
The PR template (`.github/pull_request_template.md`) asks for the same file evidence.
