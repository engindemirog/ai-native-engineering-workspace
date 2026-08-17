# Prompt: Write the Spec

```
Role: Analyst. Using specs/TEMPLATE.md, write specs/active/<NNNN>-<name>.md for:
"<feature>". Fold in the intent and every clarify decision we made.

Requirements must describe BEHAVIOR — no technical solutions (no endpoints, tables, caches).
Acceptance criteria: each line independently testable; cover the happy path, boundaries,
empty states, invalid inputs, and authorization. Constraints include explicit OUT OF SCOPE items.

Then run a SELF-CRITIQUE pass as a hostile reader: which questions would a developer still have?
(ambiguous criteria, missing boundary values, undefined error behavior). List each gap with your
recommendation; I will approve which ones get folded in. Do not write a plan or code.
```
