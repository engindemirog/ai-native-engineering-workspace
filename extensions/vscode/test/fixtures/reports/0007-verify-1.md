VERIFY report for spec 0007 (`scripts/gate`), HEAD 94d49db, branch feature/0007-gate

All nine criteria are proven, but fix round 2 introduced one regression (F-1), so the verdict is FAIL on three Low findings. Nothing in the repo was edited, committed or pushed. Scratch work is in <scratchpad>\verify7\ (walk.sh, probe2.sh to probe5.sh, fx.sh, st.sh, st.out).

**Baseline**
- `git diff --stat f528426..HEAD` shows only `.anew-dev/plans/0007-plan.md` (+1 line), so the recorded 487/0 @f528426 still stands (rule 6).
- `./scripts/doctor --strict` on the repo: `0 fail, 5 warn` (the template's expected warnings), exit 0.
- The status and gate selftest sections, run from a scratch copy (header + doctor fixture + line 641 to the end, ROOT = repo): `== selftest: 206 passed, 0 failed ==` (status 84, gate 122).

## 1. Criterion ↔ evidence
| AC | Evidence | Status |
|---|---|---|
| AC-1 | Selftest "gate approve-spec: a Draft spec is approved / one commit / refused on an approved spec … naming the stage" (pass). My probe5: approve-spec at BUILD gives exit 1, "0005 is at BUILD (Developer); approve-spec decides ANALYZE". | PROVEN |
| AC-2 | Selftest: template line filled, status BUILD, re-approval clears spec drift, second same-day re-approval refused, Draft spec refused, no plan refused (pass). probe5 on plan drift: WARN "the plan changed after approval", then approve-plan, then the WARN is gone; second run writes "(re-approved)"; third gives exit 1 "already re-approved today". | PROVEN |
| AC-3 | Selftest triage scenarios (pass). walk.sh: Review round 1 with a real finding → FIX ROUND; after fix-1 → REVIEW; clean review round 2 → VERIFY; VERIFY round 1 with an investigate → "unclear: investigate open — Q-1"; clean VERIFY round 2 → SHIP. Headings numbered 1, 2 and 1, 2 per kind. | PROVEN |
| AC-4 | Selftest bad-input scenarios (pass). probe2, nine inputs: noise with an empty or blank note, defer without a B-n, defer B-99, verdict `Real`, `a\|b` in the text, a blank text, a line break, `\|` in the note. Each gives exit 2 and the same ls-files/status/diff/HEAD/file checksums. | PROVEN |
| AC-5 | Selftest ship scenarios, including doctor on the shipped fixture, a struck criterion, forms, moves, sensitive area (pass). walk.sh: ship at SHIP ticks AC-1, AC-2 and the DoD, sets Status: Shipped, makes a rename commit, rewrites the plan's `Spec:` line. `ANEW_BASE_REF=<pre-ship> doctor --strict` gives 0 fail. Control: unticking AC-2 makes doctor print FAIL "unchecked criterion in a new ship". | PROVEN |
| AC-6 | Selftest (pass). probe2: a staged `other.txt` and a dirty README stay out of the triage commit; plan edits go in, with "committed with your uncommitted edits to specs/plans/0005-plan.md". probe4: a staged `specs/notes.md` survives a ship. | PROVEN |
| AC-7 | Selftest: no git, empty user.name, unknown spec, 3-digit number, unknown gate, `--now` (pass). probe5: `ship 0005 extra` exits 2 with "unknown argument". | PROVEN |
| AC-8 | Selftest "status: an open investigate in a VERIFY round is unclear, not SHIP / … never reads SHIP / beside an open real finding is unclear" (pass). All 84 status scenarios green. | PROVEN |
| AC-9 | 487/0 @f528426 plus specs-only diff since; doctor --strict green; `### scripts/gate` present in docs/commands.md; CHANGELOG has `## v1.26`; `.anew-version` is `v1.26`. | PROVEN |

- **Break-on-purpose:** I did not run my own mutants, to keep memory use down. The plan records 9 mutants caught (fix-1 and fix-2). I read the fix-2 asserts instead: each move-refusal loop asserts exit 1 plus an unchanged commit count and porcelain, so a removed check would go red.
- **Tests asserting implementation instead of behavior:** none found.
- **Criteria without real evidence:** none. Info-1 (interrupt) has no selftest scenario; I probed it myself (P6, P7).

## 2. Adversarial probes
1. **Full manual walk, non-ASCII user and path with a space.** User "Çağrı Öztürk", spec `0003-çay demo.md`, finding "M-1 Orta — Türkçe ğüşıöç bulgu". Walk: Draft → approve-spec → plan → approve-plan → evidence → triage --review → fix → triage --review (clean) → investigate round → triage --verify (clean) → ship. Expected: every gate output and the next status reading agree, and doctor is green after the ship. Observed: as expected, doctor rc=0.
2. **Gate and status agree on the stage.** approve-spec, ship and triage at BUILD each refuse with exit 1, naming BUILD (Developer) and the stage they decide.
3. **Re-approval clears plan drift.** The WARN disappears after approve-plan (probe5).
4. **Bad input changes nothing.** All nine cases left the state identical (probe2).
5. **Unrelated staged file.** It stays staged and out of the commit in triage and in ship.
6. **Failing pre-commit hook, ship, non-ASCII path.** Staged unrelated file present. Output: "git commit failed — nothing was written: … restored as before". The whole state is identical, including the move and the quoted-path index entry.
7. **TERM sent to gate from the hook, hook then fails.** Exit 130, state identical (correct, but silent: see F-2).
8. **TERM sent to gate from the hook, hook then succeeds.** Exit 130. HEAD is 47fac6f "gate: ship 0005 …", but the working tree and index are rolled back: `R "specs/done/0005-ş x.md" -> "specs/active/0005-ş x.md"`, `M specs/plans/0005-plan.md` (staged reverse ship). This is F-1.
9. **Defer naming a missing B-n.** "B-1 is not in specs/backlog.md", exit 2.
10. **Ship blocked by a staged file outside specs/.** Ship refuses with "status warning" (evidence older than code). This is correct: status counts staged files outside specs/ as changes after the evidence. An unrelated staged file under specs/ does not block a ship.

## 3. Protected tests
`git diff ba7cd3c..HEAD -- scripts/selftest` has exactly one removed line: the header comment, which now also lists gate. No assert was deleted, skipped or weakened. Inside the branch, fix-2 changed the rollback assert from `[ -z porcelain ]` to `= "$st0"`. The fixture now holds staged edits on purpose, and a new diff --cached / diff equality assert was added, so the test is stronger.

## 4. Findings
- **F-1 Low (new in fix round 2): an interrupt can roll back a commit that landed.** `scripts/gate:118` with `:157-158`.
  - Why it happens: the INT/TERM trap rolls back whenever `$snap` is non-empty. `snap=""` is only cleared after the commit subshell returns.
  - When it fails: a signal that reaches gate but not git (for example a tool or the planned screen killing gate's pid on a timeout during a slow hook) lets the commit succeed. The trap then restores the pre-gate files and index under the new HEAD. Probe 8 reproduces it.
  - Why fix-2 made it worse: before fix-2 the trap only removed `$T`, so the tree stayed consistent.
  - Recommendation: record `git rev-parse HEAD` before the commit. In the trap, roll back only while HEAD is unchanged; otherwise clear `snap` and report the sha.
- **F-2 Low (docs vs code): an interrupt's rollback prints nothing.** `docs/commands.md:181-182` and the CHANGELOG v1.26 upgrade notes say an interrupt puts the files back "and says so" and names a path it could not restore. The trap prints nothing and ignores `$lost` (probes 7 and 8 show only exit 130).
  - Recommendation: the trap prints "gate: interrupted — <paths> restored as before", or the `lost` message, before `exit 130`.
- **F-3 Low (docs): status's "Common mistake" bullet now sits under `### scripts/gate`.** At `docs/commands.md:187-191`, the bullet "reading REVIEW or VERIFY as 'it has not run' …" belongs to `### scripts/status`. The gate section was inserted between status's Refusal and that bullet (in ba7cd3c it followed line 140), so gate now has two Common mistake bullets.
  - Recommendation: move the bullet back above `### scripts/gate`.
- Not reported: B-12 and L-2 CRLF, as instructed.

## 5. Verdict
VERIFY: FAIL — three Low findings. F-1 is a regression added by fix round 2, which skipped re-review: an interrupt during a successful commit rolls the files back under the new commit. All criteria AC-1..AC-9 are proven.

Next: you triage this as VERIFY round 1, for example with `./scripts/gate triage 0007 --verify --finding … real "fix-3"`. My recommendation is real for all three, fixed as fix-3, which is Low only. A narrow VERIFY of the fix-3 diff then follows, then SHIP. The alternative is to defer F-1 and F-2 to the backlog with B-<n> entries and fix F-3, the one-line doc move. That is defensible because F-1 needs a signal aimed at gate alone, but the docs would still claim an interrupt "says so".
