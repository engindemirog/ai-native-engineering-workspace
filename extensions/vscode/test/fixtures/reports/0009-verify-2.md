## VERIFY round 2, spec 0009 at 35bb23c: **Pass**

I edited and committed nothing in the repo. `git status` is clean at the end. Everything I wrote is under `<scratchpad>\verify2-0009\`.

### Numbers (all at 35bb23c, Windows 10, Git Bash)
- **selftest:** 496 passed, 0 failed, exit 0. Log: `<scratchpad>\verify2-0009\selftest.log`
- **doctor --strict:** 0 fail, 5 warn. These are the 5 expected pre-bootstrap warnings: AGENTS.md not configured, mode, language, `check.conf`, adapter. It also reports ANEW base v1.27.
- **npm test:** typecheck clean (`tsc --noEmit`). 42 passed, 0 failed, 0 skipped. The integration tests ran the real `scripts/status --json` and the gate refusal. Log: `<scratchpad>\verify2-0009\npm-test.log`
- **npm run package:** `anew-0.1.0.vsix`, 7 files, 14.5 KB (`out/extension.cjs` is 30.17 KB). The file is gitignored, so the tree stays clean.
- **CI:** the `extension` job runs `npm ci`, `npm test` and `npm run package` on Node 24.

### Verify table
| AC | Evidence | Verdict |
|---|---|---|
| AC-1 list, groups, stages, warnings, count | `status.test.ts`, plus `integration.test.ts` "the list reads the real scripts/status --json" (pass). Fix-3's tree labels, coloured icons and view badge are in the VS Code layer, which no test reaches; the human's AC-6 run covers them. | Pass |
| AC-2 exact gate args; same result as terminal; refusal shown, nothing written | `gate.test.ts`, plus integration "a refusal shows gate's message and writes nothing" (pass). Screenshot 6-refused shows gate's text unchanged, exit code named, escaped. | Pass |
| AC-3 approve only after opening; triage/ship offer no write | `panel-logic.test.ts` (opened gate, per-decision key, SHIP row) and `panel.test.ts`. Mutations M1 (offer ignores `opened`), M2 (button always rendered), M10 (approve allowed while running) and M11 (decision key ignores the write) each turn tests red. Screenshot 1 shows no Approve before opening; screenshot 2 shows Approve after. | Pass |
| AC-4 summaries show template sections; otherwise "open the file" | `summary.test.ts` and `cards.test.ts`, including this repo's own plan and spec 0009. Screenshots show the files, criterion ↔ test and risks cards, plus intent and criteria for a spec. | Pass |
| AC-5 inactive outside ANEW; no shell, no write | `shell.test.ts` and `panel-logic.test.ts` (no-shell offer). The notice page (screenshot 7) has no buttons and no script, and escapes its text. | Pass |
| AC-6 packaged `.vsix` installs and works on the pilot | Package rebuilt at HEAD. The real install is judged by the human, who reported it working on the pilot clone. Screenshot gallery below. | Pass (human-judged) |
| AC-7 selftest, doctor, CI, docs, version | Numbers above. README line 171, `docs/commands.md` line 35 and §F, CHANGELOG v1.27, `.anew-version` v1.27. | Pass |

### Screenshots
Rendered from the HEAD `panel.ts` and `panel-logic.ts` with VS Code dark and light theme variables stubbed, including charts orange, green and blue. Captured headless in Chromium at 1000 px wide:
- No horizontal scroll on any page.
- No injected elements reached the DOM (`<img>`, `<script>alert>` in the file text all rendered as text).
- No console errors or dialogs.
- Tab reaches the first button on every page.

Paths, each with a `-light.png` twin:
- `<scratchpad>\verify2-0009\1-spec-before-open-dark.png`
- `<scratchpad>\verify2-0009\2-plan-after-open-dark.png`
- `<scratchpad>\verify2-0009\3-running-own-dark.png` (hint: "Running ./scripts/gate approve-plan 0008…")
- `<scratchpad>\verify2-0009\4-running-other-dark.png` (hint: "gate is running for 0007; wait for its answer.")
- `<scratchpad>\verify2-0009\5-written-next-dark.png` (shows "/build 0008" and Copy)
- `<scratchpad>\verify2-0009\6-refused-dark.png`
- `<scratchpad>\verify2-0009\7-notice-no-shell-dark.png`

Scripts: `render.mjs`, `shot.py` and `mutate.sh` in the same folder.

**Against the mockup's main area:**
- **Plan approval after opening** matches the mockup's layout: file path, a 26 px title "Plan NNNN — name", the stage strip with "✓ Spec" in green and "● Plan · waiting for you" in orange, a two-column grid of files and criterion ↔ test (with a count and "N/M mapped"), the risk cards with their recommendation, the "these cards are a summary" line, and the decision box with Approve, Request changes… and the gate command footer.
- **Written state** matches the mockup's green box: "✓ Plan approved — written and committed", gate's output in a mono block, then "Next step — run in your agent: /build NNNN" with Copy.
- **Differences, all minor:**
  - The strip chips carry no "· approved" text.
  - The output block shows gate's one line rather than the mockup's diff.
  - There is no "Approved by" line (deferred to 0010 in triage round 4).
  - The written page shows the spec's cards, not the plan's (Info-2).

### Break attempts
I mutated a copy outside the repo and ran `panel-logic`, `panel`, `cards` and `summary` tests. The unmutated copy passes 25 of 25.
- **Losing the opened gate:** caught. M1 failed 3 tests, M2 failed 1, M11 failed 2.
- **Running-spec message:** caught. M8 (own and other swapped) and M9 (generic "running gate…" restored) each failed "while gate runs… says for which spec". M10 failed 2 tests.
- **Escaping in cards:**
  - Caught for risk titles (M3), files (M6), proofs (M7), warnings (M13) and the notice text (M12).
  - **Not caught for the spec cards:** removing `esc()` from the Intent card (M4) or the criteria text (M5) leaves every test green. See L-1.

### Findings
- **L-1 (Low, test gap).** `extensions/vscode/src/panel.ts:77` and `:82`. Removing `esc()` from the Intent card or the criteria text leaves every test green. The fixture in `test/panel.test.ts:8-12` has only plan sections, so a regression would put a spec's raw HTML into the webview unnoticed. The CSP (`default-src 'none'`, nonce'd scripts only) limits the impact. The code is correct today: my screenshots show the injected text escaped. Recommendation: add a spec-section case (Intent and Acceptance criteria with `<img onerror>`) to "everything from the files is escaped". It can go in spec 0010 with B-14..B-17, or in a one-line test fix now.
- **L-2 (Low, UX).** `panel.ts`, `decide()` (`const open = o.approve ? '' : …`). While gate runs (screenshots 3 and 4), the box swaps Approve for a primary "Open the full plan" button even though the file is already open. That suggests a step that is not needed. Clicking it only reopens the file, so it does no harm. Recommendation: in the running state, show no buttons, or Approve disabled as the spec's UX says ("button disabled"). Fits 0010.
- **L-3 (Low, accessibility, light theme).**
  - **Strip chip:** the "● Plan · waiting for you" chip is white (`--vscode-editor-background`) on charts orange `#d18616`, about 2.6:1 contrast at 12 px.
  - **Map entry:** the "no test yet" text is orange on white, about 2.7:1.
  - Both are below WCAG AA. Dark theme is fine.
  - Recommendation: dark text on the orange chip in every theme, and a darker token for "missing". Spec 0010.
- **Info-1.** The written state replaces the decision box with gate's answer, as the mockup does. Because `file()` returns the spec once the row is at BUILD, the page then shows the spec's Intent and criteria cards under a "Plan approved" result, where the mockup keeps the plan's cards. This is consistent with the fix-2 design; worth noting for 0010.
- **Info-2.** The re-review's L-8..L-11 (deferred as B-14..B-17) still hold; nothing new there.

**Overall verdict: Pass.** All seven criteria are mapped to evidence. selftest, doctor, `npm test` and `package` are green at 35bb23c. The gate and running-message tests are proven able to fail. No Medium or higher finding; L-1..L-3 are Low and fit spec 0010, with L-1 cheap enough to add now if the human wants.
