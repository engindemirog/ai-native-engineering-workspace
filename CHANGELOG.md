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
