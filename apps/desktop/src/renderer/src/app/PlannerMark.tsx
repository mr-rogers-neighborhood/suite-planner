import { AppMark } from "@suite/ui";

/**
 * The Suite Planner mark: this app's glyph on the suite's accent tile.
 *
 * Drawn at 36 rather than 24, which is why `AppMark` takes a `viewBox` instead of assuming
 * one size. The glyph used to be a CSS gradient square, because the real artwork is
 * `fill="#fff"` and would have been invisible on a light page.
 */
const VIEW_BOX = "0 0 36 36";

const GLYPH = [
  "M10 18c0-1.3-.8-2.4-2-2.8v-3.4c1.2-.4 2-1.5 2-2.8c0-1.7-1.3-3-3-3S4 7.3 4 9c0 1.3.8 2.4 2 2.8v3.4c-1.2.4-2 1.5-2 2.8s.8 2.4 2 2.8v3.4c-1.2.4-2 1.5-2 2.8c0 1.7 1.3 3 3 3s3-1.3 3-3c0-1.3-.8-2.4-2-2.8v-3.4c1.2-.4 2-1.5 2-2.8m21-8H15c-.6 0-1-.4-1-1s.4-1 1-1h16c.6 0 1 .4 1 1s-.4 1-1 1m0 9H15c-.6 0-1-.4-1-1s.4-1 1-1h16c.6 0 1 .4 1 1s-.4 1-1 1m0 9H15c-.6 0-1-.4-1-1s.4-1 1-1h16c.6 0 1 .4 1 1s-.4 1-1 1",
];

export function PlannerMark({
  label,
  size,
  className,
}: {
  readonly label?: string;
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
}) {
  return (
    <AppMark
      viewBox={VIEW_BOX}
      paths={GLYPH}
      {...(label === undefined ? {} : { label })}
      {...(size === undefined ? {} : { size })}
      {...(className === undefined ? {} : { className })}
    />
  );
}
