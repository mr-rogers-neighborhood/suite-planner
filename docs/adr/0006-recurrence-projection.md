# ADR-0006: Recurrence is a projection with per-occurrence completion

- Status: accepted
- Date: 2026-01-05

## Context

Recurring tasks can be materialised as future records, or stored once and expanded on read.
Materialising creates a write loop, a retention question and a duplicate-avoidance problem.
Expanding on read needs a way to mark one occurrence done without closing the task.

## Decision

Store one task with an anchor date and a rule. `occurrencesBetween` is a pure projection over a range.
Completion is recorded in `recurrenceCompletions` as date keys; the task itself stays `planned`.

## Consequences

- No loop rewrites the document, and no occurrence records accumulate.
- A day plan shows an occurrence by projecting the rule into that day.
- Monthly rules skip months without the anchor day rather than clamping, which is predictable.
- Editing the rule changes future projections but leaves recorded completions alone.
