import { Button, Launch, PrivacyLine } from "@suite/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PlannerMark } from "../app/PlannerMark";
import { getBridge } from "../platform/bridge";
import { ThemePicker } from "../theme/ThemePicker";

/**
 * The screen a person lands on the first time, when there is no workspace file yet.
 *
 * Planner used to skip straight into an empty document, which answers a question nobody had
 * asked yet: the first thing a new user saw was a blank week with no way to tell whether their
 * work would be kept, or where.
 *
 * It appears only when the main process reports that it created the workspace this session, so
 * every later launch goes straight to the document. That check lives in the main process because
 * only it knows whether a file was read or invented.
 */
export function PlannerLauncher({ onBegin }: { onBegin: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function importWorkspace(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const result = await getBridge().importWorkspace();
      if (!result.canceled) onBegin();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not import that file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <Launch
        mark={<PlannerMark size="md" />}
        title="Suite Planner"
        tagline="A planner that lives in a file on this machine."
        hint="Start with an empty week, or open a planner file you already have."
        actions={
          <Button variant="primary" onClick={onBegin} disabled={busy}>
            <Plus size={14} />
            New planner
          </Button>
        }
        importOptions={[
          {
            label: "Planner file",
            detail: "A .planner file from anywhere",
            onSelect: () => void importWorkspace(),
          },
        ]}
        notice={
          error === null ? null : (
            <p
              role="alert"
              className="mb-3 rounded-lg bg-[var(--danger)] px-3 py-2 text-[12px] text-[var(--on-danger)]"
            >
              {error}
            </p>
          )
        }
        footer={
          <>
            <div className="w-[190px]">
              <ThemePicker />
            </div>
            <PrivacyLine />
          </>
        }
      />
    </div>
  );
}
