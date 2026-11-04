import { type CalendarEvent, fromDateKey, todayKey } from "@gradient/core";
import { useEffect, useState } from "react";

import { useWorkspaceSnapshot } from "../store/snapshotStore";
import { useUiStore } from "../store/uiStore";

const START_HOUR = 7;
const END_HOUR = 21;
const DAY_START = START_HOUR * 60;
const DAY_END = END_HOUR * 60;

export function DayCalendar() {
  const snapshot = useWorkspaceSnapshot();
  const date = useUiStore((state) => state.selectedDate);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const events = snapshot.events.filter((event) => event.dateKey === date);
  const isToday = date === todayKey();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow = isToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END;

  const label = fromDateKey(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <aside
      className="hidden w-[326px] shrink-0 flex-col border-l border-line bg-panel lg:flex"
      aria-label="Calendar"
    >
      <header className="border-b border-line px-5 pb-4 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Calendar</h2>
          <span className="text-[11px] text-faint">{label}</span>
        </div>
        <p className="mt-1 text-[11px] text-faint">Local events only · no account</p>
      </header>

      <div className="relative flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-[38px_1fr] gap-x-2">
          <div className="relative">
            {hours().map((hour) => (
              <div key={hour} className="h-14 text-right text-[10px] text-faint">
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="relative">
            {hours().map((hour) => (
              <div key={hour} className="h-14 border-t border-line/70" />
            ))}

            {showNow && (
              <div
                className="pointer-events-none absolute inset-x-0 flex items-center"
                style={{ top: `${percentOf(nowMinutes)}%` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                <span className="h-px flex-1 bg-danger/70" />
              </div>
            )}

            {events.map((event) => (
              <EventBlock key={event.id} event={event} />
            ))}

            {events.length === 0 && (
              <div className="absolute inset-x-0 top-24 text-center">
                <p className="text-xs text-faint">No events today.</p>
                <p className="mt-1 text-[11px] text-faint/80">
                  Gradient keeps its calendar on this machine.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function EventBlock({ event }: { event: CalendarEvent }) {
  const top = Math.max(0, percentOf(minutesOf(event.startTime)));
  const bottom = Math.min(100, percentOf(minutesOf(event.endTime)));
  const height = Math.max(3, bottom - top);

  return (
    <div
      className="absolute inset-x-0 overflow-hidden rounded-lg border border-accent/40 bg-accent-soft px-2 py-1.5"
      style={{ top: `${top}%`, height: `${height}%` }}
    >
      <p className="truncate text-[11px] font-medium text-ink">{event.title}</p>
      <p className="text-[10px] text-muted">
        {event.startTime}–{event.endTime}
      </p>
    </div>
  );
}

function hours(): number[] {
  return Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
}

function minutesOf(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

function percentOf(minutes: number): number {
  return ((minutes - DAY_START) / (DAY_END - DAY_START)) * 100;
}
