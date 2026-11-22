// Sets up everything Nicelyy needs in a Stripe account, in one go:
//   - the three plans (Starter, Plus, Unlimited), each with a monthly price
//     and a yearly price (12 months for the price of 10);
//   - the customer billing page (change plan, update card, invoices, cancel);
//   - the webhook that keeps people's plans in sync with Stripe.
//
// Safe to run again: it finds what already exists (by lookup keys and
// metadata) instead of making duplicates. Run it once in test mode, then once
// with your live key when you launch.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://nicelyy.vercel.app node scripts/stripe-setup.mjs
//
// It never prints secret keys or the webhook signing secret. It prints the
// lines to paste into Vercel.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
const site = (process.env.SITE_URL || "").replace(/\/$/, "");
if (!key || !site.startsWith("https://")) {
  console.error("Set STRIPE_SECRET_KEY and SITE_URL (https://...) first.");
  process.exit(1);
}

const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });

// Keep in step with src/lib/plans.ts (prices in pence, VAT included).
const PLANS = [
  { tier: "starter", name: "Nicelyy Starter", description: "10 messages a month", monthly: 700 },
  { tier: "plus", name: "Nicelyy Plus", description: "30 messages a month", monthly: 1500 },
  { tier: "unlimited", name: "Nicelyy Unlimited", description: "Unlimited messages (fair use 500 a month)", monthly: 2000 },
];

// Electronically supplied services: the right VAT category for an app.
const TAX_CODE = "txcd_10000000";

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

async function findOrCreateProduct(plan) {
  for await (const p of stripe.products.list({ limit: 100 })) {
    if (p.metadata?.nicelyy_tier === plan.tier) {
      if (!p.active || p.name !== plan.name || p.description !== plan.description) {
        return stripe.products.update(p.id, { active: true, name: plan.name, description: plan.description });
      }
      return p;
    }
  }
  return stripe.products.create({
    name: plan.name,
    description: plan.description,
    tax_code: TAX_CODE,
    metadata: { nicelyy_tier: plan.tier },
  });
}

async function findOrCreatePrice(product, plan, interval) {
  const lookup_key = `nicelyy_${plan.tier}_${interval === "month" ? "monthly" : "yearly"}`;
  const amount = interval === "month" ? plan.monthly : plan.monthly * 10;
  const existing = (await stripe.prices.list({ lookup_keys: [lookup_key], limit: 1 })).data[0];
  if (existing && existing.active && existing.unit_amount === amount && existing.product === product.id) {
    return existing;
  }
  // Prices can't be edited, so a changed amount gets a new price that takes
  // over the lookup key. Existing subscribers keep their old price.
  return stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: amount,
    recurring: { interval },
    tax_behavior: "inclusive",
    lookup_key,
    transfer_lookup_key: true,
    nickname: `${plan.name} (${interval === "month" ? "monthly" : "yearly"})`,
  });
}

async function setupPortal(products) {
  const params = {
    business_profile: {
      headline: "Manage your Nicelyy plan",
      privacy_policy_url: `${site}/privacy`,
      terms_of_service_url: `${site}/terms`,
    },
    default_return_url: `${site}/account`,
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "address"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "unused", "missing_features", "switched_service", "other"],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: products.map(({ product, monthly, yearly }) => ({
          product: product.id,
          prices: [monthly.id, yearly.id],
        })),
      },
    },
    metadata: { nicelyy: "portal" },
  };
  for await (const c of stripe.billingPortal.configurations.list({ limit: 100 })) {
    if (c.metadata?.nicelyy === "portal") {
      const { metadata, ...update } = params;
      return stripe.billingPortal.configurations.update(c.id, { ...update, active: true });
    }
  }
  return stripe.billingPortal.configurations.create(params);
}

async function setupWebhook() {
  const url = `${site}/api/stripe/webhook`;
  for await (const w of stripe.webhookEndpoints.list({ limit: 100 })) {
    if (w.url === url) {
      await stripe.webhookEndpoints.update(w.id, { enabled_events: WEBHOOK_EVENTS, disabled: false });
      return { id: w.id, created: false };
    }
  }
  const w = await stripe.webhookEndpoints.create({
    url,
    enabled_events: WEBHOOK_EVENTS,
    description: "Nicelyy: keeps plans in sync",
  });
  // w.secret is the signing secret. Deliberately not printed: copy it from
  // the Stripe dashboard (Developers > Webhooks > this endpoint > Reveal).
  return { id: w.id, created: true };
}

const account = await stripe.balance.retrieve();
const mode = account.livemode ? "LIVE" : "TEST";
console.log(`Stripe ${mode} mode. Site: ${site}\n`);

const products = [];
for (const plan of PLANS) {
  const product = await findOrCreateProduct(plan);
  const monthly = await findOrCreatePrice(product, plan, "month");
  const yearly = await findOrCreatePrice(product, plan, "year");
  products.push({ plan, product, monthly, yearly });
  console.log(`  ${plan.name}: £${monthly.unit_amount / 100}/month, £${yearly.unit_amount / 100}/year`);
}
const portal = await setupPortal(products);
console.log(`  Billing page: ready`);
const webhook = await setupWebhook();
console.log(`  Webhook: ${webhook.created ? "created" : "already there, updated"} (${webhook.id})`);

const env = {
  STRIPE_PRICE_STARTER: products[0].monthly.id,
  STRIPE_PRICE_PLUS: products[1].monthly.id,
  STRIPE_PRICE_UNLIMITED: products[2].monthly.id,
  STRIPE_PRICE_STARTER_YEARLY: products[0].yearly.id,
  STRIPE_PRICE_PLUS_YEARLY: products[1].yearly.id,
  STRIPE_PRICE_UNLIMITED_YEARLY: products[2].yearly.id,
  STRIPE_PORTAL_CONFIGURATION: portal.id,
};
console.log(`\nAdd these to Vercel (${mode} mode values):`);
for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
console.log(
  "\nAlso add STRIPE_SECRET_KEY (your sk_ key) and STRIPE_WEBHOOK_SECRET\n" +
    "(Stripe dashboard > Developers > Webhooks > the Nicelyy endpoint > Signing secret > Reveal)."
);
