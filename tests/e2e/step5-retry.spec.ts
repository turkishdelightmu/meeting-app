import { test, expect } from "@playwright/test";

const LONG_TRANSCRIPT =
  "This is a planning meeting transcript where we discuss product launch timeline, owners, action items, risks, and follow-ups. ".repeat(
    3
  );

test.describe("Step 5 retry-once behavior", () => {
  test("auto-retries once, then succeeds", async ({ page }) => {
    const testId = `step5-pass-${Date.now()}`;

    await page.route("**/api/generate", async (route) => {
      const headers = {
        ...route.request().headers(),
        "x-step5-test-mode": "fail_once_then_pass",
        "x-step5-test-id": testId,
      };
      await route.continue({ headers });
    });

    await page.goto("/meeting-note-cleaner");
    await page.getByPlaceholder("Paste your meeting transcript here to begin processing...").fill(LONG_TRANSCRIPT);
    await page.getByRole("button", { name: "Generate Notes" }).click();

    await expect(page.getByRole("heading", { name: "Processed Notes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Validation Error" })).toHaveCount(0);
  });

  test("shows validation error after two invalid responses", async ({ page }) => {
    const testId = `step5-fail-${Date.now()}`;

    await page.route("**/api/generate", async (route) => {
      const headers = {
        ...route.request().headers(),
        "x-step5-test-mode": "fail_twice",
        "x-step5-test-id": testId,
      };
      await route.continue({ headers });
    });

    await page.goto("/meeting-note-cleaner");
    await page.getByPlaceholder("Paste your meeting transcript here to begin processing...").fill(LONG_TRANSCRIPT);
    await page.getByRole("button", { name: "Generate Notes" }).click();

    await expect(page.getByRole("heading", { name: "Validation Error" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  });
});
