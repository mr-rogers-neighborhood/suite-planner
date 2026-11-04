import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

const variants = {
  primary: "bg-accent text-white hover:opacity-90",
  ghost: "bg-raised text-ink hover:bg-line/70 border border-line",
  quiet: "text-muted hover:text-ink hover:bg-raised",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
} as const;

export function Button({ variant = "ghost", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
