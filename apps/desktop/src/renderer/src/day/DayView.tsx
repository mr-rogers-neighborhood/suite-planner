import { capacityFor, dayPlan, type Project, type Tag } from "@gradient/core";
import { Inbox } from "lucide-react";

import { CaptureBar } from "../capture/CaptureBar";
import { useReplica, useWorkspaceSnapshot } from "../store/snapshotStore";
import { useUiStore } from "../store/uiStore";
import { CapacityMeter } from "./CapacityMeter";
import { DayHeader } from "./DayHeader";
import { TaskRow } from "./TaskRow";

export function DayView() {
  const snapshot = useWorkspaceSnapshot();
  const replica = useReplica();
  const date = useUiStore((state) => state.selectedDate);
  const setView = useUiStore((state) => state.setView);

  const plan = dayPlan(snapshot.tasks, date, {
    defaultEstimateMinutes: snapshot.settings.defaultEstimateMinutes,
  });
  const day = snapshot.days.find((record) => record.dateKey === date);
  const available = day?.capacityMinutesOverride ?? snapshot.settings.dailyCapacityMinutes;
  const capacity = capacityFor(
    plan.tasks.map((entry) => entry.task),
    available,
    snapshot.settings.defaultEstimateMinutes,
  );

  const projects = new Map<string, Project>(
    snapshot.projects.map((project) => [project.id, project]),
  );
  const tags = new Map<string, Tag>(snapshot.tags.map((tag) => [tag.id, tag]));

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Day plan">
      <DayHeader date={date} />

      <div className="px-6 pt-4">
        <CapacityMeter capacity={capacity} />
      </div>

      <div className="px-6 pt-4">
        <CaptureBar target={{ kind: "day", dateKey: date }} />
      </div>

      <div className="mt-2 flex-1 overflow-y-auto px-6 pb-24">
        {plan.overdue.length > 0 && (
          <section className="mt-4">
            <h2 className="px-3 text-[11px] font-medium uppercase tracking-wider text-warn">
              Overdue
            </h2>
            <ul className="mt-1">
              {plan.overdue.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted"
                >
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <button
                    type="button"
                    onClick={() => replica.document.scheduleTask(task.id, date)}
                    className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted transition-colors hover:bg-raised hover:text-ink"
                  >
                    Pull to today
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ul className="mt-2 space-y-0.5">
          {plan.tasks.map((entry) => (
            <TaskRow
              key={`${entry.task.id}:${entry.occurrence}`}
              entry={entry}
              {...(entry.task.projectId ? { project: projects.get(entry.task.projectId) } : {})}
              tags={entry.task.tagIds
                .map((id) => tags.get(id))
                .filter((tag): tag is Tag => tag !== undefined)}
            />
          ))}
        </ul>

        {plan.tasks.length === 0 && (
          <EmptyDay onPullFromInbox={() => setView("inbox")} inboxCount={plan.inboxCount} />
        )}

        {plan.completed.length > 0 && (
          <details className="mt-6 px-3">
            <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-wider text-faint">
              Completed · {plan.completed.length}
            </summary>
            <ul className="mt-1 space-y-0.5">
              {plan.completed.map((entry) => (
                <TaskRow
                  key={`${entry.task.id}:${entry.occurrence}`}
                  entry={entry}
                  {...(entry.task.projectId ? { project: projects.get(entry.task.projectId) } : {})}
                  tags={[]}
                />
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}

function EmptyDay({
  onPullFromInbox,
  inboxCount,
}: {
  onPullFromInbox: () => void;
  inboxCount: number;
}) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-panel">
        <Inbox size={18} className="text-muted" />
      </div>
      <p className="mt-4 text-sm font-medium text-ink">Nothing planned yet</p>
      <p className="mt-1 max-w-[38ch] text-xs leading-relaxed text-faint">
        Capture something above, or pull work out of the inbox. Estimates against capacity tell you
        whether the day fits before you commit to it.
      </p>
      {inboxCount > 0 && (
        <button
          type="button"
          onClick={onPullFromInbox}
          className="mt-4 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          Open inbox · {inboxCount} waiting
        </button>
      )}
    </div>
  );
}
