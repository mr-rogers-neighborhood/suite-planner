import { createFrameHost } from "@suite/go";
import { createPlannerHost } from "./plannerHost";

/**
 * The pack's prelude.
 *
 * Two jobs, in this order, and the order is the whole file: build the bridge the renderer expects,
 * then import the renderer. `main.tsx` runs `bootDocument()` at import time, and `getBridge()`
 * throws if `window.suitePlanner` is not there yet.
 *
 * Nothing here is Planner-specific beyond the module id — the adapter next door is where the domain
 * knowledge lives, which is why this file is nine lines of wiring and not a second app.
 */

const host = createFrameHost({ moduleId: "planner" });
const bridge = createPlannerHost(host);

window.suitePlanner = bridge;

// `pagehide` fires on a navigation away as well as on close, and on a phone it is the last reliable
// moment. `dispose` alone would leave the tail of an edit in memory (ADR-0005).
window.addEventListener("pagehide", () => {
  void bridge.flush().catch(() => undefined);
  bridge.dispose();
});

await import("../../desktop/src/renderer/src/main");
