import { formatDuration, inboxTasks, type Project } from "@gradient/core";
import { Inbox } from "lucide-react";

import { CaptureBar } from "../capture/CaptureBar";
import { Button } from "../components/Button";
import { TaskCheckbox } from "../components/TaskCheckbox";
import { useReplica, useWorkspaceSnapshot } from "../store/snapshotStore";
import { useUiStore } from "../store/uiStore";

export function InboxView() {
  const snapshot = useWorkspaceSnapshot();
  const replica = useReplica();
  const date = useUiStore((state) => state.selectedDate);
  const tasks = inboxTasks(snapshot.tasks);
  const projects = new Map<string, Project>(
    snapshot.projects.map((project) => [project.id, project]),
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Inbox">
      <header className="border-b border-line px-6 pb-4 pt-5">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
          <span className="text-xs text-faint">
            {tasks.length === 0 ? "clear" : `${tasks.length} waiting`}
          </span>
        </div>
        <p className="mt-1 text-xs text-faint">Captured work lands here until you give it a day.</p>
      </header>

      <div className="px-6 pt-4">
        <CaptureBar target={{ kind: "inbox" }} />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-6 pb-24">
        {tasks.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-panel">
              <Inbox size={18} className="text-muted" />
            </div>
            <p className="mt-4 text-sm font-medium text-ink">Inbox zero</p>
            <p className="mt-1 max-w-[36ch] text-xs leading-relaxed text-faint">
              Nothing is waiting. Capture the next thing with Ctrl N, or plan a day.
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {tasks.map((task) => {
              const project = task.projectId ? projects.get(task.projectId) : undefined;
              return (
                <li
                  key={task.id}
                  className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-panel"
                >
                  <TaskCheckbox
                    checked={false}
                    onCheckedChange={() => replica.document.completeTask(task.id)}
                    label={`Complete ${task.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-faint">
                      {project && (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: project.color ?? "var(--accent)" }}
                          />
                          {project.name}
                        </span>
                      )}
                      {task.estimateMinutes !== null && (
                        <span>{formatDuration(task.estimateMinutes)}</span>
                      )}
                      {task.priority !== null && <span>P{task.priority}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => replica.document.scheduleTask(task.id, date)}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    Schedule
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
