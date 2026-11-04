# Data model

The schema is `packages/core/src/schema.ts`. Zod is the source of truth; types are `z.infer`. Every
write is parsed before it reaches the CRDT.

## Roots

One Loro document holds these roots. Only `WorkspaceDocument` mutates them.

| Root            | Key          | Record                    |
| --------------- | ------------ | ------------------------- |
| `tasks`         | task id      | `task`                    |
| `projects`      | project id   | `project`                 |
| `tags`          | tag id       | `tag`                     |
| `events`        | event id     | `calendarEvent`           |
| `days`          | `yyyy-MM-dd` | `dayRecord`               |
| `focusSessions` | session id   | `focusSession`            |
| `settings`      | —            | `settings` (one map)      |
| `meta`          | —            | `workspaceMeta` (one map) |

Each task, project, tag, event, day and focus session is a mergeable map, so a field write is a leaf
write. Two clients editing a title and an estimate at the same time both keep their edit; a
whole-record write would make the second one win.

Notes are Loro text containers named `note:<taskId>`. The note is not in the task record, so a text
edit never rewrites the task. Until the editor binds to the container, a save replaces the whole
note; concurrent edits to one note are the one place v1 does not merge at character level.

## Records

### task

| Field                                   | Type                           | Notes                                                    |
| --------------------------------------- | ------------------------------ | -------------------------------------------------------- |
| `id`                                    | string                         | `task_<uuid>`                                            |
| `title`                                 | string                         | authored                                                 |
| `projectId`                             | string \| null                 | one project                                              |
| `tagIds`                                | string[]                       | labels                                                   |
| `status`                                | `inbox` \| `planned` \| `done` | derived from scheduling, but stored so filters are cheap |
| `estimateMinutes`                       | number \| null                 | null means "use the default"                             |
| `scheduledFor`                          | date key \| null               | the day the task is planned for                          |
| `order`                                 | number                         | position within that day                                 |
| `dueAt`                                 | timestamp \| null              | an actual deadline, not a plan                           |
| `remindAt`                              | timestamp \| null              | when main should notify                                  |
| `remindedAt`                            | timestamp \| null              | set by the scheduler; stops repeats                      |
| `recurrence`                            | rule \| null                   | frequency, interval, weekdays, until                     |
| `recurrenceCompletions`                 | date key[]                     | occurrences already done                                 |
| `priority`                              | 1..3 \| null                   | 1 is highest                                             |
| `source`                                | string \| null                 | reserved for a future import adapter                     |
| `checklist`                             | item[]                         | subtasks, with `id`, `title`, `done`                     |
| `createdAt`, `updatedAt`, `completedAt` | timestamps                     |                                                          |

### project

`id`, `name`, `color`, `archivedAt`, `createdAt`.

### tag

`id`, `name`, `color`, `createdAt`.

### calendarEvent

`id`, `title`, `dateKey`, `startTime` (`HH:MM`), `endTime` (`HH:MM`), `notes`, `color`,
`createdAt`, `updatedAt`. The schema rejects an event that ends before it starts.

### dayRecord

`dateKey`, `intention`, `shutdownNote`, `capacityMinutesOverride`, `plannedAt`, `shutdownAt`.
A day holds no task list: the tasks point at it.

### focusSession

`id`, `taskId`, `startedAt`, `plannedMinutes`, `endedAt`.

### settings

`weekStartsOn`, `workdayStart`, `workdayEnd`, `dailyCapacityMinutes`, `defaultEstimateMinutes`,
`theme`, `remindersEnabled`.

### workspaceMeta

`workspaceId`, `schemaVersion`, `createdAt`.

## Derived, never stored

- The day plan: tasks with `scheduledFor === dateKey`, plus projected recurrence occurrences.
- Capacity: the sum of estimates against `dailyCapacityMinutes` or the day override.
- Overdue: a non-recurring task scheduled before the day and not done.
- Inbox: `status === "inbox"` and no `scheduledFor`.
- Occurrences of a recurring task: `occurrencesBetween` over a range.
- Search hits: an in-memory fuzzy match over titles, projects and tags.
- Display order: `order`, then `createdAt`.

A derived value may be cached only if it can be thrown away and rebuilt from the document. The
renderer's snapshot is exactly that: a projection rebuilt after every commit.

## Recurrence

A recurring task stores its anchor in `scheduledFor` and its rule in `recurrence`. Occurrences are
projected into a range; nothing is materialised. Completion is recorded in
`recurrenceCompletions`, and the task itself stays `planned`. Monthly recurrence skips months that
do not contain the anchor day rather than clamping to the last day.

## Writes

`WorkspaceDocument` exposes typed methods. Each one:

1. reads the current record and merges the patch,
2. parses the result with the Zod schema,
3. writes only the keys that changed (plus `updatedAt`),
4. commits the Loro transaction.

Creating a record writes every field once. Deleting is a map delete; there is no trash yet.

## File format

A `.gradient` file is a JSON envelope:

```json
{
  "format": "gradient.workspace",
  "formatVersion": 1,
  "schemaVersion": 1,
  "exportedAt": "2026-01-05T09:00:00.000Z",
  "snapshot": "<base64 Loro snapshot>"
}
```

`decodeWorkspaceFile` returns a `Result` and rejects bad JSON, another app's JSON, a newer format and
a snapshot that will not decode. Import then builds a fresh document and validates every record
before replacing the authority.

The live workspace is the same envelope at
`<userData>/workspace.gradient`, with `workspace.backup.gradient` holding the previous write and
`workspace.gradient.tmp` used for the atomic rename.
