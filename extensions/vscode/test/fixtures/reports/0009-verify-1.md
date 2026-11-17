## VERIFY 0009: independent QA at HEAD 44ba9c955fd74e1be30eb1d2353e31a65c677375 (feat/0009-vscode-extension)

**Overall verdict: Pass.** No High or Medium findings. AC-6 (the real install and the tree view) is left to the human at SHIP. I edited and committed nothing in the repo; `git status` is clean. The repo has one new gitignored file, the `.vsix`.

### Runs (one at a time, none killed for low memory)
- `./scripts/selftest` @44ba9c9: **496 passed, 0 failed**, exit 0. Log: <scratchpad>\verify-0009\selftest.log
- `./scripts/doctor --strict` @44ba9c9: **0 fail, 5 warn**, all 5 the expected pre-bootstrap ones. It reports base version v1.27.
- `npm test` in `extensions/vscode` @44ba9c9: typecheck clean, **34 tests, 34 pass, 0 fail, 0 skipped**. The three integration tests ran against the real `scripts/status` and `scripts/gate` and were not skipped. The plan's build evidence says 28 at b25111a; the extra 6 are `panel.test.ts` and the new fix-round tests.
- `npm run package`: `anew-0.1.0.vsix`, 7 files, 11.75 KB, with `out/extension.cjs` at 20.71 KB.

### Verify table
| AC | Evidence | Status |
|---|---|---|
| AC-1 | `status.test.ts`: groups, waiting count, warnings and writes on a JSON fixture with one row per stage. `integration.test.ts` "the list reads the real scripts/status --json" passed. I checked the fixture's stage and `who` strings against `scripts/status:289-350` and they match. | PASS, with the Low gap L-c below |
| AC-2 | `gate.test.ts`: the arguments are exactly `[write, NNNN]`, and non-4-digit input is refused. Integration "approve-spec and approve-plan leave what the terminal call leaves" (twin repos: tree, message, author, commit count, dirty state) and "a refusal shows gate's message and writes nothing" both passed. `panel.test.ts` "written and refused are shown as gate said them" passed. | PASS |
| AC-3 | `panel-logic.test.ts`: approve only after opening; "opening the spec does not open the plan approval"; triage, ship and agent stages offer no write. I broke the opened check (`if (!s.opened)` made a no-op), which gave 3 failures. I made the decision key only the spec number, which gave 2 failures. The screenshots confirm it. | PASS |
| AC-4 | `summary.test.ts` (6 tests: plan and spec sections, the untouched templates, a file without the sections, headings inside comments or fences, CRLF). `panel.ts:84` shows "No summary in this file — open the file." | PASS |
| AC-5 | `shell.test.ts` (setting, PATH and Git for Windows layouts, no shell). `panel-logic.test.ts` "without a shell nothing is written". Outside an ANEW workspace: `extension.ts:167` returns before registering anything, and the view and commands are gated by `when: anew.active` in package.json. That part is shown by reading the code only, since it has no test. | PASS (the "inactive outside ANEW" half by reading the code) |
| AC-6 | Panel HTML screenshots in dark and light (gallery below). The plan's build evidence records the `.vsix` installed in VS Code 1.137. I did not see the tree view, the status bar or the real approvals on the pilot clone. | Judged by the human at SHIP |
| AC-7 | selftest 496/0 and doctor 0 fail @44ba9c9. `.github/workflows/check.yml` has the `extension` job (Node 24, npm ci, test, package). README, `docs/commands.md` (section F) and CHANGELOG v1.27 name the extension, and `.anew-version` is v1.27. I did not see a CI run on GitHub. | PASS locally; the CI run is shown on the PR |

### Fix-2 (not re-reviewed), my own read
- The diff stays within L-6 and L-7: `panel-logic.ts` `done`/`shown`, the guard at `extension.ts:334`, the tests and the triage record. Nothing in it goes beyond the findings.
- **Where gate's answer shows:** I traced it against `scripts/status`. After approve-spec the row moves to PLAN with the Developer (no write offered), and the answer stays. When the plan exists the row becomes PLAN with the human, approve-plan is offered and the answer goes. After approve-plan the row moves to BUILD with the Developer and "Next: /build" stays. REVIEW, SHIP and shipped hide it. A refusal stays on its own decision.
- **Switching spec while gate runs:** `show()` clears the result and the opened file. On return, `this.spec === row.spec` drops an answer for another spec. Switching away and back keeps it, which is correct. The list still refreshes either way.
- **Breaks I ran on a scratchpad copy:**
  - Removing `d.spec === row.spec` from `shown()`: 1 failure.
  - Removing `row.stage === d.after` (the old L-7 behaviour): 1 failure.
  - Removing the escaping of section bodies: 2 failures.
  - Baseline: 11/11 pass.
- **No test covers the `extension.ts:334` guard**, because it is in the VS Code layer (G-3). It is correct by reading the code.

### Findings
- **L-a (Low)** `extension.ts:208-229` and `:302`: the panel never shows its "no shell" state. Without a shell, `refresh()` sets `status = null`, so `panel.render()` finds no row and says "This spec is no longer in scripts/status." The same happens when `scripts/status` fails briefly. The tree and status bar do name the missing shell, and no write is offered, so AC-5 holds. But spec Requirement 6 ("the panel says so") is not met as written, and the panel's message misleads. To reproduce: open a panel, then set `anew.shell` to a path that does not exist.
- **L-b (Low/Info)** `panel-logic.ts:30`, `extension.ts:329`: `running` belongs to the whole panel. If you switch to spec B while gate runs for A, B shows "running gate…" with no buttons until A's call returns. That is harmless, since it stops a second write, but the message is wrong for B.
- **L-c (Low)** AC-1's every-stage fixture is hand-written JSON. The real `status --json` runs only on a single-spec fixture (ANALYZE, then PLAN with the human). I checked the stage strings by reading the script, but no automated test catches the two drifting apart.
- **Info-1** The running state removes the Approve and Request-changes buttons rather than disabling them as the spec's "button disabled" says. The effect is the same.
- **Info-2** `panel.test.ts` checks exact markup strings (`<button id="approve" class="primary">…`). It tests the implementation more than the behaviour, so a harmless markup change would break it.

### Screenshot gallery (state → path)
Rendered from the real `panel.ts` and `panel-logic.ts` with VS Code theme variables stubbed and Chromium headless shell 1248. No console errors or dialogs; no `<img>` or extra script injected; Tab reaches "Open the full file" first.
- Spec approval before opening (no Approve; the warning and the hostile name and body are escaped): <scratchpad>\verify-0009\1-spec-before-open-dark.png, …\1-spec-before-open-light.png
- Plan approval after opening (Approve shown): <scratchpad>\verify-0009\2-plan-after-open-dark.png, …\2-plan-after-open-light.png
- Running: <scratchpad>\verify-0009\3-running-dark.png, …\3-running-light.png
- Written, shown after the refresh at BUILD with "Next: /build in your agent": <scratchpad>\verify-0009\4-written-next-dark.png, …\4-written-next-light.png
- Refused (exit 1, gate's text escaped): <scratchpad>\verify-0009\5-refused-dark.png, …\5-refused-light.png
- No shell (logic state; per L-a the real panel does not reach it): <scratchpad>\verify-0009\6-no-shell-dark.png, …\6-no-shell-light.png

Every "…" stands for <scratchpad>\verify-0009\.

All states are readable in both themes, the Approve gating is right in every state, and text from the files is escaped. Not captured: high-contrast theme, the tree view and the status bar. These are for the human at SHIP. Scripts: <scratchpad>\verify-0009\render.mjs and <scratchpad>\verify-0009\shot.py

**Criteria without real evidence:** AC-6 (human at SHIP); the "inactive outside an ANEW workspace" half of AC-5 (code reading only); the CI run for AC-7 (not yet seen).
