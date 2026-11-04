# Decision records

Every decision that changes the shape of the product or the code gets a short record here. Records
are written for Gradient; none are copied from another project. An id is stable and quotable, but the
prose around a citation should still state the decision.

| #                                           | Decision                                                      | Status   |
| ------------------------------------------- | ------------------------------------------------------------- | -------- |
| [0001](0001-loro-document.md)               | One Loro document per workspace is the source of truth        | accepted |
| [0002](0002-electron.md)                    | Electron, one Chromium on every OS                            | accepted |
| [0003](0003-main-authority.md)              | Main process holds the document; the renderer keeps a replica | accepted |
| [0004](0004-task-owns-its-day.md)           | The task owns its day and order                               | accepted |
| [0005](0005-checklist-subtasks.md)          | Subtasks are checklist items, not child tasks                 | accepted |
| [0006](0006-recurrence-projection.md)       | Recurrence is a projection with per-occurrence completion     | accepted |
| [0007](0007-sync-seam.md)                   | No server in v1; sync is an interface                         | accepted |
| [0008](0008-local-calendar.md)              | The calendar holds local events only                          | accepted |
| [0009](0009-radix-tailwind.md)              | Radix primitives with Tailwind                                | accepted |
| [0010](0010-workspace-file.md)              | One app-managed workspace file plus export                    | accepted |
| [0011](0011-estimates-not-time-blocking.md) | Estimates and capacity, not time blocking                     | accepted |
| [0012](0012-no-turborepo.md)                | pnpm workspace scripts, no Turborepo                          | accepted |
| [0013](0013-local-gate.md)                  | The quality gate is local                                     | accepted |

## Writing one

Copy the shape of an existing record: context, decision, consequences. Name the alternatives that
were real. Keep it short enough to read in a minute. If a later decision replaces it, mark the old one
`superseded by ADR-NNNN` rather than deleting it.
