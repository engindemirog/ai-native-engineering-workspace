# ADR 0007 — Check leaves nothing running

- Status: Accepted
- Date: 2026-10-07

## Context
Nearly every toolchain buys speed by keeping processes warm: build daemons, compile servers,
package-manager services, test hosts and workers, watchers, browsers, the app under test,
containers, emulators. A human builds ~20 times a day; an agent runs `./scripts/check` ~200 times,
so per-run residue compounds until the machine starves — on a 32 GB machine we measured 2.4 GB
free and e2e failing with blank pages. That day it was build and compile servers, but Gradle
daemons, pytest-xdist workers and leaked Chromiums produce the same picture. ANEW's core is
language-agnostic, so the fix cannot be a list of tools.

## Decision
One category-based rule and one test (`docs/testing.md`, Resource hygiene): a check run leaves
nothing running, defined by the residue test — check twice back to back, process count and
memory return to baseline after each run. Bootstrap derives each stack's switches itself
(inventory → neutralize → prove) and does not finish until the residue test passes; in adoption
it proposes flag changes instead of imposing them.

## Consequences
- Benefits: flat memory under agent-driven frequency; stable e2e; a rule any future stack can be
  held to without touching the core.
- Costs: slightly slower builds (no warm daemons); the residue test is a bootstrap gate, not
  validated by `scripts/doctor` — later check.conf edits can regress it unnoticed.

## Alternatives considered
- A maintained per-stack switch list: ages instantly and contradicts the language-agnostic core.
  Two examples in `prompts/bootstrap.md` are illustrations, not that list.
- Periodic cleanup scripts, or bigger hardware: both treat the symptom; residue still builds up
  between cleanups and hides which command leaks.
- A cleanup step in `scripts/check`: rejected for now — a stop inside the leaking step, keeping
  its exit code, works with the fail-fast contract unchanged.

## Revisit triggers
- Residue regressions after bootstrap keep recurring (consider a check.conf convention doctor can see).
- Stacks appear whose stop cannot be expressed inside one step.
