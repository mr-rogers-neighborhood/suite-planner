# ADR-0011: Estimates and capacity, not time blocking

- Status: accepted
- Date: 2026-01-05

## Context

Sunsama asks whether the day fits; Akiflow lets you drag work onto a timeline. Both are useful, and
they are different products. Time blocking needs a start time, a duration, conflict handling and a
drag surface; it also turns the calendar into a second source of scheduling truth.

## Decision

A task carries an estimate, and the day carries a capacity. The header shows planned minutes against
available minutes. Tasks do not occupy calendar slots in v1; the calendar shows events only.

## Consequences

- The core question — "is today realistic?" — is answered without a timeline.
- Scheduling stays a list operation: move to a day, reorder, estimate.
- Time blocking can be added later as a placement over the same tasks, without changing the task
  record's meaning.
- Capacity is a number the user controls, not a claim the app makes about their day.
