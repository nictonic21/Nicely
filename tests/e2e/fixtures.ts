import type { Page } from "@playwright/test";

export const versions = [
  { label: "Balanced", message: "I'd like to talk about this morning's meeting." },
  { label: "Short and direct", message: "Can we talk about this morning?" },
  { label: "Warmer opening", message: "I know this week has been a lot for everyone." },
];

// Pretend server answers, so tests never call the AI, Supabase or Stripe.
export async function mockApi(page: Page, opts: { used?: number; limit?: number } = {}) {
  const calls: Record<string, unknown[]> = { rewrite: [], refine: [], feedback: [], try: [] };
  const me = { signedIn: true, email: "you@example.com", tier: "plus", planName: "Plus", used: opts.used ?? 3, limit: opts.limit ?? 30, unlimited: false, hasBilling: true, periodStart: "2026-11-01T00:00:00Z", yearlyAvailable: false, emailOptOut: false };
  await page.route("**/api/me", (r) => r.fulfill({ json: me }));
  await page.route("**/api/rewrite", (r) => {
    calls.rewrite.push(r.request().postDataJSON());
    if ((opts.used ?? 3) >= (opts.limit ?? 30)) return r.fulfill({ status: 402, json: { error: "limit" } });
    return r.fulfill({ json: { versions, subject: "", tip: "Calm and clear.", safety: "none", rewriteId: "r1", tweaksLeft: 3, usage: { used: (opts.used ?? 3) + 1, limit: 30 } } });
  });
  await page.route("**/api/refine", (r) => {
    calls.refine.push(r.request().postDataJSON());
    return r.fulfill({ json: { versions: [{ label: "Shorter", message: "Can we talk?" }], subject: "", tip: "Short.", safety: "none", rewriteId: "r1", tweaksLeft: 2 } });
  });
  await page.route("**/api/feedback", (r) => {
    calls.feedback.push(r.request().postDataJSON());
    return r.fulfill({ json: { saved: true } });
  });
  await page.route("**/api/try", (r) => {
    calls.try.push(r.request().postDataJSON());
    return r.fulfill({ json: { versions, subject: "", tip: "Clear.", safety: "none" } });
  });
  return calls;
}
