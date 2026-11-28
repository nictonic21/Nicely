import Anthropic from "@anthropic-ai/sdk";
import { getStripe, priceIdFor, tierForPrice } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { META_PIXEL_ID } from "@/components/MetaPixel";
import { PLANS, type Interval, type PaidTier } from "@/lib/plans";

// The owner's "setup check": tests every connection Nicelyy needs and
// explains problems in plain English. Never returns a secret: only whether
// it's set, its kind (from the first few letters) and what it connects to.

export type CheckStatus = "ok" | "problem" | "off";
export interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
}
export interface CheckGroup {
  title: string;
  checks: Check[];
}

const has = (k: string) => !!process.env[k]?.trim();

function keyKind(v: string | undefined): string {
  if (!v) return "not set";
  if (v.startsWith("sk_test_")) return "secret key (test)";
  if (v.startsWith("sk_live_")) return "secret key (LIVE)";
  if (v.startsWith("rk_test_")) return "restricted key (test)";
  if (v.startsWith("rk_live_")) return "restricted key (LIVE)";
  if (v.startsWith("pk_")) return "publishable key";
  return "not a Stripe key";
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

async function stripeChecks(): Promise<Check[]> {
  const checks: Check[] = [];
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const kind = keyKind(key);
  if (!key) {
    return [{ name: "Stripe secret key", status: "problem", detail: "STRIPE_SECRET_KEY isn't set in Vercel." }];
  }
  if (!kind.startsWith("secret") && !kind.startsWith("restricted")) {
    return [
      {
        name: "Stripe secret key",
        status: "problem",
        detail: `STRIPE_SECRET_KEY is a ${kind}. It must be the Secret key (starts sk_test_ or sk_live_), from Developers → API keys.`,
      },
    ];
  }

  const stripe = getStripe();
  try {
    const acct = await stripe.accounts.retrieveCurrent();
    const name = acct.settings?.dashboard?.display_name || acct.business_profile?.name || "(no name)";
    checks.push({
      name: "Stripe secret key",
      status: "ok",
      detail: `A ${kind}, for the Stripe account "${name}" (${acct.id}).`,
    });
  } catch (err) {
    return [{ name: "Stripe secret key", status: "problem", detail: `Stripe rejected the key: ${message(err)}` }];
  }

  const expectLive = key.includes("_live_");
  for (const tier of Object.keys(PLANS).filter((t) => t !== "free") as PaidTier[]) {
    for (const interval of ["month", "year"] as Interval[]) {
      const envName = `STRIPE_PRICE_${tier.toUpperCase()}${interval === "year" ? "_YEARLY" : ""}`;
      const label = `${PLANS[tier].name} ${interval === "year" ? "yearly" : "monthly"} price`;
      if (!has(envName)) {
        checks.push({
          name: label,
          status: interval === "year" ? "off" : "problem",
          detail: `${envName} isn't set in Vercel.${interval === "year" ? " (Optional: yearly plans stay hidden.)" : ""}`,
        });
        continue;
      }
      try {
        const id = priceIdFor(tier, interval);
        const price = await stripe.prices.retrieve(id);
        const expected = interval === "year" ? PLANS[tier].yearlyPounds * 100 : PLANS[tier].pricePounds * 100;
        const problems: string[] = [];
        if (!price.active) problems.push("it's archived in Stripe");
        if (price.livemode !== expectLive) problems.push(`it's a ${price.livemode ? "live" : "test"} price but the key is ${expectLive ? "live" : "test"}`);
        if (price.currency !== "gbp") problems.push(`it's in ${price.currency.toUpperCase()}, not GBP`);
        if (price.unit_amount !== expected) problems.push(`it's £${(price.unit_amount ?? 0) / 100}, the site shows £${expected / 100}`);
        if (price.recurring?.interval !== interval) problems.push(`it bills every ${price.recurring?.interval ?? "one-off"}`);
        if (tierForPrice(id) !== tier) problems.push("it's mapped to the wrong plan");
        checks.push({
          name: label,
          status: problems.length ? "problem" : "ok",
          detail: problems.length ? `Found, but ${problems.join("; ")}.` : `£${expected / 100} per ${interval}.`,
        });
      } catch (err) {
        checks.push({
          name: label,
          status: "problem",
          detail: `${envName} doesn't exist in this Stripe account (${message(err)}). The price codes and the secret key must come from the same account.`,
        });
      }
    }
  }

  const portalId = process.env.STRIPE_PORTAL_CONFIGURATION?.trim();
  if (portalId) {
    try {
      const c = await stripe.billingPortal.configurations.retrieve(portalId);
      checks.push({
        name: "Billing page settings",
        status: c.active ? "ok" : "problem",
        detail: c.active ? "Customers can change plan, update their card, see invoices and cancel." : "The settings exist but are switched off.",
      });
    } catch (err) {
      checks.push({
        name: "Billing page settings",
        status: "problem",
        detail: `STRIPE_PORTAL_CONFIGURATION isn't in this Stripe account (${message(err)}).`,
      });
    }
  } else {
    checks.push({ name: "Billing page settings", status: "off", detail: "Using Stripe's default billing page settings." });
  }

  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  checks.push({
    name: "Webhook signing secret",
    status: whsec?.startsWith("whsec_") ? "ok" : "problem",
    detail: !whsec
      ? "STRIPE_WEBHOOK_SECRET isn't set, so paid plans won't switch on after checkout."
      : whsec.startsWith("whsec_")
        ? "Set. (It can only be fully tested with a real checkout.)"
        : "STRIPE_WEBHOOK_SECRET should start with whsec_.",
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) {
    try {
      const url = `${base}/api/stripe/webhook`;
      let found = false;
      for await (const w of stripe.webhookEndpoints.list({ limit: 100 })) {
        if (w.url === url) {
          found = w.status === "enabled";
          break;
        }
      }
      checks.push({
        name: "Webhook in Stripe",
        status: found ? "ok" : "problem",
        detail: found
          ? `Stripe sends updates to ${url}.`
          : `This Stripe account has no enabled webhook for ${url}. Run the Stripe setup script for this account.`,
      });
    } catch (err) {
      checks.push({ name: "Webhook in Stripe", status: "problem", detail: message(err) });
    }
  }
  return checks;
}

async function aiCheck(): Promise<Check> {
  if (!has("ANTHROPIC_API_KEY")) {
    return { name: "AI key", status: "problem", detail: "ANTHROPIC_API_KEY isn't set, so rewriting can't work." };
  }
  try {
    // Listing models is free: it proves the key works without using credit.
    await new Anthropic({ maxRetries: 0, timeout: 10_000 }).models.list({ limit: 1 });
    return { name: "AI key", status: "ok", detail: "Anthropic accepts the key." };
  } catch (err) {
    return { name: "AI key", status: "problem", detail: `Anthropic rejected the key: ${message(err)}` };
  }
}

async function databaseCheck(): Promise<Check> {
  if (!has("NEXT_PUBLIC_SUPABASE_URL") || !has("NEXT_PUBLIC_SUPABASE_ANON_KEY") || !has("SUPABASE_SERVICE_ROLE_KEY")) {
    return { name: "Database", status: "problem", detail: "One of the three Supabase keys isn't set in Vercel." };
  }
  try {
    const { error } = await createAdminClient().rpc("admin_stats");
    return error
      ? { name: "Database", status: "problem", detail: `Connected, but the setup isn't complete: ${error.message}. Re-run the database setup.` }
      : { name: "Database", status: "ok", detail: "Connected, and the setup is in place." };
  } catch (err) {
    return { name: "Database", status: "problem", detail: message(err) };
  }
}

const setting = (name: string, env: string, ifMissing: string, required = true): Check =>
  has(env)
    ? { name, status: "ok", detail: "Set." }
    : { name, status: required ? "problem" : "off", detail: ifMissing };

export async function runHealthChecks(): Promise<CheckGroup[]> {
  const [stripe, ai, db] = await Promise.all([stripeChecks(), aiCheck(), databaseCheck()]);
  return [
    {
      title: "Core",
      checks: [
        db,
        ai,
        setting("Site address", "NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_BASE_URL isn't set."),
        setting("App secret", "NICELYY_SECRET", "NICELYY_SECRET isn't set, so the free try and contact form are off."),
      ],
    },
    { title: "Payments (Stripe)", checks: stripe },
    {
      title: "Business details",
      checks: [
        setting("Support email", "NEXT_PUBLIC_CONTACT_EMAIL", "NEXT_PUBLIC_CONTACT_EMAIL isn't set, so Terms, Privacy and Help have no contact address."),
        setting("Business name", "NEXT_PUBLIC_LEGAL_NAME", "NEXT_PUBLIC_LEGAL_NAME isn't set, so the legal pages just say \"Nicelyy\"."),
      ],
    },
    {
      title: "Optional extras",
      checks: [
        setting("Emails (Resend)", "RESEND_API_KEY", "Off: no welcome or reminder emails, and the contact form is hidden.", false),
        setting("Human check (Turnstile)", "TURNSTILE_SECRET_KEY", "Off: the free try relies on its other limits only.", false),
        setting("Error alerts (Sentry)", "NEXT_PUBLIC_SENTRY_DSN", "Off: you won't be told when something breaks.", false),
        setting("Google / Apple sign-in", "NEXT_PUBLIC_AUTH_PROVIDERS", "Off: email sign-up only.", false),
        META_PIXEL_ID
          ? { name: "Meta Pixel (ads)", status: "ok", detail: `Pixel ${META_PIXEL_ID}. Loads only for visitors who accept advertising cookies.` }
          : { name: "Meta Pixel (ads)", status: "off", detail: "Off: no cookie banner, and Facebook/Instagram ads can't be measured." },
      ],
    },
  ];
}
