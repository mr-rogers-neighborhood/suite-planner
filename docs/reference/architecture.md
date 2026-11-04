# Architecture

Gradient is a local-first daily planner. One Loro document per workspace is the source of truth,
`@gradient/core` validates every write, and the React app renders projections of that document. A
task exists whether or not it is planned for a day; a day is a date that some tasks point at.

This page is the map. The rules are in [conventions.md](conventions.md), the records in
[data-model.md](data-model.md), and the reasoning in [../adr/README.md](../adr/README.md).

## Three rules

1. **Offline works.** The network is not required to open, edit or export a workspace. There is no
   network call in v1 at all.
2. **Loro owns the document.** The UI reads through `@gradient/core` and writes through
   `WorkspaceDocument`, never raw Loro.
3. **Every write is validated.** Zod schemas in `packages/core/src/schema.ts` parse at the boundary
   before a value reaches the CRDT.

## Process model

```
┌────────────────────────── Electron main (authority) ──────────────────────────┐
│  WorkspaceDocument (Loro)  ──►  file store (.gradient, atomic write)          │
│         │                                                                     │
│         ├──► reminder scheduler ──► native Notification                      │
│         └──► IPC: snapshot / commit / export / import / info                  │
└───────────────────────────────────────────────────────────────────────────────┘
                                    │ contextBridge, allowlisted channels
┌───────────────────────────────────▼───────────────────────────────────────────┐
│  Renderer (replica)                                                           │
│  React 19 + Vite + Tailwind + Radix                                           │
│    ├── WorkspaceDocument replica, one observe call site → snapshot store      │
│    ├── Zustand: UI state only (view, selected date, capture focus, notice)    │
│    └── pure projections: dayPlan, capacityFor, occurrencesBetween, parseCapture│
└───────────────────────────────────────────────────────────────────────────────┘
```

**Boot.** Main loads `workspace.gradient` from `app.getPath("userData")`, falls back to
`workspace.backup.gradient`, and creates a new document if both are missing or invalid. The renderer
asks for a snapshot and builds a replica.

**Edits.** The renderer mutates its replica. `subscribeLocalUpdates` emits the CRDT delta; the
snapshot store forwards it over `workspace:commit`, refreshes its derived snapshot, and the UI
re-renders. Main imports the delta and debounces an atomic write (400 ms). The same delta channel is
what a relay would carry later, so document code does not change when sync arrives (ADR-0007).

**Import.** Main decodes the file, builds a fresh document, validates every record, replaces the
authority and writes it, then broadcasts `workspace:replaced` with a new snapshot. The renderer
replaces its replica and re-subscribes.

**Reminders.** Main keeps its own document, so the scheduler ticks with no window open. A due task
gets `remindedAt` as a leaf write, which is what stops it repeating.

## Why main is the authority

The renderer is sandboxed and its lifetime is a window. The scheduler has to outlive the window, and
autosave has to survive a renderer crash. Putting the document in main gives both, and it keeps the
file and notification APIs in the process that is allowed to use them (ADR-0003).

The cost is a delta channel and a full-snapshot fallback. Both are small, and both are what a future
relay needs anyway.

## Repo map

| Path                          | Responsibility                                                        |
| ----------------------------- | --------------------------------------------------------------------- |
| `apps/desktop/src/main`       | Authority, file store, IPC, tray, scheduler, menu, window             |
| `apps/desktop/src/preload`    | Typed `GradientBridge` over `contextBridge`                           |
| `apps/desktop/src/renderer`   | React shell, day view, inbox, capture, calendar, theme                |
| `packages/core/src/schema.ts` | Zod records and `z.infer` types                                       |
| `packages/core/src/loro`      | `WorkspaceDocument` and its domain modules                            |
| `packages/core/src/plan`      | Pure projections: day plan, capacity, recurrence, inbox, search, sort |
| `packages/core/src/capture`   | Pure one-line capture parser                                          |
| `packages/core/src/file`      | `.gradient` envelope, encode/decode, errors                           |
| `scripts/check-shape.mjs`     | Mechanical rules: file length, observe sites, Loro confinement        |

## Layers

- **Pure.** `schema`, `plan/*`, `capture/parse`, `dates`, `ids`. No DOM, no Loro, no `fetch`, no
  timers. A test needs none of them.
- **Document.** `loro/*`. Owns the `LoroDoc`, validates writes, commits transactions. The only layer
  allowed to import `loro-crdt`.
- **Shell.** Electron main, preload, file store, scheduler, IPC, React hosts. Owns state and I/O.
- **UI state.** Zustand, UI only. Never a second copy of document truth.

Dependencies point inward: a pure module never imports the document layer, and the document layer
never imports React or Electron.

## Security model

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`.
- No remote content. `setWindowOpenHandler` denies and opens external links in the system browser.
- A Content-Security-Policy is set on responses and repeated in `index.html`.
- Every IPC payload is parsed with Zod in main. Only `Uint8Array` updates cross the commit channel.
- File paths are app-owned except for paths the user picks in a native dialog.
- No telemetry, no analytics, no network client in the bundle.

## Decisions

| Question                   | Decision                                         | Record             |
| -------------------------- | ------------------------------------------------ | ------------------ |
| Where truth lives          | One Loro document per workspace, owned by main   | ADR-0001, ADR-0003 |
| What runs the UI           | Electron, one Chromium on every OS               | ADR-0002           |
| Who owns a task's day      | The task owns `scheduledFor` and `order`         | ADR-0004           |
| What a subtask is          | A checklist item on the task                     | ADR-0005           |
| How recurrence works       | A pure projection plus per-occurrence completion | ADR-0006           |
| What sync is               | An interface, no relay shipped                   | ADR-0007           |
| What the calendar holds    | Local events only                                | ADR-0008           |
| What the UI primitives are | Radix + Tailwind                                 | ADR-0009           |
| Where the file lives       | App-managed autosave plus export/import          | ADR-0010           |
| How a day is planned       | Estimates and capacity, not time blocking        | ADR-0011           |
| How the workspace is built | pnpm scripts, no Turborepo                       | ADR-0012           |
| What gates a change        | Local commands only                              | ADR-0013           |

## Not settled

- **Time blocking.** The model has estimates and a day calendar; placing a task on the grid needs a
  start time and a duration, and a conflict rule. It waits for a real request.
- **Week view.** Upcoming is a list first. A week grid is a projection over the same tasks.
- **External calendars.** Google/Outlook need OAuth and a server. `.ics` import/export fits the
  local model and can come first.
- **Integrations.** A `source` field and an adapter seam exist; no adapter ships. Nothing in the
  schema assumes there will never be one.
- **Body search.** Search covers titles, projects and tags in memory. Searching note bodies needs a
  stored index, which is a cache with an invalidation problem; it waits.
- **Multi-window.** The delta channel would merge edits from two windows, but the UI assumes one.
