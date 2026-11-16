# Spec 0008 — doctor reads the untouched template approval line as not approved (mini)

- Status: Shipped
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0008-plan.md`
- Self-critique: done (no gaps: one line of doctor, the behavior named by B-8)
- Source: B-8 (`.anew-dev/backlog.md`; spec 0006, review round 1, Info-3)

## Intent
doctor strips HTML comments one line at a time. The plan template's approval line opens a
comment that closes on the next line, so on an untouched copy (`- Approved by / on: — <!-- This
line IS …`) nothing is stripped, the value reads non-empty, and doctor counts the plan as
approved. A spec moved to `In progress` on such a plan passes the gate "build started without
recorded plan approval" silently — the one gate doctor has for plan approval. status and gate
already read the line correctly. This is a fix (LTS policy: a script that does not behave as
documented): on `main` as v1.26.1, then on `lts/1.24` as v1.24.2.

Not done: doctor's other one-line comment strips (no reported case), B-3.

## Changed behavior
- [x] CB-1 — A plan whose approval line is the template's untouched line (a comment that opens
  after `—` and closes on a later line), with its spec `In progress`, gets doctor's gate "build
  started without recorded plan approval" (WARN locally, FAIL under `--strict`).
- [x] CB-2 — A value followed by a comment that opens and does not close on that line
  (`- Approved by / on: Ada, 2026-10-16 <!-- …`) still reads approved.

## Preserved behavior
- [x] PB-1 — A recorded value, with or without a comment closed on the same line, reads approved;
  `—`, `-` and empty read not approved; the existing doctor scenarios stay green.
- [x] PB-2 — `lts/1.24` receives only this fix (cherry-pick `-x`, `.anew-dev/` hunks dropped, its
  own v1.24.2 CHANGELOG entry and `.anew-version`); its selftest and doctor --strict are green.

## Out of scope
Other comment handling in doctor; status and gate (already correct); any new rule.

## Definition of Done
- [x] `scripts/check` green (here: doctor --strict + selftest), on `main` and on `lts/1.24`
- [x] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [x] Criterion ↔ evidence table complete for CB-* **and** PB-*
- [x] Spec moved to `.anew-dev/done/` (immutable there)
