import { type Capacity, formatDuration } from "@gradient/core";

export function capacityLabel(capacity: Capacity): string {
  if (capacity.state === "empty") {
    return `${formatDuration(capacity.availableMinutes)} available`;
  }
  if (capacity.state === "over") {
    return `${formatDuration(Math.abs(capacity.remainingMinutes))} over capacity`;
  }
  return `${formatDuration(capacity.plannedMinutes)} planned · ${formatDuration(capacity.remainingMinutes)} left`;
}

export function CapacityMeter({ capacity }: { capacity: Capacity }) {
  const width = Math.min(100, Math.round(capacity.ratio * 100));
  const bar =
    capacity.state === "over" ? "bg-danger" : capacity.state === "tight" ? "bg-warn" : "bg-accent";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted">{capacityLabel(capacity)}</span>
        <span className="text-faint">{formatDuration(capacity.availableMinutes)} day</span>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: a styled meter is not consistently stylable in Chromium; the role and values carry the semantics */}
      <div
        role="meter"
        aria-label="Planned time against daily capacity"
        aria-valuemin={0}
        aria-valuemax={capacity.availableMinutes}
        aria-valuenow={Math.min(capacity.plannedMinutes, capacity.availableMinutes)}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised"
      >
        <div
          className={`h-full rounded-full transition-[width] ${bar}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
