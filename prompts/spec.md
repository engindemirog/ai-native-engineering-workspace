# Prompt: Write the Spec

```
Role: Analyst. Using <specs/TEMPLATE.md | specs/TEMPLATE-mini.md for a change request or incident>,
write specs/active/<NNNN>-<name>.md for: "<feature>". Fold in the intent and every clarify
decision we made. (Mini: Changed behavior + Preserved behavior criteria, Source mandatory.)

Requirements must describe BEHAVIOR — no technical solutions (no endpoints, tables, caches).
Acceptance criteria: each line independently testable; cover the happy path, boundaries,
empty states, invalid inputs, and authorization. Constraints include explicit OUT OF SCOPE items.
User experience: fill flow, states, design link and accessibility, or "none — no user interface".
Every listed state gets a criterion. Never invent visuals. Ask for a link to a fixed version of
the design (or a dated export), so verification compares against what was approved; a design
that changes later is a spec change (R-08).
Write in the docs language (AGENTS.md, Language); field labels and Status values stay English.

Then run a SELF-CRITIQUE pass as a hostile reader: which questions would a developer still have?
(ambiguous criteria, missing boundary values, undefined error behavior). List each gap with your
recommendation; I will approve which ones get folded in.
SIZE: more than one user capability, or more than ~8–10 acceptance criteria → recommend a split:
name the specs and their order. If I keep it as one, write that into Constraints & out of scope
(Split: proposed <specs>; kept as one — <who>, <reason>). Do not write a plan or code.
```
