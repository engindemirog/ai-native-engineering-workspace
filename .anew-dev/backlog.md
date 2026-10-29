# Backlog — ANEW's own deferred findings

Same format and rules as the template's `specs/backlog.md`; kept here so the template's file stays empty.

- **B-1** — A tab inside a step name breaks the step↔prerequisite pairing in check and doctor (`requires names no step: <prefix>`; doctor then reports profiles runnable) — Source: spec 0001, review round 1 (scripts/check, scripts/doctor R-record split) — Severity: Low — Recommendation: a separator that cannot occur after trimming (e.g. `\037`), or document that step names carry no tab — Deferred by: Engin Demiroğ, 2026-10-29, rare; no field case
