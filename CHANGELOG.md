# Changelog

Template users: compare your copy against the version you started from and pull what you need —
the core is Markdown plus two scripts, so upgrades are file copies, not migrations.

## Unreleased

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
