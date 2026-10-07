# Changelog

Template users: compare your copy against the version you started from and pull what you need —
the core is Markdown plus three scripts, so upgrades are file copies, not migrations.

## v1.4 — Evidence is referenced, not stored

- `docs/testing.md` gains an "Evidence policy": evidence is a pointer (test name + command), never a
  saved file; non-reproducible items go into the PR; no repo clones inside the repo; no `evidence/`.
- `prompts/verify.md`, `prompts/build.md` and `prompts/review.md` apply the policy where evidence
  is produced: pointers and commands, output shown in the conversation, nothing written to files.
- `scripts/doctor` warns (every mode, never fails) on a nested `.git` directory and on any
  `evidence/` directory in the working tree.
- ADR 0006 records the decision and why retention/archive tooling was rejected.

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
