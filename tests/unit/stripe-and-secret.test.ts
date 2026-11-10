import { describe, expect, it } from "vitest";

Object.assign(process.env, {
  STRIPE_PRICE_STARTER: "price_s",
  STRIPE_PRICE_PLUS: "price_p",
  STRIPE_PRICE_UNLIMITED: "price_u",
  STRIPE_PRICE_STARTER_YEARLY: "price_sy",
  STRIPE_PRICE_PLUS_YEARLY: "price_py",
  NICELYY_SECRET: "a-test-secret-that-is-long-enough",
});
const { tierForPrice, priceIdFor, yearlyAvailable, mapStatus, periodStartOf } = await import("@/lib/stripe");
const { sign, verify } = await import("@/lib/secret");

describe("stripe helpers", () => {
  it("maps monthly and yearly prices to the right plan", () => {
    expect(tierForPrice("price_s")).toBe("starter");
    expect(tierForPrice("price_py")).toBe("plus");
    expect(tierForPrice("price_u")).toBe("unlimited");
    expect(tierForPrice("price_unknown")).toBeNull();
    expect(priceIdFor("plus", "year")).toBe("price_py");
  });
  it("only offers yearly once all three yearly prices exist", () => {
    expect(yearlyAvailable()).toBe(false);
    process.env.STRIPE_PRICE_UNLIMITED_YEARLY = "price_uy";
    expect(yearlyAvailable()).toBe(true);
  });
  it("maps Stripe statuses", () => {
    expect(mapStatus("active")).toBe("active");
    expect(mapStatus("trialing")).toBe("active");
    expect(mapStatus("past_due")).toBe("past_due");
    expect(mapStatus("canceled")).toBe("cancelled");
    expect(mapStatus("incomplete")).toBe("none");
  });
  it("reads the billing period start from either place Stripe keeps it", () => {
    const iso = "2026-11-01T00:00:00.000Z";
    const secs = Date.parse(iso) / 1000;
    expect(periodStartOf({ items: { data: [{ current_period_start: secs }] } } as never)).toBe(iso);
    expect(periodStartOf({ items: { data: [{}] }, current_period_start: secs } as never)).toBe(iso);
  });
});

describe("signed links", () => {
  it("verifies its own signatures and rejects tampering", () => {
    const sig = sign("unsub:user-1");
    expect(verify("unsub:user-1", sig)).toBe(true);
    expect(verify("unsub:user-2", sig)).toBe(false);
    expect(verify("unsub:user-1", sig.slice(0, -2) + "xx")).toBe(false);
  });
});
