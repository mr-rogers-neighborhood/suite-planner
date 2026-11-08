import { Toast as SharedToast } from "@suite/ui";

import { useUiStore } from "../store/uiStore";

/**
 * The app's toast, on the shared one.
 *
 * The store holds a bare string; the shared component wants a notice object, because it has a
 * tone that decides whether a screen reader interrupts. A failure is the only thing that
 * should interrupt, and this app's notices are all informational — so the adapter is a
 * wrapping, not a tone. A failure path can pass one later without changing the store.
 */
export function Toast() {
  const notice = useUiStore((state) => state.notice);
  const setNotice = useUiStore((state) => state.setNotice);

  return (
    <SharedToast
      notice={notice === null ? null : { message: notice }}
      onDismiss={() => setNotice(null)}
    />
  );
}
