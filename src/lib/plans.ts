// The ONE place plan rules live. Shared by server and browser, so nothing
// server-only may be imported here.

export type Tier = "free" | "starter" | "plus" | "unlimited";
export type PaidTier = Exclude<Tier, "free">;

export interface Plan {
  tier: Tier;
  name: string;
  pricePounds: number; // per month
  limit: number; // rewrites per billing month (free: in total)
  unlimited: boolean; // shown to customers as "unlimited"
  blurb: string;
}

// Unlimited carries a generous fair-use cap behind the scenes, so one
// account can never cost more in AI than the plan brings in. Stated in the
// Terms. Change it here only.
export const FAIR_USE_CAP = 500;

export const PLANS: Record<Tier, Plan> = {
  free: {
    tier: "free",
    name: "Free",
    pricePounds: 0,
    limit: 3,
    unlimited: false,
    blurb: "Try it out. No card needed.",
  },
  starter: {
    tier: "starter",
    name: "Starter",
    pricePounds: 7,
    limit: 10,
    unlimited: false,
    blurb: "For the odd tricky message.",
  },
  plus: {
    tier: "plus",
    name: "Plus",
    pricePounds: 15,
    limit: 30,
    unlimited: false,
    blurb: "For busy weeks and difficult people.",
  },
  unlimited: {
    tier: "unlimited",
    name: "Unlimited",
    pricePounds: 20,
    limit: FAIR_USE_CAP,
    unlimited: true,
    blurb: "Say it nicely, every time.",
  },
};

export const PAID_TIERS: PaidTier[] = ["starter", "plus", "unlimited"];

export function isPaidTier(t: unknown): t is PaidTier {
  return t === "starter" || t === "plus" || t === "unlimited";
}

// past_due is a grace period while Stripe retries a failed card.
export function isActiveStatus(s: string | null | undefined): boolean {
  return s === "active" || s === "past_due";
}

export interface UserRow {
  plan: string | null;
  payment_status: string | null;
  period_start: string | null;
}

export interface Entitlement {
  plan: Plan;
  since: Date; // count rewrites made on or after this moment
}

const DAY = 24 * 60 * 60 * 1000;

// Works out what someone can use right now.
// Paid: the plan's limit per billing month. The month starts at the date
// Stripe last renewed; never more than 31 days ago, so a missed webhook can
// never leave a paying customer stuck at their limit.
// Free: 3 rewrites in total.
export function entitlementFor(row: UserRow | null, now = new Date()): Entitlement {
  if (row && isActiveStatus(row.payment_status) && isPaidTier(row.plan)) {
    const floor = new Date(now.getTime() - 31 * DAY);
    const start = row.period_start ? new Date(row.period_start) : floor;
    return { plan: PLANS[row.plan], since: start > floor ? start : floor };
  }
  return { plan: PLANS.free, since: new Date(0) };
}
