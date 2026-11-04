import type { PlannerBridge } from "@suite/planner-core";

export function getBridge(): PlannerBridge {
  const bridge = window.suitePlanner;
  if (!bridge) {
    throw new Error("Suite Planner must run inside its desktop shell");
  }
  return bridge;
}
