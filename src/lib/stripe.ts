import Stripe from "stripe";
import type { Interval, PaidTier } from "@/lib/plans";

// Created on first use so a missing key never breaks the build.
let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  // The fetch-based client works the same on Vercel and in restricted
  // networks (it honours proxy settings), unlike Node's default client.
  if (!stripe) stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
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

// Monthly recurring revenue straight from Stripe (the source of truth), for
// the owner dashboard. Yearly plans count as a twelfth per month. Prices are
// VAT-inclusive, so this is the amount customers pay, before Stripe's fees.
export async function getRevenue(): Promise<{ mrrPence: number; subscriptions: number; yearly: number } | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  let mrr = 0;
  let subscriptions = 0;
  let yearly = 0;
  for (const status of ["active", "past_due"] as const) {
    for await (const sub of getStripe().subscriptions.list({ status, limit: 100 })) {
      subscriptions++;
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = (price.unit_amount ?? 0) * (item.quantity ?? 1);
        const every = price.recurring?.interval_count ?? 1;
        if (price.recurring?.interval === "year") {
          yearly++;
          mrr += amount / (12 * every);
        } else if (price.recurring?.interval === "month") {
          mrr += amount / every;
        }
      }
      if (subscriptions >= 5000) break;
    }
  }
  return { mrrPence: Math.round(mrr), subscriptions, yearly };
}

// The billing page settings made by scripts/stripe-setup.mjs (change plan,
// update card, invoices, cancel). Falls back to the account's default
// settings if not set.
export function portalOptions(): { configuration?: string } {
  const id = process.env.STRIPE_PORTAL_CONFIGURATION;
  return id ? { configuration: id } : {};
}

// Whether a saved customer exists in the Stripe account the site uses now.
// A customer saved from another account or mode (test data from before going
// live, say) doesn't, and must be forgotten rather than breaking checkout.
export async function customerExists(stripe: Stripe, customerId: string): Promise<boolean> {
  try {
    const c = await stripe.customers.retrieve(customerId);
    return !("deleted" in c && c.deleted);
  } catch (err) {
    const code = (err as { code?: string; statusCode?: number }).code;
    const status = (err as { statusCode?: number }).statusCode;
    if (code === "resource_missing" || status === 404) return false;
    throw err;
  }
}

// Clears a person's Stripe link and plan when their saved customer belongs to
// another Stripe account (e.g. the test sandbox). Only clears if the row still
// points at that same customer.
export const STALE_CUSTOMER_RESET = {
  stripe_customer_id: null,
  stripe_subscription_id: null,
  plan: null,
  payment_status: "none",
  period_start: null,
} as const;
