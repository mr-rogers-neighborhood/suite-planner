import type { Task } from "../schema";

export type CapacityState = "empty" | "comfortable" | "tight" | "over";

export type Capacity = {
  plannedMinutes: number;
  availableMinutes: number;
  remainingMinutes: number;
  ratio: number;
  state: CapacityState;
};

const TIGHT_RATIO = 0.8;

export function capacityFor(
  tasks: readonly Task[],
  availableMinutes: number,
  defaultEstimateMinutes: number,
): Capacity {
  const plannedMinutes = tasks.reduce(
    (total, task) => total + (task.estimateMinutes ?? defaultEstimateMinutes),
    0,
  );
  const remainingMinutes = availableMinutes - plannedMinutes;
  const ratio =
    availableMinutes > 0 ? plannedMinutes / availableMinutes : plannedMinutes > 0 ? 2 : 0;

  let state: CapacityState = "empty";
  if (plannedMinutes > 0 && plannedMinutes > availableMinutes) state = "over";
  else if (plannedMinutes > 0 && ratio >= TIGHT_RATIO) state = "tight";
  else if (plannedMinutes > 0) state = "comfortable";

  return { plannedMinutes, availableMinutes, remainingMinutes, ratio, state };
}
