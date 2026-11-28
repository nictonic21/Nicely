import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { customerExists, getStripe, portalOptions, STALE_CUSTOMER_RESET } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/billing/portal: Stripe's page to change plan, update card,
// see invoices or cancel.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  try {
    const row = await getUserRow(user.id, user.email ?? null);
    if (!row.stripe_customer_id) {
      return NextResponse.json({ error: "You don't have a paid plan yet." }, { status: 400 });
    }
    // Saved from another Stripe account or mode (e.g. test data from before
    // going live): forget it, so they can choose a plan again.
    if (!(await customerExists(getStripe(), row.stripe_customer_id))) {
      await createAdminClient()
        .from("users")
        .update(STALE_CUSTOMER_RESET)
        .eq("id", user.id)
        .eq("stripe_customer_id", row.stripe_customer_id);
      return NextResponse.json(
        { error: "Your earlier plan was a test. Please choose a plan below." },
        { status: 400 }
      );
    }
    const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const session = await getStripe().billingPortal.sessions.create({
        ...portalOptions(),
      customer: row.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("portal failed:", err);
    return NextResponse.json(
      { error: "Could not open billing just now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
