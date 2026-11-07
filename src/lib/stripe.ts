import Stripe from "stripe";
import type { Interval, PaidTier } from "@/lib/plans";

// Created on first use so a missing key never breaks the build.
let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

// Each plan is a Price created in the Nicelyy Stripe dashboard. Real Price
// IDs (not prices made up at checkout) are what let customers switch plans in
// Stripe's billing portal. Yearly prices are optional: the yearly option only
// shows once all three are set.
const PRICE_ENV: Record<PaidTier, Record<Interval, string>> = {
  starter: { month: "STRIPE_PRICE_STARTER", year: "STRIPE_PRICE_STARTER_YEARLY" },
  plus: { month: "STRIPE_PRICE_PLUS", year: "STRIPE_PRICE_PLUS_YEARLY" },
  unlimited: { month: "STRIPE_PRICE_UNLIMITED", year: "STRIPE_PRICE_UNLIMITED_YEARLY" },
};

export function yearlyAvailable(): boolean {
  return Object.values(PRICE_ENV).every((p) => !!process.env[p.year]);
}

export function priceIdFor(tier: PaidTier, interval: Interval = "month"): string {
  const id = process.env[PRICE_ENV[tier][interval]];
  if (!id) throw new Error(`Stripe price for ${tier} (${interval}) is not set.`);
  return id;
}

export function tierForPrice(priceId: string | null | undefined): PaidTier | null {
  if (!priceId) return null;
  for (const tier of Object.keys(PRICE_ENV) as PaidTier[]) {
    const ids = PRICE_ENV[tier];
    if (priceId === process.env[ids.month] || priceId === process.env[ids.year]) return tier;
  }
  return null;
}

// Stripe subscription status -> our payment_status.
export function mapStatus(status: Stripe.Subscription.Status): string {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "cancelled";
  return "none";
}

// The current billing month's start. Newer Stripe API versions keep it on
// the subscription item; older ones on the subscription itself.
export function periodStartOf(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as { current_period_start?: number } | undefined;
  const legacy = (sub as unknown as { current_period_start?: number }).current_period_start;
  const secs = item?.current_period_start ?? legacy;
  return typeof secs === "number" ? new Date(secs * 1000).toISOString() : null;
}

export function isLive(sub: Stripe.Subscription): boolean {
  return sub.status !== "canceled" && sub.status !== "incomplete_expired";
}
