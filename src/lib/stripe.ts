import Stripe from "stripe";
import type { PaidTier } from "@/lib/plans";

// Created on first use so a missing key never breaks the build.
let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

// Each plan is a Price created in the Nicelyy Stripe dashboard. Real Price IDs
// (not prices made up at checkout) are what let customers switch plans in
// Stripe's billing portal.
export function priceIdFor(tier: PaidTier): string {
  const id = {
    starter: process.env.STRIPE_PRICE_STARTER,
    plus: process.env.STRIPE_PRICE_PLUS,
    unlimited: process.env.STRIPE_PRICE_UNLIMITED,
  }[tier];
  if (!id) throw new Error(`Stripe price for ${tier} is not set.`);
  return id;
}

export function tierForPrice(priceId: string | null | undefined): PaidTier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PLUS) return "plus";
  if (priceId === process.env.STRIPE_PRICE_UNLIMITED) return "unlimited";
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
