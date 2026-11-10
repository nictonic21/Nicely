import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DECLINED_MESSAGE, FAILED_MESSAGE, parseRewriteBody, readJson } from "@/lib/input";
import { rewriteMessage, RewriteDeclined } from "@/lib/rewrite";
import { sign } from "@/lib/secret";
import { clientIp, humanCheck } from "@/lib/request";

// POST /api/try
// One free rewrite from the home page, no account needed.
// Protected three ways so it can't run up the AI bill:
//  1. One try per visitor (by a salted one-way hash of their IP) per day.
//  2. A daily cap across everyone (TRIAL_DAILY_CAP, default 300).
//  3. Cloudflare Turnstile "are you human" check, once its keys are set.
export const runtime = "nodejs";
export const maxDuration = 60;

const TRIAL_MAX_CHARS = 1200;

const signUp = (error: string, status: number) =>
  NextResponse.json({ error, signUp: true }, { status });

export async function POST(request: Request) {
  if (!process.env.NICELYY_SECRET) {
    return signUp("Create a free account to try Nicelyy. It takes a few seconds.", 503);
  }
  const body = await readJson(request);
  const input = parseRewriteBody(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });
  if (input.text.length > TRIAL_MAX_CHARS || input.received.length > TRIAL_MAX_CHARS) {
    return NextResponse.json(
      { error: `For the free try, please keep it under ${TRIAL_MAX_CHARS.toLocaleString()} characters.` },
      { status: 400 }
    );
  }

  const ip = clientIp(request);
  if (!(await humanCheck(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Please complete the quick check, then try again.", retryCheck: true }, { status: 403 });
  }

  const admin = createAdminClient();
  const cap = parseInt(process.env.TRIAL_DAILY_CAP || "", 10);
  const { data: claim, error } = await admin.rpc("claim_trial", {
    p_ip_hash: sign(`ip:${ip}`),
    p_per_ip: 1,
    p_daily_cap: Number.isFinite(cap) && cap > 0 ? cap : 300,
  });
  if (error || !claim) {
    console.error("claim_trial failed:", error);
    return signUp("Create a free account to try Nicelyy. It takes a few seconds.", 500);
  }
  if (!claim.ok) {
    return signUp(
      claim.reason === "used"
        ? "You've had your free try today. Create a free account for 3 more messages."
        : "Free tries are busy right now. Create a free account for 3 free messages.",
      429
    );
  }

  try {
    const result = await rewriteMessage(input);
    return NextResponse.json(result);
  } catch (err) {
    await admin.from("trial_uses").delete().eq("id", claim.id);
    if (err instanceof RewriteDeclined) return NextResponse.json({ error: DECLINED_MESSAGE }, { status: 422 });
    console.error("trial failed:", err);
    return NextResponse.json({ error: FAILED_MESSAGE.replace(" You haven't been charged for it.", "") }, { status: 502 });
  }
}
