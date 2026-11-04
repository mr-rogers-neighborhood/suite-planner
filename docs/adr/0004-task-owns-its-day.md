# ADR-0004: The task owns its day and order

- Status: accepted
- Date: 2026-01-05

## Context

A day could own an ordered list of task ids, or a task could own the day it is planned for and its
position. The first makes "the plan" a first-class record; the second makes a move two leaf writes.

## Decision

The task owns `scheduledFor` and `order`. A day record holds only authored day facts: intention,
shutdown note and a capacity override. The day plan is a projection over tasks.

## Consequences

- Moving a task between days rewrites two fields, not an array, so concurrent moves merge.
- Reordering writes one `order` per moved task; a large reorder is a small batch of leaf writes.
- A task cannot appear twice on one day. Multiple occurrences come from recurrence, not duplicate
  records.
- The day record stays small and independent of how many tasks are planned.
