import { WorkspaceDocument, type WorkspaceSnapshot } from "@suite/planner-core";
import { createContext, useContext, useSyncExternalStore } from "react";

import { getBridge } from "../platform/bridge";

/**
 * The renderer's replica of the document. This file owns the single `observe` call site: edits are
 * merged locally, forwarded to main as CRDT updates, and the UI reads a rebuilt snapshot.
 */
export class DocumentReplica {
  #doc: WorkspaceDocument;
  #snapshot: WorkspaceSnapshot;
  #listeners = new Set<() => void>();
  #detach: () => void;

  constructor(doc: WorkspaceDocument) {
    this.#doc = doc;
    this.#snapshot = doc.getSnapshot();
    this.#detach = this.watch();
  }

  get document(): WorkspaceDocument {
    return this.#doc;
  }

  getSnapshot = (): WorkspaceSnapshot => this.#snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  refresh(): void {
    this.#snapshot = this.#doc.getSnapshot();
    for (const listener of this.#listeners) listener();
  }

  replace(bytes: Uint8Array): void {
    this.#detach();
    this.#doc = WorkspaceDocument.fromSnapshot(bytes);
    this.#detach = this.watch();
    this.refresh();
  }

  dispose(): void {
    this.#detach();
    this.#listeners.clear();
  }

  private watch(): () => void {
    return this.#doc.observe((update) => {
      void getBridge()
        .commit(update)
        .catch((error: unknown) =>
          console.error("Suite Planner: could not commit an update", error),
        );
      this.refresh();
    });
  }
}

export const WorkspaceContext = createContext<DocumentReplica | null>(null);

export async function bootDocument(): Promise<{
  replica: DocumentReplica;
  created: boolean;
}> {
  const bridge = getBridge();
  const bytes = await bridge.loadSnapshot();
  const replica = new DocumentReplica(WorkspaceDocument.fromSnapshot(bytes));
  bridge.onWorkspaceReplaced((snapshot) => replica.replace(snapshot));
  return { replica, created: await bridge.wasCreated() };
}

export function useReplica(): DocumentReplica {
  const replica = useContext(WorkspaceContext);
  if (!replica) throw new Error("useReplica must be used inside WorkspaceContext");
  return replica;
}

export function useWorkspaceSnapshot(): WorkspaceSnapshot {
  const replica = useReplica();
  return useSyncExternalStore(replica.subscribe, replica.getSnapshot, replica.getSnapshot);
}
