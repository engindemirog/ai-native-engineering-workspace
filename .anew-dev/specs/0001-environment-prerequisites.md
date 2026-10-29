# Spec 0001 — Environment prerequisites, surfaced before BUILD

- Status: Approved
- Mode: lite (assumed — this repository's AGENTS.md is unconfigured; ANEW's own development)
- Plan: `.anew-dev/plans/0001-plan.md`

## Intent
A project's check steps depend on its environment (a container runtime, a toolchain version, a
service) and ANEW never asks whether that environment is present. In the OYP pilot (field report,
2026-10-29, finding A-1) the full profile could not run on the developer's machine, nobody knew
until the end of BUILD, and every full-profile proof then cost a push and a CI round. Success: a
project can state what each step needs, and ANEW tells the human — at bootstrap, at plan time and
when check runs — which profile this machine can run, before any work depends on it. When the
environment cannot satisfy a rule, the agent has one defined way to stop and ask (a recovery
ramp) instead of improvising. ANEW stays tool-neutral: it knows no tool, version or container
runtime; it only runs what the project declares.

## Requirements
1. **Declaration.** A project can attach zero or more prerequisites to any check step. A
   prerequisite is a project-written shell command; exit 0 means "met", anything else "not met".
   The declaration lives with the steps (`scripts/check.conf`), so steps and their needs are read
   in one place.
2. **No declaration, no change.** A project that declares nothing sees exactly today's behavior
   from `check`, `doctor`, `residue` and bootstrap.
3. **doctor reports.** `scripts/doctor` runs every declared prerequisite and reports each one
   (met / not met, naming the step and the command). It then states, per profile, whether this
   machine can run it: `fast` and `full` each "runnable" or "not runnable here (steps: …)".
   An unmet prerequisite is a warning in both normal and `--strict` mode: it describes the
   machine, not a process-gate violation. This holds on a minimal CI runner too: no separate
   switch to silence it.
4. **check refuses early and clearly.** Before the first step runs, `scripts/check` evaluates the
   prerequisites of every step in the selected profile. An unmet one fails check before any step
   runs — never skips a step — with a message distinct from a step failure: the step(s), the unmet
   command, and the pointer "environment gap — see R-13". In `--fast`, prerequisites of full-only
   steps are not evaluated. A prerequisite command declared on several steps runs once per check
   (or doctor) run and its result applies to all of them.
   Output: a met prerequisite is one `ok` line; an unmet one shows the command's full output.
5. **Bootstrap gate.** Bootstrap's VERIFY report (the human gate) includes doctor's per-profile
   verdict. A profile that is not runnable on this machine is called out with a recommendation
   (fix the environment / run that profile in CI only / change the step), and the human decides.
6. **Plan time and build entry.** The plan names every unmet prerequisite on the planner's
   machine under "Risks & open questions", with a recommendation, so the gap is decided at plan
   approval, not discovered at the end of BUILD. At `/build` entry the builder prints doctor's
   per-profile verdict; if it differs from the plan's (another machine, a changed environment),
   the builder stops and R-13 applies before any code is written.
7. **Environment-gap ramp (R-13).** A new recovery ramp for "the environment cannot satisfy an
   ANEW rule or a check step" (a missing or too-old tool, a permission layer that refuses an
   action the rules require, a profile that cannot run locally). Core rule: stop; name the rule
   and the constraint; propose options with costs and a recommendation; the human decides; the
   decision is recorded as a plan amendment. Never work around the rule silently, never weaken
   it, never mark its evidence as present.
8. **Tool neutrality.** No ANEW script contains the name of a specific tool, runtime or version
   as a requirement. Documentation examples that touch containers show at least two runtimes side
   by side (e.g. Docker and Podman) or a non-container example; none implies a runtime is needed.

## User experience
none — no graphical interface. The terminal output is the interface:
- Flow: the human (or agent) runs `./scripts/doctor` or `./scripts/check`; prerequisite results
  appear before the verdict they affect.
- States:
  - no prerequisites declared → output identical to today;
  - all met → one `ok` line per distinct prerequisite command, profiles "runnable";
  - some unmet → `WARN` per unmet prerequisite (step(s) + command) followed by the command's full
    output, profile verdict "not runnable here";
  - check finds an unmet prerequisite → distinct failure line (step(s), command, R-13 pointer)
    before any step runs, exit 1;
  - the prerequisite command itself is missing / not executable → reported as "not met" with the
    shell's error shown, never as a crash of doctor or check.
- Design reference: none — the flow above is the design.
- Accessibility: plain text, no colour-only signals; lines start with the existing
  `ok` / `WARN` / `FAIL` prefixes so they stay greppable.

## Constraints & out of scope
- POSIX `sh` only, like every ANEW script; Linux, macOS and Git Bash on Windows.
- Prerequisite commands must be side-effect free and fast; ANEW documents this but does not
  enforce a timeout (no portable `timeout` in POSIX sh). A prerequisite must not start anything
  (residue rule, `docs/testing.md`).
- Backward compatibility: existing `check.conf` files keep working unchanged. Upgrading needs a
  CHANGELOG entry with the behavior list (`CHANGELOG.md`, How to upgrade) and `scripts/selftest`
  coverage of the new behavior.
- Out of scope: version parsing or comparison inside ANEW; auto-installing or upgrading tools;
  a timeout mechanism; the clean-clone and residue-resource work (spec 0003); the waiver path,
  triage record and other process records (spec 0002); platform/template notes (spec 0004).
- Split: proposed 0001 (this) → 0002 process records (incl. waiver path) → 0003 hygiene without
  assumptions (clean-clone command, residue resource probe, Windows residue filter) → 0004
  platform & template notes. Source for all: OYP pilot field report, 2026-10-29.

## Acceptance criteria
- [ ] AC-1 — With no prerequisites declared, `check`, `doctor`, `residue` and `selftest` produce
  the same results and exit codes as v1.20 on the same `check.conf`.
- [ ] AC-2 — A step with one met and one unmet prerequisite: doctor prints one `ok` and one `WARN`
  line, each naming the step and the command; exit code 0 in normal and in `--strict` mode.
- [ ] AC-3 — doctor prints a per-profile verdict: an unmet prerequisite on a full-only step makes
  `full` "not runnable here (steps: <name>)" while `fast` stays "runnable"; on a `[fast]` step,
  both are not runnable.
- [ ] AC-4 — `./scripts/check` with an unmet prerequisite on the last step: no step's command is
  executed (not even the first), the output carries the distinct prerequisite-failure line (step,
  command, R-13) and the command's output, exit 1, and no `CHECK GREEN` line appears. A met
  prerequisite prints one `ok` line and none of its output.
- [ ] AC-5 — `./scripts/check --fast` does not evaluate prerequisites of full-only steps (an
  unmet one there leaves the fast run green).
- [ ] AC-6 — A prerequisite whose command does not exist is reported as not met with the shell's
  error text; doctor and check do not abort on it.
- [ ] AC-7 — `workflows/bootstrap.md` (VERIFY) and `prompts/plan.md` + `specs/plans/TEMPLATE.md`
  (Risks) require the per-profile verdict / unmet prerequisites with a recommendation.
- [ ] AC-8 — `prompts/recovery/environment-gap.md` exists as R-13 with the core rule above, is
  listed in `prompts/recovery/README.md`, and doctor's recovery-catalog count expects 13.
- [ ] AC-9 — Tool neutrality: `grep -ri 'docker\|podman\|testcontainers' scripts/ --exclude=check.conf.example` finds nothing;
  `scripts/check.conf.example` shows the prerequisite format with a tool-neutral example or two
  alternatives side by side.
- [ ] AC-10 — A prerequisite command declared on three steps is executed exactly once per check
  run and once per doctor run (observable via a counter file written by the test's command).
- [ ] AC-11 — `prompts/build.md` (and the `/build` entry check in `workflows/segments.md`)
  require printing doctor's per-profile verdict and stopping with R-13 when it differs from the
  plan's Risks entry.
- [ ] AC-12 — `scripts/selftest` covers AC-1 … AC-6 and AC-10, and fails when any of them is broken on
  purpose (one deliberate break per criterion, reported by VERIFY).

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `specs/backlog.md`
- [ ] Docs / ADRs updated if behavior or architecture changed (CHANGELOG entry with behavior list; ADR `docs/decisions/anew/ANEW-0011-tool-neutral.md`: ANEW knows no tool, runtime or version — it runs only what the project declares)
- [ ] Spec moved to `specs/done/` (it becomes immutable there)

## Scorecard (fill at ship — honest numbers make the process improvable)
| Metric | Value |
|---|---|
| Spec revisions | 1 (self-critique: 6 gaps folded in, approved 2026-10-29) |
| Fix rounds | |
| Review findings: real / noise / deferred | |
| Regressions introduced | |
| Bugs escaped to production | |
