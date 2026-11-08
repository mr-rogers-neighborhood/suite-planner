import { DEFAULT_THEME_ID } from "@suite/theme";
import { describe, expect, it } from "vitest";
import { presetFor, readStoredTheme, resolveTheme, THEME_STORAGE_KEY } from "./theme";

describe("resolveTheme", () => {
  it("resolves system against the desktop", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("takes a chosen mode as given, whatever the desktop says", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("presetFor", () => {
  it("keeps a preset this build ships", () => {
    expect(presetFor("solarized")).toBe("solarized");
  });

  it("falls back for one it does not, rather than drawing nothing", () => {
    expect(presetFor("some-future-theme")).toBe(DEFAULT_THEME_ID);
    expect(presetFor(null)).toBe(DEFAULT_THEME_ID);
  });
});

describe("readStoredTheme", () => {
  it("follows the desktop with the default preset when nothing is stored", () => {
    expect(readStoredTheme({ getItem: () => null })).toEqual({
      preset: DEFAULT_THEME_ID,
      mode: "system",
    });
    expect(readStoredTheme(undefined)).toEqual({ preset: DEFAULT_THEME_ID, mode: "system" });
  });

  it("reads the pair a choice is stored as", () => {
    const storage = {
      getItem: (key: string) =>
        key === THEME_STORAGE_KEY ? JSON.stringify({ preset: "logseq", mode: "dark" }) : null,
    };
    expect(readStoredTheme(storage)).toEqual({ preset: "logseq", mode: "dark" });
  });

  it("keeps a mode written before presets existed", () => {
    // The record used to be a bare string. Someone who chose dark should not lose it
    // because the file grew a field.
    expect(readStoredTheme({ getItem: () => "dark" })).toEqual({
      preset: DEFAULT_THEME_ID,
      mode: "dark",
    });
  });

  it("answers the default for a record it cannot parse", () => {
    expect(readStoredTheme({ getItem: () => "not json" })).toEqual({
      preset: DEFAULT_THEME_ID,
      mode: "system",
    });
  });
});
