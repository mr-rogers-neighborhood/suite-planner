import { applyTheme, DEFAULT_THEME_ID, PRESETS, presetById, type SuiteTheme } from "@suite/theme";

/**
 * Which preset and which mode this window draws.
 *
 * Two independent choices, the same pair Canvas and Start use: a **preset** is a palette
 * family, a **mode** is how bright to draw it. Stored in `localStorage` because both are
 * device preferences — they change how this screen draws, never what a collaborator sees.
 *
 * The values reach CSS as `var(--role)`, and this app's stylesheet points its own Tailwind
 * names at those roles, so a preset repaints every component without one of them knowing.
 */
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeChoice {
  readonly preset: string;
  readonly mode: ThemeMode;
}

export const THEME_STORAGE_KEY = "suite.theme";

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/** The preset a stored id names, or the default when it names one this build does not ship. */
export function presetFor(id: unknown): string {
  return typeof id === "string" && presetById(id) !== null ? id : DEFAULT_THEME_ID;
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}

/** Read the stored choice, tolerating a partial or hand-edited record. */
export function readStoredTheme(storage: Pick<Storage, "getItem"> | undefined): ThemeChoice {
  const fallback: ThemeChoice = { preset: DEFAULT_THEME_ID, mode: "system" };
  const stored = storage?.getItem(THEME_STORAGE_KEY);
  if (stored === null || stored === undefined) return fallback;
  if (isThemeMode(stored)) return { preset: DEFAULT_THEME_ID, mode: stored };
  try {
    const parsed = JSON.parse(stored) as { preset?: unknown; mode?: unknown };
    return {
      preset: presetFor(parsed.preset),
      mode: isThemeMode(parsed.mode) ? parsed.mode : "system",
    };
  } catch {
    return fallback;
  }
}

/** The presets, for a picker. */
export function themeOptions(): readonly SuiteTheme[] {
  return PRESETS;
}

/**
 * Paint a preset onto the document.
 *
 * `data-theme` carries the preset id and `data-theme-mode` the resolved mode, so a rule that
 * wants to know which family is on can ask, and no rule ever has to ask whether "system" is
 * dark today.
 */
function paintTheme(choice: ThemeChoice, mode: ResolvedTheme): void {
  const preset = presetById(choice.preset) ?? presetById(DEFAULT_THEME_ID);
  if (preset !== null) applyTheme(preset, mode, document.documentElement);
  document.documentElement.dataset.theme = choice.preset;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.mode = mode;
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;
}

/**
 * Apply the stored choice and keep "system" in step with the desktop.
 *
 * Returns a cleanup, so a test can restore the listener.
 */
export function initTheme(): () => void {
  const choice = readStoredTheme(typeof window === "undefined" ? undefined : window.localStorage);
  paintTheme(choice, resolveTheme(choice.mode, prefersDark()));

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const now = readStoredTheme(window.localStorage);
    if (now.mode === "system") paintTheme(now, resolveTheme("system", media.matches));
  };
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Store a choice and repaint. The one place a preference is written. */
export function setThemeChoice(choice: ThemeChoice): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(choice));
  paintTheme(choice, resolveTheme(choice.mode, prefersDark()));
}
