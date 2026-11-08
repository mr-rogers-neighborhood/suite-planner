import { todayKey } from "@suite/planner-core";
import { useEffect, useState } from "react";
import { Shell } from "./app/Shell";
import { Toast } from "./app/Toast";
import { PlannerLauncher } from "./launcher/PlannerLauncher";
import { getBridge } from "./platform/bridge";
import { type DocumentReplica, WorkspaceContext } from "./store/snapshotStore";
import { useUiStore } from "./store/uiStore";

export function App({ replica, created }: { replica: DocumentReplica; created: boolean }) {
  const setNotice = useUiStore((state) => state.setNotice);
  const focusCapture = useUiStore((state) => state.focusCapture);
  const setView = useUiStore((state) => state.setView);
  const setSelectedDate = useUiStore((state) => state.setSelectedDate);
  // Only the run that invented the workspace starts here; dismissing is for this session only.
  const [begun, setBegun] = useState(!created);

  useEffect(() => {
    const bridge = getBridge();
    const offCommand = bridge.onCommand((command) => {
      if (command === "capture") focusCapture();
      if (command === "today") {
        setView("today");
        setSelectedDate(todayKey());
      }
      if (command === "inbox") setView("inbox");
    });
    const offReminder = bridge.onReminder((reminder) => {
      setNotice(`Reminder · ${reminder.title}`);
    });

    return () => {
      offCommand();
      offReminder();
    };
  }, [focusCapture, setNotice, setSelectedDate, setView]);

  return (
    <WorkspaceContext.Provider value={replica}>
      {begun ? <Shell /> : <PlannerLauncher onBegin={() => setBegun(true)} />}
      <Toast />
    </WorkspaceContext.Provider>
  );
}
