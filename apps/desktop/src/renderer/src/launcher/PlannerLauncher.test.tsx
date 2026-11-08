import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlannerLauncher } from "./PlannerLauncher";

const importWorkspace = vi.fn();

// The launcher's only machine dependency is the import dialog. Everything else it renders is
// static, so the fake bridge is deliberately tiny.
vi.mock("../platform/bridge", () => ({
  getBridge: () => ({ importWorkspace }),
}));

vi.mock("../theme/ThemePicker", () => ({
  ThemePicker: () => <div data-testid="theme-picker" />,
}));

afterEach(() => {
  // This workspace runs without globals, so Testing Library cannot register its own cleanup.
  cleanup();
  importWorkspace.mockReset();
});

describe("PlannerLauncher", () => {
  it("says which app this is and where the work goes", () => {
    render(<PlannerLauncher onBegin={() => {}} />);
    expect(screen.getByRole("heading", { level: 1, name: "Suite Planner" })).toBeInTheDocument();
    expect(screen.getByText(/lives in a file on this machine/u)).toBeInTheDocument();
  });

  it("begins on New planner", () => {
    const onBegin = vi.fn();
    render(<PlannerLauncher onBegin={onBegin} />);
    fireEvent.click(screen.getByRole("button", { name: /New planner/u }));
    expect(onBegin).toHaveBeenCalledOnce();
  });

  it("imports a file and does not also open an empty week", async () => {
    const onBegin = vi.fn();
    importWorkspace.mockResolvedValue({ canceled: false });
    render(<PlannerLauncher onBegin={onBegin} />);

    fireEvent.click(screen.getByRole("button", { name: "Import…" }));

    await waitFor(() => expect(onBegin).toHaveBeenCalledOnce());
    expect(importWorkspace).toHaveBeenCalledOnce();
  });

  it("stays put when the import dialog is cancelled", async () => {
    const onBegin = vi.fn();
    importWorkspace.mockResolvedValue({ canceled: true });
    render(<PlannerLauncher onBegin={onBegin} />);

    fireEvent.click(screen.getByRole("button", { name: "Import…" }));

    await waitFor(() => expect(importWorkspace).toHaveBeenCalledOnce());
    expect(onBegin).not.toHaveBeenCalled();
  });

  it("reports a failed import instead of pretending it worked", async () => {
    const onBegin = vi.fn();
    importWorkspace.mockRejectedValue(new Error("That file is not a planner workspace."));
    render(<PlannerLauncher onBegin={onBegin} />);

    fireEvent.click(screen.getByRole("button", { name: "Import…" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That file is not a planner workspace.",
    );
    expect(onBegin).not.toHaveBeenCalled();
  });
});
