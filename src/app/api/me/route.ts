import { NextResponse } from "next/server";
import { countRewritesSince, getRequestUser, getUserRow } from "@/lib/auth";
import { entitlementFor, isActiveStatus } from "@/lib/plans";
import { yearlyAvailable } from "@/lib/stripe";
import { maybeSendWelcome } from "@/lib/emails";

// GET /api/me: the signed-in person's plan and how much they've used.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ signedIn: false }, { status: 401 });
  try {
    const row = await getUserRow(user.id, user.email ?? null);
    const { plan, since } = entitlementFor(row);
    const used = await countRewritesSince(user.id, since);
    await maybeSendWelcome(user.id).catch(() => {});
    return NextResponse.json({
      signedIn: true,
      email: user.email,
      tier: plan.tier,
      planName: plan.name,
      used,
      limit: plan.limit,
      unlimited: plan.unlimited,
      pastDue: row.payment_status === "past_due",
      hasBilling: !!row.stripe_customer_id && isActiveStatus(row.payment_status),
      periodStart: plan.tier === "free" ? null : since.toISOString(),
      yearlyAvailable: yearlyAvailable(),
      emailOptOut: !!row.email_opt_out,
    });
  } catch {
    return NextResponse.json({ error: "Could not load your account." }, { status: 500 });
  }
}
