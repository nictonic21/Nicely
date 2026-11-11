import { expect, test } from "@playwright/test";
import { mockApi, versions } from "./fixtures";

test("home page shows the slogan, free try and pricing", async ({ page }) => {
  const calls = await mockApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Say it");
  await expect(page.getByText("£7", { exact: true })).toBeVisible();

  await page.getByText("Use this example").click();
  await page.locator("#try").getByRole("button", { name: /Say it nicelyy/ }).click();
  await expect(page.getByText("Like it? There's more.")).toBeVisible();
  await expect(page.locator("#try").getByText(versions[0].message)).toBeVisible();
  expect(calls.try).toHaveLength(1);
});

test("app: write, pick a version, tweak, rate, and find it in history", async ({ page }) => {
  const calls = await mockApi(page);
  await page.goto("/app");
  await page.fill("#text", "you called me out in front of everyone");
  await page.getByRole("button", { name: /Kind/ }).click();
  await page.getByRole("button", { name: "Say it nicelyy" }).click();

  await expect(page.getByText("Ready to send", { exact: true })).toBeVisible();
  expect(calls.rewrite[0]).toMatchObject({ tone: "kind", recipient: "work", format: "text" });

  await page.getByRole("tab", { name: /Option 2/ }).click();
  await expect(page.getByText(versions[1].message)).toBeVisible();

  await page.getByRole("button", { name: "Shorter" }).click();
  await expect(page.getByText("Can we talk?")).toBeVisible();
  await expect(page.getByText("2 free left")).toBeVisible();
  expect(calls.refine[0]).toMatchObject({ rewriteId: "r1", tweak: "shorter", current: versions[1].message });

  await page.getByRole("button", { name: "Not helpful" }).click();
  await page.getByRole("button", { name: "Too long" }).click();
  await expect.poll(() => calls.feedback.at(-1)).toMatchObject({ rating: -1, reason: "too_long" });

  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me/);

  await page.goto("/app/history");
  await expect(page.getByText("Can we talk?")).toBeVisible();

  // Their tone choice is remembered next time.
  await page.goto("/app");
  await expect(page.getByRole("button", { name: /Kind/ })).toHaveAttribute("aria-pressed", "true");
});

test("app: shows the upgrade card when messages run out", async ({ page }) => {
  await mockApi(page, { used: 30, limit: 30 });
  await page.goto("/app");
  await page.fill("#text", "hello");
  await page.getByRole("button", { name: "Say it nicelyy" }).click();
  await expect(page.getByText("You've used this month's messages")).toBeVisible();
});

test("help, terms and privacy pages load", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: /How can we/ })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByText("You must be 18 or over")).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByText("we don't keep what you write", { exact: false })).toBeVisible();
});

test("the owner dashboard is hidden from everyone else", async ({ page }) => {
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("no page scrolls sideways", async ({ page }) => {
  await mockApi(page);
  for (const path of ["/", "/app", "/help", "/login", "/signup", "/terms"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, path).toBe(false);
  }
});

test("sign-up and log-in explain clearly when accounts aren't switched on yet", async ({ page }) => {
  // The test build has no account keys, like a fresh deploy before setup.
  for (const path of ["/signup", "/login"]) {
    await page.goto(path);
    await expect(page.getByText("Accounts aren't open yet")).toBeVisible();
    await expect(page.locator("form button[type=submit]")).toBeDisabled();
  }
});
