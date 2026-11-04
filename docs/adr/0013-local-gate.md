# ADR-0013: The quality gate is local

- Status: accepted
- Date: 2026-01-05

## Context

A gate that only runs in a hosted CI service is a gate a contributor cannot reproduce. It also makes
"green" a claim about a service rather than about the code on this machine. Suite Planner has no deployment
pipeline yet.

## Decision

Every gate is a local command. `pnpm check` is the edit loop; `pnpm verify` adds the production and
Storybook builds. Playwright runs on request. No CI service is claimed to gate `main`.

## Consequences

- A contributor can reproduce any claim by running the named command.
- Nothing runs automatically on push, so a broken change can reach the branch; the habit is to run
  `pnpm check` before each commit and `pnpm verify` before a milestone.
- Husky runs Biome on staged files and commitlint on the message, which covers the cheap half.
- Adding CI later is a policy change, not a code change.
