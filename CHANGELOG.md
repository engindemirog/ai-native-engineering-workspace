# Changelog

Template users: compare your copy against the version you started from and pull what you need —
the core is Markdown plus a few POSIX scripts, so upgrades are file copies, not migrations.

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
