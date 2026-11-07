import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { entitlementFor } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFormat, isRecipient, isTone, MAX_CHARS } from "@/lib/options";
import { rewriteMessage, RewriteDeclined } from "@/lib/rewrite";

// POST /api/rewrite
// Body: { text, received?, tone, recipient, format }
// Uses one rewrite from the person's plan. If the AI step fails, the rewrite
// is given back, so nobody pays for an error.
export const runtime = "nodejs";
export const maxDuration = 60;

const BURST_PER_MINUTE = 8;

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const received = typeof body.received === "string" ? body.received : "";
  const { tone, recipient, format } = body;

  if (!text.trim()) {
    return NextResponse.json({ error: "Write, paste or say what you want to say first." }, { status: 400 });
  }
  if (text.length > MAX_CHARS || received.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Please keep each box under ${MAX_CHARS.toLocaleString()} characters.` },
      { status: 400 }
    );
  }
  if (!isTone(tone) || !isRecipient(recipient) || !isFormat(format)) {
    return NextResponse.json({ error: "Please choose a tone and who it's for." }, { status: 400 });
  }

  const admin = createAdminClient();
  let row;
  try {
    row = await getUserRow(user.id, user.email ?? null);
  } catch {
    return NextResponse.json({ error: "Could not load your account. Please try again." }, { status: 500 });
  }
  const { plan, since } = entitlementFor(row);

  const { data: claim, error: claimError } = await admin.rpc("claim_rewrite", {
    p_user: user.id,
    p_since: since.toISOString(),
    p_limit: plan.limit,
    p_burst: BURST_PER_MINUTE,
    p_tone: tone,
    p_recipient: recipient,
  });
  if (claimError || !claim) {
    console.error("claim_rewrite failed:", claimError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!claim.ok) {
    if (claim.reason === "limit") {
      return NextResponse.json(
        { error: "limit", used: claim.used, limit: plan.limit, tier: plan.tier },
        { status: 402 }
      );
    }
    if (claim.reason === "slow_down") {
      return NextResponse.json(
        { error: "You're going a bit fast. Please wait a minute and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  try {
    const result = await rewriteMessage({ text, received, tone, recipient, format });
    return NextResponse.json({
      ...result,
      usage: { used: claim.used, limit: plan.limit, unlimited: plan.unlimited, tier: plan.tier },
    });
  } catch (err) {
    // Give the rewrite back.
    await admin.from("rewrites").delete().eq("id", claim.id);
    if (err instanceof RewriteDeclined) {
      return NextResponse.json(
        {
          error:
            "We can't help with that one. Try telling us the point you want to make, and we'll help you say it well.",
        },
        { status: 422 }
      );
    }
    console.error("rewrite failed:", err);
    return NextResponse.json(
      { error: "We couldn't rewrite that just now. You haven't been charged for it. Please try again." },
      { status: 502 }
    );
  }
}
