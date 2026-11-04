# ADR-0012: pnpm workspace scripts, no Turborepo

- Status: accepted
- Date: 2026-01-05

## Context

The repository has two packages: an Electron app and a core library. Turborepo earns its keep with a
task graph, remote caching and many packages. Here it would be another config file and another
caching layer to debug.

## Decision

Use a pnpm workspace with root scripts that call the two packages. No Turborepo.

## Consequences

- One fewer tool and one fewer cache to invalidate.
- Root scripts are explicit about order (`typecheck` recurses, `build` targets the app).
- If a third or fourth package appears with a real graph, this decision can be revisited with a
  measured reason.
- `pnpm -r` covers the recursive cases.
