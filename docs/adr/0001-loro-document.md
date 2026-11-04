# ADR-0001: One Loro document per workspace

- Status: accepted
- Date: 2026-01-05

## Context

Gradient must open and edit without a network, keep undo, and survive a crash without losing the
plan. A future sync feature should not force a rewrite of the document layer. The workspace is small
enough (thousands of tasks, not millions) that one document is comfortable.

## Decision

One Loro CRDT document per workspace is the source of truth. Zod schemas validate every write.
`WorkspaceDocument` is the only writer, and every record is a mergeable map so writes land on leaf
keys.

## Consequences

- Offline editing, undo and concurrent merges come from the CRDT rather than hand-written code.
- A snapshot is the whole workspace, which makes export and backup trivial.
- Reads rebuild a projection; a large workspace would need an index later.
- Splitting into per-task documents is possible behind the `WorkspaceDocument` seam if a benchmark
  ever asks for it, but it costs cross-document atomicity.
