import { type DateKey, parseCapture, todayKey } from "@suite/planner-core";

import { CornerDownLeft, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useReplica } from "../store/snapshotStore";
import { useUiStore } from "../store/uiStore";
import { resolveProjectId, resolveTagIds } from "./resolve";

export type CaptureTarget = { kind: "day"; dateKey: DateKey } | { kind: "inbox" };

export function CaptureBar({ target }: { target: CaptureTarget }) {
  const replica = useReplica();
  const captureSignal = useUiStore((state) => state.captureSignal);
  const setNotice = useUiStore((state) => state.setNotice);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (captureSignal > 0) inputRef.current?.focus();
  }, [captureSignal]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function submit(): void {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;

    const parsed = parseCapture(
      trimmed,
      todayKey(),
      target.kind === "day" ? { impliedDate: target.dateKey } : {},
    );
    const scheduledFor =
      target.kind === "day" ? (parsed.dateKey ?? target.dateKey) : parsed.dateKey;
    const dueAt =
      parsed.time && scheduledFor
        ? new Date(`${scheduledFor}T${parsed.time}:00`).toISOString()
        : null;

    const doc = replica.document;
    const projectId = parsed.projectName ? resolveProjectId(doc, parsed.projectName) : null;
    const tagIds = resolveTagIds(doc, parsed.tagNames);

    doc.createTask({
      title: parsed.title,
      scheduledFor: scheduledFor ?? null,
      estimateMinutes: parsed.estimateMinutes ?? null,
      projectId,
      tagIds,
      priority: parsed.priority ?? null,
      dueAt,
    });

    setValue("");
    setNotice(`Captured · ${parsed.title}`);
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 transition-colors focus-within:border-accent"
      >
        <Plus size={15} className="shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setValue("");
              event.currentTarget.blur();
            }
          }}
          aria-label="Capture a task"
          placeholder={
            target.kind === "day"
              ? "Add a task for this day — tomorrow ~45m #Planner"
              : "Add to the inbox — friday @deep-work !1"
          }
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-faint sm:block">
          Ctrl N
        </kbd>
        <button
          type="submit"
          aria-label="Add task"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-white"
        >
          <CornerDownLeft size={13} />
        </button>
      </form>
      <p className="mt-1.5 px-1 text-[11px] text-faint">
        <span className="text-muted">tomorrow</span> · <span className="text-muted">~45m</span> ·{" "}
        <span className="text-muted">#project</span> · <span className="text-muted">@tag</span> ·{" "}
        <span className="text-muted">!1</span> · <span className="text-muted">9:30</span>
      </p>
    </div>
  );
}
