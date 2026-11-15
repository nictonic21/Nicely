import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DECLINED_MESSAGE, FAILED_MESSAGE, parseRewriteBody, readJson } from "@/lib/input";
import { rewriteMessage, RewriteDeclined } from "@/lib/rewrite";
import { sign } from "@/lib/secret";
import { clientIp, humanCheck } from "@/lib/request";

// POST /api/try
// One free rewrite from the home page, no account needed: a taster that
// leads to signing up, not a free alternative to it.
//  - Shows version 1 in full; versions 2 and 3 are only named, and unlock
//    with a free account. (Their text is never sent to the browser.)
//  - One try per browser per month (a cookie), and at most 3 per internet
//    address per month (a salted one-way hash), so private windows don't
//    give endless tries but people sharing a phone network or office aren't
//    all blocked by one person.
//  - A daily cap across everyone (TRIAL_DAILY_CAP, default 300).
//  - Cloudflare Turnstile "are you human" check, once its keys are set.
export const runtime = "nodejs";
export const maxDuration = 60;

const TRIAL_MAX_CHARS = 1200;
const MONTH_SECONDS = 30 * 24 * 60 * 60;
const PER_ADDRESS_PER_MONTH = 3;
const TRIED_COOKIE = "nicelyy_tried";
const USED_MESSAGE = "You've had your free try this month. Create a free account for 3 free messages, with all 3 versions each time.";

const signUp = (error: string, status: number) =>
  NextResponse.json({ error, signUp: true }, { status });

export async function POST(request: Request) {
  if (!process.env.NICELYY_SECRET || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The free try opens very soon. Please check back shortly." },
      { status: 503 }
    );
  }
  if (request.headers.get("cookie")?.includes(`${TRIED_COOKIE}=1`)) {
    return signUp(USED_MESSAGE, 429);
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
    p_per_ip: PER_ADDRESS_PER_MONTH,
    p_window_seconds: MONTH_SECONDS,
    p_daily_cap: Number.isFinite(cap) && cap > 0 ? cap : 300,
  });
  if (error || !claim) {
    console.error("claim_trial failed:", error);
    return signUp("Create a free account to try Nicelyy. It takes a few seconds.", 500);
  }
  if (!claim.ok) {
    return signUp(
      claim.reason === "used"
        ? USED_MESSAGE
        : "Free tries are busy right now. Create a free account for 3 free messages.",
      429
    );
  }

  try {
    const result = await rewriteMessage(input);
    const [first, ...rest] = result.versions;
    const res = NextResponse.json({
      versions: [first],
      locked: rest.map((v) => v.label),
      subject: result.subject,
      tip: result.tip,
      safety: result.safety,
    });
    res.cookies.set(TRIED_COOKIE, "1", {
      maxAge: MONTH_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (err) {
    await admin.from("trial_uses").delete().eq("id", claim.id);
    if (err instanceof RewriteDeclined) return NextResponse.json({ error: DECLINED_MESSAGE }, { status: 422 });
    console.error("trial failed:", err);
    return NextResponse.json({ error: FAILED_MESSAGE.replace(" You haven't been charged for it.", "") }, { status: 502 });
  }
}
