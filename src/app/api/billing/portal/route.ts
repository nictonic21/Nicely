import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

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
    const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const session = await getStripe().billingPortal.sessions.create({
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
