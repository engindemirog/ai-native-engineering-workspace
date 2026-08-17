# Workflow: Incident

**Goal:** stabilize production first, learn second. Speed matters — gates here are thin by design.

```
ASSESS → STABILIZE → [HUMAN: action] → EVIDENCE → ROOT CAUSE → FIX (bug-fix workflow) → POSTMORTEM
```

1. **ASSESS.** What's broken, blast radius, since when, what changed last (deploys, config, data).
2. **STABILIZE.** Prefer the boring option: revert/rollback (R-11 — `git revert`, never history
   rewriting), feature-flag off, scale, or rate-limit. **[GATE: human]** — the human executes or
   explicitly approves the production action. Agents do not touch production unilaterally.
3. **EVIDENCE.** Before it evaporates: logs, metrics, failing requests, timeline. Store alongside
   the incident spec (`specs/active/incident-<date>.md` — a lightweight spec is enough).
4. **ROOT CAUSE.** Diagnosis discipline of R-01: cause, not symptom. "Why did our gates miss it?"
   is part of the root cause.
5. **FIX.** Run the **bug-fix workflow** (reproduction first). The incident is not "done" at
   mitigation.
6. **POSTMORTEM.** Blameless, short, written: timeline, cause, what gate would have caught it.
   Outcomes become permanent: a new test, a new check in `scripts/check.conf`, a docs rule, or an
   ADR — otherwise the lesson evaporates with the adrenaline.
