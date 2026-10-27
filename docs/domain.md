# Domain

> **Template — filled during bootstrap.** The shared language between business, humans, and agents.
> If a term isn't here, expect the AI to invent its own meaning for it.

## Ubiquitous language
<!-- One row per term. Same word = same meaning, everywhere: code, specs, conversation. -->

| Term | Meaning | Notes / not to be confused with |
|---|---|---|
| | | |

## Business rules
<!-- Numbered, testable statements. e.g. "BR-3: An order in status Delivered is immutable." -->

## Key domain invariants
<!-- Things that must NEVER be violated, regardless of feature pressure. -->

## Sensitive areas
<!-- Where a mistake costs money, access or legal standing (e.g. payments, identity, personal
     data). A spec that touches one says so in Constraints (`Sensitive area: <name>`); there the
     clarify gate is asked in lite too, every fix round is re-reviewed, and every criterion is
     proven red by breaking the code (workflows/README.md, Modes). "None" is a valid answer. -->
