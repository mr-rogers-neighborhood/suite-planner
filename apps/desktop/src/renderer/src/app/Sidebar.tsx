import { todayKey } from "@suite/planner-core";
import { Button } from "@suite/ui";
import { Download, Inbox, Sun, Upload } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { getBridge } from "../platform/bridge";
import { useUiStore } from "../store/uiStore";
import { ThemePicker } from "../theme/ThemePicker";
import { PlannerMark } from "./PlannerMark";

export function Sidebar() {
  const view = useUiStore((state) => state.view);
  const setView = useUiStore((state) => state.setView);
  const setSelectedDate = useUiStore((state) => state.setSelectedDate);
  const setNotice = useUiStore((state) => state.setNotice);
  const [workspacePath, setWorkspacePath] = useState<string>("");

  useEffect(() => {
    void getBridge()
      .info()
      .then((info) => setWorkspacePath(info.path))
      .catch(() => setWorkspacePath(""));
  }, []);

  async function exportWorkspace(): Promise<void> {
    try {
      const result = await getBridge().exportWorkspace();
      if (!result.canceled) setNotice(`Exported to ${result.path ?? "your chosen file"}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed");
    }
  }

  async function importWorkspace(): Promise<void> {
    try {
      const result = await getBridge().importWorkspace();
      if (!result.canceled) setNotice("Workspace imported");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed");
    }
  }

  return (
    <aside className="flex w-[228px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <PlannerMark size="sm" />
        <span className="text-[15px] font-semibold tracking-tight">Suite Planner</span>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
        <NavItem
          active={view === "today"}
          icon={<Sun size={15} />}
          label="Today"
          onClick={() => {
            setView("today");
            setSelectedDate(todayKey());
          }}
        />
        <NavItem
          active={view === "inbox"}
          icon={<Inbox size={15} />}
          label="Inbox"
          onClick={() => setView("inbox")}
        />
      </nav>

      <div className="mt-6 px-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Soon</p>
        <ul className="mt-2 space-y-1.5 text-[13px] text-faint">
          <li>Upcoming</li>
          <li>Projects</li>
          <li>Focus</li>
          <li>Rituals</li>
        </ul>
      </div>

      <div className="mt-auto space-y-3 border-t border-line p-4">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => void exportWorkspace()}>
            <Download size={13} />
            Export
          </Button>
          <Button size="sm" className="flex-1" onClick={() => void importWorkspace()}>
            <Upload size={13} />
            Import
          </Button>
        </div>
        <ThemePicker />
        <p className="truncate text-[11px] text-faint" title={workspacePath}>
          {workspacePath || "Local workspace"}
        </p>
      </div>
    </aside>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex items-center gap-2.5 rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-ink"
          : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-raised hover:text-ink"
      }
    >
      {icon}
      {label}
    </button>
  );
}
