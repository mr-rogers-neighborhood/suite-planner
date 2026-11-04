import { describe, expect, it } from "vitest";

import { parseCapture } from "./parse";

const today = "2026-01-05";

describe("parseCapture", () => {
  it("should keep a plain title", () => {
    const parsed = parseCapture("Write the plan", today);
    expect(parsed.title).toBe("Write the plan");
    expect(parsed.dateKey).toBeNull();
  });

  it("should read a day, estimate and project", () => {
    const parsed = parseCapture("Draft the plan tomorrow ~45m #Gradient", today);
    expect(parsed.title).toBe("Draft the plan");
    expect(parsed.dateKey).toBe("2026-01-06");
    expect(parsed.estimateMinutes).toBe(45);
    expect(parsed.projectName).toBe("Gradient");
  });

  it("should read hours, tags and priority", () => {
    const parsed = parseCapture("Review backlog @deep-work !1 ~1.5h", today);
    expect(parsed.title).toBe("Review backlog");
    expect(parsed.tagNames).toEqual(["deep-work"]);
    expect(parsed.priority).toBe(1);
    expect(parsed.estimateMinutes).toBe(90);
  });

  it("should resolve a weekday to its next occurrence", () => {
    const parsed = parseCapture("Call Sam friday", today);
    expect(parsed.dateKey).toBe("2026-01-09");
    expect(parsed.title).toBe("Call Sam");
  });

  it("should skip a leading next before a weekday", () => {
    const parsed = parseCapture("Call Sam next friday", today);
    expect(parsed.dateKey).toBe("2026-01-09");
    expect(parsed.title).toBe("Call Sam");
  });

  it("should read a clock time and imply today", () => {
    const parsed = parseCapture("Standup 9:30", today);
    expect(parsed.time).toBe("09:30");
    expect(parsed.dateKey).toBe(today);
    expect(parsed.title).toBe("Standup");
  });

  it("should convert a meridiem time", () => {
    const parsed = parseCapture("Demo 2pm", today);
    expect(parsed.time).toBe("14:00");
  });

  it("should keep unknown tokens in the title", () => {
    const parsed = parseCapture("Fix the 404 page", today);
    expect(parsed.title).toBe("Fix the 404 page");
    expect(parsed.time).toBeNull();
  });

  it("should use the raw input when every token is metadata", () => {
    const parsed = parseCapture("#Gradient", today);
    expect(parsed.title).toBe("#Gradient");
    expect(parsed.projectName).toBe("Gradient");
  });
});
