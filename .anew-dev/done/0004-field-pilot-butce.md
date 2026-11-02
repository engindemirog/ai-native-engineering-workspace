# Spec 0004 — Field pilot "bütçe": proof that scales, lists that grow, check's exit code, a map that exists

- Status: Shipped
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0004-plan.md`
- Self-critique: done (gaps folded in below, G-1…G-3)
- Revised (R-08): Requirement 3 and the Success line — allow-lists and sensitive areas take the
  CHANGE lane (review rounds 1–2) — approved by Engin Demiroğ, 2026-11-02

## Intent
The bütçe pilot (a Python expense tracker built with ANEW v1.23, lite, local-only, Money declared a
sensitive area at bootstrap) shipped six specs (0001–0006). Its records show four rules that cost
work without buying quality, or let a false claim through:
- **Proof cost in a sensitive area.** VERIFY broke the code 49 times for spec 0005 (11 criteria)
  and 31 times for 0006 (8 criteria), where the rule asks for every criterion proven red — one
  break each. In 0006 a fix round that changed two lines of `docs/architecture.md` went through a
  full re-review only because the area is sensitive.
- **Lists that grow.** Each new page had to edit an earlier spec's exact navigation test, and the
  rules do not say whether adding an expected item to a shipped test is allowed (0006, Risk 1:
  settled by a spec revision under R-08).
- **Check's exit code.** A `grep` in an `&&` chain let a commit through while check was red: the
  chain took grep's exit code, not check's.
- **A map that names tests that don't exist.** Review found the plan's criterion ↔ test map
  naming a test that does not exist in 0002 (L-3) and 0005 (I-1); VERIFY trusts that map.

Success means a sensitive area costs one break per criterion and no re-review for a
documents-only fix; a growing list never needs a spec revision, and an allow-list or a
sensitive-area list takes the CHANGE lane; only check's own exit code can gate a commit; doctor
names a map entry that no file holds before review has to.

Deliberately not done: anything specific to Money (a sensitive area is chosen per project at
bootstrap — "None" is valid), mutation tools (stack-specific; a project adds one as a check step),
docs-vs-routes checks (stack-specific; a project's own test).

## Requirements
1. **One break per criterion in a sensitive area.** `prompts/verify.md`: every criterion in a
   sensitive area is proven red by at least one deliberate break; more only where the criterion
   holds several risky behaviors, each named. The risky-behavior sample outside a sensitive area
   (typically 4–5 per spec) is unchanged.
2. **A documents-only fix round is not re-reviewed, in a sensitive area too.** A fix round whose
   diff touches documentation only — no code, test, configuration or script — goes on to VERIFY,
   which reads its diff (as for a Low/Info round today). Every place that states the sensitive-area
   re-review says so: `workflows/feature-development.md` step 8, `workflows/README.md` (Modes),
   `docs/domain.md` (Sensitive areas comment), `prompts/build.md` (fixes), `prompts/verify.md`,
   `docs/commands.md` (`/review`). (G-1: a round that changes a documented rule the code relies on,
   e.g. a business rule in `docs/domain.md`, is still documentation; VERIFY's diff read is the
   check, and a real gap there is a finding.)
3. **Lists that grow.** `docs/testing.md`, Protected-tests rule:
   - a test of a list that later work extends (navigation, menus, report columns) asserts what its
     criterion needs — the items it adds, in order where order matters — not the whole list, unless
     the exact list is the behavior;
   - when a shipped test pins an exact list and a criterion of the new spec adds an item, adding
     that item to the expected list is an allowed edit: it removes no expectation. It is on the
     plan's file list and named in the commit message; no spec revision is needed;
   - except where the list's exactness is the behavior — an allow-list ("nothing else is
     accepted") or any list in a sensitive area: an added item removes the expectation that it is
     refused, so that change is its own mini-spec (CHANGE lane, `workflows/change-request.md`) with
     `Supersedes: <NNNN>/AC-x`, and the shipped spec stays as it is (invariant 7);
   - removing or loosening an expectation stays forbidden (G-2: reordering an exact list is a
     change of behavior, not an addition — it needs the criterion that orders it).
4. **Only check's own exit code gates a commit.** `docs/git.md`, Commits: a commit (or push) is
   gated by `./scripts/check`'s own exit code; its output is never piped into another command in
   the chain that decides the commit (`check | grep … && git commit` takes grep's exit code).
5. **doctor names a map entry no file holds.** For each plan whose spec is in `specs/active/`, every
   backticked name in the criterion ↔ test map's "Proven by" column must be found in the working
   tree outside `specs/` and `.anew-dev/`, else `WARN plan <NNNN>: criterion map names <name> — no
   file holds it`. Rules:
   - `a::b` is checked as its parts; a part is cut at the first `*`, `[` or `(` (a wildcard or a
     parameter); a part shorter than 3 characters is skipped;
   - a part is found when a file has that path or that basename, or a file's text contains it;
   - untracked files count (tests are written before they are committed); git-ignored files don't;
   - WARN in every mode, never FAIL: the map is prose and a wrong guess must not block CI.
   (G-3: shipped plans are not scanned — later work may rename a test legitimately.)

## Acceptance criteria
- [x] AC-1 `prompts/verify.md` states one break per criterion in a sensitive area, more only where named.
- [x] AC-2 All six places of Requirement 2 state the documents-only exception; none still says "every fix round is re-reviewed" without it.
- [x] AC-3 `docs/testing.md` states the list rules of Requirement 3: the allowed addition, the allow-list / sensitive-area exception through the CHANGE lane, the reorder case.
- [x] AC-4 `docs/git.md` states the exit-code rule with the grep example.
- [x] AC-5 selftest: doctor warns for a missing name, a missing `::` part and a missing wildcard prefix; stays quiet for a name in an untracked test file, a basename, a path, a `[param]` name; a name found only in `specs/` warns; a shipped plan is not scanned; `--strict` exit stays 0 for it.
- [x] AC-6 `./scripts/selftest` and `./scripts/doctor` green; CHANGELOG v1.24 with the Upgrading behavior list and document intents; `.anew-version` v1.24.

## Constraints
- Stack-neutral: no language, tool or framework named in rules (memory: ANEW docs are stack-neutral).
- POSIX sh and awk only in `scripts/doctor`; no new dependency.
- No invariant rule in `AGENTS.md` changes.
