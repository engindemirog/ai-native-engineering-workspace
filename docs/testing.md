# Testing

> **Template — filled during bootstrap.**

## The contract
- Every acceptance criterion maps to at least one test (criterion ↔ test map lives in the plan).
- Tests assert **behavior**, not implementation details or mere status codes.
- The whole suite runs inside `scripts/check` — one command, everywhere.

## Frameworks & layout
<!-- Test framework(s), where tests live, naming pattern. -->

## What must be tested
<!-- e.g. every business rule (BR-n), every boundary/forbidden dependency; the e2e journeys and
     budget, if the project has e2e at all (Test layers). -->

## Test layers
1. **The cheapest test that proves the criterion.** Unit first, then component or integration
   (UI states render in component tests), and a browser end-to-end test only for what no lower
   layer can prove. A test sits at the lowest layer that fails for the right reason.
2. **e2e is optional, and budgeted.** ANEW does not require end-to-end tests. A project that
   has them names at bootstrap the few critical journeys they cover and a budget (journeys and
   minutes, under "What must be tested"). Over budget, no e2e test is added: the next test goes a
   layer down, or an existing one moves down.
3. **What exists runs in check.** Every test, e2e included, is a check step — slow suites
   full-only (Two speeds). A suite outside check costs its upkeep and proves nothing: it is never
   evidence, and nobody sees it break.
4. A UI criterion also needs a screenshot against the spec's User experience (Evidence for UI
   criteria). The screenshot is no reason for an e2e test: the states are tested at the lowest
   layer that can (rule 1).

## Protected-tests rule
Weakening asserts, deleting, or skipping tests to reach green is forbidden. A red test triggers
`prompts/recovery/red-test.md` (R-02) — first decide what is wrong: code, test, or spec.

## Characterization tests
Before refactoring untested code (`workflows/refactor.md`) and for brownfield change requests
(`workflows/change-request.md`, Preserved behavior), pin the current behavior first — warts
included. They are written from observation, not from what the code "should" do.

## Evidence for UI criteria
A screenshot is evidence for a UI criterion; for change requests, before/after screenshots that
also show the preserved behavior. Screenshots go into the PR, not the repo (Evidence policy).
A screenshot proves a criterion only against the spec's "User experience": every state it lists
(empty, loading, error, success, no permission), compared with the linked design if there is one.

## Evidence policy
1. **Evidence is referenced, not stored.** Each acceptance criterion's evidence is a pointer: the
   test's name and the command that reproduces it (`./scripts/check`). The criterion ↔ evidence
   table in the spec/plan is the only evidence artifact that lives in the repo.
2. **Reproducible evidence is never filed.** No saved check output, console dumps, coverage reports
   or log copies in the repo — git history and CI runs already archive every execution.
3. **Non-reproducible evidence** (a screenshot of a manual UI check, a one-off measurement, an
   external-system confirmation) goes into the pull request (description or attachment); the
   evidence table links to it. It is the exception, not the rule.
4. **Never clone or copy the repository inside its own working tree.** Clean-clone verification
   runs in a temporary directory outside the repo; only the one-line result (command + green/red)
   is recorded in the evidence table. The clone is always deleted, never kept.
5. **There is no `evidence/` (or `.evidence/`) directory in this workspace.** An agent that feels
   the need to create one is about to violate rule 1. `scripts/doctor` warns on both violations.

## Resource hygiene
1. **A check run leaves nothing running.** No survivors of any kind: build/compile daemons,
   package-manager services, test hosts and parallel workers, watch modes, browsers, the application
   under test, containers or emulators started for the run. Agents run check an order of magnitude
   more often than humans; per-run residue compounds into machine starvation.
2. **The residue test** (the rule's definition, not advice): run `./scripts/check` twice back to
   back; after each run, process count and memory return to the baseline measured before the first.
   `./scripts/residue` runs it (`--fast` for the fast profile) and names every survivor with its
   command line; it lists anything started meanwhile too, so run it on an otherwise idle machine.
   Kernel threads (`[kworker/…]` on Linux) are left out: no step can start one. Zombies still
   count. Rerun it whenever `scripts/check.conf` changes.
3. Warm-process caches trade memory for speed for humans who build rarely; with an agent, trade the
   seconds back for a flat memory profile.
4. Interactive modes (watchers, dev servers, REPLs) never belong in check. e2e, where a project
   has it, runs single-worker and headless by default; one component owns the app-under-test
   lifecycle — started for the run, stopped at the end, including on failure and timeout.
5. **Data counts too.** Every run starts from a known state: what a run writes — database rows,
   files, queues, uploaded objects — never reaches the next run, also after a run killed halfway.
   Use a fresh database (or schema) per run, or seed and clean up inside the same step, keeping its
   exit code. The residue test measures processes and memory only; tests that pass on a clean state
   and fail on a used one are this rule failing, not the code (R-02, environment first).

## Two speeds, one contract
1. `./scripts/check` is still the one way to ask "is this good?"; `--fast` is a speed of the
   contract, not a second contract.
2. **Fast green is a working state; only full green is evidence.** Per step, per finding, per
   iteration → `--fast`. Segment exits, PROVE steps, recovery-ramp exits, the verify table and CI
   → `CHECK GREEN (full, …)`. `scripts/doctor` warns when a shipped spec, or in CI the pull
   request description, shows `CHECK GREEN (fast, …)` and no `(full, …)`.
3. Fast: compile and the quick tests (unit, lint). Full only: long integration suites, e2e, and
   any single step over ~a minute — the minute is a per-step threshold, not a total for the fast
   profile; fast has no fixed total. Bootstrap decides per stack and tags the steps `[fast]` in
   check.conf. When fast grows too long to iterate with, take steps out in this order: lint
   first, then formatting, then unit tests; compilation stays longest.
4. **Split a test step by a selector, never by a list.** The fast step selects with a filter
   (a category, trait, tag or namespace) and the full-only step runs the same filter inverted,
   so "fast ∪ the rest = every test" holds by construction: a test added later still runs in
   one of them. Splitting by naming projects or files leaves a silent hole — a new one that is
   not added to check.conf runs in neither profile while check stays green.
5. Durations come from check itself (`<== <step> (n s)` per step, the total in the green line).
   Decide a split, or report a profile's duration, on the median of at least 3 runs — single
   runs vary too much to decide on.
6. **A full green is evidence for its commit — run it once.** When `CHECK GREEN (full, …)` exists
   for the exact commit at hand (the builder's handoff, or a CI run), review, verify and the gates
   cite it — the line, plus the CI run link and its commit SHA, which must equal HEAD — instead of
   running full again. A new commit needs a new full run.
7. **Writing one test runs that test.** While writing or fixing a single test, run it alone with
   the test tool's own filter, without the suites that depend on it. That is authoring, never
   evidence; `scripts/check` stays the way to ask "is this good?". Repeat runs are for the
   flaky-test hunt only (R-03).
8. **Before a push, run the touched area.** `--fast`, plus the full-only tests that cover what
   changed (the touched module's integration tests; the touched journey's e2e test, if there is
   one), selected with the test tool's own filter. Failures that only show against real
   infrastructure or in a real browser then surface in minutes, not after a CI round, a review
   and a triage. Like rule 7 this is authoring, never evidence. When CI runs the full profile on
   the pushed commit, that run is the full green (rule 6): do not also run full locally before
   pushing.

## Determinism
Flaky tests are fixed, not retried or skipped — see R-03. Evidence of a fix: 5 consecutive green runs.
An infrastructure failure outside the tests (mirror timeout, lost runner) is not a flake: rerun
only the failed jobs and write the cause down (R-03 tells the two apart).

**The app under test runs in a deterministic mode.** Animations and transitions are off; the
clock, time zone, locale and random seeds are fixed; third-party services are replaced by stubs.
A test that measures or asserts while an animation runs is waiting on time, not on state — its
result depends on the machine's speed. Turn motion off in both places the stack offers: the test
tool's setting (e.g. a reduced-motion preference) and the app's own switch for test builds.
Bootstrap records how this stack does it under "Frameworks & layout"; a decision that is not
obvious gets an ADR.
