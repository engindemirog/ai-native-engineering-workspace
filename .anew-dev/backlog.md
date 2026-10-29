# Backlog — ANEW's own deferred findings

Same format and rules as the template's `specs/backlog.md`; kept here so the template's file stays empty.

- **B-1** — A tab inside a step name breaks the step↔prerequisite pairing in check and doctor (`requires names no step: <prefix>`; doctor then reports profiles runnable) — Source: spec 0001, review round 1 (scripts/check, scripts/doctor R-record split) — Severity: Low — Recommendation: a separator that cannot occur after trimming (e.g. `\037`), or document that step names carry no tab — Deferred by: Engin Demiroğ, 2026-10-29, rare; no field case
- **B-2** — `requires <step> [fast]: …` reports `requires names no step: <step> [fast]` without saying the tag does not belong there — Source: spec 0001, VERIFY round 1 (gap a) — Severity: Info — Recommendation: when the name ends in `[fast]` and the stripped name is a step, add "drop the [fast] tag" to the message — Deferred by: Engin Demiroğ, 2026-10-29, caught loudly already
- **B-3** — doctor judges criterion-looking lines inside a code fence, an HTML comment, inline code or a table cell of a new ship (fail-closed: a false gate, never a silent pass) — Source: spec 0002, review round 1 (M-2) — Severity: Low — Recommendation: skip fenced and commented blocks when parsing — Deferred by: Engin Demiroğ, 2026-10-29, safe direction; no field case
