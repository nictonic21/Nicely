import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isLive, mapStatus, periodStartOf, tierForPrice } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/stripe/webhook
// Stripe tells us here when someone subscribes, renews, switches plan or
// cancels. This is the ONLY thing that changes a person's plan.
//
// Stripe can resend events and send them out of order, so we always re-read
// the subscription's CURRENT state from Stripe rather than trusting the event.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let subscriptionId: string | null = null;
  let fallbackUserId: string | undefined;

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode === "subscription" && s.subscription) {
        subscriptionId = String(s.subscription);
        fallbackUserId = s.client_reference_id || s.metadata?.userId || undefined;
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      subscriptionId = sub.id;
      fallbackUserId = sub.metadata?.userId || undefined;
      break;
    }
    default:
      return NextResponse.json({ received: true });
  }
  if (!subscriptionId) return NextResponse.json({ received: true });

  try {
    await syncSubscription(stripe, subscriptionId, fallbackUserId);
  } catch (err) {
    console.error("webhook sync failed:", err);
    // A 500 makes Stripe try again later.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function syncSubscription(stripe: Stripe, subscriptionId: string, fallbackUserId?: string) {
  const admin = createAdminClient();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = String(sub.customer);
  const userId = sub.metadata?.userId || fallbackUserId;

  // Find the person by customer id, falling back to the id we tagged.
  let { data: row } = await admin
    .from("users")
    .select("id, stripe_subscription_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!row && userId) {
    const res = await admin
      .from("users")
      .select("id, stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();
    row = res.data;
  }
  if (!row) throw new Error(`No user for customer ${customerId}`);

  const status = mapStatus(sub.status);

  // A message about an old subscription must never overwrite the current one.
  if (row.stripe_subscription_id && row.stripe_subscription_id !== sub.id) {
    if (!isLive(sub)) return; // old one ending: ignore
    // A new live subscription replaces a stale link only if the old one is dead.
    try {
      const current = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      if (isLive(current)) return;
    } catch {
      // Old one can't be found: take the new one.
    }
  }

  if (status === "cancelled") {
    await admin
      .from("users")
      .update({
        plan: null,
        payment_status: "cancelled",
        stripe_subscription_id: null,
        period_start: null,
        stripe_customer_id: customerId,
      })
      .eq("id", row.id);
    return;
  }

  const tier = tierForPrice(sub.items.data[0]?.price?.id);
  await admin
    .from("users")
    .update({
      ...(tier ? { plan: tier } : {}),
      payment_status: status,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      period_start: periodStartOf(sub),
    })
    .eq("id", row.id);
}
