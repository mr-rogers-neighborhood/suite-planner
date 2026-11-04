# ADR-0008: The calendar holds local events only

- Status: accepted
- Date: 2026-01-05

## Context

Sunsama and Akiflow sync Google and Outlook calendars. That needs OAuth, token storage, refresh
handling and a server component — exactly the account-bound shape Gradient is avoiding. A planner
still benefits from seeing meetings next to tasks.

## Decision

The calendar shows events stored in the workspace. Events have a date, a start time, an end time and
an optional note. No external calendar is read or written in v1.

## Consequences

- The day view can show meetings and tasks together without a network.
- Users type or import events manually; `.ics` import/export is the natural first extension.
- The event model is deliberately plain so a future adapter can map to it.
- No OAuth, token storage or revocation surface exists.
