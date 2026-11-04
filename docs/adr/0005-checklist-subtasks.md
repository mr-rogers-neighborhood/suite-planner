# ADR-0005: Subtasks are checklist items, not child tasks

- Status: accepted
- Date: 2026-01-05

## Context

Sunsama and Akiflow both support nested work. Child tasks would give each item its own estimate,
project, reminder and day, but they also add recursive planning, ordering and deletion rules.

## Decision

A subtask is a checklist item on the task: `{ id, title, done }`. It has no estimate, project or day
of its own. The task remains the unit of planning.

## Consequences

- The day view stays one row per planned thing.
- Completing a checklist item is a single array write on one record.
- A user who needs independent scheduling promotes the item to a task; that is a later feature, not
  an implicit one.
- Nested estimates are not possible, which keeps capacity honest.
