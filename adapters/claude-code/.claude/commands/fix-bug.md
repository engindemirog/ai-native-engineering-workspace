---
description: Run the bug-fix workflow (reproduction before fix)
argument-hint: what is broken, expected vs actual
---
Read AGENTS.md and workflows/bug-fix.md. Run the workflow for: $ARGUMENTS
Iron rule: no fix before a failing minimal reproduction test exists (R-05 pattern). Diagnose root
cause before changing anything (R-01). The reproduction test is permanent. Stop at every human gate.
