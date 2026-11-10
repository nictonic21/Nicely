import { describe, expect, it } from "vitest";
import { allowanceStart, entitlementFor, PLANS, PAID_TIERS, FREE_TWEAKS, MONTHLY_TWEAK_CAP, FAIR_USE_CAP } from "@/lib/plans";

const d = (s: string) => new Date(s);

describe("plans", () => {
  it("has the advertised prices and limits", () => {
    expect(PLANS.free.limit).toBe(3);
    expect([PLANS.starter.pricePounds, PLANS.starter.limit]).toEqual([7, 10]);
    expect([PLANS.plus.pricePounds, PLANS.plus.limit]).toEqual([15, 30]);
    expect([PLANS.unlimited.pricePounds, PLANS.unlimited.limit]).toEqual([20, FAIR_USE_CAP]);
    expect(PLANS.unlimited.unlimited).toBe(true);
  });

  it("prices yearly plans at 12 months for the price of 10", () => {
    for (const t of PAID_TIERS) expect(PLANS[t].yearlyPounds).toBe(PLANS[t].pricePounds * 10);
  });

  it("keeps the worst-case Unlimited AI cost under the price", () => {
    // ~2p per AI call (rewrite or tweak), generous upper estimate.
    const worstCasePounds = (FAIR_USE_CAP + MONTHLY_TWEAK_CAP) * 0.02;
    expect(worstCasePounds).toBeLessThan(PLANS.unlimited.pricePounds);
    expect(FREE_TWEAKS).toBe(3);
  });
});

describe("allowanceStart (when messages top up)", () => {
  it("uses the renewal date for a monthly plan", () => {
    expect(allowanceStart(d("2026-11-01T09:00:00Z"), d("2026-11-07T00:00:00Z")).toISOString()).toBe("2026-11-01T09:00:00.000Z");
  });
  it("tops a yearly plan up every month on the start day", () => {
    expect(allowanceStart(d("2025-11-15T00:00:00Z"), d("2026-11-14T23:00:00Z")).toISOString()).toBe("2026-10-15T00:00:00.000Z");
    expect(allowanceStart(d("2025-11-15T00:00:00Z"), d("2026-03-20T00:00:00Z")).toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });
  it("handles start dates on the 31st in short months", () => {
    expect(allowanceStart(d("2026-01-31T10:00:00Z"), d("2026-03-05T00:00:00Z")).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(allowanceStart(d("2026-01-31T10:00:00Z"), d("2026-03-31T11:00:00Z")).toISOString()).toBe("2026-03-31T10:00:00.000Z");
  });
  it("never looks back more than 31 days, even with a missing or odd date", () => {
    const now = d("2026-11-07T00:00:00Z");
    expect(allowanceStart(null, now).toISOString()).toBe("2026-10-07T00:00:00.000Z");
    expect(allowanceStart(d("2027-01-01T00:00:00Z"), now).toISOString()).toBe("2026-10-07T00:00:00.000Z");
  });
});

describe("entitlementFor", () => {
  const now = d("2026-11-07T00:00:00Z");
  it("gives free users 3 messages in total", () => {
    const e = entitlementFor(null, now);
    expect(e.plan.tier).toBe("free");
    expect(e.since.getTime()).toBe(0);
  });
  it("gives active and past-due subscribers their plan", () => {
    for (const status of ["active", "past_due"]) {
      const e = entitlementFor({ plan: "plus", payment_status: status, period_start: "2026-11-01T00:00:00Z" }, now);
      expect(e.plan.tier).toBe("plus");
    }
  });
  it("drops cancelled or unknown plans back to free", () => {
    expect(entitlementFor({ plan: "plus", payment_status: "cancelled", period_start: null }, now).plan.tier).toBe("free");
    expect(entitlementFor({ plan: "gold", payment_status: "active", period_start: null }, now).plan.tier).toBe("free");
  });
});
