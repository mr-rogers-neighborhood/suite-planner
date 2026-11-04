# Gradient

**A local-first daily planner.** A day view that puts your task list beside a calendar, time
estimates against daily capacity, quick capture, rituals and a focus timer — in one Electron app
that opens without a network and keeps your plan in a file you own.

There is no account, no server and no telemetry. Export a `.gradient` file whenever you want a copy;
the app keeps an autosaved workspace and one rolling backup on this machine.

> Gradient is pre-alpha. The core loop works; editing surfaces and rituals are being built.

## Run it

Node 22 or newer and pnpm 12.

```sh
pnpm install
pnpm dev        # Electron window, Vite renderer with hot reload
```

Other commands:

```sh
pnpm check      # the edit loop: biome, tsc, changed tests, shape check
pnpm verify     # lint, typecheck, all tests, shape, knip, build, Storybook build
pnpm test       # every Vitest project
pnpm storybook  # component workshop on :6006
pnpm e2e:smoke  # Playwright smoke journey; on request, not part of the gate
pnpm package    # electron-builder targets for this platform
```

## What it does

- **A day is the unit.** Today opens to an ordered task list with a capacity meter and a local
  calendar beside it.
- **Estimates, not guesswork.** Every task carries an estimate; the meter says whether the day fits.
- **Capture in one line.** `Draft the plan tomorrow ~45m #Gradient @deep-work !1 9:30` becomes a
  scheduled task with a project, tag, estimate, priority and due time.
- **Inbox, then plan.** Captured work waits in the inbox until you give it a day.
- **It is a document, not a service.** One Loro CRDT document, autosaved atomically, exportable at
  any time.

## How it is built

React 19 on Electron, one Loro CRDT document per workspace, Zod-validated records, Tailwind v4 with
Radix primitives. The main process holds the authoritative document and the reminder scheduler; the
renderer keeps a replica and streams CRDT deltas over a narrow, validated IPC bridge.

| Path             | What lives there                                                           |
| ---------------- | -------------------------------------------------------------------------- |
| `apps/desktop`   | Electron main, preload bridge, React renderer, Storybook, Playwright       |
| `packages/core`  | Schema, `WorkspaceDocument`, pure projections, capture parser, file format |
| `docs/reference` | Architecture, conventions, data model                                      |
| `docs/adr`       | The decisions behind the shape, one page each                              |

Read [AGENTS.md](AGENTS.md) before contributing (human or agent), and
[docs/reference/architecture.md](docs/reference/architecture.md) for the longer version.

## Licence

MIT, © Gradient contributors.
