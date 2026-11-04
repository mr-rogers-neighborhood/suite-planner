# ADR-0007: No server in v1; sync is an interface

- Status: accepted
- Date: 2026-01-05

## Context

Suite Planner is account-free and local-first. A relay would add identity, authorization, hosting and
cost, and none of that is needed to prove the daily-planning loop. But designing the document so sync
is impossible would be a one-way door.

## Decision

Ship no server and no network client in v1. Keep the document sync-shaped: the renderer forwards CRDT
deltas, main applies them, and the file is a snapshot. Define the seam, do not implement a relay.

## Consequences

- Nothing in the product depends on connectivity, an account or a licence.
- Multi-device use is export/import for now.
- A future relay carries the same delta channel; the document layer does not change.
- Collaboration semantics (presence, permissions, sharing) remain undecided and out of scope.
