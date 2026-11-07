import { NextResponse } from "next/server";
import { getRequestUser, getUserRow } from "@/lib/auth";
import { entitlementFor, FREE_TWEAKS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { DECLINED_MESSAGE, FAILED_MESSAGE, parseRewriteBody, readJson } from "@/lib/input";
import { inputHash, rewriteMessage, RewriteDeclined } from "@/lib/rewrite";
import { maybeSendNudge } from "@/lib/emails";

// POST /api/rewrite
// Body: { text, received?, tone, recipient, format }
// Uses one message from the person's plan and returns three versions. If the
// AI step fails, the message is given back, so nobody pays for an error.
export const runtime = "nodejs";
export const maxDuration = 60;

const BURST_PER_MINUTE = 8;

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const input = parseRewriteBody(await readJson(request));
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

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
    p_tone: input.tone,
    p_recipient: input.recipient,
    p_input_hash: await inputHash(input),
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
    const result = await rewriteMessage(input);
    await maybeSendNudge(user.id, plan, claim.used, since).catch(() => {});
    return NextResponse.json({
      ...result,
      rewriteId: claim.id,
      tweaksLeft: FREE_TWEAKS,
      usage: { used: claim.used, limit: plan.limit, unlimited: plan.unlimited, tier: plan.tier },
    });
  } catch (err) {
    // Give the message back.
    await admin.from("rewrites").delete().eq("id", claim.id);
    if (err instanceof RewriteDeclined) {
      return NextResponse.json({ error: DECLINED_MESSAGE }, { status: 422 });
    }
    console.error("rewrite failed:", err);
    return NextResponse.json({ error: FAILED_MESSAGE }, { status: 502 });
  }
}
