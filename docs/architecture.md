# Architecture

> **Template — filled during bootstrap.** Describe the architecture you *decided on*, not an
> aspiration. Agents read this file before planning; vague answers here become vague code.

## System overview
<!-- 3–6 sentences: what the system is, its architectural style (monolith / modular monolith /
services / etc.), and the one-line reason for that choice (link the ADR). -->

## Modules / components and ownership
<!-- One row per module: single responsibility + the data it owns (conceptual, not table-level). -->

| Module | Single responsibility | Owns |
|---|---|---|
| | | |

## Communication rules
<!-- When is a direct call allowed, when an event/message, when is it forbidden? -->

## Forbidden dependencies (make them testable)
<!-- Concrete prohibitions an architecture test could assert, e.g.
"Module A never accesses Module B's internal types or storage — only its public interface." -->

## Deliberately out of scope
<!-- Conscious non-goals for the current version. -->
