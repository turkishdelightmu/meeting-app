import { test, expect } from "@playwright/test";

const TRANSCRIPT =
  "This is a planning meeting transcript discussing owners, decisions, and action items for launch readiness.";

const MOCK_SUCCESS_RESPONSE = {
  ok: true,
  source: "mock",
  result: {
    confidence: "high",
    language: "en",
    summary: [
      { text: "Launch readiness is being tracked with clear action ownership." },
    ],
    decisions: [
      {
        title: "Keep launch date contingent on API readiness",
        status: "confirmed",
        owner: "Sarah",
        effectiveDate: "Immediate",
        evidenceQuote: "We keep the date only if API reliability is stable.",
      },
    ],
    actionItems: [
      {
        title: "Validate API load test results",
        assignee: "Mike",
        assigneeInitial: "M",
        dueDate: "Tomorrow",
        priority: "high",
        done: false,
      },
    ],
    risks: [{ text: "Vendor throughput limits are still uncertain" }],
    openQuestions: [{ text: "What is the final vendor burst limit?" }],
  },
};

test.describe("Step 8 copy, feedback, and instrumentation", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://localhost:3000",
    });

    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto("/meeting-note-cleaner");
    await page.getByPlaceholder("Paste your meeting transcript here to begin processing...").fill(TRANSCRIPT);
    await page.getByText("English", { exact: true }).click();
    await page.getByRole("button", { name: "Generate Notes" }).click();

    await expect(page.getByRole("heading", { name: "Processed Notes" })).toBeVisible();
  });

  test("copy-as-text and copy-as-markdown write expected clipboard output", async ({ page }) => {
    await page.getByRole("button", { name: "Copy as text" }).click();
    await expect(page.getByText("Copied!", { exact: true })).toBeVisible();

    const copiedText = await page.evaluate(async () => navigator.clipboard.readText());
    expect(copiedText).toContain("EXECUTIVE SUMMARY");
    expect(copiedText).toContain("KEY DECISIONS");

    await page.getByRole("button", { name: "Copy as markdown" }).click();
    await expect(page.getByText("Copied!", { exact: true })).toBeVisible();

    const copiedMarkdown = await page.evaluate(async () => navigator.clipboard.readText());
    expect(copiedMarkdown).toContain("## Executive Summary");
    expect(copiedMarkdown).toContain("## Next Steps");
    expect(copiedMarkdown).toContain("- [ ] Validate API load test results");
  });

  test("feedback thumbs toggle state and emit analytics console events", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    const thumbUpButton = page.locator("button:has(span:text('thumb_up'))");
    const thumbDownButton = page.locator("button:has(span:text('thumb_down'))");

    await thumbUpButton.click();
    await expect(thumbUpButton).toHaveClass(/bg-green-100/);

    await thumbUpButton.click();
    await expect(thumbUpButton).not.toHaveClass(/bg-green-100/);

    await thumbDownButton.click();
    await expect(thumbDownButton).toHaveClass(/bg-red-100/);

    await expect.poll(() => logs.some((line) => line.includes("[analytics] feedback_up"))).toBeTruthy();
    await expect.poll(() => logs.some((line) => line.includes("[analytics] feedback_down"))).toBeTruthy();
  });
});
