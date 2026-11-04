# ADR-0003: Main process holds the document; the renderer keeps a replica

- Status: accepted
- Date: 2026-01-05

## Context

The renderer owns the window, and the window can close. Reminders must still fire, and autosave must
survive a renderer crash. Only main can write files and show native notifications. But routing every
keystroke through IPC would make the editor feel remote.

## Decision

Main holds the authoritative `WorkspaceDocument` and the reminder scheduler. The renderer builds a
replica from a snapshot, edits locally, and forwards each CRDT delta over `workspace:commit`. Main
imports the delta and debounces an atomic write. An import in main broadcasts a fresh snapshot.

## Consequences

- Editing is local and fast; the file and notifications live where they are allowed.
- The delta channel is the same one a relay would use, so the document layer does not change when
  sync arrives.
- The renderer must handle a full replacement, which it does by rebuilding the replica.
- Two windows would merge through the CRDT, but the UI assumes one for now.
