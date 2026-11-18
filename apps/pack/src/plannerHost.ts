import type { ModuleHost } from "@suite/go";
import type { ExportResult, ImportResult, PlannerBridge, WorkspaceInfo } from "@suite/planner-core";
import { LoroDoc } from "loro-crdt";

/**
 * Planner's bridge, built out of whatever host it is running in.
 *
 * This is the half of the pack that knows Planner, and it lives in Planner's own repository on
 * purpose: `suite-go` installs a signed pack and learns nothing, which is the rule the container
 * exists to keep (`suite-go/docs/reference/contract.md`).
 *
 * The awkward part is ownership. On the desktop, main holds a `LoroDoc`, applies the renderer's
 * updates and writes the file. A pack has no main, so this object is that owner: it holds a replica,
 * applies each update, and writes a snapshot at the boundaries ADR-0005 names — never per keystroke,
 * and never an update written out as if it were a whole document.
 */

export const DOCUMENT_STORAGE_KEY = "planner:document-id";
const DOCUMENT_NAME = "Planner.planner";
const DOCUMENT_TITLE = "Planner";

/** How long edits are coalesced before a write. The same debounce the Scratch module uses. */
const FLUSH_DEBOUNCE_MS = 300;

export interface PlannerHost extends PlannerBridge {
  /** Write now rather than on the debounce. Called when the host releases the module. */
  flush(): Promise<void>;
  /** Release the timers and listeners this object installed. */
  dispose(): void;
}

export function createPlannerHost(host: ModuleHost): PlannerHost {
  let documentId: string | null = null;
  let doc: LoroDoc | null = null;
  let created = false;
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let opening: Promise<void> | null = null;

  const cancelTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  async function flush(): Promise<void> {
    cancelTimer();
    if (!dirty || documentId === null || doc === null) return;
    dirty = false;
    try {
      await host.documents.save(documentId, {
        bytes: doc.export({ mode: "snapshot" }),
        title: DOCUMENT_TITLE,
      });
    } catch (error) {
      // Put the flag back: losing one write is recoverable at the next boundary, forgetting that
      // there was one is not.
      dirty = true;
      throw error;
    }
  }

  function schedule(): void {
    cancelTimer();
    timer = setTimeout(() => {
      timer = null;
      void flush().catch((error: unknown) => {
        console.error("Suite Planner: could not save the document", error);
      });
    }, FLUSH_DEBOUNCE_MS);
  }

  /**
   * A replica for these bytes, or `null` when they are not a document this app can read.
   *
   * Empty means "the app has not written its schema yet". Anything else has to decode: a pack that
   * trusted the first document in a list without checking opened a foreign file in practice — the
   * frame bridge used to ignore the module filter, and the failure surfaced as a Loro decode error.
   */
  function replicaOf(bytes: Uint8Array): LoroDoc | null {
    if (bytes.length === 0) return new LoroDoc();
    try {
      return LoroDoc.fromSnapshot(bytes);
    } catch {
      return null;
    }
  }

  /** Find the document this module opened last time, or make an empty one and remember it. */
  async function open(): Promise<void> {
    const remembered = await host.storage.get(DOCUMENT_STORAGE_KEY);
    if (remembered !== null) {
      const record = await host.documents.open(remembered);
      const replica = record === null ? null : replicaOf(record.bytes);
      if (record !== null && replica !== null) {
        documentId = record.id;
        doc = replica;
        return;
      }
    }

    // A reinstall loses the key-value store but not the files, so the module's own list is the
    // fallback. It is narrowed to this module by the host, and each candidate is checked before it
    // is trusted.
    const existing = await host.documents.list(host.moduleId);
    for (const summary of existing) {
      const record = await host.documents.open(summary.id);
      const replica = record === null ? null : replicaOf(record.bytes);
      if (record !== null && replica !== null) {
        documentId = record.id;
        doc = replica;
        await host.storage.set(DOCUMENT_STORAGE_KEY, record.id);
        return;
      }
    }

    const record = await host.documents.create({ moduleId: host.moduleId, name: DOCUMENT_NAME });
    documentId = record.id;
    doc = new LoroDoc();
    created = true;
    await host.storage.set(DOCUMENT_STORAGE_KEY, record.id);
  }

  function ensure(): Promise<void> {
    opening ??= open();
    return opening;
  }

  const onHidden = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      void flush().catch(() => undefined);
    }
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onHidden);
  }

  return {
    async loadSnapshot() {
      await ensure();
      if (created || doc === null) return null;
      // A snapshot, not an update: the app's `fromSnapshot` needs the schema, and updates after
      // creation do not carry it.
      return doc.export({ mode: "snapshot" });
    },

    async adopt(snapshot: Uint8Array) {
      await ensure();
      if (doc === null) return;
      // The app made the first document. Import rather than replace, so anything already applied
      // to this replica survives.
      doc.import(snapshot);
      dirty = true;
      await flush();
    },

    async commit(update: Uint8Array) {
      await ensure();
      doc?.import(update);
      dirty = true;
      schedule();
    },

    // Nothing replaces the document yet: sync is a later phase, and a listener that never fires is
    // more honest than one the shell believes exists.
    onWorkspaceReplaced() {
      return () => undefined;
    },

    // No notification plugin and no command channel from the shell. Both return an unsubscriber so
    // a caller does not have to special-case a host that cannot deliver either.
    onReminder() {
      return () => undefined;
    },

    onCommand() {
      return () => undefined;
    },

    // Export and import go through the shell's file service, which this pack does not claim yet.
    // Saying "cancelled" is the truth; a silent no-op would look like a broken button.
    async exportWorkspace(): Promise<ExportResult> {
      return { canceled: true };
    },

    async importWorkspace(): Promise<ImportResult> {
      return { canceled: true };
    },

    async info(): Promise<WorkspaceInfo> {
      await ensure();
      const schemaVersion = Number(doc?.getMap("meta").get("schemaVersion") ?? 0);
      return { path: DOCUMENT_NAME, schemaVersion };
    },

    async platform(): Promise<string> {
      return "suite-go";
    },

    flush,

    dispose() {
      cancelTimer();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onHidden);
      }
    },
  };
}
