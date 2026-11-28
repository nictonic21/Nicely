import { expect, test, type Page } from "@playwright/test";

// The Meta Pixel must never load without consent (UK PECR / GDPR).
// Runs when the site is built with a pixel ID (CI uses a dummy one).
const PIXEL = "connect.facebook.net";

async function watchPixel(page: Page) {
  const requests: string[] = [];
  await page.route(`**/${PIXEL}/**`, (r) => {
    requests.push(r.request().url());
    return r.fulfill({ body: "", contentType: "application/javascript" });
  });
  return requests;
}

test.describe("cookie consent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const shown = await page
      .getByRole("dialog", { name: "Cookie choices" })
      .waitFor({ timeout: 5000 })
      .then(() => true, () => false);
    test.skip(!shown, "Built without a pixel ID");
  });

  test("nothing loads before a choice, and Reject keeps it that way", async ({ page }) => {
    const requests = await watchPixel(page);
    await page.reload();
    await page.waitForTimeout(500);
    expect(requests).toHaveLength(0);
    expect(await page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe("undefined");
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByRole("dialog", { name: "Cookie choices" })).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(500);
    expect(requests).toHaveLength(0);
    await expect(page.getByRole("dialog", { name: "Cookie choices" })).toHaveCount(0);
  });

  test("Accept loads the pixel with automatic collection off, and settings can reopen", async ({ page }) => {
    const requests = await watchPixel(page);
    await page.reload();
    await page.getByRole("button", { name: "Accept" }).click();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const calls = await page.evaluate(() => ((window as unknown as { fbq: { queue: unknown[][] } }).fbq.queue ?? []).map((c) => Array.from(c as unknown[]).slice(0, 3)));
    expect(calls[0]).toEqual(["set", "autoConfig", false]);
    expect(calls.some((c) => c[0] === "track" && c[1] === "PageView")).toBe(true);
    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(page.getByRole("dialog", { name: "Cookie choices" })).toBeVisible();
  });
});
