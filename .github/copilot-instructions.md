# Copilot instructions — Gradient

Read [AGENTS.md](../AGENTS.md) for the repo map, rules and feature path, and
[docs/reference/conventions.md](../docs/reference/conventions.md) for code shape.

## Always

- Use pnpm from the repo root; never npm or yarn.
- Document data goes through `@gradient/core` (`WorkspaceDocument`), never raw Loro.
- Zustand holds UI state only; document truth is CRDT-owned.
- Validate every write with Zod, and write only the leaf keys that changed.
- Keep TypeScript strict; no `any` without a justified `biome-ignore`.
- The renderer is sandboxed. New machine access goes through `GradientBridge`, validated in main.
- Conventional commit messages; docs and ADRs change with the code they describe.
- Run the local gate after each edit batch: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm shape`. E2E runs on request only.
- All verification gates are local. Name the local command; never claim an external CI service gates
  `main`.

## Shape

Pure core, imperative shell: schema, projections, sorting and the capture parser return data;
`WorkspaceDocument`, the file store, the scheduler, IPC handlers and React hosts own state and I/O.
`neverthrow` `Result` at fallible boundaries.

## Files

Components are `PascalCase.tsx`, hooks are `useCamelCase.ts`, tests are co-located
`*.test.{ts,tsx}`, stories are `*.stories.tsx`. One `index.ts` per feature folder is its public
surface. Type-only imports use `import type`.
