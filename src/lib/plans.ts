// The ONE place plan rules live. Shared by server and browser, so nothing
// server-only may be imported here.

export type Tier = "free" | "starter" | "plus" | "unlimited";
export type PaidTier = Exclude<Tier, "free">;

export type Interval = "month" | "year";

export interface Plan {
  tier: Tier;
  name: string;
  pricePounds: number; // per month
  yearlyPounds: number; // per year: 12 months for the price of 10
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
    yearlyPounds: 0,
    name: "Free",
    pricePounds: 0,
    limit: 3,
    unlimited: false,
    blurb: "Try it out. No card needed.",
  },
  starter: {
    tier: "starter",
    yearlyPounds: 70,
    name: "Starter",
    pricePounds: 7,
    limit: 10,
    unlimited: false,
    blurb: "For the odd tricky message.",
  },
  plus: {
    tier: "plus",
    yearlyPounds: 150,
    name: "Plus",
    pricePounds: 15,
    limit: 30,
    unlimited: false,
    blurb: "For busy weeks and difficult people.",
  },
  unlimited: {
    tier: "unlimited",
    yearlyPounds: 200,
    name: "Unlimited",
    pricePounds: 20,
    limit: FAIR_USE_CAP,
    unlimited: true,
    blurb: "Say it nicelyy, every time.",
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

function addMonthsUTC(d: Date, k: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + k;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(y, m, Math.min(d.getUTCDate(), lastDay), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
  );
}

// The start of the current monthly allowance. Messages top up every month on
// the day the plan started, for monthly AND yearly plans (a yearly plan still
// gets its allowance each month, not once a year).
export function allowanceStart(periodStart: Date | null, now = new Date()): Date {
  const floor = new Date(now.getTime() - 31 * DAY);
  if (!periodStart || periodStart > now) return floor;
  let k =
    (now.getUTCFullYear() - periodStart.getUTCFullYear()) * 12 + (now.getUTCMonth() - periodStart.getUTCMonth());
  let start = addMonthsUTC(periodStart, k);
  while (start > now && k > 0) start = addMonthsUTC(periodStart, --k);
  return start > floor ? start : floor;
}

// Works out what someone can use right now.
// Paid: the plan's limit each month. Free: 3 messages in total.
export function entitlementFor(row: UserRow | null, now = new Date()): Entitlement {
  if (row && isActiveStatus(row.payment_status) && isPaidTier(row.plan)) {
    const start = allowanceStart(row.period_start ? new Date(row.period_start) : null, now);
    return { plan: PLANS[row.plan], since: start };
  }
  return { plan: PLANS.free, since: new Date(0) };
}

// Free one-tap tweaks ("Shorter", "Softer"...) that come with each message.
export const FREE_TWEAKS = 3;
// ...up to this many free tweaks a month in total, so even the heaviest
// Unlimited user can never cost more in AI than they pay.
export const MONTHLY_TWEAK_CAP = 200;
