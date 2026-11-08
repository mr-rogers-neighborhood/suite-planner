import {
  addDaysToKey,
  type DateKey,
  fromDateKey,
  humanDayLabel,
  todayKey,
} from "@suite/planner-core";
import { IconButton } from "@suite/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useReplica, useWorkspaceSnapshot } from "../store/snapshotStore";
import { useUiStore } from "../store/uiStore";

export function DayHeader({ date }: { date: DateKey }) {
  const snapshot = useWorkspaceSnapshot();
  const replica = useReplica();
  const setSelectedDate = useUiStore((state) => state.setSelectedDate);
  const day = snapshot.days.find((record) => record.dateKey === date);
  const [intention, setIntention] = useState(day?.intention ?? "");

  useEffect(() => {
    setIntention(day?.intention ?? "");
  }, [day?.intention]);

  function saveIntention(): void {
    if (intention === (day?.intention ?? "")) return;
    replica.document.updateDay(date, { intention });
  }

  const fullDate = fromDateKey(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-line px-6 pb-4 pt-5">
      <div className="flex items-center gap-2">
        <IconButton label="Previous day" onClick={() => setSelectedDate(addDaysToKey(date, -1))}>
          <ChevronLeft size={16} />
        </IconButton>
        <IconButton label="Next day" onClick={() => setSelectedDate(addDaysToKey(date, 1))}>
          <ChevronRight size={16} />
        </IconButton>
        <div className="ml-1 flex items-baseline gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">
            {humanDayLabel(date, todayKey())}
          </h1>
          <span className="text-xs text-faint">{fullDate}</span>
        </div>
        {date !== todayKey() && (
          <button
            type="button"
            onClick={() => setSelectedDate(todayKey())}
            className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            Back to today
          </button>
        )}
      </div>

      <label className="mt-4 flex items-center gap-2">
        <span className="sr-only">Today's intention</span>
        <input
          value={intention}
          onChange={(event) => setIntention(event.target.value)}
          onBlur={saveIntention}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          placeholder="What matters most today?"
          className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
      </label>
    </header>
  );
}
