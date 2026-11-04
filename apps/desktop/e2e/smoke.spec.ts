import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { _electron as electron, expect, test } from "@playwright/test";

test("captures a task and restores it after relaunch", async () => {
  const userData = await mkdtemp(join(tmpdir(), "suite-planner-e2e-"));

  const launch = () =>
    electron.launch({
      args: [process.cwd(), "--no-sandbox"],
      env: {
        ...process.env,
        SUITE_PLANNER_USER_DATA: userData,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "1",
      },
    });

  const app = await launch();
  const page = await app.firstWindow();
  await page.getByLabel("Capture a task").fill("Smoke test task ~20m");
  await page.getByLabel("Capture a task").press("Enter");
  await expect(page.getByRole("button", { name: "Smoke test task", exact: true })).toBeVisible();
  await app.close();

  const relaunched = await launch();
  const restored = await relaunched.firstWindow();
  await expect(
    restored.getByRole("button", { name: "Smoke test task", exact: true }),
  ).toBeVisible();
  await relaunched.close();
});
