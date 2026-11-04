import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type DayTask, formatDuration, type Project, type Tag } from "@suite/planner-core";
import { Bell, MoreHorizontal, Repeat, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "../components/IconButton";
import { TaskCheckbox } from "../components/TaskCheckbox";
import { useReplica } from "../store/snapshotStore";

type TaskRowProps = {
  entry: DayTask;
  project?: Project | undefined;
  tags: Tag[];
};

export function TaskRow({ entry, project, tags }: TaskRowProps) {
  const replica = useReplica();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(entry.task.title);
  }, [entry.task.title]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function toggle(): void {
    if (entry.done) {
      if (entry.recurring) {
        replica.document.uncompleteOccurrence(entry.task.id, entry.occurrence);
      } else {
        replica.document.uncompleteTask(entry.task.id);
      }
    } else {
      replica.document.completeTask(entry.task.id, entry.recurring ? entry.occurrence : null);
    }
  }

  function commitTitle(): void {
    const next = draft.trim();
    setEditing(false);
    if (next.length === 0 || next === entry.task.title) {
      setDraft(entry.task.title);
      return;
    }
    replica.document.updateTask(entry.task.id, { title: next });
  }

  const dueTime = entry.task.dueAt
    ? new Date(entry.task.dueAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <li className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-panel">
      <TaskCheckbox
        checked={entry.done}
        onCheckedChange={toggle}
        label={`Complete ${entry.task.title}`}
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitTitle();
              if (event.key === "Escape") {
                setDraft(entry.task.title);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-line bg-canvas px-2 py-1 text-sm text-ink focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`block w-full truncate text-left text-sm ${
              entry.done ? "text-faint line-through" : "text-ink"
            }`}
          >
            {entry.task.title}
          </button>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
          {project && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: project.color ?? "var(--accent)" }}
              />
              {project.name}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag.id}>#{tag.name}</span>
          ))}
          {entry.task.estimateMinutes !== null && (
            <span className="inline-flex items-center gap-1">
              <Timer size={11} />
              {formatDuration(entry.task.estimateMinutes)}
            </span>
          )}
          {dueTime && <span>due {dueTime}</span>}
          {entry.recurring && (
            <span className="inline-flex items-center gap-1">
              <Repeat size={11} />
              {entry.task.recurrence?.frequency}
            </span>
          )}
          {entry.task.remindAt && (
            <span className="inline-flex items-center gap-1">
              <Bell size={11} />
              reminder
            </span>
          )}
        </div>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton
            label={`Actions for ${entry.task.title}`}
            className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal size={15} />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[180px] rounded-lg border border-line bg-panel p-1 shadow-2xl"
          >
            <DropdownMenu.Item
              onSelect={() => replica.document.scheduleTask(entry.task.id, null)}
              className="cursor-default rounded-md px-2.5 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-raised"
            >
              Move to inbox
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => replica.document.deleteTask(entry.task.id)}
              className="cursor-default rounded-md px-2.5 py-1.5 text-sm text-danger outline-none data-[highlighted]:bg-raised"
            >
              Delete task
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </li>
  );
}
