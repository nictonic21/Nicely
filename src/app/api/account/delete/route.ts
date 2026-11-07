import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { getStripe, isLive } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/account/delete: cancels any plan straight away and permanently
// deletes the account and its usage history (UK GDPR right to erasure).
export const runtime = "nodejs";

export async function POST() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  try {
    const row = await getUserRow(user.id, user.email ?? null);
    if (row.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe();
      const subs = await stripe.subscriptions.list({ customer: row.stripe_customer_id, limit: 10 });
      for (const s of subs.data.filter(isLive)) await stripe.subscriptions.cancel(s.id);
    }
    // Deleting the auth user cascades to the users and rewrites rows.
    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("account delete failed:", err);
    return NextResponse.json(
      { error: "Could not delete your account just now. Please try again or contact us." },
      { status: 500 }
    );
  }
}
