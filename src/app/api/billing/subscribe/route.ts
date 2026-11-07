import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { isPaidTier } from "@/lib/plans";
import { getStripe, isLive, priceIdFor, yearlyAvailable } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/billing/subscribe  Body: { tier: "starter" | "plus" | "unlimited", interval?: "month" | "year" }
// Returns a Stripe Checkout link. Anyone who already has a plan is sent to the
// billing portal to switch instead, so nobody is ever charged twice.
export const runtime = "nodejs";

function originOf(request: Request) {
  return process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  let body: { tier?: unknown; interval?: unknown } = {};
  try {
    body = await request.json();
  } catch {}
  if (!isPaidTier(body.tier)) {
    return NextResponse.json({ error: "Please choose a plan." }, { status: 400 });
  }
  const interval = body.interval === "year" && yearlyAvailable() ? "year" : "month";
  const origin = originOf(request);

  try {
    const stripe = getStripe();
    const admin = createAdminClient();
    const row = await getUserRow(user.id, user.email ?? null);
    let customerId = row.stripe_customer_id;

    if (!customerId) {
      // Reuse a customer already tagged with this person (e.g. two tabs).
      let found: string | null = null;
      try {
        const search = await stripe.customers.search({
          query: `metadata['userId']:'${user.id}'`,
          limit: 1,
        });
        found = search.data[0]?.id ?? null;
      } catch {}
      if (!found) {
        const created = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { userId: user.id },
        });
        found = created.id;
      }
      // Claim the slot only if still empty, then use whichever won.
      await admin
        .from("users")
        .update({ stripe_customer_id: found })
        .eq("id", user.id)
        .is("stripe_customer_id", null);
      const fresh = await getUserRow(user.id, user.email ?? null);
      customerId = fresh.stripe_customer_id;
      if (!customerId) throw new Error("No customer id after claim.");
    }

    // Already subscribed? Switch plans in the portal instead.
    const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    if (subs.data.some(isLive)) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/account`,
      });
      return NextResponse.json({ url: portal.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceIdFor(body.tier, interval), quantity: 1 }],
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
      success_url: `${origin}/app?welcome=1`,
      cancel_url: `${origin}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout just now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
