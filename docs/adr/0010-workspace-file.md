# ADR-0010: One app-managed workspace file plus export

- Status: accepted
- Date: 2026-01-05

## Context

"A file you own" can mean a document with Open/Save, an app-managed database, or a folder of plain
files. Open/Save friction on every edit is the wrong default for a planner. A folder of Markdown
files gives up CRDT merges and a single ordered plan.

## Decision

Keep one autosaved workspace file in Electron's `userData`, with one rolling backup. Export writes the
same envelope to a user-chosen `.planner` file; import replaces the workspace after validating every
record.

## Consequences

- Edits are always saved; there is no unsaved state to lose.
- The user can take a copy at any time and open it on another machine.
- The live file is app-managed, so "where is my data" is answered in the sidebar.
- A plain-text export can be added later without changing the live format.
