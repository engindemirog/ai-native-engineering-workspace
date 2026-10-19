---
name: fix-bug
description: "ANEW Run the bug-fix workflow (reproduction before fix). Run explicitly: $fix-bug."
---
Read AGENTS.md and workflows/bug-fix.md. Run the workflow for what is described after the skill name.
Iron rule: no fix before a failing minimal reproduction test exists (R-05 pattern). Diagnose root
cause before changing anything (R-01). The reproduction test is permanent. Stop at every human gate.
