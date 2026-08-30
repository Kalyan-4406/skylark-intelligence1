import { expect, test } from "@playwright/test";

test("founder runs pipeline and leadership analyses on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 945 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What does the business need to know?" })).toBeVisible();
  await page.getByRole("button", { name: "How is our pipeline looking this quarter?" }).click();
  await expect(page.getByRole("heading", { name: "Pipeline summary" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: "What does the business need to know?" })).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Data-quality caveats" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data-quality caveats" })).toBeInViewport();
  await expect(page.getByRole("cell", { name: "Construction" })).toHaveCount(0);
  await page.screenshot({ path: "docs/verification/latest-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "New analysis" }).click();
  await page.getByRole("button", { name: "Generate a leadership update" }).click();
  await expect(page.getByRole("heading", { name: "Executive summary" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: "Data-quality caveats" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Ask a business question" })).toBeVisible();
  await page.screenshot({ path: "docs/verification/latest-mobile.png", fullPage: true });
});
