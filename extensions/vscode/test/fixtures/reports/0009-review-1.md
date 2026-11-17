Review round 1 · fix rounds so far: 0

**Scope.** I reviewed `git diff main...HEAD` (spec 0009, approved plan 0009) from the files only. I ran `npm test` in `extensions/vscode` at HEAD ee5bcab: typecheck clean, 28 passed, 0 failed, 0 skipped. The integration tests ran the real `scripts/status` and `scripts/gate` through Git Bash. I did not re-run selftest or doctor; I cite them from Build evidence @b25111a. The only commit after that, ee5bcab, touches nothing but `.anew-dev/plans/0009-plan.md`. I did not check whether CI has run for the pushed HEAD, so triage should wait for CI's `extension` job on ee5bcab.

## Findings

**H-1 — Correctness (Req 4 / AC-3: approve only after the full file is opened)**
- **Where:** `extensions/vscode/src/extension.ts:129`, with `:170` and `:159`.
- **Defect:** the panel's `opened` flag (and `result`) is reset only when a different spec number is shown, not when the decision or file changes for the same spec. A spec file opened earlier therefore unlocks Approve on that spec's plan, which was never opened.
- **Failure scenario:**
  1. The human opens 0001 at ANALYZE, clicks "Open the full file" (`opened = true`) and approves the spec. The row becomes PLAN (Developer); the panel stays open.
  2. The agent runs /plan and writes `specs/plans/0001-plan.md`. The `specs/**` watcher fires `refresh()`, which calls `panel.render()`.
  3. The row is now PLAN (human), so `writeFor` returns approve-plan, and `opened` is still true. "Approve the plan" appears at once as an active button, with only the plan's summary shown. That is exactly the summary-only approval the mockup correction removed.
  4. The stale "Written. approve-spec 0001 …" result is shown on the plan screen too, with "Next: /build in your agent".
- Clicking the same row again does not reset either flag, since the spec number is unchanged.
- **Recommended action:** key `opened` and `result` by the file or write, not by the spec number. Add a test that a stage change for the same spec clears `opened`, for example by moving that state into `panel-logic`.

**L-1 — Correctness / AC-5 ("outside an ANEW workspace the extension shows nothing")**
- **Where:** `extensions/vscode/package.json:61-66`.
- **Defect:** only `anew.open` is hidden from the command palette. "ANEW: Refresh" shows in every workspace, and `activate` returns early without registering it (`extension.ts:19-21`).
- **Failure scenario:** in any non-ANEW folder, Ctrl+Shift+P lists "ANEW: Refresh". Running it activates the extension, which registers nothing, and VS Code shows "command 'anew.refresh' not found".
- **Recommended action:** add `"when": "anew.active"` to the commandPalette entry for `anew.refresh`.

**L-2 — Correctness / maintainability**
- **Where:** `extensions/vscode/src/panel.ts:27` and `:88`.
- **Defect:** `nextAfter(v.offer.write)` is computed from the offer after the refresh, not from the write that ran. A successful write always moves the row to a stage with no write (PLAN Developer after approve-spec, BUILD after approve-plan). So "Next: /plan in your agent" and "Next: /build in your agent" never appear after a write; it always says "see the work list". The two specific branches are effectively dead (H-1's stale-result case is the only way to reach one, and that one is wrong).
- **Failure scenario:** approve a spec. The result box says "Next: see the work list" instead of "/plan in your agent".
- **Recommended action:** derive "Next" from the write that ran, stored with the result.

**L-3 — Edge case**
- **Where:** `extensions/vscode/src/extension.ts:125` and `:169`.
- **Defect:** `void this.on(...)` drops rejections. If `showTextDocument` rejects, nothing re-renders, and the webview has already disabled the clicked button (`panel.ts` script).
- **Failure scenario:** the spec file is renamed or deleted between the status read and the click. "Open the full file" stays disabled, with no message, until an unrelated refresh.
- **Recommended action:** catch the error, show it, and re-render.

**L-4 — Tests (AC-2 "the panel shows gate's message", AC-3 at the panel)**
- **Where:** `extensions/vscode/src/panel.ts`, which has no test.
- **Defect:** `html()` is pure and needs no VS Code, yet nothing tests the escaping, the CSP and nonce, the refused state naming the exit code, or that no Approve button is rendered when `offer.approve` is false. AC-2's panel half is proven only through `answer()`.
- **Failure scenario:** a regression that drops `esc()` around `v.result.text`, or renders `approve` unconditionally, passes all 28 tests.
- **Recommended action:** add `test/panel.test.ts` covering escaping, the refused and written states, and button presence.

**L-5 — Plan conformance (R-07)**
- **Where:** `extensions/vscode/media/anew.svg`.
- **Defect:** this file is not on the plan's file list, and there is no Amendment for it. It is the activity-bar icon that `package.json:29` requires.
- **Also:** `package.json:22,80` builds `out/extension.cjs`, while the plan says `out/extension.js`.
- **Recommended action:** record both as Amendment A-1.

**Info-1 — Spec vs. plan wording (Req 3 / Req 4)**
- The spec puts triage in "your turn" and says a triage row explains that its screen comes with 0010. `scripts/status` has no triage stage: triage happens at REVIEW (who "fresh session / read-only reviewer") or VERIFY (QA).
- Those rows therefore land in "in progress", and the panel hint reads "REVIEW: waiting for fresh session / read-only reviewer." (`panel-logic.ts:185`).
- The approved plan narrowed "your turn" to who=human or unclear, so this follows the plan. Worth noting for spec 0010.

**Info-2 — Security posture**
- The webview is sound:
  - CSP is `default-src 'none'` plus nonce'd style and script.
  - `localResourceRoots: []` and no remote content.
  - Every interpolated value goes through `esc()`.
  - Messages carry only a `type` that is string-compared; paths come from extension state.
  - `execFile` takes an argument array, and `gateArgs` enforces `^[0-9]{4}$`, so command injection is not reachable.
- Two hardening notes:
  - `anew.shell` has the default (window) scope, so a workspace's `.vscode/settings.json` can point it at any executable, which runs on activation.
  - `capabilities.untrustedWorkspaces` is not declared. As far as I know VS Code then disables the extension in Restricted Mode by default, and a trusted workspace runs its own `scripts/status` anyway, so the extra exposure is small.
- Optional: declare the capability explicitly, and mark `anew.shell` `machine`-scoped or restricted.

**Info-3 — Windows shell detection**
- Correct for the cmd, bin and mingw64 layouts. It does not pick WSL's `System32\bash.exe` (it needs a `git.exe` beside it), and it moves on to the next `git.exe` on PATH when no `bash.exe` is found.
- It does not handle a quoted PATH entry (`"C:\Program Files\Git\cmd"`) or Scoop shims; both fall through to null, which the `anew.shell` setting covers.
- A setting that names a missing file gives null, with no fallback. That is deliberate and tested.

**Info-4 — Activation and refresh**
- `activate` checks only `workspaceFolders[0]`, while `workspaceContains` matches any folder. In a multi-root workspace with the ANEW repo second, the extension activates but shows nothing.
- `refresh()` calls are not serialized; overlapping runs can briefly show an older status.
- Status warnings such as "evidence older than the code" depend on files outside `specs/`, so they do not refresh on code edits. That matches spec Req 3 ("specs/ changes, Refresh command, never a timer").

**Info-5 — Clean dimensions**
- Docs, CHANGELOG, `.anew-version` and CI are accurate.
  - `docs/commands.md` §F, README row and `extensions/vscode/README.md` match the behavior.
  - The CHANGELOG v1.27 entry and its Upgrading section are correct; `.anew-version` is v1.27.
  - `LICENSE` matches the repo's apart from its first three lines.
  - `.gitignore` is correct.
- CI job `extension` is correct: setup-node 24, `npm ci`, `npm test`, `npm run package`, `working-directory` set. A shallow checkout is fine because the fixtures build their own repos.
- Performance is clean.
- No vacuous tests:
  - The twin-repo test compares tree, message, author, commit count and dirty state.
  - The refusal test compares snapshots before and after.
  - The status unit tests assert exact group membership.
  - The summary tests run against the real templates.

## Acceptance criteria vs. tests

| AC | Status | Evidence and gaps |
|---|---|---|
| AC-1 | Covered | `status.test.ts` uses hand-made JSON with every stage. `integration.test.ts` runs the real `status --json`, but the real output is checked only at ANALYZE and PLAN (human); the real `warnings` array is never checked. |
| AC-2 | Mostly covered | `gate.test.ts` plus the integration twins and the refusal test. "The panel shows gate's message" is not tested (L-4). |
| AC-3 | Partly covered | `offer()` is fully tested. The wiring in `extension.ts` breaks the rule (H-1), and no test covers it. "Triage or ship offers no write" is covered. |
| AC-4 | Covered | `summary.test.ts`: template sections, real templates, no sections, comment and fence headings, CRLF. |
| AC-5 | Partly covered | The no-shell half is covered (`shell.test.ts`, `panel-logic.test.ts`). "Outside an ANEW workspace shows nothing" has no test (it is the VS Code layer, left to AC-6) and is undermined by L-1. |
| AC-6 | Not yet proven | Manual. Build evidence shows the `.vsix` built and installed and a demo workspace prepared; the screenshots and the human's judgment at SHIP are still to come. |
| AC-7 | Covered | Selftest and doctor are cited from Build evidence @b25111a. The CI job exists, README and `docs/commands.md` name the extension, and CHANGELOG v1.27 and `.anew-version` are present. |

## Verdict

**Not clean: one High finding (H-1)** breaks the opened-before-approve rule, the core of Requirement 4 and AC-3, in a realistic approve-spec → /plan flow. There are also five Low findings and five Info notes. This is a stop at review; no switch to QA. Triage is next.
