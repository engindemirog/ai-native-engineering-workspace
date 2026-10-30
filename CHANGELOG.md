# Changelog

Template users: compare your copy against the version you started from and pull what you need —
the core is Markdown plus a few POSIX scripts, so upgrades are file edits, not migrations.

## How to upgrade

1. **Your base** is the version in `.anew-version` (doctor prints it). If it is missing, find the
   template tag your `scripts/` match and write it there.
2. **Read every entry above your base**, oldest first. From v1.12 on, each "Upgrading" section
   gives a **behavior list** for every changed script and a **one-line intent** for every
   changed document, plus the full diff link (`/compare/vX...vY`).
3. **Scripts:** an unmodified copy may simply be copied. A copy you extended gets the behavior
   list applied — never a plain copy, which would delete your extensions. `./scripts/selftest`
   then tells you where your copy no longer behaves as documented.
4. **Documents** you translated or extended: apply each intent in your own words; a patch will not
   apply to them, and doesn't need to.
5. **Decisions:** take new `docs/decisions/anew/ANEW-*.md` files as they are (ANEW-0010); your own
   ADRs are never renumbered.
6. Write the new version into `.anew-version`.

## v1.22 — Process records

From the same field pilot, and from ANEW's own first run of v1.21: five places where the process
had no written record, so agents improvised. Each now has one place and one rule; no invariant
rule is weakened.

- **Moved out, never waived** (ANEW-0012): proven criteria are ticked at ship; one that cannot be
  proven is moved out at the ship gate (R-08) — its line stays, struck through, `→ moved to
  B-<n> | spec <NNNN> — <name>, <date>, <why>`, to open work. A sensitive-area criterion cannot
  move. `scripts/doctor` checks every new ship (on a pull request in CI).
- **Triage lives in the plan** (`## Triage`): lite has no PR at triage time; the PR links it.
- **The ship commit inherits the full green** (`docs/testing.md`, Two speeds rule 6) when
  everything after the cited green touches only `specs/` and `doctor --strict` judged the ship.
- **Self-critique has a status** (`- Self-critique: done | pending (<condition>)`).
- **One decision per gate message** (`workflows/segments.md`, Contract, Gate).

### Upgrading

**Tick proven criteria before your next ship.** doctor now judges each new ship: a criterion
left `- [ ]` is a gate unless it is moved out. If your team kept the evidence table and left the
boxes empty, tick the proven ones (`- [x]`) at ship from now on — doctor tells you which.

- `scripts/doctor` — behavior: (1) new ships — specs added to `specs/done/` vs the base ref
  (`$ANEW_BASE_REF`, else the PR's merge-base, else HEAD plus untracked files there): every
  unchecked criterion line — fail closed: a line with a checkbox (`[ ]`, `[]`, `[x]`, `[X]`)
  followed by an `AC-|CB-|PB-<n>` id with only punctuation or emphasis between, whatever its
  bullet; the line's first box and id decide, `[x]`/`[X]` is ticked; a box in backticks or a
  table cell still counts — without
  `→ moved to` / `-> moved to` after the id (after the closing `~~` when the id is struck;
  outside backticks) → gate `unchecked criterion in a new ship: <file> <id> — tick it ([x]) if VERIFY
  proved it, else move it out`; a `B-<n>` target needs `**B-<n>**` in `specs/backlog.md`, a
  `spec <NNNN>` target a file in `specs/active/` that is not the spec itself, else gate; any move
  in a sensitive spec → gate: a line starting (after bullet / emphasis) with "sensitive area" or
  "sensitive area(s)" and a separator (`:`, `—`, `-`), any case, unless its value (past emphasis,
  quotes or brackets) starts with none or n/a — an empty value is sensitive; a new ship with no criterion line → WARN.
  Paths are read unquoted and workspace-relative (non-ASCII names, a workspace in a
  subdirectory), also in the immutability check's messages; the check runs under `LC_ALL=C`, so
  specs in other encodings are read byte for byte. Specs already
  in `specs/done/` at the base are not checked. (2) `- Self-critique: pending …` (any case) in
  `specs/active/`: Draft → WARN with the condition (expected until approval); Approved / In
  progress → gate. No field → nothing.
- `scripts/selftest` — scenarios for the behaviors above.
- `specs/TEMPLATE.md`, `specs/TEMPLATE-mini.md`: intent: the Self-critique field and the
  moved-out line format. `prompts/spec.md`: intent: sets the field. `specs/plans/TEMPLATE.md`:
  intent: `## Triage`. `prompts/recovery/spec-change.md`: intent: R-08 covers the ship-gate move.
- `workflows/feature-development.md` (steps 7, 10), `workflows/segments.md` (Contract, Gate;
  VERIFY; SHIP handoff), `prompts/verify.md`, `prompts/recovery/flaky-test.md`,
  `.github/pull_request_template.md`, `docs/commands.md`: intent: the triage record is the plan;
  descoping at ship; one decision per gate. `docs/testing.md`: intent: rule 6's specs-only
  inheritance with its proving command. The four `new-feature` adapters: intent: one decision
  per gate message; so do the `change`, `fix-bug`, `refactor` and `bootstrap` adapters.
  `workflows/refactor.md`, `workflows/change-request.md`: intent: tick or move out at ship; the
  move to done/ is part of the PR (also in step 10 and the segments SHIP handoff).
  `workflows/refactor.md` (step 2), `workflows/incident.md` (step 3) and the `/refactor`
  adapters: intent: lanes without ANALYZE run the self-critique pass and set the field, so their
  mini-specs pass the new gate; `docs/git.md` trivial policy (3) says the same. `specs/backlog.md`:
  intent: ship-gate moves land there too.
- Decisions: `docs/decisions/anew/ANEW-0012-descope-not-waive.md` (new).
- Full diff: `/compare/v1.21...v1.22`.

## v1.21 — The environment is asked, not assumed

From a field project (.NET, Windows + Git Bash) whose container runtime was too old for its
integration tests: nobody knew until the end of BUILD, a criterion shipped with its full proof
missing, and every full proof cost a push and a CI round. ANEW still names no tool (ANEW-0011):
the project declares what a step needs, ANEW runs it and reports.

- **Step prerequisites** (`docs/testing.md`, Two speeds rule 9): `requires <step>: <command>` in
  `scripts/check.conf`, exit 0 = met. `scripts/check` runs the profile's prerequisites before the
  first step and fails on an unmet one — never skips the step. `scripts/doctor` says per profile
  whether this machine can run it. Bootstrap's gate, the plan's Risks and BUILD's entry show that
  verdict, so a profile that cannot run here is decided before work depends on it.
- **R-13 — Environment gap** (`prompts/recovery/environment-gap.md`): when the environment cannot
  satisfy a rule or a step (a missing tool, a permission layer refusing what a rule requires, a
  profile that cannot run locally): stop, show the constraint, options with costs, the human
  decides, a plan amendment records it. Never work around the rule.

### Upgrading

Update the scripts **before** adding `requires` lines: a v1.20 check runs `requires x: cmd` as a
step named "requires x" (it fails if unmet — never a false green, but the output misleads).
The other way round: a step whose name starts with `requires` and a space or tab is now read as
a prerequisite — rename it before updating. If the rest of its name matches no step, v1.21 check
fails on it (`requires names no step`); if it does match one, the old step silently stops being a
step and runs as that step's prerequisite.

- `scripts/check` — behavior: lines `requires <step>: <command>` (first non-blank word
  `requires`, then a space or tab — the same rule in doctor and residue) are prerequisites, not
  steps; only a conf with such a line runs the prerequisite pass. Before the first step, every
  prerequisite of the profile's steps runs once per distinct command text (from the repo root,
  stdin from /dev/null). Met → `ok    prerequisite: <cmd> (steps: …)`, output hidden; unmet →
  its output, then `CHECK FAILED (<profile>) prerequisite not met: <cmd> (steps: …) — environment
  gap, see prompts/recovery/environment-gap.md (R-13)`; all are reported, then exit 1 with no
  step run. `--fast` skips prerequisites of full-only steps. Malformed `requires` lines fail
  check the same way, before any step: naming no step (`requires names no step: <name>`), an
  empty or comment-only command (`requires has no command: <step>`), no `:` (`requires line has
  no ':': <line>`); an empty step name prints as `(empty)`.
  A step is listed once per command. No `requires` line → output unchanged.
- `scripts/doctor` — behavior: messages print through `printf` (backslashes kept). A conf with
  only `requires` lines has no steps (WARN as before). With `requires` lines: each distinct
  command runs once; met → ok, unmet → WARN plus its output; a malformed line (as in check) →
  WARN; then `profile fast|full: runnable on this machine` (ok), `not runnable on this machine
  (steps: …)` (WARN, computed from exact step↔command pairs), or, with a malformed line, `check
  fails on the check.conf errors above` (WARN). WARN in every mode, also `--strict`. Recovery
  catalog expects 13 ramps.
- `scripts/residue` — behavior: `requires` lines are not steps (a conf of only those →
  `RESIDUE NOT MEASURED`).
- `scripts/selftest` — scenarios for the behaviors above.
- `scripts/check.conf.example`: intent: shows the `requires` format with a tool-neutral example
  and two container runtimes side by side.
- `prompts/recovery/environment-gap.md` (new), `prompts/recovery/README.md`: intent: R-13. Every
  "R-01…R-12" reference (README, prompts/README, docs/commands.md, the four `/recover` adapters)
  reads R-01…R-13; `docs/roles/developer.md` lists R-13.
- `workflows/bootstrap.md`, `prompts/bootstrap.md`: intent: VERIFY shows doctor's per-profile
  verdict; a profile not runnable here comes with a recommendation for the human (R-13).
  `prompts/plan.md`, `specs/plans/TEMPLATE.md`: intent: unmet prerequisites are plan risks.
  `prompts/build.md`, `workflows/segments.md`: intent: BUILD prints its verdict first and stops
  on R-13 when it differs from the plan's. `docs/testing.md`: intent: Two speeds rule 9.
  `docs/commands.md`: intent: the prerequisite outputs of check and doctor.
- Decisions: `docs/decisions/anew/ANEW-0011-tool-neutral.md` (new).
- Full diff: `/compare/v1.20...v1.21`.

## v1.20 — e2e is optional

ANEW read as if every project had browser end-to-end tests: bootstrap asked "which e2e tool?",
and the examples led with e2e. In the field, e2e volume was the main cost of a feature, and a new
project answered by moving e2e out of check. Neither is the default now.

- **Test layers** (`docs/testing.md`): the cheapest test that proves the criterion — unit, then
  component or integration, a browser e2e test only for what no lower layer can prove. e2e is
  optional; a project that has it names its critical journeys and a budget at bootstrap, and over
  budget the next test goes a layer down. **What exists runs in check** (slow suites full-only):
  a suite outside check is never evidence. Bootstrap recommends component tests and no e2e
  unless a critical journey needs one.
- **No steps, no claim:** `scripts/doctor` warns when `scripts/check.conf` has no steps;
  `scripts/residue` says `RESIDUE NOT MEASURED` instead of `RESIDUE CLEAN` on such a conf.
  `scripts/check` no longer counts a whitespace-only line (a stray CR included) or an indented
  comment as a step — each ran as an empty command and printed a green step.

### Upgrading

- `scripts/check` — behavior: lines that are blank after ASCII whitespace (space, tab, CR, VT,
  FF), and lines whose first non-blank character is `#`, are skipped (before: only empty lines
  and lines starting with `#`); an indented `#name: cmd` line no longer runs. The set is ASCII on
  purpose, so every shell and locale agrees; doctor and residue use the same set.
- `scripts/doctor` — behavior: a `check.conf` with no step by that rule → WARN
  "scripts/check.conf has no steps" (instead of ok).
- `scripts/residue` — behavior: the same conf → prints `RESIDUE NOT MEASURED (<profile>)`, exits
  0, measures nothing and runs no check.
- `scripts/selftest` — scenarios for the behaviors above.
- `docs/testing.md`: intent: new "Test layers" section (journeys and budget under "What must be
  tested"; a UI screenshot never replaces the test); e2e examples become conditional.
  `prompts/bootstrap.md`, `workflows/bootstrap.md`: intent: asks which layer proves UI criteria,
  e2e only with journeys and a budget; a greenfield residue is NOT MEASURED and is run by the
  work that adds the steps. `docs/commands.md`: the NOT MEASURED result; only gate WARNs become
  FAIL under `--strict`.
- Full diff: `/compare/v1.19...v1.20`.

## v1.19 — Delivery speed, from the field

From a field project where a four-line style fix took hours: two failures showed only in a real
browser, surfaced after CI, review and triage, and motion made e2e flaky. Text only, no script
changes.

- **Deterministic mode under test** (`docs/testing.md`, Determinism): animations and transitions
  off, clock, time zone, locale and seeds fixed, third-party services stubbed. Bootstrap asks how
  the stack does it. R-03 names a running animation as a source of nondeterminism.
- **Run the touched area before a push** (Two speeds, rule 8): `--fast` plus the full-only tests
  that cover the change, by the test tool's filter. Authoring, not evidence. When CI runs full on
  the pushed commit, full is not also run locally (ANEW-0009 revised). `docs/commands.md` no
  longer reads as "a local full run at every handoff".
- **Known traps** (`docs/conventions.md`): a section that starts empty. A real finding that a
  build-time rule would have caught adds one line, recommended by the reviewer, recorded at
  triage as Amendment A-n and written by the Developer in the fix round, so it is in-plan.
  Build reads it before the first step.
- **One-pass review** (lite, `workflows/segments.md` "The chainer", ANEW-0002 revised): one
  independent session reviews and, on a clean verdict, adds the VERIFY evidence table. The
  session checks the conditions itself, not the builder: outside a sensitive area, no criterion
  that needs the code broken on purpose. UI screenshots are named in the table and attached by
  the human. Any finding, or a gap in the table → the usual flow. The triage gate confirms the
  verdict and the table; the ship gate stays.
- **Not adopted:** retrying flaky tests in CI (R-03 stands; the field project kept it too).
  Sharding CI's full run is a revisit trigger of ANEW-0009, not a rule: it splits the one
  `CHECK GREEN (full, …)` line that doctor reads.

### Upgrading

- `docs/testing.md`: intent: Two speeds rule 8 (touched area before a push); deterministic mode
  under Determinism. `prompts/recovery/flaky-test.md`: animation as a source.
- `docs/conventions.md`: intent: an empty "Known traps" section. `prompts/build.md`: read Known
  traps; touched area before a push; no local full when CI runs it. `prompts/review.md`: recommend
  Known traps lines; the one-pass review and its condition check. `workflows/feature-development.md`,
  `workflows/change-request.md`: Known traps at triage, as Amendment A-n.
- `workflows/segments.md`: intent: the one-pass review; VERIFY's entry check accepts its table.
  `workflows/README.md`, `workflows/change-request.md`, `docs/roles/README.md`,
  `docs/roles/reviewer.md`, `docs/roles/qa.md`, `docs/commands.md` (`/new-feature`, `/review`,
  `/verify`, `/change`), `adapters/generic/README.md`, the Claude Code `verify` command, every
  adapter's `new-feature` and `change` command, both `reviewer` agents: intent: the one-pass
  review. `docs/decisions/anew/ANEW-0002-segments-always-stop.md`: revised.
- `prompts/bootstrap.md`: intent: asks for the deterministic mode and known traps.
- `docs/decisions/anew/ANEW-0009-two-speeds-one-contract.md`: revised; sharding revisit trigger.
- Full diff: `/compare/v1.18...v1.19`.

## v1.18 — Field rules, generalized

From a field project that changed the process on its own and kept shipping. Its generic rules
come back here. Text only, no script changes.

- **Defer is a triage outcome:** real / noise / **defer** / investigate. A deferred finding is real
  but fixed later by a human decision. It gets an entry in the new `specs/backlog.md` (source,
  severity, recommendation, who and when), which is deleted with the work that closes it.
- **Severity drives re-review:** findings carry Critical / High / Medium / Low / Info. A fix round
  with a Medium or higher finding is re-reviewed. A Low/Info-only round goes to VERIFY, which reads
  its diff, so the producer still never verifies its own work.
- **Targeted red evidence:** reading the assert is the default. Breaking the code on purpose is
  required for concurrency, money, authorization and boundary values (typically 4–5 per spec).
- **Sensitive areas** (`docs/domain.md`, asked at bootstrap): in every mode the clarify gate is
  asked, every fix round is re-reviewed, and every criterion is proven red by breaking the code.
- **Plan amendments** are recorded in the plan as `A-n — what — why — name, date`. Review counts
  their files as in-plan.
- **Plan size signal:** a plan over ~150 lines means the spec is too big. Recommend a split.
- **Review does not wait for CI:** BUILD may hand off with the CI run of the pushed commit still
  going. REVIEW starts; TRIAGE waits for it to be green (ANEW-0009 revised).
- **Commit named paths only** (`git commit -- <paths>`), because a parallel session may have
  staged files in the same tree.
- **Infrastructure is not a flake** (R-03): a job failing outside the tests (mirror timeout, lost
  runner) is rerun with its cause written down. A test that fails and then passes is flaky, and a
  rerun is never the fix.

### Upgrading

- `specs/backlog.md`: new, take as is.
- `prompts/review.md`: intent: severity scale; defer in the triage list; amendments count as
  in-plan; may start before CI's full run ends. `docs/roles/reviewer.md`, `docs/roles/README.md`,
  `docs/commands.md`, `.github/pull_request_template.md`, `specs/TEMPLATE.md`,
  `specs/TEMPLATE-mini.md`, `workflows/bug-fix.md`, `refactor.md`, `change-request.md`: defer in
  the triage list, the DoD and the scorecard.
- `workflows/feature-development.md`, `workflows/segments.md`: intent: defer and amendments at
  triage; Low/Info-only fix rounds go to VERIFY; review starts on pushed commits; clarify is
  asked in a sensitive area.
- `prompts/build.md`: intent: CI's full run as the handoff green; named-path commits;
  where a fix round goes next. `docs/git.md`: the named-path rule.
- `prompts/verify.md`: intent: when to break the code; read Low/Info-only fix diffs; deferred
  findings have entries. `docs/roles/qa.md`: the matching power.
- `prompts/plan.md`, `specs/plans/TEMPLATE.md`: intent: SIZE at ~150 lines; the Amendments
  section. `prompts/recovery/plan-drift.md`: amendments are recorded as A-n.
- `docs/domain.md`: intent: a Sensitive areas section. `prompts/bootstrap.md`: asks for it.
  `prompts/spec.md`: names it in Constraints. `workflows/README.md`: what it changes.
- `prompts/recovery/flaky-test.md`, `docs/testing.md` (Determinism): intent: infrastructure vs.
  flake.
- `AGENTS.md`: the Specs row points at `specs/backlog.md`. A bootstrapped AGENTS.md gets the same
  pointer.
- `docs/decisions/anew/ANEW-0009`: take as is (gains a `Revised:` line).
- `.anew-version`: `v1.18`.
- Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.17...v1.18

## v1.17 — Kernel threads are not residue

From a field project whose residue test went red on a Linux CI agent: `ps` lists kernel threads
(`[kworker/0:1-events]`), which the kernel starts and stops on its own, so every run "leaked" one.
Windows never takes that path, so the template's selftest did not see it.

- **`scripts/residue`** leaves out processes whose whole command line is one bracketed name. A
  zombie (`[x] <defunct>`) still counts.
- **`scripts/selftest`** runs the POSIX path on every machine with a fake `uname` and `ps`. A kernel
  thread must not be a survivor; a zombie must be one.

### Upgrading

- `scripts/residue`, behavior: on the POSIX path, a process whose command line matches
  `^\[[^]]*\]$` is not measured. A copy that carries a local kernel-thread fix (e.g. marked
  `LOCAL CHANGE`) drops it for this one.
- `scripts/selftest`, behavior: four new residue assertions (kernel thread clean, not listed;
  zombie red, named).
- `docs/testing.md`: intent: Resource hygiene rule 2 names what is left out and what still counts.
- `.anew-version`: `v1.17`.
- Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.16...v1.17

## v1.16 — A feature fits in a day

From a field project where one feature (22 acceptance criteria, four fix rounds) took over a
working day. The root cause was size, magnified by repeated full runs and a dirty e2e database.
Text only — no script changes; every rule here is Documented.

- **Size signal:** the spec's self-critique recommends a split when a spec holds more than one user
  capability or more than ~8–10 criteria; keeping it as one is recorded in the spec. R-08: a new
  capability mid-work is a new spec, not a change.
- **Data counts too** (testing.md, Resource hygiene rule 5; ANEW-0007 revised): every run starts
  from a known state; what a run writes never reaches the next one. Bootstrap's inventory names it.
- **A full green is evidence for its commit — run it once** (Two speeds rule 6; ANEW-0009
  revised): review, verify and gates cite the existing `CHECK GREEN (full, …)` of the exact commit
  (handoff, or a CI run whose SHA equals HEAD) instead of re-running. **Writing one test runs that
  test** (rule 7): authoring, never evidence; repeat runs only for R-03.
- **Fix rounds are counted:** fix commits carry `[plan NNNN/fix-k]`; the review report opens with
  `Review round n · fix rounds so far: k`; a fourth round is not started before R-06.

### Upgrading

- `docs/testing.md`: intent — Resource hygiene rule 5 (data); Two speeds rules 6 (cite, don't
  re-run, same SHA) and 7 (one test while writing it; repeats only in R-03).
- `prompts/spec.md`: intent — SIZE step in the self-critique. `specs/TEMPLATE.md`: the same hint
  in the Acceptance criteria comment.
- `prompts/build.md`: intent — rule 7 while iterating; `[plan NNNN/fix-k]` on fix commits, no
  fourth round before R-06. `docs/git.md`: the fix-commit format.
- `prompts/review.md`: intent — cite an existing full green for the commit; open with the round
  count; flag R-06 after round 3. `prompts/verify.md`: intent — cite, don't re-run.
- `prompts/recovery/spec-change.md` (R-08): intent — a new capability is a new spec.
- `prompts/bootstrap.md`: intent — the inventory names data left for the next run.
- `workflows/feature-development.md`, `prompts/recovery/README.md`, README: the matching lines.
- `docs/decisions/anew/ANEW-0007`, `ANEW-0009`: take as they are (each gains a `Revised:` line).
- `.anew-version`: `v1.16`.
- Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.15...v1.16

## v1.15 — Prompts close their gaps

A review of every prompt against the roles, workflows and testing rules. Text only — no script
changes; every rule added here is Documented.

- `review.md`: loads the approved plan too (the Tests dimension checks its criterion ↔ test map);
  new **Plan conformance** dimension — changed files outside the plan's list are findings (R-07);
  Correctness covers every User experience state and accessibility.
- `build.md`: an error from the current plan step is fixed inside BUILD; R-01 starts when the error
  comes from outside the step or survives two attempts. The ramp list adds R-03, R-10 and R-09.
- `plan.md` and `specs/plans/TEMPLATE.md`: the criterion ↔ test map has a **Profile** column
  (fast or full); a new test must be caught by its step's selector (testing.md, rule 4).
- `spec.md`, `plan.md`, `adr.md`, `review.md`, `verify.md`: write in the docs language from
  AGENTS.md; field labels stay English.
- `spec.md`: ask for a link to a fixed version of the design (or a dated export); a design that
  changes later is a spec change (R-08).
- `clarify.md`: at most ~7 questions, ordered by impact; the rest wait for the self-critique.
- `verify.md`: the evidence paragraph is a list; "a test that can't fail" is checked by reading
  the assert or by breaking the code in a temporary copy outside the repo, never committed.
- `bootstrap.md`: the testing interview asks, for UI work, the e2e tool and who owns the
  app-under-test lifecycle.
- R-09: the fresh session deletes the state file once it has taken over; nothing outlives it
  unless moved into the plan. R-03, R-08, R-12 end with `./scripts/check (full)` green. R-05, R-06,
  R-09 and R-10 change no code (R-05's red reproduction is the point), so they carry no check exit.

### Upgrading

- Documents (intent, apply in your own words if you translated them): each bullet above is the
  intent for its file; `docs/commands.md` — `/review` reads the plan.
- `specs/plans/TEMPLATE.md`: add the Profile column; existing plans need no change.
- `.anew-version`: `v1.15`.
- Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.14...v1.15

## v1.14 — Fast output is caught as evidence

From the same field report; it is also ANEW-0009's first revisit trigger.

- `scripts/doctor` warns (every mode, never fails) when a shipped spec, or in CI the pull request
  description, shows `CHECK GREEN (fast, …)` and no `CHECK GREEN (full, …)`. The description is
  read from the event payload (`$GITHUB_EVENT_PATH`), no network; it is checked when the PR is
  opened, reopened or pushed to, not on a description-only edit. An untagged conf's
  `(fast = full: …)` run counts as full. The rule moves from Documented to Validated.
- R-02 (red test): many unrelated tests red at once → check the environment first (daemons,
  containers, ports); a crashed environment is not a code fault.
- `scripts/selftest` covers the warning for specs and PR descriptions, and that full output, or an
  untagged `--fast` run, is not reported.

### Upgrading

- `scripts/doctor` (behavior): for each `specs/done/*.md`, and for `$GITHUB_EVENT_PATH` when it is
  a pull-request payload, warn if the text contains `CHECK GREEN (fast,` and not
  `CHECK GREEN (full,`.
- `scripts/selftest` (behavior): the doctor wrapper also unsets `GITHUB_EVENT_PATH`; new
  `doctor_pr <payload>` helper; the scenarios above.
- `docs/testing.md`: intent — Two speeds rule 2 names the doctor warning.
- `prompts/recovery/red-test.md`: intent — environment first when many unrelated tests are red.
- README: the "Evidence cites the full profile" row is Validated.
- `.anew-version`: `v1.14`.
- Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.13...v1.14

## v1.13 — Upgrades without collisions

From the same field report: upgrading a derived project meant guessing its base, renumbering the
template's ADRs around the project's own, and losing local script extensions to "copy".

- `.anew-version` records the ANEW version a workspace is based on; `scripts/doctor` prints it
  (`ok ANEW base version: v1.13`) and warns when it is missing. In the template, `scripts/selftest`
  checks it matches the newest CHANGELOG entry.
- The template's decisions move to `docs/decisions/anew/` as `ANEW-0001` … `ANEW-0009` (each
  with a `Revised:` line; decisions unchanged), plus ANEW-0010 recording why. Project ADRs number
  from 0001 in `docs/decisions/` with no collisions; `prompts/adr.md` counts only those.
- CHANGELOG opens with "How to upgrade": base from `.anew-version`, behavior lists for scripts,
  one-line intents for documents, a diff link per release.
- `scripts/selftest` checks usage output by its `usage:` prefix and exit code, not its full text,
  so a legitimate extension of a script's arguments is not reported as a difference.

### Upgrading

- `.anew-version` (new): one line, `v1.13`.
- `scripts/doctor` (behavior): print `ANEW base version: <first line of .anew-version>` as ok;
  warn when the file is missing. Never fail on it.
- `scripts/selftest` (behavior): usage assertions match `usage:` only; fixture copies
  `.anew-version`; the version scenarios above.
- `docs/decisions/`: move the template decisions you have (ADR 0001–0009 as shipped by ANEW, if
  you kept them in your own range) to `docs/decisions/anew/` under their `ANEW-NNNN` names, or take
  the folder from v1.13 and delete your copies. Your own ADRs stay where they are; one that had
  to be renumbered around a template ADR may keep its number. Add ANEW-0010.
- `docs/decisions/README.md`: intent — two owners, two places; the next project number counts
  only `docs/decisions/`.
- `prompts/adr.md`: intent — NNNN is the highest in `docs/decisions/` + 1, `anew/` excluded.
- README: the `docs/decisions/` row names the two places.
- Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.12...v1.13

## v1.12 — Check tells you how long it took

From a field report (a two-stack project that adopted v1.7): the split between fast and full is
decided on step durations, and nothing in ANEW measured them.

- `scripts/check` prints `<== <step> (n s)` after every step (red ones too) and the total in the
  green line: `CHECK GREEN (full, 14 steps, 1080 s)`. `date +%s`, no `bc`; where the clock gives
  no number, times are left out and the run still counts. The `==> <step>` lines and the
  `CHECK GREEN (<profile>, n steps` / `CHECK FAILED (<profile>) at step:` prefixes are unchanged.
- `docs/testing.md`, Two speeds: "~a minute" is a per-step threshold, not a fast total; when fast
  grows too long, drop lint, then formatting, then unit tests. New rule 4: split a test step by a
  selector (category, trait, tag, namespace) and its inverse, never by a list — a test added
  later then still runs in one profile. New rule 5: decide on the median of at least 3 runs.
- `prompts/bootstrap.md` (3d) applies rules 4 and 5 at the gate.
- `scripts/selftest` checks that durations are present (never their value) and that a missing
  clock leaves them out.

### Upgrading

`scripts/check` (behavior, for copies you extended): time each step with `date +%s` and print
`<== <step> (n s)` after it, red or green; append `, <total> s` inside the green line; print no
time when `date +%s` is not a number. Anything that parses the green line must accept the extra
field. `docs/testing.md`: Two speeds rule 3 (per-step threshold, removal order), new rules 4 and 5.
`prompts/bootstrap.md` 3d: selector split, median of 3. Full diff: https://github.com/engindemirog/ai-native-engineering-workspace/compare/v1.11...v1.12

## v1.11 — Codex becomes a first-class adapter

- `adapters/codex/`: every command as a project-level Codex skill (`skills/<name>/SKILL.md`, the
  same pointers as the Cursor commands), invoked as `$analyze`, `$plan 0003`, … No pointer file:
  Codex reads `AGENTS.md` natively. Each skill is explicit only (`agents/openai.yaml`:
  `allow_implicit_invocation: false`), so Codex never starts a gated stage by itself. Review runs
  in a fresh Codex session; `specs/done/` is backed by CI. The deprecated user-level custom
  prompts (`~/.codex/prompts/`) are not used.
- `./scripts/init codex` installs the skills to `.agents/skills/` (kept unless `--force`).
- `scripts/doctor`: adapter parity covers Codex (`adapter parity: <x> missing in codex`) and fails
  on a Codex skill that is not explicit-only; `.agents/skills/` counts as an installed adapter.
  `scripts/selftest` covers both checks.
- README (quickstart, command sentences, a Codex column in "How strongly is each rule held?"),
  `adapters/README.md` and `docs/commands.md` list Codex next to the other tools.

### Upgrading

Where Codex is used, run `./scripts/init codex` and commit `.agents/skills/`. Template users copy
`adapters/codex/` and the `scripts/init`, `scripts/doctor` and `scripts/selftest` changes.

## v1.10 — The commands document themselves

- `docs/commands.md`: one page for all 17 commands (5 scripts, 12 slash commands) — command map
  with the four human gates, then for each: what it does, when to use it, reads / writes, stops
  at, lite / strict, refusal (verbatim), common mistake; a quick-reference table and the two
  golden rules. It points at the files that define the rules instead of restating them; the
  recovery catalog stays in `prompts/recovery/README.md`.
- README links it at the top ("New here?").
- `scripts/doctor` requires `docs/commands.md` like any core file and, where `adapters/` exists,
  fails when a command or script has no section in it
  (`command reference out of date: /<x> missing from docs/commands.md`). `scripts/selftest` proves
  the guard fires and clears.
- No behavior changes.

### Upgrading

Copy `docs/commands.md`, the README "New here?" line, `scripts/doctor` and `scripts/selftest`.
If you added your own commands, give each a ``### `/<name>` `` section in `docs/commands.md`.

## v1.9.1 — README stands on its own

- README drops the "Origin" section that pointed to the course: ANEW is now its own environment,
  separate from it. No change to the core.

### Upgrading

Nothing to copy.

## v1.9 — The residue test is one command

- `scripts/residue` runs the residue test (`docs/testing.md`, Resource hygiene): it measures processes
  and available memory, runs `./scripts/check` twice (`--fast` for the fast profile), and names
  every survivor with its command line; memory over the tolerance (`ANEW_RESIDUE_MB`, 512 MB) is
  residue too. A process only counts if it is still alive at a second look. Unix-likes via `ps`,
  Windows (Git Bash) via PowerShell/CIM. A red check aborts it: the test needs a green check.
- `docs/testing.md`, `prompts/bootstrap.md` and `workflows/bootstrap.md` name the command, for both
  profiles; `docs/testing.md` adds: rerun it whenever `scripts/check.conf` changes.
- `scripts/selftest` covers it (usage, red check, `--fast`, a leaked process named, a waited-for
  child not reported). Its assertions look for the scenario's own marker, so a busy machine cannot
  make them flaky.

### Upgrading

Copy `scripts/residue` (keep it executable) and `scripts/selftest`, then run `./scripts/residue` and
`./scripts/residue --fast` against your `scripts/check.conf`.

## v1.8 — ANEW proves its own scripts

- `scripts/selftest`: 50 scenario checks that `scripts/check` (profiles, tags, failures, arguments,
  stdin) and `scripts/doctor` (every gate, `--strict`, immutability, twin specs, mini-specs,
  evidence hygiene, adapter parity, missing core files) behave as documented. Each scenario runs
  in a throwaway copy of the ANEW core outside the repo; a project's own specs and code are never
  copied, so it behaves the same in the template and in bootstrapped projects. CI runs it after
  doctor.
- README catches up with v1.4–v1.7: the enforcement table gains evidence hygiene (Validated),
  resource hygiene and the UX section (Documented); `--fast`, evidence pointers and the selftest
  are described; the ADR range and the script count no longer go stale.
- `docs/decisions/README.md`: accepted ADRs may take editorial corrections that leave the decision
  unchanged, recorded as a `Revised:` line. ADR 0007 records its v1.6.1 wording change that way.

### Upgrading

Copy `scripts/selftest` (keep it executable) and add its step to your CI's doctor job
(`.github/workflows/check.yml`). If you changed `scripts/check` or `scripts/doctor` locally, the
selftest tells you where your copy now differs from the documented behavior.

## v1.7 — Two speeds, one contract

- `scripts/check --fast` runs only the steps tagged `[fast]` in their name; plain `./scripts/check`
  still runs every step (full) and is the only evidence. Output names the profile
  (`CHECK GREEN (fast, n)` / `(full, n)`, `CHECK FAILED (fast) at step: …`); unknown arguments are
  an error. Untagged confs run everything in both profiles; tagged confs still run fully under the
  v1.6.1 script.
- `docs/testing.md` gains "Two speeds, one contract": fast iterates, full ships.
- `prompts/build.md` (incl. §fixes), `workflows/refactor.md` and the recovery ramps R-01, R-02
  iterate with `--fast`; handoffs, PROVE steps and every ramp exit (R-01, R-02, R-04, R-07, R-11)
  run full. `prompts/verify.md` rejects fast output as evidence. `prompts/bootstrap.md` splits and
  tags the steps and reports both durations; the residue test and test-count check cover both.
- CI keeps running the full contract (now said in `check.yml`); README lists the new rule as
  Documented. `scripts/check.conf.example` shows a `[fast]` step.
- ADR 0009 records the decision and the per-commit trade-off.
- Fix: `scripts/check` runs each step with stdin from `/dev/null` — a step that read stdin used to
  swallow the remaining check.conf lines, skip them silently and still report green.

### Upgrading

Copy `scripts/check` and the edits to `docs/testing.md`, `prompts/build.md`, `prompts/verify.md`,
`prompts/bootstrap.md`, `prompts/recovery/` (R-01, R-02, R-04, R-07, R-11), `workflows/refactor.md`
and `workflows/bug-fix.md`. Tag the quick steps in your `scripts/check.conf` with `[fast]` in the
step name (keep every test step actually running its tests — count them), and keep citing only
full-profile output as evidence.

## v1.6.1 — Fixes: no stack-specific example that breaks tests; `.evidence/` is evidence too

- `scripts/check.conf.example` (v1.5): the resource-hygiene example added build flags to the test
  command; some test runners forward such flags to the test process and run zero tests. The
  example is now a JVM (Gradle) build, and the examples elsewhere in the core follow suit.
- `prompts/bootstrap.md` Prove step: confirm every test step still runs the same number of tests
  after the switches are added.
- `scripts/doctor` and the Evidence policy cover `.evidence/` as well as `evidence/`.

### Upgrading

If you copied the v1.5 example into `scripts/check.conf`, check that your test step still runs your
tests (count them), and drop any build-only flags from it. Copy `scripts/doctor`.

## v1.6 — User experience lives in the spec

- `specs/TEMPLATE.md` gains a required "User experience" section: flow, states (empty, loading,
  error, success, no permission), design link, accessibility — or "none — no user interface".
  Every listed state gets an acceptance criterion. `specs/TEMPLATE-mini.md` gains a `Design:` link.
- `prompts/clarify.md` and `prompts/spec.md` ask for flow, states and the design link (never invent
  visuals); `prompts/verify.md` and `docs/testing.md` check UI screenshots against that section.
- ADR 0008 records why UX is a spec section, not a new segment, role or design-tool integration.

### Upgrading

Copy the "User experience" section of `specs/TEMPLATE.md`, the `Design:` line of
`specs/TEMPLATE-mini.md`, and the edits to `prompts/clarify.md`, `prompts/spec.md`,
`prompts/verify.md` and `docs/testing.md`. Specs already in `specs/active/` keep their shape;
new specs use the section.

## v1.5 — Check leaves nothing running

- `docs/testing.md` gains "Resource hygiene": no daemons, servers, workers, browsers, app under
  test or containers survive a check run; defined by the residue test (check twice, process count
  and memory back to baseline). Categories only — no tool list.
- `prompts/bootstrap.md`: check.conf commands go through inventory → neutralize → prove; a
  bootstrap that fails the residue test is not done; adoption proposes flag changes, never imposes.
  `workflows/bootstrap.md` VERIFY runs the residue test.
- `scripts/check.conf.example`: the build example follows the rule (no warm build daemon).
- ADR 0007 records the decision and why a per-stack switch list was rejected.

### Upgrading

Copy the "Resource hygiene" section of `docs/testing.md` and the bootstrap edits. Then, for your own
`scripts/check.conf`: inventory what each command can leave running, add your stack's
no-daemon / no-server switches (or stop inside the same step), set e2e to single-worker headless
with one component owning the app lifecycle, and run the residue test to confirm.

## v1.4 — Evidence is referenced, not stored

- `docs/testing.md` gains an "Evidence policy": evidence is a pointer (test name + command), never a
  saved file; non-reproducible items go into the PR; no repo clones inside the repo; no `evidence/`.
- `prompts/verify.md`, `prompts/build.md` and `prompts/review.md` apply the policy where evidence
  is produced: pointers and commands, output shown in the conversation, nothing written to files.
- `scripts/doctor` warns (every mode, never fails) on a nested `.git` directory and on any
  `evidence/` directory in the working tree.
- ADR 0006 records the decision and why retention/archive tooling was rejected.
- Fix: `scripts/doctor` reports a nested clone once, not the `evidence/` inside it (693d020).

### Upgrading

Copy the "Evidence policy" section of `docs/testing.md`, the edits to `prompts/verify.md`,
`prompts/build.md` and `prompts/review.md`, and `scripts/doctor` (evidence hygiene checks). Then move
any non-reproducible items from an existing `evidence/` directory into their PRs and delete the
directory (and any repository clones inside your working tree).

## v1.3 — Hardening: ANEW applies ANEW to itself

- `scripts/doctor` requires every core file (`workflows/change-request.md` and the specs/decisions
  READMEs were missing from the list).
- `scripts/doctor` validates `specs/done/` immutability against a base ref (uncommitted edits
  locally, the PR merge-base in CI); FAIL under `--strict`. CI checkout uses `fetch-depth: 0`.
- Adapter parity is checked by `scripts/doctor`: every Claude Code command must exist for Cursor
  and Copilot (the five workflow commands were added in the previous release).
- README states how strongly each rule is held — Documented / Validated / Enforced — per tool, and
  no longer overclaims ("impossible to break", "physically immutable", "enforced" role separation).
- README says why ANEW exists (decision errors, not typing speed) and where it stops (intent → merge).
- ADR 0004 (enforcement levels) and ADR 0005 (scope boundary).

### Upgrading

Copy `scripts/doctor`; copy the five new command files per adapter (`adapters/cursor/commands/`,
`adapters/github-copilot/prompts/`: bootstrap, fix-bug, refactor, adr, recover) and re-run
`./scripts/init <tool>`; set `fetch-depth: 0` on the doctor job's checkout in your CI.

### Also included (accumulated since the last release)

- Refactors open a mini-spec (Changed behavior = none, Preserved = characterization); bug-fix triage
  is a human gate in every mode; `refactor/` branches documented.
- Cursor and Copilot gain `/bootstrap`, `/fix-bug`, `/refactor`, `/adr`, `/recover` and Cursor an
  immutability rule for `specs/done/`; `scripts/init` keeps existing files unless `--force`.
- Refusals and handoffs are written in the chat language, command names verbatim.
- `scripts/doctor`: two open specs sharing a `Source:` key are reported (FAIL under `--strict`).
- Lite mode starts with `/new-feature`, not the segment commands: said in `AGENTS.md`, in the
  bootstrap report's closing `Next:` line, and in `workflows/segments.md`.
- Bootstrap asks the interview and document languages first; recorded as the `Language:` line in
  `AGENTS.md` and a "Language" section in `docs/conventions.md`; `scripts/doctor` warns if unset.
  Protocol fields and the ANEW core stay English.
- Scripts and the Claude hook carry the executable bit in git; `.gitattributes` pins LF for them.
- Lite mode: spec approval is a light yes/no gate, never skipped (it is PLAN's entry condition).
- "No spec, no code" clarified for lanes without a spec file: bug fixes use report + reproduction
  test, trivial changes use work item + `docs/git.md` policy; the PR template accepts both.
- Incident specs use the shared numbering and `specs/TEMPLATE-mini.md`.
- `scripts/doctor`: duplicate spec numbers (twin specs) and unmarked shipped specs are reported.
- Claude hook covers MultiEdit and NotebookEdit; `prompts/README.md` gained a prompt index.
- ADRs 0001–0003 record the workspace's own design decisions.

## Change-request lane (commits b39de57, 3ce6b7c)

- `workflows/change-request.md`: triage rubric (bug / trivial / change), trivial lane, mini-spec
  lane; `specs/TEMPLATE-mini.md` with changed + preserved behavior criteria.
- `/change` in every adapter; trivial-change policy asked at bootstrap, recorded in `docs/git.md`.
- `scripts/doctor`: mini-specs need a `Source:` work item.

## Segments and the chainer (commit 7642b8d)

- `workflows/segments.md`: ANALYZE, PLAN, BUILD, REVIEW, VERIFY with entry checks and handoffs.
  Rule: *Segments always stop; /new-feature flows only as far as the mode allows.*
- Segment commands for Claude Code, Cursor (`.cursor/commands/`) and GitHub Copilot
  (`.github/prompts/`, read-only `reviewer` agent, `specs/done/` instruction).
- Spec status machine and plan approval line documented; STOP RULEs on the role cards.
- `scripts/doctor` checks spec/plan consistency; `--strict` makes violations fail in CI.

## v1.0 — Initial release (commit c578aed)

- Core: `AGENTS.md`, `docs/`, `specs/`, `workflows/`, `prompts/` (incl. recovery ramps R-01…R-12),
  `scripts/check`, `scripts/doctor`, `scripts/init`.
- Adapters: Claude Code (commands, reviewer subagent, permission denies, immutability hook),
  GitHub Copilot, Cursor, generic.
