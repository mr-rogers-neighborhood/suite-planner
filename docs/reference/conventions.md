# Coding conventions

The rules as rules. The model they serve is [architecture.md](architecture.md), the records are in
[data-model.md](data-model.md), and the reasoning is in [../adr/README.md](../adr/README.md).

## Shape: pure core, imperative shell

Pure modules take data and return data: `schema`, `dates`, `ids`, `plan/*`, `capture/parse`,
`file` decoding. No DOM, no Loro, no `fetch`, no timers, and a test that needs none of them.

Shell modules own state or I/O: `WorkspaceDocument` and its domain modules, the Electron main
process, the file store, the scheduler, IPC handlers, preload, React hosts.

Dependencies point inward. A pure module that imports `loro/WorkspaceDocument` is a bug; pass plain
values down and interpret results up.

One owner per piece of state. Document truth lives in Loro through `WorkspaceDocument`; UI state
lives in Zustand; transient view state may live in React. Never keep a second copy.

## Files and folders

Folder by feature, not by file type: `packages/core/src/{loro,plan,capture,file}`,
`apps/desktop/src/{main,preload}`, `apps/desktop/src/renderer/src/{app,day,inbox,capture,calendar,components,store,platform,theme}`.

Each feature folder exposes one `index.ts` and nothing else as public surface. No barrel files that
re-export everything. The facade (`WorkspaceDocument`) and the folder index are the API.

Co-locate `*.test.ts(x)` and `*.stories.tsx` with the code they cover. One primary export per file;
small helpers stay private. Named exports only. Around 400 lines, look for a seam;
`pnpm shape` fails a source file over 900 lines.

Components are `PascalCase.tsx`, hooks are `useCamelCase.ts`, other modules are `camelCase.ts`.

## Naming

Functions read `verbNoun`: `createTask`, `scheduleTask`, `markDayPlanned`, `parseCapture`. Predicates
read `isX`, `hasX` or `canX`: `isOccurrence`, `isOccurrenceDone`. Conversions read `toX` and `fromX`;
`decodeX` returns a `Result` and `assertX` throws.

Hooks are `useX`, component props are `XProps`, tagged error types are `XxxError`.

Tests describe the unit under test and use `it("should …")` for the behaviour.

## Data and errors

Prefer plain readonly objects, discriminated unions and exhaustive `switch`.

No boolean-flag arguments. Take a small options object, or write two named functions.

`Result<T, E>` from `neverthrow` belongs at fallible boundaries: decoding a file, validating a
loaded document, parsing an IPC payload. Use `ok`/`err` and convert once at the seam. Throw for
programmer errors and invariants only, and never a bare `Error("…")` across a module boundary;
define a tagged error type (`TaskNotFoundError`, `WorkspaceFileError`).

`zod` is the source of truth for persisted shapes: derive types with `z.infer`, never duplicate an
interface, and validate on every write.

`remeda` is not a dependency. Use a loop when it is clearer.

No new dependency without a stated job and the correct package.

## Refactor on sight

| Smell                                                          | Smallest fix                           |
| -------------------------------------------------------------- | -------------------------------------- |
| A whole-record write where two fields can change independently | Write the leaf field                   |
| A derivation stored back into the document                     | Recompute at read time                 |
| A second copy of a day plan or capacity calculation            | One pure projection, one call site     |
| A component that imports `loro-crdt`                           | Go through `WorkspaceDocument`         |
| A new IPC channel without a Zod parse                          | Parse in main before using the payload |
| A log line with a task body or a file path                     | Log the error code, not the content    |

`pnpm shape` enforces the mechanical half: file length, the single `observe` call site, Loro imports
confined to `packages/core/src/loro`, `nodeIntegration: true` banned, and component file names.

## TypeScript

Strict mode stays on, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax` and `isolatedModules`. Do not weaken it.

No `any` without a `// biome-ignore lint/suspicious/noExplicitAny: <reason>` and a real reason.
Prefer `unknown` with narrowing, and discriminated unions.

Type-only imports use `import type`. Imports are grouped external, `@gradient/*`, then relative,
separated by blank lines; Biome's organizer enforces it.

## Domain language

A **workspace** is one Loro document, one file and one sync unit. A **task** is the object. A
**day** is a local date (`yyyy-MM-dd`) with an intention, a shutdown note and an optional capacity
override. A **plan** is the projection of tasks that point at a day. A **project** groups tasks; a
**tag** labels them. An **event** is a local calendar entry. A **note** is the rich text attached to
a task. A **session** is a focus timer run.

Say "move to inbox" and "delete task", not "archive" and "remove". There is no trash yet; a delete is
a delete.

## Libraries first

Use the library's primitive before writing plumbing: Radix `Dialog`, `DropdownMenu`, `Checkbox`,
`Tooltip`; Tiptap's `useEditor` and `BubbleMenu`; Zustand selectors; `useSyncExternalStore`.

Hand-roll only what the library leaves out, such as the buttons inside a Tiptap bubble menu or the
day timeline geometry.

## React

Function components with hooks, no classes.

Read document data through `useWorkspaceSnapshot` and never a `useState` copy. Never call
`WorkspaceDocument.observe` from a component: `store/snapshotStore.ts` owns the single subscription
and selectors stay atomic.

Keep components small and split presentational pieces into the feature folder.

## State

Zustand holds UI state only: active view, selected date, selected task, capture focus signal, notices.
Document data is owned by the Loro document.

A reminder is document data (`remindAt`, `remindedAt`), not a UI timer. A focus countdown derives from
a persisted session, so a reload resumes it.

## Accessibility

Radix primitive first. Every icon-only control has an `aria-label` and a title. Focus stays visible;
the focus ring is defined once in `theme/styles.css`. Do not encode state in colour alone; pair the
capacity colour with text. Respect `prefers-reduced-motion`. Storybook runs the a11y addon.

## Tests

Vitest with Testing Library. Pure modules get unit tests; components get a test where behaviour is
non-trivial and a story where it is visual. Playwright covers one Electron smoke journey and runs on
request, not in the gate.

A CRDT change gets a convergence test: two replicas from one snapshot, concurrent edits, exchange
updates, same result.

## Docs

Docs change with the code they describe. A decision that changes the shape gets an ADR; a comment may
cite `ADR-NNNN`, but the prose around it states the decision so the code does not depend on opening
the file.
