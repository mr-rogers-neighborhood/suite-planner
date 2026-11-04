import type { GradientBridge } from "@gradient/core";

export function getBridge(): GradientBridge {
  const bridge = window.gradient;
  if (!bridge) {
    throw new Error("Gradient must run inside its desktop shell");
  }
  return bridge;
}
