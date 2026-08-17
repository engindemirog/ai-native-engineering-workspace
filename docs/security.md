# Security

> **Template — filled during bootstrap.** Baseline rules agents must honor in every plan and review.

## Secrets
- Secrets never enter the repo, specs, prompts, or chat. `.env` is gitignored; provide `.env.example`.
- Agents never print secret values, even when debugging.

## Input & output
<!-- Validation strategy at boundaries; what is escaped/encoded; what never leaks in error messages. -->

## AuthN / AuthZ
<!-- Who may call what; where authorization is enforced; default-deny statements. -->

## Dependencies
<!-- Policy for adding new dependencies: who approves, what gets checked (license, maintenance, CVEs). -->

## Review lens
Security is a mandatory dimension of every independent review (see `prompts/review.md`), not a
separate afterthought phase.
