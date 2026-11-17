## Verdict: Clean for the triaged findings. Two new Low issues and one Info.

All seven real findings from round 1 are resolved. `npm test` (typecheck plus 34 tests) passes. No asserts were weakened and no tests were removed: the diff only adds tests.

### Triaged findings
- **H-1: resolved.**
  - `decision()` (panel-logic.ts:37) builds a key from spec, write and file.
  - `opened` is set only in `on('open')` after `showTextDocument` (extension.ts:175), and only to that key. `render()` (164) and `on('approve')` (179-182) both recompute it from the live row and compare it.
  - When approve-spec is followed by approve-plan on a panel that stays open, the stage changes, then the write changes, then the file changes to `specs/plans/…`. The key no longer matches, so Approve is hidden.
  - The refresh path (`refresh` → `panel.render()`, line 83) redraws with the new key.
  - A stale `approve` message is checked again against the new row inside `on()`, so it cannot write.
  - "Request changes" never sets `opened`.
  - Test caveat: panel-logic.test.ts:42-50 tests only the pure helper (the keys differ). The `Approval` wiring itself has no test. That is acceptable, since it is VS Code glue code.
- **L-1: resolved.** `anew.refresh` now has `when: anew.active` (package.json:68-71).
- **L-2: resolved.** The next step is stored in `Done.next` (panel-logic.ts:47) and rendered from the result (panel.ts:27). Tests cover both "next" values and the refused case.
- **L-3: resolved.** extension.ts:125-129 resets `running`, shows an error message and redraws, which re-enables the disabled button.
- **L-4: resolved.** test/panel.test.ts has real asserts:
  - escaping of name, warnings and section body
  - the exact CSP string and a single nonce'd script
  - the Approve button only when the offer has it
  - written and refused results
- **L-5 / A-1: resolved.** The plan amendment matches the actual files: `media/anew.svg`, `out/extension.cjs`, and the test glob.
- **Info-2: resolved.**
  - `anew.shell` now has `scope: machine`, so a workspace's own settings cannot set it; VS Code ignores the value there.
  - `capabilities.untrustedWorkspaces.supported: false` keeps the extension off in Restricted Mode.
  - The engine is `^1.90.0`, and both keys are supported there.

### New findings
1. **Low: one spec's gate answer can be shown on another spec's panel** (extension.ts:185-187 together with panel-logic.ts:54).
   - Scenario:
     1. The user clicks Approve on 0004, and gate runs.
     2. While it runs, they click 0005 in the work list. 0005 is at BUILD or any other agent stage. `show()` sets `result = null` and switches to 0005.
     3. Gate returns, and `this.result` is set to 0004's `Done`.
     4. `shown()` keeps any result when `write === null`, so 0005's panel shows "Written. approve-spec 0004 … Next: /plan".
   - The same race also leaves `running = true` while 0005 is shown.
   - Fix: capture `const spec = this.spec` before the `await`. Afterwards, drop the result if `this.spec !== spec`. Alternatively, include the spec in the `shown()` check, for example by testing `d.decision` against the row's spec.
2. **Low: a stale result survives every later stage** (panel-logic.ts:54). The rule `write === null ⇒ keep` also covers BUILD, VERIFY, SHIP and shipped. After approve-plan, "Written … Next: /build in your agent" stays on that spec's panel through review, ship and shipped, as long as the panel is not switched to another spec. This contradicts the comment above `shown()` ("goes once a new decision is up"), because SHIP is a human decision.
   - Fix: keep the result only while the stage is the one gate's write leads to. That means PLAN (Developer) after approve-spec and BUILD after approve-plan. A simpler alternative is to keep it only until the row's stage changes a second time.
3. **Info: a revised file can be approved without reopening it from the panel** (panel-logic.ts:37). The cycle is "Request changes", then the agent revises the spec or plan, then the row returns to the same stage. The key is unchanged, so Approve is offered at once.
   - The editor opened beside the panel does reload changes from disk, so the risk is small.
   - The fix is optional: add the file's mtime or a content hash to `decision()`.

### Security
- Webview and CSP are unchanged and sound:
  - `default-src 'none'`, with the nonce on both script and style
  - `localResourceRoots: []`
  - all text from files is escaped
  - the action is checked again on the extension host

### Files
- C:\ai-native-engineering-workspace\extensions\vscode\src\extension.ts
- C:\ai-native-engineering-workspace\extensions\vscode\src\panel-logic.ts
- C:\ai-native-engineering-workspace\extensions\vscode\src\panel.ts
- C:\ai-native-engineering-workspace\extensions\vscode\package.json
- C:\ai-native-engineering-workspace\extensions\vscode\test\panel-logic.test.ts
- C:\ai-native-engineering-workspace\extensions\vscode\test\panel.test.ts
