import type { PlannerBridge } from "@suite/planner-core";

/**
 * The global the prelude installs before importing the renderer.
 *
 * Duplicated from the desktop renderer's declaration on purpose: this app is a different build with
 * a different `include`, and a type that only exists in the other one would make this file compile
 * here and nowhere else.
 */
declare global {
  interface Window {
    suitePlanner?: PlannerBridge;
  }
}
