# Spec 0012 — the VS Code extension: the agent's next step on the screen

- Status: Approved
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0012-plan.md`
- Self-critique: done (G-1–G-4 accepted as recommended, Engin Demiroğ, 2026-11-18)
- Source: the human after 0011's SHIP: "BUILD: waiting for Developer. diyor. ama build yapmıyor gibi"

## Intent
After a decision on the screen (a spec or plan approved, a triage saved) the work moves to the
agent: PLAN, BUILD, a fix round, REVIEW or VERIFY. The agent's chat that asked for the decision
does not learn that it was taken on the screen, and the screen, opened again, says only
"BUILD: waiting for Developer." — no command, no button. The human waits for a build that nothing
has started.

This spec shows, on every row that waits for the agent, the command that continues it —
`/build 0003`, `/review 0003`, … in the picked agent's form — with **Copy**, and **Continue in
Claude Code** where Start is offered today (0011). A human can then always take the work one step
further from the screen.

It stays a view: the extension still never runs a segment itself; Continue opens a fresh Claude
Code session with the command, as Start does.

Success means: a plan approved on the screen, the row opened again shows `/build NNNN` with Copy
and Continue, and Continue starts the build in a new session.

Deliberately not done:
- reaching the agent's session that is already open (no API for it; G-2);
- a Continue for agents other than Claude Code (as 0011 G-4);
- any change to `scripts/status` or to the segments.

## Requirements
1. **The command for a row that waits for the agent**, from its stage and who (G-1):
   PLAN · Developer → `/plan NNNN`; BUILD · Developer → `/build NNNN`; FIX ROUND · Developer →
   `/build NNNN`; REVIEW · reviewer → `/review NNNN`; VERIFY · QA → `/verify NNNN`. Any other row
   (the human's, shipped, unclear) has none.
2. **In the agent's form:** the agent picked on the Start screen (0011), `$…` for Codex.
3. **On the row's screen:** the stage, the line status gives, the command, **Copy**, and
   **Continue in Claude Code** when `claude` is found, the pick is Claude Code and its adapter is
   installed (0011's rule for Start). For REVIEW and VERIFY the screen says the session must be a
   fresh one — which Continue always is.
4. **After a decision:** the answer box that today shows "Next step — run in your agent" and Copy
   gets the same Continue.
5. **Release:** ANEW v1.29.1; extension 0.3.1, the `.vsix` on the GitHub release.

## User experience
- **Design reference:** the 0010/0011 screens; the command in the same `code.cmd` block as the
  answer box.
- **Accessibility:** Copy and Continue are real buttons; results announced with `role=status`.
- **Language:** English, as the scripts' output is.

## Constraints & out of scope
- The extension writes no file; Continue opens a terminal running `claude "<command>"`, as Start.
- Tests run without a VS Code instance: the mapping and the HTML in pure modules with
  `node:test`; the VS Code layer by the human's run at SHIP.

## Acceptance criteria
- [ ] AC-1 — each agent stage gives its command, and the human's, shipped and unclear rows give
  none (unit tests on `scripts/status --json` rows for every stage, including a real fixture).
- [ ] AC-2 — the command follows the picked agent: `$build NNNN` for Codex, `/build NNNN` for the
  others (unit tests).
- [ ] AC-3 — the row's screen shows the command with Copy, and Continue only under 0011's Start
  rule; REVIEW and VERIFY name the fresh session; the answer box after an approval offers Continue
  under the same rule (unit tests on the HTML).
- [ ] AC-4 — on this machine the packaged `.vsix` installs, and a plan approved on the screen is
  continued with `/build NNNN` from the reopened row; judged by the human at SHIP.
- [ ] AC-5 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; `docs/commands.md` §F, `extensions/vscode/README.md`, CHANGELOG v1.29.1 and
  `.anew-version` v1.29.1.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [ ] Docs updated (`docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [ ] Spec moved to `.anew-dev/done/`

## Self-critique (approved 2026-11-18)
- **G-1 — the command from stage and who, not from status's text.** Status's `next` is prose for a
  human ("finish the plan's steps; record …"); parsing it would break on any wording change.
  Recommendation: a fixed table from stage + who to the segment, tested against status's JSON
  rows; status itself is unchanged.
- **G-2 — a fresh session, never the waiting one.** The chat that asked for the approval cannot be
  reached from VS Code. Recommendation: Continue opens a new session; the screen also says "or tell
  the session that is waiting to go on". A fresh session is safe for every segment (each reads its
  files), and for REVIEW and VERIFY it is what the invariant requires.
- **G-3 — a fix round continues with `/build NNNN`.** `/build` resumes fix rounds from the plan's
  triage (`prompts/build.md §fixes`). Recommendation: the same command; the screen's line from
  status names the open findings.
- **G-4 — a patch release.** It completes 0011's screens rather than adding a new one.
  Recommendation: v1.29.1 and extension 0.3.1; no rule changes.
