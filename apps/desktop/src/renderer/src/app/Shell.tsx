import { DayCalendar } from "../calendar/DayCalendar";
import { DayView } from "../day/DayView";
import { InboxView } from "../inbox/InboxView";
import { useUiStore } from "../store/uiStore";
import { Sidebar } from "./Sidebar";

export function Shell() {
  const view = useUiStore((state) => state.view);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {view === "today" ? <DayView /> : <InboxView />}
      </div>
      <DayCalendar />
    </div>
  );
}
