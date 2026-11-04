import type { GradientBridge } from "@gradient/core";

declare global {
  interface Window {
    gradient?: GradientBridge;
  }
}
