import type { PlannerBridge } from "@suite/planner-core";

declare global {
  interface Window {
    suitePlanner?: PlannerBridge;
  }
}
