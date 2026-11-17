## Fix round 3 review (spec 0009, `git diff 44ba9c9 9460f23`): Clean

There are no High or Medium findings. All three triaged findings are resolved, the earlier fixes still hold, and the tests are as strong as before or stronger. `npm test` in `extensions/vscode`: 42 pass, 0 fail, 0 skipped, about 11s, no memory trouble.

### Triaged findings
- **M-1 (follow the mockup): resolved.**
  - The panel now has everything the mockup's main area asks for:
    - the stage strip, with "● Plan · waiting for you" when it is the human's turn;
    - cards for files, criterion ↔ test with an "n/m mapped" count, risks with their recommendation, and a spec's intent and criteria;
    - the footer line "These cards are a summary…";
    - the decision box: "Open the full plan" first, then Approve and Request changes once the file is open, with the hint naming the file and the footer naming the `./scripts/gate` command;
    - the result: "✓ Plan approved — written and committed", gate's output, "Next step — run in your agent: /build NNNN" and a Copy button.
  - The tree stays the native view. It has the waiting badge (`view.badge`), the labels "Spec approval", "Plan approval" and "· your decision", and coloured ThemeIcons.
- **L-a: resolved.** When a row is missing, `extension.ts:171-174` shows `problem()` first (no shell, or status failing). It then shows "reading scripts/status…" if status is still null, and only after that "no longer in scripts/status".
- **L-b: resolved.** `running` now holds the spec it runs for (`panel-logic.ts:251-254`). Another spec's panel says "gate is running for X" and offers no write. Tested.

### Regressions
None found.
- **H-1 (opened file kept per decision):** unchanged; `offer` still gets `opened: this.opened === decision(...)`.
- **L-6 / L-7 (where gate's answer shows):** `shown()` and `done()` are unchanged except that `next` is now the real command.
- **Approve only after opening:** unchanged in `offer`, and `panel.ts` renders the Approve button only when the offer has it.

### Security
- **Escaping:** every piece of file-derived text in the new cards goes through `esc()`: files, pairs, risks, criteria, intent, the raw fallback, warnings, `who`, the hint, and gate's output. The step names are constants. The test feeds `<script>` and `<img onerror>` through the risk, file and test-map cards.
- **CSP:** unchanged for the main page. `notice()` has no `script-src`, so `default-src 'none'` blocks scripts, and it has no script; this is tested.
- **`copy` message:** the host ignores what the message carries. It copies only its own `this.result.next`, which it built from `row.spec`. Unknown message types are ignored. No issues.

### Findings
- **Low: wrapped criteria are cut short without a mark (`cards.ts:83-89`).** `criteria()` keeps only the first line of each `- [ ] AC-n —` item, with no "…".
  - Scenario: this repo's own spec 0009 shows AC-1 as "…waiting count match scripts/status --json" and stops there. The "(unit tests … fixture repo)" part is gone, which misrepresents the criterion on a spec approval.
  - Fix: reuse `items()`' continuation joining, as `risks()` does.
- **Low: criteria in another shape drop out silently (`cards.ts:86`).** A line like `AC-3: …` or `* [ ] AC-3 — …` is skipped. The raw fallback runs only when *no* line matches, so a mixed list shows a smaller "Acceptance criteria · n" with nothing missing on view.
  - Fix: if any `- [` item in the section does not match, fall back to raw.
- **Low: the risks label can be untrue (`panel.ts:390`).** "Risks · N, each with a recommendation" is shown even when a risk has no recommendation; `risks()` then uses the rest of the text, or `''`.
  - Fix: say "Risks · N", or count the risks whose advice starts with Recommendation/Öneri.
- **Low: pipes inside table cells (`cards.ts:59`).** `pairs()` splits on every `|`, so an escaped `\|` or a pipe inside backticks cuts the proof short. A table whose header is not "Acceptance criterion" counts its header row as a mapped pair. The output is wrong but harmless, and the approve gating is untouched.
  - Fix: split on unescaped pipes, and skip the first row before a `|---|` separator.
- **Info:**
  - The mockup's line "the approver is taken from the git user: <name>" is missing from the decision box.
  - Struck-out criteria (`~~AC-n~~ → moved to B-n`) look the same as open ones, and the `done` flag is never rendered.
  - The Open button disappears once Approve shows. This matches the mockup, but a closed editor can then only be reopened from the tree or the editor.

### Tests
None were weakened. Asserts reworded to the new markup still check the exact button markup, the escaping, the CSP and written versus refused. New asserts cover the strip, cards, copy, `notice`, the running spec, and `cards.ts` run against this repo's own plan and spec 0009. No escaping test covers the raw `<pre>` fallback; the code escapes it, so this is Info only.

### Plan drift
None. The changed files are `extension.ts`, `panel.ts` and `panel-logic.ts` (all in the plan), plus `cards.ts` and `test/cards.test.ts` (amendment A-2), and the plan document itself. `package.json` is unchanged; the engine `^1.90` supports `TreeView.badge` and CSS `color-mix`.

Nothing was written to the repo or the scratch folder.
